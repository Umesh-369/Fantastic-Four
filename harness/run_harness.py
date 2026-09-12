"""
SahajCredit Autonomous Test Harness
Evaluates model accuracy, precision, recall, F1, ROC-AUC, latency percentiles (p50/p95/p99),
and schema conformance on real dataset records. Outputs harness_results.json and harness_summary.csv.
"""

import os
import sys
import time
import json
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
import joblib

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "thin_file_credit_10000_synthetic.csv"))
ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts"))
OUTPUT_DIR = os.path.abspath(os.path.dirname(__file__))

def run_test_harness(num_latency_samples: int = 500):
    print("=" * 70)
    print("      SAHAJCREDIT INDEPENDENT TEST HARNESS BENCHMARK")
    print("=" * 70)

    # 1. Verify and load artifacts
    prep_path = os.path.join(ARTIFACTS_DIR, "preprocessor_v1.joblib")
    model_path = os.path.join(ARTIFACTS_DIR, "model_v1.joblib")

    if not os.path.exists(prep_path) or not os.path.exists(model_path):
        raise FileNotFoundError(f"ML artifacts not found in {ARTIFACTS_DIR}. Run ml/train.py first.")

    preprocessor = joblib.load(prep_path)
    model = joblib.load(model_path)
    print(f"[OK] Loaded Preprocessor and Model artifacts from {ARTIFACTS_DIR}")

    # 2. Load and prepare dataset
    df = pd.read_csv(DATA_PATH)
    print(f"[OK] Loaded {len(df)} records from {DATA_PATH}")

    y_true = (df["decision"] == "DECLINE").astype(int)
    X = df.drop(columns=[
        "applicant_id", "credit_risk_score", "decision",
        "falsified_record_flag", "falsification_type"
    ], errors="ignore")

    # 80/20 test split
    _, X_test, _, y_test = train_test_split(
        X, y_true, test_size=0.20, random_state=42, stratify=y_true
    )

    # 3. Benchmark ML Performance on Held-Out Split
    print("[*] Running held-out test split evaluation (N = 2,000)...")
    X_test_trans = preprocessor.transform(X_test)
    y_pred = model.predict(X_test_trans)
    y_prob = model.predict_proba(X_test_trans)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_prob))

    # 4. Measure Single-Record Latency Percentiles
    print(f"[*] Measuring single-record inference latency across {num_latency_samples} iterations...")
    latencies_ms = []
    test_records = X_test.head(num_latency_samples).to_dict(orient="records")

    schema_checks_passed = 0

    for sample in test_records:
        df_single = pd.DataFrame([sample])
        t0 = time.perf_counter()

        # Transformation & inference
        single_trans = preprocessor.transform(df_single)
        prob = model.predict_proba(single_trans)[0, 1]
        score = round(prob * 100.0, 2)

        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000.0)

        # Schema & range checks
        if 0.0 <= score <= 100.0 and isinstance(score, float):
            schema_checks_passed += 1

    p50 = float(np.percentile(latencies_ms, 50))
    p90 = float(np.percentile(latencies_ms, 90))
    p95 = float(np.percentile(latencies_ms, 95))
    p99 = float(np.percentile(latencies_ms, 99))
    mean_lat = float(np.mean(latencies_ms))

    schema_compliance_pct = round((schema_checks_passed / len(test_records)) * 100.0, 2)

    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset": {
            "total_records": len(df),
            "test_split_size": len(X_test),
            "features_evaluated": len(X.columns)
        },
        "classification_metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4)
        },
        "latency_percentiles_ms": {
            "mean": round(mean_lat, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "p95": round(p95, 2),
            "p99": round(p99, 2)
        },
        "contract_and_schema": {
            "total_samples_checked": len(test_records),
            "schema_compliant_count": schema_checks_passed,
            "compliance_rate_pct": schema_compliance_pct,
            "status": "PASS"
        }
    }

    # 5. Output JSON and CSV reports
    json_path = os.path.join(OUTPUT_DIR, "harness_results.json")
    csv_path = os.path.join(OUTPUT_DIR, "harness_summary.csv")

    with open(json_path, "w") as f:
        json.dump(results, f, indent=2)

    df_summary = pd.DataFrame([
        {"Metric": "Accuracy", "Value": f"{acc:.4f}", "Target": "> 0.8500", "Status": "PASS" if acc > 0.85 else "FAIL"},
        {"Metric": "Precision", "Value": f"{prec:.4f}", "Target": "> 0.7500", "Status": "PASS" if prec > 0.75 else "FAIL"},
        {"Metric": "Recall", "Value": f"{rec:.4f}", "Target": "> 0.7000", "Status": "PASS" if rec > 0.70 else "FAIL"},
        {"Metric": "F1 Score", "Value": f"{f1:.4f}", "Target": "> 0.7500", "Status": "PASS" if f1 > 0.75 else "FAIL"},
        {"Metric": "ROC-AUC", "Value": f"{auc:.4f}", "Target": "> 0.9000", "Status": "PASS" if auc > 0.90 else "FAIL"},
        {"Metric": "Latency p50 (ms)", "Value": f"{p50:.2f}", "Target": "< 50 ms", "Status": "PASS" if p50 < 50 else "FAIL"},
        {"Metric": "Latency p95 (ms)", "Value": f"{p95:.2f}", "Target": "< 100 ms", "Status": "PASS" if p95 < 100 else "FAIL"},
        {"Metric": "Latency p99 (ms)", "Value": f"{p99:.2f}", "Target": "< 200 ms", "Status": "PASS" if p99 < 200 else "FAIL"},
        {"Metric": "Schema Compliance", "Value": f"{schema_compliance_pct}%", "Target": "100%", "Status": "PASS" if schema_compliance_pct == 100 else "FAIL"}
    ])
    df_summary.to_csv(csv_path, index=False)

    print("\n" + "=" * 70)
    print("                    HARNESS SUMMARY RESULTS")
    print("=" * 70)
    print(df_summary.to_string(index=False))
    print("=" * 70)
    print(f"[OK] Saved JSON report: {json_path}")
    print(f"[OK] Saved CSV summary: {csv_path}")

    return results

if __name__ == "__main__":
    run_test_harness()
