"""
ClimateGuard AI — C07 Heuristic & Linear Baseline Implementations
Provides:
1. Moving Average Heuristic Baseline:
   Evaluates 3-day preceding rolling mean temperature against threshold (38.0°C).
2. Logistic Regression Baseline:
   Standard L2-regularized linear model trained on chronological training set.
"""

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import f1_score, precision_score, recall_score, confusion_matrix

class HeuristicMovingAverageBaseline:
    """
    Rule-based moving average baseline:
    Predicts heatwave if the 3-day preceding rolling mean temperature >= threshold.
    """
    def __init__(self, threshold_c=38.0):
        self.name = "3-Day Moving Average Heuristic"
        self.threshold_c = threshold_c
        self.fitted_ = True

    def fit(self, X, y=None):
        return self

    def predict(self, rolling_3d_tmax):
        return (np.asarray(rolling_3d_tmax) >= self.threshold_c).astype(int)

    def predict_proba(self, rolling_3d_tmax):
        vals = np.asarray(rolling_3d_tmax)
        # Pseudo-probability calibrated around threshold
        probs = 1.0 / (1.0 + np.exp(-(vals - self.threshold_c)))
        return np.column_stack([1.0 - probs, probs])

class LogisticRegressionBaseline:
    """
    Linear baseline model with StandardScaler preprocessing and class weighting.
    """
    def __init__(self, C=1.0, random_state=42):
        self.name = "Regularized Logistic Regression"
        self.scaler = StandardScaler()
        self.model = LogisticRegression(C=C, max_iter=1000, class_weight="balanced", random_state=random_state)
        self.fitted_ = False

    def fit(self, X, y):
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.fitted_ = True
        return self

    def predict(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

def evaluate_predictions(y_true, y_pred):
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()
    return {
        "f1_score": round(f1, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "confusion_matrix": cm
    }

