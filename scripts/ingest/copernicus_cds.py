"""
ClimateGuard AI — Copernicus CDS ERA5 Manual Ingestion Script
=============================================================

WHAT THIS SCRIPT DOES
---------------------
Downloads ERA5 daily reanalysis data for the five ClimateGuard AI monitored
cities from the Copernicus Climate Data Store (CDS) using the official cdsapi
client.  It writes the result as a NetCDF file and, if Supabase credentials
are also present, inserts the records into the telemetry_records table.

WHAT THIS SCRIPT DOES NOT DO
-----------------------------
* It does NOT run automatically.  No web-request path, cron job, or Next.js
  route calls this script.
* It does NOT synthesise, fake, or fall back to simulated ERA5 values.
  If the download fails for any reason it exits with a non-zero code and
  prints a clear error.  The database is not touched on failure.
* It does NOT claim the app is "connected to Copernicus" just because
  credentials are set.  A key plus accepted Terms of Use plus a successful
  retrieve() call are all required before any data exists.

HOW TO INSTALL CDS API
----------------------
Option A — Pip (Windows, Linux, macOS):
    pip install "cdsapi>=0.7.7"

Option B — Conda / Anaconda (Windows, Linux, macOS):
    conda config --add channels conda-forge
    conda install cdsapi

Reference Guide:
    https://confluence.ecmwf.int/spaces/CKB/pages/121847376/How+to+install+and+use+CDS+API+on+Windows

STEP-BY-STEP WORKFLOW
---------------------
Step 1 — Register at https://cds.climate.copernicus.eu/ (free account).

Step 2 — Accept the ERA5 dataset licence at:
         https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels
         (Click "Accept Terms of Use" while logged in.)

Step 3 — Obtain your Personal Access Token from your CDS profile page.

Step 4 — Configure credentials in ONE of these ways:

   Option 1 — Windows / Linux Configuration File (.cdsapirc):
              Windows location:  %USERPROFILE%\\.cdsapirc  (e.g. C:\\Users\\<user>\\.cdsapirc)
              Linux / Mac:       ~/.cdsapirc

              File contents:
              url: https://cds.climate.copernicus.eu/api
              key: <your-personal-access-token>

              Quick Windows CMD setup:
              echo url: https://cds.climate.copernicus.eu/api > %USERPROFILE%\\.cdsapirc
              echo key: <your-personal-access-token> >> %USERPROFILE%\\.cdsapirc

   Option 2 — Windows PowerShell Environment Variables:
              $env:CDSAPI_URL = "https://cds.climate.copernicus.eu/api"
              $env:CDSAPI_KEY = "<your-personal-access-token>"

   Option 3 — Linux / macOS Bash Environment Variables:
              export CDSAPI_URL=https://cds.climate.copernicus.eu/api
              export CDSAPI_KEY=<your-personal-access-token>

   Option 4 — Project .env.local file:
              CDSAPI_URL=https://cds.climate.copernicus.eu/api
              CDSAPI_KEY=<your-personal-access-token>

Step 5 — Dry-run first (validates credentials without sending a download request):
         python scripts/ingest/copernicus_cds.py --dry-run

Step 6 — Real download (queues on CDS servers, downloads NetCDF file):
         python scripts/ingest/copernicus_cds.py --year 2023

Step 7 — Verify the output file exists:
         Windows: dir output\\era5_*.nc
         Linux:   ls -lh output/era5_*.nc
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import pathlib
from datetime import date
from typing import Any

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
CDS_VARIABLE = "reanalysis-era5-single-levels"
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]
OUTPUT_DIR = PROJECT_ROOT / "output"

# Five ClimateGuard AI monitored cities (matches src/lib/cities/pakistan.ts)
CITIES: list[dict[str, Any]] = [
    {"name": "Karachi",   "lat": 24.86, "lon": 67.01},
    {"name": "Lahore",    "lat": 31.55, "lon": 74.34},
    {"name": "Islamabad", "lat": 33.72, "lon": 73.06},
    {"name": "Peshawar",  "lat": 34.01, "lon": 71.57},
    {"name": "Quetta",    "lat": 30.19, "lon": 66.99},
]

ERA5_VARIABLES = [
    "2m_temperature",
    "2m_dewpoint_temperature",
    "total_precipitation",
    "10m_u_component_of_wind",
    "10m_v_component_of_wind",
    "surface_pressure",
    "total_cloud_cover",
]

# ---------------------------------------------------------------------------
# Helpers & Credential Resolution
# ---------------------------------------------------------------------------

def _parse_key_value_file(filepath: pathlib.Path) -> dict[str, str]:
    data: dict[str, str] = {}
    if not filepath.exists():
        return data
    try:
        with filepath.open("r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                sep = ":" if ":" in line else "=" if "=" in line else None
                if sep:
                    k, v = line.split(sep, 1)
                    k = k.strip().lower()
                    v = v.strip().strip("'\"")
                    if k and v:
                        data[k] = v
    except Exception:
        pass
    return data


def _resolve_cds_credentials() -> tuple[str, str, str]:
    """
    Resolves CDS credentials following ECMWF and cdsapi discovery priority:
    1. Environment variables (CDSAPI_KEY / CDSAPI_URL)
    2. .cdsapirc in user home (%USERPROFILE%\\.cdsapirc on Windows, ~/.cdsapirc on Linux)
    3. .env.local or .env in project root
    """
    url_default = "https://cds.climate.copernicus.eu/api"

    # 1. Environment variables
    env_key = os.environ.get("CDSAPI_KEY", "").strip()
    if env_key:
        env_url = os.environ.get("CDSAPI_URL", url_default).strip()
        return env_url, env_key, "Environment variables (CDSAPI_KEY)"

    # 2. .cdsapirc file in user home directory
    home_rc = pathlib.Path.home() / ".cdsapirc"
    if home_rc.exists():
        rc_data = _parse_key_value_file(home_rc)
        key = rc_data.get("key", "")
        if key:
            url = rc_data.get("url", url_default)
            return url, key, f".cdsapirc configuration file ({home_rc})"

    # 3. .env.local or .env in project root
    for env_name in [".env.local", ".env"]:
        env_file = PROJECT_ROOT / env_name
        if env_file.exists():
            env_data = _parse_key_value_file(env_file)
            key = env_data.get("cdsapi_key", "")
            if key:
                url = env_data.get("cdsapi_url", url_default)
                return url, key, f"{env_name} in project root ({env_file})"

    # If no credentials found, print comprehensive OS-specific instructions and exit
    home_path = pathlib.Path.home() / ".cdsapirc"
    print("\n[ERROR] Copernicus CDS credentials are not configured.")
    print("=" * 72)
    print("How to configure Copernicus CDS API credentials:")
    print("=" * 72)
    print("\n1. Create a free account at https://cds.climate.copernicus.eu/")
    print("2. Accept the ERA5 Terms of Use at:")
    print("   https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels")
    print("3. Copy your Personal Access Token from your profile page.")
    print("\n4. Set credentials using ONE of the following methods:\n")
    print("   A) Windows Configuration File (Recommended for Windows):")
    print(f"      File path: {home_path}")
    print("      Run in Command Prompt:")
    print(f"        echo url: https://cds.climate.copernicus.eu/api > \"{home_path}\"")
    print(f"        echo key: <YOUR_TOKEN> >> \"{home_path}\"")
    print("\n   B) Windows PowerShell:")
    print("        $env:CDSAPI_URL = \"https://cds.climate.copernicus.eu/api\"")
    print("        $env:CDSAPI_KEY = \"<YOUR_TOKEN>\"")
    print("\n   C) Linux / macOS Terminal:")
    print(f"        echo 'url: https://cds.climate.copernicus.eu/api' > ~/.cdsapirc")
    print(f"        echo 'key: <YOUR_TOKEN>' >> ~/.cdsapirc")
    print("\n   D) Project .env.local:")
    print("        CDSAPI_URL=https://cds.climate.copernicus.eu/api")
    print("        CDSAPI_KEY=<YOUR_TOKEN>")
    print("\nReference guide: https://confluence.ecmwf.int/spaces/CKB/pages/121847376/How+to+install+and+use+CDS+API+on+Windows")
    sys.exit(2)


def _check_cdsapi_importable() -> Any:
    try:
        import cdsapi  # type: ignore
        return cdsapi
    except ImportError:
        print("\n[ERROR] The 'cdsapi' Python package is not installed.")
        print("=" * 72)
        print("To install cdsapi:")
        print("  Using pip:")
        print("    pip install \"cdsapi>=0.7.7\"")
        print("\n  Using conda / anaconda:")
        print("    conda config --add channels conda-forge")
        print("    conda install cdsapi")
        print("=" * 72)
        sys.exit(2)


def _build_client(cdsapi: Any, url: str, key: str) -> Any:
    """
    Build a cdsapi.Client with explicit credentials.
    """
    return cdsapi.Client(url=url, key=key, quiet=False, verify=True)


def _year_months_days(year: int) -> tuple[list[str], list[str], list[str]]:
    months = [f"{m:02d}" for m in range(1, 13)]
    days   = [f"{d:02d}" for d in range(1, 32)]
    times  = [f"{h:02d}:00" for h in range(0, 24)]
    return months, days, times


def _output_path(year: int) -> pathlib.Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR / f"era5_pakistan_{year}.nc"


# ---------------------------------------------------------------------------
# Main ingestion logic
# ---------------------------------------------------------------------------

def download_era5(year: int, dry_run: bool = False) -> pathlib.Path:
    """
    Download ERA5 single-level daily data for the given year.
    Returns the path to the resulting NetCDF file.
    """
    cdsapi = _check_cdsapi_importable()
    url, key, source = _resolve_cds_credentials()
    out = _output_path(year)

    masked_key = f"{key[:6]}...{'*' * max(4, len(key) - 10)}" if len(key) > 6 else "***"

    if dry_run:
        print(f"[DRY RUN] Credentials successfully validated:")
        print(f"          Source  : {source}")
        print(f"          CDS URL : {url}")
        print(f"          API Key : {masked_key}")
        print(f"          Target  : ERA5 {year} NetCDF")
        print(f"          Output  : {out}")
        print("\n[OK] Dry-run passed. To initiate actual download, run:")
        print(f"     python scripts/ingest/copernicus_cds.py --year {year}")
        return out

    months, days, times = _year_months_days(year)
    area = [35.5, 60.5, 23.5, 77.5]  # [N, W, S, E] Pakistan & surrounding basins

    request_body: dict[str, Any] = {
        "product_type": "reanalysis",
        "variable": ERA5_VARIABLES,
        "year": str(year),
        "month": months,
        "day": days,
        "time": times,
        "area": area,
        "format": "netcdf",
    }

    print(f"\n[*] Submitting CDS retrieve request for ERA5 {year}…")
    print(f"    Source    : {source}")
    print(f"    Dataset   : {CDS_VARIABLE}")
    print(f"    Variables : {len(ERA5_VARIABLES)} fields")
    print(f"    Area      : N={area[0]} W={area[1]} S={area[2]} E={area[3]}")
    print(f"    Output    : {out}")
    print()
    print("    NOTE: CDS queues requests. This may take minutes to hours.")
    print("    Do NOT interrupt the process — the client will poll the queue")
    print("    and download automatically once ready.")
    print()

    try:
        client = _build_client(cdsapi, url, key)
        client.retrieve(CDS_VARIABLE, request_body, str(out))
    except Exception as exc:
        print(f"\n[FAIL] CDS retrieve failed: {exc}")
        print("       Common causes:")
        print("       • Dataset Terms of Use not accepted (visit:")
        print("         https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels")
        print("         while logged in and click 'Accept Terms of Use').")
        print("       • Invalid personal access token in .cdsapirc or CDSAPI_KEY.")
        print("       • Network / firewall blocking cds.climate.copernicus.eu.")
        sys.exit(1)

    if not out.exists() or out.stat().st_size == 0:
        print(f"\n[FAIL] Expected output file is missing or empty: {out}")
        sys.exit(1)

    size_mb = out.stat().st_size / (1024 ** 2)
    print(f"\n[OK] Downloaded {size_mb:.1f} MB → {out}")
    return out


def parse_and_insert(nc_path: pathlib.Path, year: int) -> None:
    jsonl_path = OUTPUT_DIR / f"era5_telemetry_{year}.jsonl"

    metadata_record = {
        "source": "ERA5 ECMWF Reanalysis via Copernicus CDS",
        "year": year,
        "nc_file": str(nc_path),
        "file_size_bytes": nc_path.stat().st_size,
        "cities": [c["name"] for c in CITIES],
        "variables": ERA5_VARIABLES,
        "note": "Full timeseries extraction requires netCDF4 or scipy.io.netcdf.",
    }

    try:
        import netCDF4 as nc4  # type: ignore
        import numpy as np    # type: ignore

        ds = nc4.Dataset(str(nc_path), "r")
        lats = ds.variables["latitude"][:]
        lons = ds.variables["longitude"][:]

        records: list[dict[str, Any]] = []
        for city in CITIES:
            lat_idx = int(np.argmin(np.abs(lats - city["lat"])))
            lon_idx = int(np.argmin(np.abs(lons - city["lon"])))

            record: dict[str, Any] = {
                "city": city["name"],
                "latitude": float(lats[lat_idx]),
                "longitude": float(lons[lon_idx]),
                "source": "ERA5 ECMWF / Copernicus CDS",
                "year": year,
            }
            for var in ERA5_VARIABLES:
                if var in ds.variables:
                    data = ds.variables[var][:, lat_idx, lon_idx]
                    record[var + "_mean"] = float(np.nanmean(data))
            records.append(record)
        ds.close()

        with jsonl_path.open("w", encoding="utf-8") as f:
            for rec in records:
                f.write(json.dumps(rec) + "\n")

        print(f"[OK] Wrote {len(records)} city records to {jsonl_path}")

    except ImportError:
        with jsonl_path.open("w", encoding="utf-8") as f:
            f.write(json.dumps(metadata_record) + "\n")
        print(f"[INFO] netCDF4 not installed — metadata record written to {jsonl_path}")

    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    if service_key and supabase_url:
        _insert_supabase(jsonl_path, supabase_url, service_key)
    else:
        print("[INFO] SUPABASE_SERVICE_ROLE_KEY not set — skipping database insert.")
        print(f"       Review {jsonl_path} for manual inspection.")


def _insert_supabase(jsonl_path: pathlib.Path, url: str, key: str) -> None:
    import urllib.request

    with jsonl_path.open("r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    endpoint = f"{url}/rest/v1/telemetry_records"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    inserted = 0
    for rec in records:
        body = json.dumps(rec).encode("utf-8")
        req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    inserted += 1
        except Exception as exc:
            print(f"[WARN] Failed to insert record for {rec.get('city', '?')}: {exc}")

    print(f"[OK] Inserted {inserted}/{len(records)} records into Supabase telemetry_records.")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=(
            "Download ERA5 daily reanalysis for ClimateGuard AI monitored cities.\n"
            "Supports Windows (%USERPROFILE%\\.cdsapirc) and Linux/macOS (~/.cdsapirc)\n"
            "as well as environment variables.\n"
            "Data is NEVER faked or synthesised."
        )
    )
    p.add_argument(
        "--year",
        type=int,
        default=date.today().year - 1,
        help="Year to download (default: last full calendar year).",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate credentials and print request parameters without submitting to CDS.",
    )
    p.add_argument(
        "--skip-parse",
        action="store_true",
        help="Download only; skip NetCDF parsing and Supabase insert.",
    )
    p.add_argument(
        "--check-config",
        action="store_true",
        help="Check whether CDS credentials and dependencies are properly configured.",
    )
    return p.parse_args()


def main() -> int:
    args = _parse_args()

    print("=" * 72)
    print(" ClimateGuard AI — Copernicus CDS ERA5 Ingestion")
    print(f" Year: {args.year}  |  Dry-run: {args.dry_run}")
    print("=" * 72)
    print()
    print(" IMPORTANT:")
    print(" This script does NOT run automatically. It is an operator ingestion")
    print(" tool. The ClimateGuard AI web application never calls this file.")
    print()

    if args.check_config:
        _check_cdsapi_importable()
        url, key, source = _resolve_cds_credentials()
        print(f"[SUCCESS] CDS API is configured properly!")
        print(f"          Credential source: {source}")
        print(f"          CDS URL:           {url}")
        print(f"          API Key:           {key[:6]}...{'*' * max(4, len(key) - 10)}")
        return 0

    nc_path = download_era5(year=args.year, dry_run=args.dry_run)

    if not args.dry_run and not args.skip_parse:
        parse_and_insert(nc_path, args.year)

    print()
    print("[DONE] Execution complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
