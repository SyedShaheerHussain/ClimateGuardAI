"""
ClimateGuard AI — Primary & Baseline Model Training Pipeline
Trains:
- Primary Non-Linear Architecture: GradientBoostingClassifier (100 estimators, max depth 4)
- Baseline Architecture: Regularized Logistic Regression with StandardScaler
- Heuristic Baseline: 3-day preceding rolling average threshold
Saves model artifacts to ml/models/
"""

import os
import csv
import time
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from ml.baseline import HeuristicMovingAverageBaseline, LogisticRegressionBaseline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PREPROC_DIR = os.path.join(BASE_DIR, "preprocessing")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLUMNS = [
    "lag1_tmax",
    "lag2_tmax",
    "lag3_tmax",
    "rolling_3d_tmax",
    "accel",
    "accel2",
    "heat_streak",
    "precip_7d",
    "sin_doy",
    "cos_doy",
    "wind",
    "diurnal",
    "apparent_diff"
]

def extract_features(csv_path):
    rows = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            lag1 = float(r["lag1_tmax"])
            lag2 = float(r["lag2_tmax"])
            lag3 = float(r["lag3_tmax"])
            r3d = float(r["rolling_3d_tmax"])
            precip7 = float(r["precip_7d"])
            sin_doy = float(r["sin_doy"])
            cos_doy = float(r["cos_doy"])
            wind = float(r["wind"])
            diurnal = float(r["diurnal_range"])
            app_diff = float(r["apparent_diff"])

            accel = lag1 - lag2
            accel2 = (lag1 - lag2) - (lag2 - lag3)
            heat_streak = 1.0 if (lag1 >= 38.0 and lag2 >= 38.0) else 0.0

            feats = [
                lag1, lag2, lag3, r3d, accel, accel2, heat_streak,
                precip7, sin_doy, cos_doy, wind, diurnal, app_diff
            ]
            rows.append({
                "date": r["date"],
                "features": feats,
                "rolling_3d": r3d,
                "label": int(r["heatwave_day"])
            })

    X = np.array([r["features"] for r in rows], dtype=np.float32)
    y = np.array([r["label"] for r in rows], dtype=np.int32)
    r3d = np.array([r["rolling_3d"] for r in rows], dtype=np.float32)
    dates = [r["date"] for r in rows]
    return X, y, r3d, dates

def train_all_models():
    train_csv = os.path.join(PREPROC_DIR, "train.csv")
    val_csv = os.path.join(PREPROC_DIR, "val.csv")

    print("[*] Loading chronological training & validation telemetry...")
    X_train, y_train, r3d_train, _ = extract_features(train_csv)
    X_val, y_val, r3d_val, _ = extract_features(val_csv)

    print(f"    Train size: {X_train.shape[0]} samples, {X_train.shape[1]} features, {np.sum(y_train)} positive heatwaves")
    print(f"    Val size:   {X_val.shape[0]} samples, {X_val.shape[1]} features, {np.sum(y_val)} positive heatwaves")

    # 1. Train Heuristic Baseline
    heur_baseline = HeuristicMovingAverageBaseline(threshold_c=38.0)
    heur_baseline.fit(r3d_train, y_train)

    # 2. Train Logistic Regression Baseline
    print("[*] Training Logistic Regression Baseline...")
    t0_log = time.perf_counter()
    log_baseline = LogisticRegressionBaseline(C=1.0, random_state=42)
    log_baseline.fit(X_train, y_train)
    t_train_log_ms = (time.perf_counter() - t0_log) * 1000

    log_path = os.path.join(MODELS_DIR, "baseline_logistic.joblib")
    joblib.dump(log_baseline, log_path)
    log_size_kb = os.path.getsize(log_path) / 1024

    # 3. Train Primary Model (GradientBoosting)
    print("[*] Training Primary Non-Linear Model (GradientBoostingClassifier)...")
    t0_gb = time.perf_counter()
    primary_model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.03,
        max_depth=4,
        subsample=0.9,
        random_state=42
    )
    primary_model.fit(X_train, y_train)
    t_train_gb_ms = (time.perf_counter() - t0_gb) * 1000

    primary_path = os.path.join(MODELS_DIR, "primary_model.joblib")
    joblib.dump(primary_model, primary_path)
    primary_size_kb = os.path.getsize(primary_path) / 1024

    print(f"[+] Models successfully trained and persisted:")
    print(f"    - Baseline Logistic : {log_size_kb:.1f} KB (Train time: {t_train_log_ms:.1f} ms)")
    print(f"    - Primary GB Model  : {primary_size_kb:.1f} KB (Train time: {t_train_gb_ms:.1f} ms)")

    return {
        "primary_model": primary_model,
        "log_baseline": log_baseline,
        "heur_baseline": heur_baseline,
        "primary_size_kb": round(primary_size_kb, 2),
        "log_size_kb": round(log_size_kb, 2),
        "train_time_primary_ms": round(t_train_gb_ms, 2),
        "train_time_log_ms": round(t_train_log_ms, 2)
    }

if __name__ == "__main__":
    train_all_models()

