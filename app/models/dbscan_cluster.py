from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

def run_dbscan_clustering(dataset, features, eps=0.5, min_samples=5):
    X = dataset[features].copy()

    # Separate numeric and one-hot features
    numeric_cols = [col for col in features if X[col].nunique() > 2 and pd.api.types.is_numeric_dtype(X[col])]
    binary_cols = [col for col in features if col not in numeric_cols]

    # Standardize features
    X_scaled = X[numeric_cols].copy()
    X_scaled[numeric_cols] = StandardScaler().fit_transform(X_scaled[numeric_cols])

    # Recombine features
    X_cluster = pd.concat([X_scaled, X[binary_cols]], axis=1)

    model = DBSCAN(eps=eps, min_samples=min_samples)
    cluster_labels = model.fit_predict(X_cluster)

    # Cluster labels
    result_df = dataset.copy()
    result_df["cluster"] = cluster_labels

    cluster_counts = pd.Series(cluster_labels).value_counts().sort_index()

    return {
        "df_with_clusters": result_df,
        "cluster_counts": cluster_counts,
        "num_clusters": len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0),
        "num_noise": np.sum(cluster_labels == -1),
    }