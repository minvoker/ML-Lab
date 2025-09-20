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
# General UX cleanup
# Export and save processed dataset, model predictions, and trained model - joblib

# Model configuration
MODEL_CONFIGS = {
    "Regression": {
        "Linear Regression": {"function": "run_linear_regression", "params": []},
        "Decision Tree": {"function": "run_decision_tree_regression", "params": ["max_depth"]},
        "Forest Regression": {"function": "run_forest_regression", "params": ["n_estimators", "max_depth"]}
    },
    "Clustering": {
        "DBSCAN": {"function": "run_dbscan_clustering", "params": ["eps", "min_samples"]}
    },
    "Anomaly Detection": {
        "Isolation Forest": {"function": "run_anomaly_detection", "params": ["contamination", "n_estimators"]}
    }
}

def get_model_function(model_type, task_type):
    """Get the model function based on task and model type."""
    return MODEL_CONFIGS[task_type][model_type]["function"]

def get_model_params(model_type, task_type):
    """Get the required parameters for a model."""
    return MODEL_CONFIGS[task_type][model_type]["params"]

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
missing_value_options = {}
outlier_options = {}

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
    
    # Show missing values summary
    missing_summary = get_missing_value_summary(edited_df)
    if not missing_summary.empty:
        st.markdown("#### 📊 Missing Values Summary")
        st.dataframe(missing_summary)
    else:
        st.success("✅ No missing values found in the dataset!")
 
    # Preprocessing Sidebar
    st.sidebar.markdown("### 🔧 Data Cleaning")
    
    # Missing values handling
    missing_strategy = st.sidebar.selectbox("Handle missing values", ["None", "Drop rows", "Impute values"])
    if missing_strategy == "Impute values":
        impute_strategy = st.sidebar.selectbox("Imputation strategy", ["mean", "median", "most_frequent"])
        impute_cols = st.sidebar.multiselect("Columns to impute (leave empty for all numeric)", edited_df.columns.tolist())
        missing_value_options = {"strategy": impute_strategy, "columns": impute_cols}
    elif missing_strategy == "Drop rows":
        drop_cols = st.sidebar.multiselect("Columns to check for missing values (leave empty for all)", edited_df.columns.tolist())
        missing_value_options = {"action": "drop", "columns": drop_cols}
    else:
        missing_value_options = {}
    
    # Outlier removal
    outlier_removal = st.sidebar.checkbox("Remove outliers (IQR method)")
    if outlier_removal:
        outlier_factor = st.sidebar.number_input("IQR factor", min_value=0.5, max_value=3.0, value=1.5, step=0.1)
        outlier_cols = st.sidebar.multiselect("Columns for outlier removal (leave empty for all numeric)", edited_df.columns.tolist())
        outlier_options = {"factor": outlier_factor, "columns": outlier_cols}
    else:
        outlier_options = {}
    
    st.sidebar.markdown("### 🔄 Data Transformation")
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
    task_type = st.selectbox("Task Type", list(MODEL_CONFIGS.keys()))

    # Get available models for selected task
    available_models = list(MODEL_CONFIGS[task_type].keys())
    model_type = st.selectbox("Model", available_models)

    # Target selection (only for regression)
    target = None
    if task_type == "Regression":
        target = st.selectbox("Select target column", edited_df.columns.tolist())
        if not pd.api.types.is_numeric_dtype(edited_df[target]):
            st.error(f"❌ Target column '{target}' must be numeric.")
            st.stop()
        original_features = st.multiselect("Select feature columns", [col for col in edited_df.columns if col != target])
    else:
        original_features = st.multiselect("Select feature columns", [col for col in edited_df.columns])
    
    # Dynamic hyperparameter configuration
    hyperparams = {}
    required_params = get_model_params(model_type, task_type)
    
    for param in required_params:
        if param == "max_depth":
            hyperparams[param] = st.slider("Tree depth", 1, 20, 5)
        elif param == "n_estimators":
            if model_type == "Forest Regression":
                hyperparams[param] = st.slider("Number of trees", 10, 300, 50)
            else:  # Isolation Forest
                hyperparams[param] = st.slider("Number of trees", 50, 500, 100, step=50)
        elif param == "eps":
            hyperparams[param] = st.number_input("Epsilon (Neighborhood distance)", min_value=0.01, max_value=10.0, value=0.5, step=0.1)
        elif param == "min_samples":
            hyperparams[param] = st.number_input("Min samples to form cluster", min_value=1, max_value=100, value=5, step=1)
        elif param == "contamination":
            hyperparams[param] = st.slider("Contamination (expected anomaly %)", 0.01, 0.50, 0.05, step=0.01)

    sample = int(st.number_input("(Optional) Sample size for plots", min_value=0, value=0))

    if st.button("🚀 Train Model") and original_features:
        train_df = edited_df.copy()

        # Apply missing value handling
        if missing_value_options:
            if missing_value_options.get("action") == "drop":
                cols_to_drop = missing_value_options.get("columns") if missing_value_options.get("columns") else None
                train_df = drop_missing_values(train_df, cols_to_drop)
                st.info(f"📉 Dropped rows with missing values. New shape: {train_df.shape}")
            elif "strategy" in missing_value_options:
                cols_to_impute = missing_value_options.get("columns") if missing_value_options.get("columns") else None
                strategy = missing_value_options.get("strategy")
                train_df = impute_missing_values(train_df, cols_to_impute, strategy)
                st.info(f"🔧 Imputed missing values using {strategy} strategy. Shape: {train_df.shape}")

        # Apply outlier removal
        if outlier_options:
            factor = outlier_options.get("factor", 1.5)
            cols_for_outliers = outlier_options.get("columns") if outlier_options.get("columns") else None
            original_shape = train_df.shape
            train_df = remove_outliers_iqr(train_df, cols_for_outliers, factor)
            removed_rows = original_shape[0] - train_df.shape[0]
            if removed_rows > 0:
                st.info(f"🗑️ Removed {removed_rows} outlier rows. New shape: {train_df.shape}")

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
            # Train selected model using configuration system
            model_function_name = get_model_function(model_type, task_type)
            
            # Import and call the appropriate function
            if model_function_name == "run_linear_regression":
                result = run_linear_regression(train_df, features, target)
            elif model_function_name == "run_decision_tree_regression":
                result = run_decision_tree_regression(train_df, features, target, hyperparams["max_depth"])
            elif model_function_name == "run_forest_regression":
                result = run_forest_regression(train_df, features, target, hyperparams["n_estimators"], hyperparams["max_depth"])
            elif model_function_name == "run_dbscan_clustering":
                result = run_dbscan_clustering(train_df, features, hyperparams["eps"], hyperparams["min_samples"])
            elif model_function_name == "run_anomaly_detection":
                result = run_anomaly_detection(train_df, features, hyperparams["contamination"], hyperparams["n_estimators"])
                    
            st.session_state.last_result = result
            st.session_state["preprocessed_df"] = train_df

    # Draw Metrics and Plots
    if st.session_state.last_result:
        handle_results(task_type, model_type, st.session_state.last_result, sample, features)
        
st.markdown("---")
st.markdown("📎 [View source on GitHub](https://github.com/minvoker/ml-lab)")