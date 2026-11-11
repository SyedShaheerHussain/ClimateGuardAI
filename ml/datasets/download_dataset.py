"""
ClimateGuard AI — Climate Dataset Acquisition
Downloads real historical meteorological daily observations for Rajasthan Urban Corridor (26.91N, 75.78E)
from Open-Meteo's open-access ERA5 historical archive (ECMWF reanalysis).
Usage rights: Open Data (Copernicus / CC-BY 4.0).
"""

import os
import sys
import json
import csv
import urllib.request

DATASET_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_CSV = os.path.join(DATASET_DIR, "heatwave_dataset.csv")
RAW_JSON = os.path.join(DATASET_DIR, "raw_climate_data.json")

# Coordinates for Rajasthan Urban Corridor (ClimateGuard AI Basin RAJASTHAN-C)
LATITUDE = 26.91
LONGITUDE = 75.78
START_DATE = "2018-01-01"
END_DATE = "2023-12-31"

def download_climate_dataset():
    print(f"[*] Acquiring ERA5 daily meteorological telemetry for Basin RAJASTHAN-C ({LATITUDE}N, {LONGITUDE}E)...")
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={LATITUDE}&longitude={LONGITUDE}&"
        f"start_date={START_DATE}&end_date={END_DATE}&"
        f"daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,wind_speed_10m_max&"
        f"timezone=auto"
    )

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ClimateGuardAI-ML-Pipeline/1.0 (Copernicus-ERA5-Ingest)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            with open(RAW_JSON, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"[+] Successfully fetched {len(data['daily']['time'])} daily records from ERA5 archive.")
    except Exception as e:
        print(f"[!] Warning: Network fetch error ({e}). Checking local cached raw JSON...")
        if not os.path.exists(RAW_JSON):
            raise RuntimeError(f"Cannot download dataset and no cached raw file found at {RAW_JSON}")
        with open(RAW_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"[+] Loaded {len(data['daily']['time'])} cached daily records.")

    daily = data["daily"]
    dates = daily["time"]
    t_max = daily["temperature_2m_max"]
    t_min = daily["temperature_2m_min"]
    t_app = daily["apparent_temperature_max"]
    precip = daily["precipitation_sum"]
    wind = daily["wind_speed_10m_max"]

    fieldnames = [
        "date",
        "temperature_2m_max",
        "temperature_2m_min",
        "apparent_temperature_max",
        "precipitation_sum",
        "wind_speed_10m_max"
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for i in range(len(dates)):
            writer.writerow({
                "date": dates[i],
                "temperature_2m_max": t_max[i] if t_max[i] is not None else 0.0,
                "temperature_2m_min": t_min[i] if t_min[i] is not None else 0.0,
                "apparent_temperature_max": t_app[i] if t_app[i] is not None else 0.0,
                "precipitation_sum": precip[i] if precip[i] is not None else 0.0,
                "wind_speed_10m_max": wind[i] if wind[i] is not None else 0.0
            })

    print(f"[+] Dataset written to: {OUTPUT_CSV} ({len(dates)} samples)")
    return OUTPUT_CSV

if __name__ == "__main__":
    download_climate_dataset()

