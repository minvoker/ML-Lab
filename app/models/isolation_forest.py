from sklearn.ensemble import IsolationForest

def run_anomaly_detection(dataset, features, contamination=0.05, n_estimators=100):
    X = dataset[features]

    model = IsolationForest(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=42
    )
    model.fit(X)
    scores = model.decision_function(X)
    labels = model.predict(X)  # -1 = anomaly, 1 = normal

    return {
        "scores": scores.tolist(),
        "labels": labels.tolist(),  # -1 for anomaly, 1 for normal
        "anomaly_count": int((labels == -1).sum()),
        "normal_count": int((labels == 1).sum())
    }