# 🔍 ML Lab

An interactive Streamlit-based machine learning sandbox for experimenting with regression, clustering, and anomaly detection — all in your browser.

![Demo GIF](./demo.gif)

---

## Project Overview

**ML Sandbox** is designed as a hands-on playground where users can:
- Upload or load datasets from Kaggle or URLs
- Preprocess data with one-hot encoding and scaling
- Select ML tasks: **Regression**, **Clustering**, or **Anomaly Detection**
- Train models interactively with visual feedback and performance metrics

It aims to make ML experimentation more accessible without writing any code.

---

## Features

- 🧪 Dataset editor & preview
- 📈 Regression models: Linear, Decision Tree, Random Forest
- 🧭 Clustering: DBSCAN with PCA visualization
- 🧨 Anomaly Detection: Isolation Forest with 2D PCA plot
- ⚙️ Preprocessing: one-hot encoding, feature scaling
- 💻 Built with **Streamlit**, **scikit-learn**, **Plotly**, and **Pandas**

---

## Challenges Faced

- Handling user-selected categorical/numerical feature encoding dynamically
- Ensuring model compatibility with one-hot encoded inputs
- PCA visualizations for both clustering and anomaly tasks in a reusable way
- Keeping state across user interactions without breaking visual plots

---


## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/minvoker/ml-lab.git
cd ML-Lab
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```
### 3. Run the app
```bash
streamlit run app/app.py
```