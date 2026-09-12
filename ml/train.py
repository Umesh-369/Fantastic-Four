"""
SahajCredit Model Training Pipeline
Trains preprocessor and credit risk prediction model on thin_file_credit_10000_synthetic.csv.
Applies rigorous leakage exclusions and produces versioned artifacts under /ml/artifacts/
and evaluation report under /ml/reports/eval_v1.json.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "thin_file_credit_10000_synthetic.csv")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# 1. Columns to strictly exclude to prevent target and temporal leakage
EXCLUDED_COLUMNS = [
    "applicant_id",          # High-cardinality identifier
    "credit_risk_score",     # Direct precursor/leakage of decision label
    "decision",              # Target label
    "falsified_record_flag", # Post-outcome fraud audit tag
    "falsification_type"     # Post-outcome fraud audit tag
]

# 2. Retained features for thin-file alternate credit assessment
NUMERIC_FEATURES = [
    "rent_payment_ratio",
    "utility_payment_ratio",
    "telecom_payment_ratio",
    "telecom_tenure_months",
    "monthly_bank_inflow",
    "monthly_bank_outflow",
    "avg_bank_balance",
    "bounce_count_6m",
    "gig_monthly_earnings",
    "gig_earnings_stability",
    "gig_months_active",
    "gig_rating",
    "income_to_expense_ratio",
    "payment_consistency",
    "data_conflict_count",
    "fraud_risk_score",
    "missing_data_ratio"
]

CATEGORICAL_FEATURES = [
    "employment_type"
]

def train_and_evaluate():
    print(f"Loading synthetic dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} records with {len(df.columns)} columns.")

    # Define target: Adverse credit outcome (DECLINE / high risk)
    y = (df["decision"] == "DECLINE").astype(int)
    X = df.drop(columns=EXCLUDED_COLUMNS, errors="ignore")

    print(f"Features shape: {X.shape}, Target distribution: {np.bincount(y)}")

    # 80/20 train/test split with fixed random seed for determinism
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Preprocessor pipeline
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ]
    )

    # Model: Gradient Boosting Classifier
    model = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )

    print("Fitting preprocessor on training split...")
    preprocessor.fit(X_train)

    X_train_trans = preprocessor.transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    print("Training GradientBoosting model...")
    model.fit(X_train_trans, y_train)

    # Evaluate on held-out test split
    y_pred = model.predict(X_test_trans)
    y_prob = model.predict_proba(X_test_trans)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_prob))

    metrics = {
        "model_version": "v1.0.0",
        "random_seed": 42,
        "test_size": 0.20,
        "n_train_samples": len(X_train),
        "n_test_samples": len(X_test),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4),
        "features": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
            "excluded_leakage_columns": EXCLUDED_COLUMNS
        }
    }

    print("\n--- Held-Out Test Split Metrics ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1']:.4f}")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")

    # Save artifacts
    preprocessor_path = os.path.join(ARTIFACTS_DIR, "preprocessor_v1.joblib")
    model_path = os.path.join(ARTIFACTS_DIR, "model_v1.joblib")
    report_path = os.path.join(REPORTS_DIR, "eval_v1.json")

    joblib.dump(preprocessor, preprocessor_path)
    joblib.dump(model, model_path)
    with open(report_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nArtifacts saved successfully:")
    print(f"  - Preprocessor: {preprocessor_path}")
    print(f"  - Model:        {model_path}")
    print(f"  - Report:       {report_path}")

    return metrics

if __name__ == "__main__":
    train_and_evaluate()
