#!/usr/bin/env python3
"""
ClimateGuard AI — C07 Heuristic Baseline Showdown Benchmark Runner
Orchestrates:
1. Dataset verification & acquisition (ERA5 ECMWF historical archive)
2. Feature engineering & chronological split (Train: 2018-2021, Val: 2022, Test: 2023)
3. Model training (Primary Gradient Boosting vs Logistic Regression vs Moving Average Heuristic)
4. Evaluation across test telemetry
5. Relative improvement verification (>= 15% required)
6. Output reports generation (c07_results.json, c07_predictions.csv, C07_REPORT.md)
"""

import os
import sys
import json
import time

# Ensure project root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.datasets.download_dataset import download_climate_dataset, OUTPUT_CSV
from ml.preprocessing.preprocess import preprocess_dataset, TRAIN_CSV, VAL_CSV, TEST_CSV
from ml.train import train_all_models
from ml.evaluate import evaluate_all, RESULTS_JSON, REPORT_MD, PREDICTIONS_CSV

def run_c07_benchmark():
    print("=" * 76)
    print(" CLIMATEGUARD AI — C07 HEURISTIC BASELINE SHOWDOWN BENCHMARK")
    print(" Directive: Complex AI architectures must justify complexity over standard")
    print("            linear or heuristic baselines by at least +15% on target metric.")
    print("=" * 76)

    # 1. Dataset check
    if not os.path.exists(OUTPUT_CSV):
        print("\n[Step 1/4] Acquiring ERA5 Historical Telemetry Dataset...")
        download_climate_dataset()
    else:
        print(f"\n[Step 1/4] Verified existing climate dataset: {OUTPUT_CSV}")

    # 2. Preprocess check
    if not (os.path.exists(TRAIN_CSV) and os.path.exists(VAL_CSV) and os.path.exists(TEST_CSV)):
        print("\n[Step 2/4] Preprocessing dataset with chronological splits...")
        preprocess_dataset()
    else:
        print("\n[Step 2/4] Verified chronological train/val/test splits.")

    # 3. Train models
    print("\n[Step 3/4] Training baseline and primary models...")
    train_results = train_all_models()

    # 4. Evaluate models
    print("\n[Step 4/4] Evaluating models against unseen test telemetry (2023)...")
    eval_results = evaluate_all()

    p = eval_results["models"]["primary"]
    l = eval_results["models"]["baselineLogistic"]
    h = eval_results["models"]["baselineHeuristic"]
    comp_log = eval_results["comparison"]["primaryVsLogistic"]
    comp_heur = eval_results["comparison"]["primaryVsHeuristic"]

    print("\n" + "=" * 76)
    print(" C07 SHOWDOWN BENCHMARK RESULTS SUMMARY")
    print("=" * 76)
    print(f" Dataset:                {eval_results['dataset']['name']}")
    print(f" Test Period:            {eval_results['dataset']['testPeriod']} ({eval_results['dataset']['testSampleCount']} samples)")
    print(f" Evaluation Metric:      {eval_results['targetMetric']} (Required Delta: >= +15.0%)")
    print("-" * 76)
    print(f" 1. Heuristic Baseline:  F1 = {h['f1Score']:.4f} | Prec = {h['precision']:.4f} | Rec = {h['recall']:.4f}")
    print(f" 2. Logistic Baseline:   F1 = {l['f1Score']:.4f} | Prec = {l['precision']:.4f} | Rec = {l['recall']:.4f}")
    print(f" 3. Primary Model (GB):  F1 = {p['f1Score']:.4f} | Prec = {p['precision']:.4f} | Rec = {p['recall']:.4f}")
    print("-" * 76)
    print(f" Relative Delta vs Logistic:   {comp_log['relativeImprovementPct']:+.2f}%  [{'PASS ✅' if comp_log['exceeds15Percent'] else 'FAIL ❌'}]")
    print(f" Relative Delta vs Heuristic:  {comp_heur['relativeImprovementPct']:+.2f}%  [{'PASS ✅' if comp_heur['exceeds15Percent'] else 'FAIL ❌'}]")
    print("-" * 76)
    print(f" FINAL SHOWDOWN STATUS:  {'✅ PASS' if eval_results['status'] == 'PASS' else '❌ FAIL'}")
    print("=" * 76)
    print(f" JSON Summary:    {RESULTS_JSON}")
    print(f" Predictions CSV: {PREDICTIONS_CSV}")
    print(f" Markdown Report: {REPORT_MD}\n")

    return eval_results

if __name__ == "__main__":
    res = run_c07_benchmark()
    if res["status"] != "PASS":
        sys.exit(1)
    sys.exit(0)

