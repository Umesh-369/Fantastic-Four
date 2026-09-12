import pytest
from fastapi.testclient import TestClient
import sys
import os
import sqlite3
import importlib.util

def load_module(rel_path):
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", rel_path))
    module_dir = os.path.dirname(abs_path)
    if module_dir not in sys.path:
        sys.path.insert(0, module_dir)
    spec = importlib.util.spec_from_file_location(os.path.basename(rel_path).replace(".py", ""), abs_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

audit_mod = load_module("services/audit-service/main.py")
credit_mod = load_module("services/credit-engine/main.py")
rule_mod = load_module("services/rule-service/main.py")

@pytest.fixture
def mock_audit_services(monkeypatch):
    import httpx
    credit_client = TestClient(credit_mod.app)
    rule_client = TestClient(rule_mod.app)
    orig_post = httpx.Client.post

    def mock_post(self, url, json=None, **kwargs):
        if isinstance(self, TestClient):
            return orig_post(self, url, json=json, **kwargs)

        class MockResponse:
            def __init__(self, sc, data):
                self.status_code = sc
                self._data = data
                self.text = str(data)
            def json(self):
                return self._data

        if "/v1/credit-engine/score" in url:
            r = credit_client.post("/v1/credit-engine/score", json=json)
            return MockResponse(r.status_code, r.json())
        elif "/v1/rules/evaluate" in url:
            r = rule_client.post("/v1/rules/evaluate", json=json)
            return MockResponse(r.status_code, r.json())
        return orig_post(self, url, json=json, **kwargs)

    monkeypatch.setattr(httpx.Client, "post", mock_post)

def test_audit_reproduce_identical_decision(mock_audit_services):
    client = TestClient(audit_mod.app)

    # 1. Record an audit event
    inputs = {
        "full_name": "Sunita Patil",
        "employment_type": "gig",
        "monthly_income": 35000.0,
        "requested_loan_amount": 40000.0,
        "rent_payment_ratio": 0.95,
        "utility_payment_ratio": 0.92,
        "telecom_payment_ratio": 0.90,
        "telecom_tenure_months": 45.0,
        "monthly_bank_inflow": 40000.0,
        "monthly_bank_outflow": 22000.0,
        "avg_bank_balance": 15000.0,
        "bounce_count_6m": 0,
        "gig_monthly_earnings": 28000.0,
        "gig_earnings_stability": 0.86,
        "gig_months_active": 32.0,
        "gig_rating": 4.8,
        "income_to_expense_ratio": 1.81,
        "payment_consistency": 0.93,
        "data_conflict_count": 0,
        "fraud_risk_score": 0.04,
        "missing_data_ratio": 0.0
    }

    # Score and evaluate to get original
    credit_client = TestClient(credit_mod.app)
    rule_client = TestClient(rule_mod.app)

    score_res = credit_client.post("/v1/credit-engine/score", json=inputs).json()
    rule_res = rule_client.post("/v1/rules/evaluate", json={
        "risk_score": score_res["risk_score"],
        "monthly_income": inputs["monthly_income"],
        "bounce_count_6m": inputs["bounce_count_6m"],
        "fraud_risk_score": inputs["fraud_risk_score"]
    }).json()

    record_payload = {
        "applicant_id": "APP_REPRO_001",
        "applicant_inputs": inputs,
        "model_version": score_res["model_version"],
        "rule_version": rule_res["rule_version"],
        "feature_vector_hash": score_res["feature_vector_hash"],
        "risk_score": score_res["risk_score"],
        "decision": rule_res["decision"],
        "explanation_summary": "Original recorded decision"
    }

    rec_resp = client.post("/v1/audit/record", json=record_payload)
    assert rec_resp.status_code == 201
    audit_id = rec_resp.json()["audit_id"]

    # 2. Call /v1/audit/{audit_id}/reproduce
    repro_resp = client.get(f"/v1/audit/{audit_id}/reproduce")
    assert repro_resp.status_code == 200
    repro_data = repro_resp.json()

    assert repro_data["is_reproducible"] is True
    assert repro_data["decision_match"] is True
    assert repro_data["risk_score_diff"] < 0.01
    assert repro_data["reproduced"]["decision"] == rule_res["decision"]

def test_audit_tamper_detection():
    client = TestClient(audit_mod.app)

    # Initial ledger verification must pass
    v1 = client.get("/v1/audit/verify").json()
    assert v1["is_valid"] is True

    # Record a test entry
    rec = client.post("/v1/audit/record", json={
        "applicant_id": "APP_TAMPER_TEST",
        "applicant_inputs": {"income": 20000},
        "model_version": "v1.0.0",
        "rule_version": "v1.0.0",
        "feature_vector_hash": "sha256:111",
        "risk_score": 20.0,
        "decision": "APPROVE",
        "explanation_summary": "Pre-tamper"
    }).json()
    audit_id = rec["audit_id"]

    # Directly tamper with SQLite table to simulate malicious database modification
    import service.ledger as audit_ledger_module
    db_path = audit_ledger_module.DB_PATH
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE audit_ledger SET decision = 'REJECT' WHERE audit_id = ?", (audit_id,))
    conn.commit()
    conn.close()

    # Ledger verification must now fail!
    v2 = client.get("/v1/audit/verify").json()
    assert v2["is_valid"] is False
    assert len(v2["tampered_records"]) >= 1
    assert any(audit_id in t for t in v2["tampered_records"])

    # Restore data integrity
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE audit_ledger SET decision = 'APPROVE' WHERE audit_id = ?", (audit_id,))
    conn.commit()
    conn.close()

    # Re-verify
    v3 = client.get("/v1/audit/verify").json()
    assert v3["is_valid"] is True
