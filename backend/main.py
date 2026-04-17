import glob
import io
import os
import sys
import uuid
from typing import Optional

import kagglehub
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sklearn.decomposition import PCA

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from models.dbscan_cluster import run_dbscan_clustering
from models.forest_regressor import run_forest_regression
from models.isolation_forest import run_anomaly_detection
from models.linear_regressor import run_linear_regression
from models.tree_regressor import run_decision_tree_regression
from utils import (
    drop_missing_values,
    get_missing_value_summary,
    impute_missing_values,
    remove_outliers_iqr,
)

app = FastAPI()

# dev only — in production the frontend is served from the same origin so no CORS needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DataFrames stored in memory keyed by session UUID — fine for a single-user tool,
# but would need a proper store (Redis, db) if this ever ran with multiple workers
_sessions: dict[str, pd.DataFrame] = {}

EXAMPLES = {
    "medical_insurance": os.path.join(
        os.path.dirname(__file__), "..", "app", "example_datasets", "Medical_insurance.csv"
    ),
    "cali_house": os.path.join(
        os.path.dirname(__file__), "..", "app", "example_datasets", "california_housing.csv"
    ),
    "test": os.path.join(
        os.path.dirname(__file__), "..", "app", "example_datasets", "test.csv"
    ),
}


def _store(df: pd.DataFrame) -> str:
    sid = str(uuid.uuid4())
    _sessions[sid] = df
    return sid


def _get(sid: str) -> pd.DataFrame:
    df = _sessions.get(sid)
    if df is None:
        raise HTTPException(404, "Session not found")
    return df


def _preview(df: pd.DataFrame, rows: int = 200) -> dict:
    return {
        "columns": df.columns.tolist(),
        "rows": df.head(rows).replace({np.nan: None}).to_dict(orient="records"),
        "shape": list(df.shape),
        "dtypes": {col: str(dt) for col, dt in df.dtypes.items()},
    }


@app.get("/datasets")
def list_datasets():
    return list(EXAMPLES.keys())


@app.post("/datasets/load-example")
def load_example(body: dict):
    name = body.get("name")
    if name not in EXAMPLES:
        raise HTTPException(400, f"Unknown dataset: {name}")
    df = pd.read_csv(EXAMPLES[name])
    sid = _store(df)
    return {"id": sid, **_preview(df)}


@app.post("/datasets/load-url")
def load_url(body: dict):
    url = body.get("url", "").strip()
    if not url:
        raise HTTPException(400, "URL is required")
    try:
        df = pd.read_csv(url)
    except Exception as e:
        raise HTTPException(400, str(e))
    sid = _store(df)
    return {"id": sid, **_preview(df)}



@app.post("/datasets/load-kaggle")
def load_kaggle(body: dict):
    slug = body.get("slug", "").strip()
    if not slug or "/" not in slug:
        raise HTTPException(400, "Provide a Kaggle dataset slug like 'owner/dataset-name'")
    try:
        path = kagglehub.dataset_download(slug)
        csv_files = glob.glob(os.path.join(path, "**", "*.csv"), recursive=True)
        if not csv_files:
            raise HTTPException(400, "No CSV file found in this Kaggle dataset")
        df = pd.read_csv(csv_files[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))
    sid = _store(df)
    return {"id": sid, **_preview(df)}


@app.post("/datasets/upload")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, str(e))
    sid = _store(df)
    return {"id": sid, **_preview(df)}


@app.get("/datasets/{sid}/missing-summary")
def missing_summary(sid: str):
    df = _get(sid)
    summary = get_missing_value_summary(df)
    if summary.empty:
        return []
    return (
        summary.reset_index()
        .rename(columns={"index": "column"})
        .replace({np.nan: None})
        .to_dict(orient="records")
    )


@app.get("/datasets/{sid}/column-stats")
def column_stats(sid: str):
    df = _get(sid)
    stats = {}
    for col in df.columns:
        is_num = pd.api.types.is_numeric_dtype(df[col])
        null_count = int(df[col].isnull().sum())
        unique = int(df[col].nunique())
        if is_num:
            non_null = df[col].dropna()
            stats[col] = {
                "type": "numeric",
                "null_count": null_count,
                "unique": unique,
                "mean": round(float(non_null.mean()), 3) if len(non_null) else None,
                "std": round(float(non_null.std()), 3) if len(non_null) else None,
                "min": round(float(non_null.min()), 3) if len(non_null) else None,
                "max": round(float(non_null.max()), 3) if len(non_null) else None,
                "median": round(float(non_null.median()), 3) if len(non_null) else None,
            }
        else:
            top = df[col].value_counts().head(5)
            stats[col] = {
                "type": "categorical",
                "null_count": null_count,
                "unique": unique,
                "top_values": {str(k): int(v) for k, v in top.items()},
            }
    return stats


@app.get("/datasets/{sid}/correlation")
def correlation(sid: str):
    df = _get(sid)
    numeric = df.select_dtypes(include="number")
    corr = numeric.corr().round(3)
    return {
        "columns": corr.columns.tolist(),
        "matrix": corr.replace({np.nan: None}).values.tolist(),
    }


class TrainRequest(BaseModel):
    session_id: str
    task_type: str
    model_type: str
    features: list[str]
    target: Optional[str] = None
    hyperparams: dict = {}
    preprocessing: dict = {}
    sample: int = 0


@app.post("/train")
def train(req: TrainRequest):
    df = _get(req.session_id)

    if not req.features:
        raise HTTPException(400, "Select at least one feature")

    train_df = df.copy()
    prep = req.preprocessing

    mv = prep.get("missing_values", {})
    if mv.get("action") == "drop":
        train_df = drop_missing_values(train_df, mv.get("columns") or None)
    elif mv.get("strategy"):
        train_df = impute_missing_values(train_df, mv.get("columns") or None, mv["strategy"])

    ov = prep.get("outliers", {})
    if ov.get("enabled"):
        train_df = remove_outliers_iqr(train_df, ov.get("columns") or None, float(ov.get("factor", 1.5)))

    ohe_cols = prep.get("one_hot_cols", [])
    if ohe_cols:
        train_df = pd.get_dummies(train_df, columns=ohe_cols)

    # after OHE, "sex" becomes "sex_male"/"sex_female" etc — remap the original feature names
    features = []
    for f in req.features:
        if f in ohe_cols:
            features.extend(c for c in train_df.columns if c.startswith(f + "_"))
        else:
            features.append(f)

    scale = prep.get("scale", {})
    if scale.get("columns") and float(scale.get("factor", 1)) != 1.0:
        for col in scale["columns"]:
            if col in train_df.columns:
                train_df[col] = train_df[col] * float(scale["factor"])

    features = [f for f in features if f in train_df.columns]
    if not features:
        raise HTTPException(400, "No valid features after preprocessing")

    hp = req.hyperparams
    # sample=0 means plot every point; otherwise use as a stride to thin large datasets
    step = max(1, req.sample)

    def _run_safe(fn, *args):
        try:
            return fn(*args)
        except ValueError as e:
            msg = str(e)
            if "could not convert string" in msg or "invalid literal" in msg:
                raise HTTPException(400, "Feature columns contain text values — use one-hot encoding in Prepare first.")
            if "Input contains NaN" in msg or "contains NaN" in msg:
                raise HTTPException(400, "Features contain missing values — handle them in Prepare before training.")
            if "0 samples" in msg or "n_samples" in msg:
                raise HTTPException(400, "Not enough rows after preprocessing — try imputation instead of dropping rows.")
            raise HTTPException(400, f"Training error: {msg}")
        except Exception as e:
            raise HTTPException(500, f"Training failed: {str(e)}")

    if req.task_type == "Regression":
        if not req.target:
            raise HTTPException(400, "Target column required for regression")
        if req.model_type == "Linear Regression":
            result = _run_safe(run_linear_regression, train_df, features, req.target)
        elif req.model_type == "Decision Tree":
            result = _run_safe(run_decision_tree_regression, train_df, features, req.target, hp.get("max_depth", 5))
        elif req.model_type == "Forest Regression":
            result = _run_safe(run_forest_regression, train_df, features, req.target, hp.get("n_estimators", 50), hp.get("max_depth", 5))
        else:
            raise HTTPException(400, f"Unknown model: {req.model_type}")

        truth = [float(v) for v in result["truth"]]
        preds = [float(v) for v in result["predictions"]]
        return {
            "task_type": "Regression",
            "metrics": {
                "MAE": round(float(result["MAE"]), 4),
                "MSE": round(float(result["MSE"]), 4),
                "RMSE": round(float(result["RMSE"]), 4),
                "R2": round(float(result["R2"]), 4),
                "train_score": round(float(result["train_score"]), 4),
                "test_score": round(float(result["test_score"]), 4),
            },
            "scatter_data": [{"truth": t, "predictions": p} for t, p in zip(truth[::step], preds[::step])],
            "line_data": [{"index": i, "truth": t, "predictions": p} for i, (t, p) in enumerate(zip(truth[::step], preds[::step]))],
        }

    elif req.task_type == "Clustering":
        result = run_dbscan_clustering(train_df, features, hp.get("eps", 0.5), hp.get("min_samples", 5))
        df_c = result["df_with_clusters"]
        clean = df_c[features].dropna()
        pca = PCA(n_components=2)
        reduced = pca.fit_transform(clean)
        labels = df_c.loc[clean.index, "cluster"].values
        return {
            "task_type": "Clustering",
            "num_clusters": result["num_clusters"],
            "num_noise": int(result["num_noise"]),
            "cluster_counts": {str(k): int(v) for k, v in result["cluster_counts"].items()},
            "pca_data": [
                {"pc1": float(reduced[i][0]), "pc2": float(reduced[i][1]), "cluster": str(labels[i])}
                for i in range(len(reduced))
            ],
        }

    elif req.task_type == "Anomaly Detection":
        result = run_anomaly_detection(train_df, features, hp.get("contamination", 0.05), hp.get("n_estimators", 100))
        clean = train_df[features].dropna()
        pca = PCA(n_components=2)
        reduced = pca.fit_transform(clean)
        labels = [result["labels"][i] for i in clean.index]
        return {
            "task_type": "Anomaly Detection",
            "anomaly_count": result["anomaly_count"],
            "normal_count": result["normal_count"],
            "pca_data": [
                {"pc1": float(reduced[i][0]), "pc2": float(reduced[i][1]), "anomaly": "Anomaly" if labels[i] == -1 else "Normal"}
                for i in range(len(reduced))
            ],
        }

    raise HTTPException(400, f"Unknown task: {req.task_type}")


# Serve React frontend in production (must be last)
_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="static")
