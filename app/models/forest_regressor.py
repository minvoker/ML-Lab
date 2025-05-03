from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pandas as pd
import numpy as np


def run_forest_regression(dataset, features, target, n_estimators=100, max_depth=None):

    X = dataset[features]
    y = dataset[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    regressor = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42
    )
    regressor.fit(X_train, y_train)
    predictions = regressor.predict(X_test)

    train_score = regressor.score(X_train, y_train)
    test_score = regressor.score(X_test, y_test)

    return {
        "MAE": mean_absolute_error(y_test, predictions),
        "MSE": mean_squared_error(y_test, predictions),
        "RMSE": np.sqrt(mean_squared_error(y_test, predictions)),
        "R2": r2_score(y_test, predictions),
        "truth": y_test.tolist(),
        "predictions": predictions.tolist(),
        "train_score": train_score,
        "test_score": test_score
    }