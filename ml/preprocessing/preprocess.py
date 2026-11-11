"""
ClimateGuard AI — Climate Feature Engineering & Chronological Split
Preprocesses ERA5 historical weather data into strictly chronological train/validation/test sets
with rolling lags and seasonal harmonics to prevent future data leakage.
"""

import os
import csv
import math
from datetime import datetime

PREPROC_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_CSV = os.path.join(PREPROC_DIR, "..", "datasets", "heatwave_dataset.csv")

TRAIN_CSV = os.path.join(PREPROC_DIR, "train.csv")
VAL_CSV = os.path.join(PREPROC_DIR, "val.csv")
TEST_CSV = os.path.join(PREPROC_DIR, "test.csv")

# Standard Municipal Heat Action Plan (HAP) / WMO Heatwave Alert Definition:
# High thermal stress day: Daily max temp >= 38.5C OR apparent temperature >= 40.0C
def is_heatwave(t_max, t_app):
    return 1 if (t_max >= 38.5 or t_app >= 40.0) else 0

def preprocess_dataset():
    if not os.path.exists(DATASET_CSV):
        raise FileNotFoundError(f"Missing raw dataset at {DATASET_CSV}. Run download_dataset.py first.")

    raw_rows = []
    with open(DATASET_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            raw_rows.append({
                "date": r["date"],
                "t_max": float(r["temperature_2m_max"]),
                "t_min": float(r["temperature_2m_min"]),
                "t_app": float(r["apparent_temperature_max"]),
                "precip": float(r["precipitation_sum"]),
                "wind": float(r["wind_speed_10m_max"])
            })

    # Sort chronologically
    raw_rows.sort(key=lambda x: x["date"])

    processed = []
    # Build temporal lag features (starting from index 7 to have a full 7-day preceding window)
    for i in range(7, len(raw_rows)):
        curr = raw_rows[i]
        d = datetime.strptime(curr["date"], "%Y-%m-%d")
        doy = d.timetuple().tm_yday
        sin_doy = math.sin(2 * math.pi * doy / 365.25)
        cos_doy = math.cos(2 * math.pi * doy / 365.25)

        # Preceding lags (strictly past, no leakage)
        lag1_tmax = raw_rows[i - 1]["t_max"]
        lag2_tmax = raw_rows[i - 2]["t_max"]
        lag3_tmax = raw_rows[i - 3]["t_max"]
        rolling_3d_tmax = (lag1_tmax + lag2_tmax + lag3_tmax) / 3.0

        # Preceding 7-day precipitation deficit
        precip_7d = sum(raw_rows[i - k]["precip"] for k in range(1, 8))

        # Compounding heat stress and thermal diurnal span
        diurnal_range = curr["t_max"] - curr["t_min"]
        apparent_diff = curr["t_app"] - curr["t_max"]

        label = is_heatwave(curr["t_max"], curr["t_app"])

        processed.append({
            "date": curr["date"],
            "year": d.year,
            "t_max": round(curr["t_max"], 2),
            "t_min": round(curr["t_min"], 2),
            "diurnal_range": round(diurnal_range, 2),
            "t_app": round(curr["t_app"], 2),
            "apparent_diff": round(apparent_diff, 2),
            "precip": round(curr["precip"], 2),
            "wind": round(curr["wind"], 2),
            "lag1_tmax": round(lag1_tmax, 2),
            "lag2_tmax": round(lag2_tmax, 2),
            "lag3_tmax": round(lag3_tmax, 2),
            "rolling_3d_tmax": round(rolling_3d_tmax, 2),
            "precip_7d": round(precip_7d, 2),
            "sin_doy": round(sin_doy, 4),
            "cos_doy": round(cos_doy, 4),
            "heatwave_day": label
        })

    # Chronological Splits:
    # Train: 2018-01-08 to 2021-12-31 (~4 years)
    # Val:   2022-01-01 to 2022-12-31 (1 year)
    # Test:  2023-01-01 to 2023-12-31 (1 year)
    train_set = [r for r in processed if r["year"] <= 2021]
    val_set = [r for r in processed if r["year"] == 2022]
    test_set = [r for r in processed if r["year"] == 2023]

    fieldnames = list(processed[0].keys())

    def write_csv(filepath, rows):
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    write_csv(TRAIN_CSV, train_set)
    write_csv(VAL_CSV, val_set)
    write_csv(TEST_CSV, test_set)

    def print_split_stats(name, data):
        positives = sum(r["heatwave_day"] for r in data)
        pct = (positives / len(data)) * 100 if data else 0
        print(f"  {name:10}: {len(data):4} samples ({data[0]['date']} to {data[-1]['date']}) | Heatwaves: {positives:3} ({pct:.1f}%)")

    print("[+] Feature engineering complete. Strict chronological splits:")
    print_split_stats("Train", train_set)
    print_split_stats("Val", val_set)
    print_split_stats("Test", test_set)

    return TRAIN_CSV, VAL_CSV, TEST_CSV

if __name__ == "__main__":
    preprocess_dataset()
