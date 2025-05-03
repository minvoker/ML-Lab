import streamlit as st 
import pandas as pd
from models.linear_regressor import run_linear_regression
from models.tree_regressor import run_decision_tree_regression
from models.forest_regressor import run_forest_regression
from models.dbscan_cluster import run_dbscan_clustering
from models.isolation_forest import run_anomaly_detection
from utils import *

# TODO: 
# CLUSTER - DBSCAN - FIX THIS, categorical cols, plots - maybe embeddings??
# ANOMALY - Isolation Forest not fully tested.
# CLASSIFICAITON - Add logistic
# PREPROCESS - Add drop missing values, impute missing, IQR outlier removal 
# General UX cleanup
# Export and save processed dataset, model predictions, and trained model - joblib
# Refactor model type logic and dfs 

# Dataset selection

st.set_page_config(layout="centered", page_title="ML Lab")  
st.title("🔍 ML Lab")

# st session to prevent plots clearing 
if "last_result" not in st.session_state:
    st.session_state.last_result = None

# LAYOUT: Sidebar for Preprocessing 
st.sidebar.header("⚙️ Preprocessing Options")

# These will be populated once dataset is loaded
one_hot_cols = []
scale_cols = []

# Dataset loading and editing 
st.markdown("### 📂 Load Dataset")
data_method = st.selectbox("Choose a method for loading dataset", ["Example dataset", "Kaggle", "URL"])

# Load dataset
df = None
if data_method == "Example dataset":
    dataset_name = st.selectbox("Choose a dataset", ["medical_insurance", "cali_house", "test"])
    if dataset_name == "medical_insurance":
        df = pd.read_csv('./app/example_datasets/Medical_insurance.csv') 
    elif dataset_name == "cali_house":
        df = pd.read_csv('./app/example_datasets/california_housing.csv') 
    elif dataset_name == "test":
        df = pd.read_csv('./app/example_datasets/test.csv') 

elif data_method == "URL":
    url_input = st.text_input("Enter url to download dataset e.g (https://data.wa.gov/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD)")
    st.write("Must be a .csv file")
    if url_input:
        try:
            df = pd.read_csv(url_input)
        except Exception as e:
            st.error(f"❌ Failed to load dataset from URL: {e}")

elif data_method == "Kaggle":
    kaggle_name = st.text_input("Enter Kaggle dataset name")
    if not kaggle_name:
        st.write("e.g (harishkumardatalab/medical-insurance-price-prediction)")
    if kaggle_name:
        try:
            df = download_kaggle_dataset(kaggle_name)
        except Exception as e:
            st.error(f"❌ Failed to load dataset from Kaggle: {e}")

# Dataset editor block
edited_df = None
if df is not None:
    st.markdown("### 🧪 Dataset Preview")
    edited_df = st.data_editor(df, height=500, use_container_width=True)
    del df
    if st.button("❓ Generate correlation matrix"):
        draw_correlation_matrix(edited_df)
 
    # Preprocessing Sidebar
    one_hot_cols = st.sidebar.multiselect("Select columns to one-hot encode", edited_df.columns.tolist())
    scale_cols = st.sidebar.multiselect("Select columns to scale (multiply)", edited_df.columns.tolist())
    scale_factor = st.sidebar.number_input("Enter scaling factor (e.g., 100000 for *100k)", value=1.0)
    apply_preprocessing = None

    # Validation messages
    non_numeric_scale = [col for col in scale_cols if not pd.api.types.is_numeric_dtype(edited_df[col])]
    if non_numeric_scale:
        st.sidebar.warning(f"⚠️ These columns are not numeric and can't be scaled: {', '.join(non_numeric_scale)}")

    numeric_onehot = [col for col in one_hot_cols if pd.api.types.is_numeric_dtype(edited_df[col])]
    if numeric_onehot:
        st.sidebar.warning(f"⚠️ These columns are already numeric and probably don't need one-hot encoding: {', '.join(numeric_onehot)}")

    if not non_numeric_scale and not numeric_onehot:
        if st.sidebar.button("✅ Apply Preprocessing"):
            st.sidebar.success("Preprocessing selections recorded! (Applied during training)")

# MAIN: Model Training 
if edited_df is not None:
    st.markdown("### 🧠 Choose Your Task")
    task_type = st.selectbox("Task Type", ["Regression", "Clustering", "Anomaly Detection"])

    if task_type == "Regression":
        model_type = st.selectbox("Model", ["Linear Regression", "Decision Tree", "Forest Regression"])
        target = st.selectbox("Select target column", edited_df.columns.tolist())
        if not pd.api.types.is_numeric_dtype(edited_df[target]):
            st.error(f"❌ Target column '{target}' must be numeric.")
            st.stop()
        original_features = st.multiselect("Select feature columns", [col for col in edited_df.columns if col != target])
            
    elif task_type == "Clustering":
        model_type = st.selectbox("Model", ["DBSCAN"])
        target = None
        original_features = st.multiselect("Select feature columns", [col for col in edited_df.columns])

    elif task_type == "Anomaly Detection":
        model_type = st.selectbox("Model", ["Isolation Forest"])
        target = None  # Not needed
        original_features = st.multiselect("Select feature columns", [col for col in edited_df.columns])
    
    # Hyperparams based on model
    match model_type:
        case "Decision Tree":
            max_depth = st.slider("Tree depth", 1, 20, 5)
        case "Forest Regression":
            max_depth = st.slider("Max depth", 1, 20, 10)
            n_estimators = st.slider("Number of trees", 10, 300, 50)
        case "DBSCAN":
            eps = st.number_input("Epsilon (Neighborhood distance)", min_value=0.01, max_value=10.0, value=0.5, step=0.1)
            min_samples = st.number_input("Min samples to form cluster", min_value=1, max_value=100, value=5, step=1)
        case "Isolation Forest":
            contamination = st.slider("Contamination (expected anomaly %)", 0.01, 0.50, 0.05, step=0.01)
            n_estimators = st.slider("Number of trees", 50, 500, 100, step=50)

    sample = int(st.number_input("(Optional) Sample size for plots", min_value=0, value=0))

    if st.button("🚀 Train Model") and original_features:
        train_df = edited_df.copy()

        # Apply one-hot encoding
        if one_hot_cols:
            train_df = pd.get_dummies(train_df, columns=one_hot_cols)

        # Expand original feature names into one-hot columns if needed
        features = []
        for feature in original_features:
            if feature in one_hot_cols:
                features.extend([col for col in train_df.columns if col.startswith(feature + '_')])
            else:
                features.append(feature)

        # Apply scaling
        for col in scale_cols:
            if col in train_df.columns:
                train_df[col] *= scale_factor

        # Final sanity check: filter only existing columns
        features = [col for col in features if col in train_df.columns]
        with st.spinner(f"Running, {model_type}"):
            # Train selected model
            if task_type == "Regression":
                if model_type == "Linear Regression":
                    result = run_linear_regression(train_df, features, target)
                elif model_type == "Decision Tree":
                    result = run_decision_tree_regression(train_df, features, target, max_depth)
                elif model_type == "Forest Regression":
                    result = run_forest_regression(train_df, features, target, n_estimators, max_depth)
            elif model_type == "DBSCAN":
                result = run_dbscan_clustering(train_df, features, eps, min_samples)
            elif model_type == "Isolation Forest":
                    result = run_anomaly_detection(train_df, features, contamination, n_estimators) 
                    
            st.session_state.last_result = result
            st.session_state["preprocessed_df"] = train_df

    # Draw Metrics and Pltos
    if st.session_state.last_result:
        handle_results(task_type, model_type, st.session_state.last_result, sample, features)
        
st.markdown("---")
st.markdown("📎 [View source on GitHub](https://github.com/minvoker/ml-lab)")