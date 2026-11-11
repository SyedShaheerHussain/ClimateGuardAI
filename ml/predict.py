"""
ClimateGuard AI — C07 Primary Model Predictor
Provides inference interface using the trained GradientBoosting primary model.
"""

import os
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "primary_model.joblib")

_model = None

def get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Primary model not found at {MODEL_PATH}. Run ml/train.py first.")
        _model = joblib.load(MODEL_PATH)
    return _model

def predict_heatwave(features):
    """
    Given a list or array of 13 engineered features:
    [lag1_tmax, lag2_tmax, lag3_tmax, rolling_3d_tmax, accel, accel2, heat_streak, precip_7d, sin_doy, cos_doy, wind, diurnal, apparent_diff]
    Returns prediction dict:
    - heatwavePredicted (bool)
    - heatwaveProbability (float between 0 and 1)
    - model (str)
    """
    model = get_model()
    x = np.asarray(features, dtype=np.float32).reshape(1, -1)
    prob = float(model.predict_proba(x)[0, 1])
    pred = int(prob >= 0.5)

    return {
        "heatwavePredicted": bool(pred),
        "heatwaveProbability": round(prob, 4),
        "threatLevel": "critical" if prob >= 0.8 else "high" if prob >= 0.6 else "moderate" if prob >= 0.3 else "safe",
        "model": "ClimateGuard-GB-NonLinear (100 estimators, max depth 4)"
    }

if __name__ == "__main__":
    import sys
    # Example test with moderate warm spell
    sample_features = [37.5, 36.8, 35.2, 36.5, 0.7, 0.9, 0.0, 0.0, 0.8, -0.6, 14.0, 12.0, 1.5]
    res = predict_heatwave(sample_features)
    print("Inference result:", res)

