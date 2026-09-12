import os
import json
import hashlib
import pandas as pd
import numpy as np
import joblib

MODEL_VERSION = "v1.0.0"
DEFAULT_ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "artifacts"))
ARTIFACTS_DIR = os.environ.get("ML_ARTIFACTS_DIR", DEFAULT_ARTIFACTS_DIR)

class ModelManager:
    """
    Encapsulates ML model loading, feature vector transformation, hashing, and inference.
    Structured cleanly to enable lift-and-shift extraction into a standalone ML microservice if needed.
    """
    def __init__(self, artifacts_dir: str = ARTIFACTS_DIR):
        self.artifacts_dir = artifacts_dir
        self.preprocessor = None
        self.model = None
        self.model_version = MODEL_VERSION
        self.load_artifacts()

    def load_artifacts(self):
        prep_path = os.path.join(self.artifacts_dir, "preprocessor_v1.joblib")
        model_path = os.path.join(self.artifacts_dir, "model_v1.joblib")

        if os.path.exists(prep_path) and os.path.exists(model_path):
            self.preprocessor = joblib.load(prep_path)
            self.model = joblib.load(model_path)
            print(f"[CreditEngine] Successfully loaded ML artifacts from {self.artifacts_dir}")
        else:
            print(f"[CreditEngine] Warning: Artifacts not found at {prep_path} or {model_path}. Will attempt fallback/lazy loading.")

    def compute_feature_hash(self, feature_dict: dict) -> str:
        # Canonical serialized representation for deterministic hashing
        canonical_str = json.dumps(feature_dict, sort_keys=True)
        return "sha256:" + hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def score(self, feature_dict: dict) -> dict:
        """
        Runs ML prediction end-to-end on input alternate data vector.
        Outputs calibrated risk score (0-100) and feature hash.
        """
        if self.preprocessor is None or self.model is None:
            self.load_artifacts()
            if self.preprocessor is None or self.model is None:
                raise RuntimeError("ML model and preprocessor artifacts not loaded.")

        feature_hash = self.compute_feature_hash(feature_dict)
        df_input = pd.DataFrame([feature_dict])

        # Transform using fitted preprocessor
        X_trans = self.preprocessor.transform(df_input)

        # Predict calibrated adverse risk probability
        prob_adverse = float(self.model.predict_proba(X_trans)[0, 1])

        # Scale to 0-100 continuous risk score
        risk_score = round(prob_adverse * 100.0, 2)

        return {
            "risk_score": risk_score,
            "model_version": self.model_version,
            "feature_vector_hash": feature_hash,
            "features_used": len(feature_dict)
        }

model_manager = ModelManager()
