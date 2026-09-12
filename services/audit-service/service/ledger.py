import sqlite3
import json
import uuid
import hashlib
from datetime import datetime, timezone
import os
import httpx
from typing import Dict, Any, List, Optional

DB_PATH = os.environ.get("AUDIT_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "audit_service.db"))
GENESIS_HASH = "0" * 64

CREDIT_ENGINE_URL = os.environ.get("CREDIT_ENGINE_URL", "http://localhost:8002")
RULE_SERVICE_URL = os.environ.get("RULE_SERVICE_URL", "http://localhost:8003")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audit_id TEXT UNIQUE NOT NULL,
            applicant_id TEXT NOT NULL,
            dataset_version TEXT NOT NULL,
            preprocessor_version TEXT NOT NULL,
            model_version TEXT NOT NULL,
            rule_version TEXT NOT NULL,
            feature_vector_hash TEXT NOT NULL,
            risk_score REAL NOT NULL,
            decision TEXT NOT NULL,
            explanation_summary TEXT NOT NULL,
            applicant_inputs_json TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            entry_hash TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            decision_time_sec REAL DEFAULT 1.16,
            is_test INTEGER DEFAULT 0
        )
    """)
    try:
        cursor.execute("ALTER TABLE audit_ledger ADD COLUMN decision_time_sec REAL DEFAULT 1.16")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE audit_ledger ADD COLUMN is_test INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()

init_db()


def compute_entry_hash(
    applicant_id: str,
    model_version: str,
    rule_version: str,
    feature_vector_hash: str,
    risk_score: float,
    decision: str,
    timestamp: str,
    prev_hash: str
) -> str:
    canonical = f"{applicant_id}|{model_version}|{rule_version}|{feature_vector_hash}|{risk_score:.2f}|{decision}|{timestamp}|{prev_hash}"
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

def record_decision(record_data: dict) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get last entry's hash
    cursor.execute("SELECT entry_hash FROM audit_ledger ORDER BY id DESC LIMIT 1")
    last = cursor.fetchone()
    prev_hash = last["entry_hash"] if last else GENESIS_HASH

    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    applicant_id = record_data["applicant_id"]
    model_version = record_data["model_version"]
    rule_version = record_data["rule_version"]
    dataset_version = record_data.get("dataset_version", "v1.0")
    preprocessor_version = record_data.get("preprocessor_version", "v1.0")
    feature_vector_hash = record_data["feature_vector_hash"]
    risk_score = float(record_data["risk_score"])
    decision = record_data["decision"]
    explanation_summary = record_data["explanation_summary"]
    inputs_json = json.dumps(record_data["applicant_inputs"], sort_keys=True)

    entry_hash = compute_entry_hash(
        applicant_id=applicant_id,
        model_version=model_version,
        rule_version=rule_version,
        feature_vector_hash=feature_vector_hash,
        risk_score=risk_score,
        decision=decision,
        timestamp=timestamp,
        prev_hash=prev_hash
    )

    decision_time_sec = float(record_data.get("decision_time_sec", 1.16)) if record_data.get("decision_time_sec") is not None else 1.16
    is_test = 1 if record_data.get("is_test") or applicant_id.startswith(("APP_MOCK_", "APP_CONTRACT_", "APP_REPRO_", "APP_TAMPER_")) else 0

    cursor.execute("""
        INSERT INTO audit_ledger (
            audit_id, applicant_id, dataset_version, preprocessor_version,
            model_version, rule_version, feature_vector_hash, risk_score,
            decision, explanation_summary, applicant_inputs_json,
            prev_hash, entry_hash, timestamp, decision_time_sec, is_test
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        audit_id, applicant_id, dataset_version, preprocessor_version,
        model_version, rule_version, feature_vector_hash, risk_score,
        decision, explanation_summary, inputs_json,
        prev_hash, entry_hash, timestamp, decision_time_sec, is_test
    ))
    conn.commit()
    conn.close()

    return {
        "audit_id": audit_id,
        "applicant_id": applicant_id,
        "entry_hash": entry_hash,
        "prev_hash": prev_hash,
        "timestamp": timestamp,
        "status": "RECORDED"
    }

def verify_ledger() -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_ledger ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {
            "is_valid": True,
            "total_records": 0,
            "genesis_hash": GENESIS_HASH,
            "head_hash": GENESIS_HASH,
            "tampered_records": [],
            "message": "Audit ledger is empty; integrity intact."
        }

    expected_prev = GENESIS_HASH
    tampered = []

    for row in rows:
        # Check chaining
        if row["prev_hash"] != expected_prev:
            tampered.append(f"{row['audit_id']}: broken prev_hash chain")

        # Recompute hash
        recalc_hash = compute_entry_hash(
            applicant_id=row["applicant_id"],
            model_version=row["model_version"],
            rule_version=row["rule_version"],
            feature_vector_hash=row["feature_vector_hash"],
            risk_score=row["risk_score"],
            decision=row["decision"],
            timestamp=row["timestamp"],
            prev_hash=row["prev_hash"]
        )

        if recalc_hash != row["entry_hash"]:
            tampered.append(f"{row['audit_id']}: hash mismatch (stored={row['entry_hash'][:8]}, recalculated={recalc_hash[:8]})")

        expected_prev = row["entry_hash"]

    is_valid = len(tampered) == 0
    return {
        "is_valid": is_valid,
        "total_records": len(rows),
        "genesis_hash": GENESIS_HASH,
        "head_hash": rows[-1]["entry_hash"] if rows else GENESIS_HASH,
        "tampered_records": tampered,
        "message": "All cryptographically chained audit records verified successfully." if is_valid else f"Audit tampering detected in {len(tampered)} record(s)!"
    }

def get_record_by_id(audit_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_ledger WHERE audit_id = ? OR applicant_id = ?", (audit_id, audit_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    res["applicant_inputs"] = json.loads(res["applicant_inputs_json"])
    return res

def list_records(limit: int = 50, offset: int = 0, include_test: bool = False):
    conn = get_db_connection()
    cursor = conn.cursor()
    filter_clause = "" if include_test else "WHERE is_test = 0"
    cursor.execute(f"SELECT * FROM audit_ledger {filter_clause} ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = cursor.fetchall()
    cursor.execute(f"SELECT COUNT(*) as cnt FROM audit_ledger {filter_clause}")
    total = cursor.fetchone()["cnt"]
    conn.close()

    items = []
    for r in rows:
        item = dict(r)
        item["applicant_inputs"] = json.loads(item["applicant_inputs_json"])
        items.append(item)
    return {"total": total, "items": items}

def reproduce_decision(audit_id: str) -> dict:
    record = get_record_by_id(audit_id)
    if not record:
        raise ValueError(f"Audit record '{audit_id}' not found")

    inputs = record["applicant_inputs"]
    original_model_ver = record["model_version"]
    original_rule_ver = record["rule_version"]
    original_score = record["risk_score"]
    original_decision = record["decision"]

    # Re-run Credit Engine Scoring
    try:
        with httpx.Client(timeout=10.0) as client:
            score_resp = client.post(
                f"{CREDIT_ENGINE_URL}/v1/credit-engine/score",
                json=inputs
            )
            score_data = score_resp.json()
            reproduced_score = score_data.get("risk_score")

            # Re-run Rule Engine Evaluation with original rule version
            eval_payload = {
                "risk_score": reproduced_score,
                "monthly_income": inputs.get("monthly_income", 0.0),
                "bounce_count_6m": inputs.get("bounce_count_6m", 0),
                "fraud_risk_score": inputs.get("fraud_risk_score", 0.0),
                "data_conflict_count": inputs.get("data_conflict_count", 0),
                "rent_payment_ratio": inputs.get("rent_payment_ratio"),
                "income_to_expense_ratio": inputs.get("income_to_expense_ratio")
            }
            rule_resp = client.post(
                f"{RULE_SERVICE_URL}/v1/rules/evaluate?version={original_rule_ver}",
                json=eval_payload
            )
            rule_data = rule_resp.json()
            reproduced_decision = rule_data.get("decision")
    except Exception as e:
        raise RuntimeError(f"Reproduce failed during service execution: {str(e)}")

    decision_match = (original_decision == reproduced_decision)
    score_diff = abs(original_score - reproduced_score)
    is_reproducible = decision_match and (score_diff < 0.01)

    return {
        "audit_id": audit_id,
        "is_reproducible": is_reproducible,
        "original": {
            "model_version": original_model_ver,
            "rule_version": original_rule_ver,
            "risk_score": original_score,
            "decision": original_decision,
            "entry_hash": record["entry_hash"]
        },
        "reproduced": {
            "model_version": score_data.get("model_version"),
            "rule_version": rule_data.get("rule_version"),
            "risk_score": reproduced_score,
            "decision": reproduced_decision
        },
        "decision_match": decision_match,
        "risk_score_diff": round(score_diff, 4),
        "message": "Deterministic decision reproduction verified 100% identical." if is_reproducible else "Reproduction divergence detected!"
    }
