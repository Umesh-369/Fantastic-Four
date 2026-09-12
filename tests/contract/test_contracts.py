import pytest
from fastapi.testclient import TestClient
import sys
import os
import importlib.util

def load_app(relative_path):
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", relative_path))
    module_dir = os.path.dirname(abs_path)
    if module_dir not in sys.path:
        sys.path.insert(0, module_dir)
    spec = importlib.util.spec_from_file_location("main", abs_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.app

credit_app = load_app("services/credit-engine/main.py")
rule_app = load_app("services/rule-service/main.py")
explain_app = load_app("services/explanation-service/main.py")
audit_app = load_app("services/audit-service/main.py")
app_app = load_app("services/application-service/main.py")
fairness_app = load_app("services/fairness-service/main.py")
gateway_app = load_app("gateway/main.py")

def test_credit_engine_contract():
    client = TestClient(credit_app)
    h_resp = client.get("/health")
    assert h_resp.status_code == 200
    assert h_resp.json()["status"] == "healthy"
    assert "model_loaded" in h_resp.json()

    payload = {
        "employment_type": "gig",
        "rent_payment_ratio": 0.95,
        "utility_payment_ratio": 0.90,
        "telecom_payment_ratio": 0.92,
        "telecom_tenure_months": 40.0,
        "monthly_bank_inflow": 35000.0,
        "monthly_bank_outflow": 20000.0,
        "avg_bank_balance": 12000.0,
        "bounce_count_6m": 0,
        "gig_monthly_earnings": 25000.0,
        "gig_earnings_stability": 0.88,
        "gig_months_active": 30.0,
        "gig_rating": 4.7,
        "income_to_expense_ratio": 1.75,
        "payment_consistency": 0.92,
        "data_conflict_count": 0,
        "fraud_risk_score": 0.05,
        "missing_data_ratio": 0.0
    }
    s_resp = client.post("/v1/credit-engine/score", json=payload)
    assert s_resp.status_code == 200
    data = s_resp.json()
    assert "risk_score" in data
    assert 0.0 <= data["risk_score"] <= 100.0
    assert "model_version" in data
    assert data["feature_vector_hash"].startswith("sha256:")

def test_rule_service_contract():
    client = TestClient(rule_app)
    a_resp = client.get("/v1/rules/active")
    assert a_resp.status_code == 200
    assert "active_version" in a_resp.json()
    assert "rule_set" in a_resp.json()

    cl_resp = client.get("/v1/rules/changelog")
    assert cl_resp.status_code == 200
    assert isinstance(cl_resp.json(), list)

    # Approve scenario
    eval_payload = {
        "risk_score": 15.0,
        "monthly_income": 35000.0,
        "bounce_count_6m": 0,
        "fraud_risk_score": 0.05
    }
    e_resp = client.post("/v1/rules/evaluate", json=eval_payload)
    assert e_resp.status_code == 200
    res = e_resp.json()
    assert res["decision"] == "APPROVE"
    assert "rule_version" in res

    # Knockout reject scenario
    ko_payload = {
        "risk_score": 10.0,
        "monthly_income": 35000.0,
        "bounce_count_6m": 5, # Exceeds max bounce rule
        "fraud_risk_score": 0.05
    }
    ko_resp = client.post("/v1/rules/evaluate", json=ko_payload)
    assert ko_resp.status_code == 200
    assert ko_resp.json()["decision"] == "REJECT"

def test_explanation_service_contract():
    client = TestClient(explain_app)
    payload = {
        "feature_vector": {
            "employment_type": "gig",
            "rent_payment_ratio": 0.95,
            "bounce_count_6m": 0,
            "income_to_expense_ratio": 1.70,
            "payment_consistency": 0.94
        },
        "risk_score": 12.0,
        "decision": "APPROVE"
    }
    resp = client.post("/v1/explain", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "positive_factors" in data
    assert "negative_factors" in data
    assert "summary_text" in data

def test_audit_service_contract():
    client = TestClient(audit_app)
    payload = {
        "applicant_id": "APP_CONTRACT_TEST",
        "applicant_inputs": {"monthly_income": 30000.0},
        "model_version": "v1.0.0",
        "rule_version": "v1.0.0",
        "feature_vector_hash": "sha256:abc12345",
        "risk_score": 15.2,
        "decision": "APPROVE",
        "explanation_summary": "Test approval"
    }
    r_resp = client.post("/v1/audit/record", json=payload)
    assert r_resp.status_code == 201
    r_data = r_resp.json()
    assert "audit_id" in r_data
    assert "entry_hash" in r_data
    assert "prev_hash" in r_data

    v_resp = client.get("/v1/audit/verify")
    assert v_resp.status_code == 200
    v_data = v_resp.json()
    assert v_data["is_valid"] is True
    assert v_data["total_records"] >= 1

def test_fairness_service_contract():
    client = TestClient(fairness_app)
    resp = client.get("/v1/fairness/report")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "insufficient_group_labels"
    assert "available_columns" in data
    assert "employment_segment_analysis" in data

def test_gateway_contract():
    client = TestClient(gateway_app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
    assert resp.json()["service"] == "gateway"

    status_resp = client.get("/v1/system/services-status")
    assert status_resp.status_code == 200
    assert "services" in status_resp.json()
    assert len(status_resp.json()["services"]) == 7

