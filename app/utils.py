import streamlit as st
from sklearn.decomposition import PCA
import numpy as np
import pandas as pd
import plotly.express as px
import kagglehub
import os

# Could have objects with inheritence for different ML metrics, or just different methods/overloading
def draw_st_metrics(model_result, validate=True):
    st.write("📈 Metrics:")

    metrics = {
        "MAE": round(model_result["MAE"], 2),
        "MSE": round(model_result["MSE"], 2),
        "RMSE": round(model_result["RMSE"], 2),
        "R²": round(model_result["R2"], 2)
    }

    if validate:
        metrics["Train R²"] = round(model_result["train_score"], 2)
        metrics["Test R²"] = round(model_result["test_score"], 2)

    # Convert to DataFrame and transpose for horizontal layout
    df_metrics = pd.DataFrame(metrics, index=["Score"]).map("{:.2f}".format)

    st.table(df_metrics)


def draw_correlation_matrix(raw_df):
    # Compute correlation matrix for numeric cols only
    df = raw_df.select_dtypes(include="number")
    corr = df.corr()

    # Create a Plotly heatmap
    fig = px.imshow(
        corr,
        text_auto=True,  # Annotate heatmap cells
        color_continuous_scale='RdBu_r',
        zmin=-1, zmax=1,
        
    )
    st.plotly_chart(fig, use_container_width=True)

def draw_cluster_plot(df_with_clusters, features):
    if "cluster" not in df_with_clusters.columns:
        st.error("❌ No 'cluster' column found in DataFrame.")
        return

    # Apply PCA to reduce to 2D for plotting
    pca = PCA(n_components=2)
    reduced = pca.fit_transform(df_with_clusters[features])

    # Build plotting DataFrame
    plot_df = pd.DataFrame(reduced, columns=["PC1", "PC2"])
    plot_df["Cluster"] = df_with_clusters["cluster"].astype(str)

    # Plot with Plotly
    fig = px.scatter(
        plot_df,
        x="PC1",
        y="PC2",
        color="Cluster",
        title="🧭 Cluster Plot (PCA 2D)",
        opacity=0.75,
        height=500
    )

    st.plotly_chart(fig, use_container_width=True)
    
def draw_cluster_profiles(df_with_clusters, categorical_col):
    fig = px.bar(
        df_with_clusters.groupby(["cluster", categorical_col]).size().reset_index(name="count"),
        x="cluster",
        y="count",
        color=categorical_col,
        barmode="group",
        title=f"Distribution of '{categorical_col}' by Cluster"
    )
    st.plotly_chart(fig, use_container_width=True)
    
def draw_scatter_plot(model_result, sample=None):
    plot_df = pd.DataFrame({
        "Truth": model_result["truth"],
        "Predictions": model_result["predictions"]
    })
        
    if sample and sample > 0:  # Downsample if sample n is specified
        plot_df = plot_df.iloc[::sample]

    fig = px.scatter(
        x=plot_df["Truth"],
        y=plot_df["Predictions"],
        labels={"x": "True Values", "y": "Predicted Values"},
        title="Predicted vs True Values (Diagonal = Perfect)"
    )

    fig.add_shape(
        type="line",
        x0=min(plot_df["Truth"]),
        y0=min(plot_df["Truth"]),
        x1=max(plot_df["Truth"]),
        y1=max(plot_df["Truth"]),
        line=dict(color="red", dash="dash"),
    )

    st.plotly_chart(fig, use_container_width=True)

# Draw Truth vs Predictions over Index (Line chart)
def draw_line_plot(model_result, sample=None):
    plot_df = pd.DataFrame({
        "Index": list(range(len(model_result["truth"]))),
        "Truth": model_result["truth"],
        "Predictions": model_result["predictions"]
    })

    if sample and sample > 0: # Downsample if sample n is specified
        plot_df = plot_df.iloc[::sample]
    # Reshape wide format → long format,
    plot_df_melted = plot_df.melt(id_vars=["Index"], value_vars=["Truth", "Predictions"], var_name="Type", value_name="Value")

    fig = px.line(
        plot_df_melted,
        x="Index",
        y="Value",
        color="Type",
        labels={"Index": "Sample Index", "Value": "Value", "Type": "Legend"},
        title="Truth vs Predictions Over Samples"
    )
    st.plotly_chart(fig, use_container_width=True)

def draw_anomaly_plot(result, dataset, features):
    if len(features) < 2:
        st.error("❌ Need at least 2 numeric features to plot anomalies.")
        return

    # Reduce to 2D with PCA
    pca = PCA(n_components=2)
    reduced = pca.fit_transform(dataset[features])
    plot_df = pd.DataFrame(reduced, columns=["PC1", "PC2"])
    plot_df["Anomaly"] = np.where(np.array(result["labels"]) == -1, "Anomaly", "Normal")

    fig = px.scatter(
        plot_df,
        x="PC1",
        y="PC2",
        color="Anomaly",
        title="🧨 Anomaly Detection Plot (PCA 2D)",
        opacity=0.75,
        height=500,
        color_discrete_map={"Anomaly": "red", "Normal": "blue"}
    )

    st.plotly_chart(fig, use_container_width=True)
    
def download_kaggle_dataset(kaggle_name):
    path = kagglehub.dataset_download(kaggle_name)
    print("Downloaded to:", path)

    files = os.listdir(path)
    csv_files = [f for f in files if f.endswith(".csv")]

    if not csv_files:
        raise FileNotFoundError("No CSV file found in the downloaded folder.")

    csv_path = os.path.join(path, csv_files[0])

    df = pd.read_csv(csv_path)

    return df

def handle_results(task_type, model_type, result, sample, features):
    if task_type == "Regression":
        draw_st_metrics(result)
        st.markdown("#### 🔍 Predicted vs Actual:")
        draw_scatter_plot(result, sample)
        draw_line_plot(result, sample)

    elif task_type == "Clustering":
        st.markdown(f"#### 📊 Cluster Summary")
        st.write("Number of clusters:", result["num_clusters"])
        st.write("Noise points:", result["num_noise"])
        st.dataframe(result["cluster_counts"])
        st.markdown("#### 🎯 Cluster Plot")
        draw_cluster_plot(result["df_with_clusters"], features)

    elif task_type == "Classification":
        st.info("✅ Classification metrics coming soon")

    elif task_type == "Anomaly Detection":
        st.markdown("#### 🚨 Anomaly Detection Results")
        st.write("Anomalies detected:", result["anomaly_count"])
        st.write("Normal points:", result["normal_count"])
        draw_anomaly_plot(result=result, dataset=st.session_state["preprocessed_df"], features=features)
