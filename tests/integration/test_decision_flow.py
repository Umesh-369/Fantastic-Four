import pytest
from fastapi.testclient import TestClient
import sys
import os
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

gateway_mod = load_module("gateway/main.py")
credit_mod = load_module("services/credit-engine/main.py")
rule_mod = load_module("services/rule-service/main.py")
explain_mod = load_module("services/explanation-service/main.py")
audit_mod = load_module("services/audit-service/main.py")

@pytest.fixture
def mock_gateway(monkeypatch):
    """
    Mount in-process test clients for gateway downstream calls so tests run cleanly and fast without spawning external ports.
    """
    credit_client = TestClient(credit_mod.app)
    rule_client = TestClient(rule_mod.app)
    explain_client = TestClient(explain_mod.app)
    audit_client = TestClient(audit_mod.app)

    async def mock_post(self, url, json=None, **kwargs):
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
        elif "/v1/explain" in url:
            r = explain_client.post("/v1/explain", json=json)
            return MockResponse(r.status_code, r.json())
        elif "/v1/audit/record" in url:
            r = audit_client.post("/v1/audit/record", json=json)
            return MockResponse(r.status_code, r.json())
        elif "/v1/applicants" in url:
            return MockResponse(201, {"applicant_id": "APP_MOCK_123"})
        raise ValueError(f"Unhandled mock URL: {url}")

    import httpx
    monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

def test_full_decision_flow_approve(mock_gateway):
    client = TestClient(gateway_mod.app)

    # Prime low-risk applicant profile
    payload_prime = {
        "full_name": "Priya Sharma",
        "date_of_birth": "1994-06-15",
        "phone_number": "9876543210",
        "employment_type": "gig",
        "monthly_income": 45000.0,
        "requested_loan_amount": 50000.0,
        "rent_payment_ratio": 0.98,
        "utility_payment_ratio": 0.96,
        "telecom_payment_ratio": 0.95,
        "telecom_tenure_months": 60.0,
        "monthly_bank_inflow": 48000.0,
        "monthly_bank_outflow": 26000.0,
        "avg_bank_balance": 18000.0,
        "bounce_count_6m": 0,
        "gig_monthly_earnings": 38000.0,
        "gig_earnings_stability": 0.92,
        "gig_months_active": 42.0,
        "gig_rating": 4.85,
        "income_to_expense_ratio": 1.84,
        "payment_consistency": 0.96,
        "data_conflict_count": 0,
        "fraud_risk_score": 0.02,
        "missing_data_ratio": 0.0
    }

    resp = client.post("/v1/decisions/evaluate", json=payload_prime)
    assert resp.status_code == 200
    data = resp.json()

    # Response contract validation
    assert "risk_score" in data
    assert "decision" in data
    assert "explanation" in data
    assert "model_version" in data
    assert "rule_version" in data
    assert "audit_id" in data
    assert "timestamp" in data

    assert data["decision"] == "APPROVE"
    assert data["risk_score"] < 35.0
    assert len(data["explanation"]["positive_factors"]) > 0
    prime_score = data["risk_score"]

    # High-risk applicant profile
    payload_adverse = dict(payload_prime)
    payload_adverse["full_name"] = "Ramesh Kumar"
    payload_adverse["rent_payment_ratio"] = 0.55
    payload_adverse["utility_payment_ratio"] = 0.60
    payload_adverse["telecom_payment_ratio"] = 0.58
    payload_adverse["bounce_count_6m"] = 5
    payload_adverse["payment_consistency"] = 0.62
    payload_adverse["fraud_risk_score"] = 0.45
    payload_adverse["income_to_expense_ratio"] = 0.95

    resp_adverse = client.post("/v1/decisions/evaluate", json=payload_adverse)
    assert resp_adverse.status_code == 200
    data_adverse = resp_adverse.json()

    # Assert score changes when features change
    assert data_adverse["risk_score"] > prime_score
    assert data_adverse["decision"] == "REJECT"

    # Explanation factors must differ meaningfully
    assert len(data_adverse["explanation"]["negative_factors"]) > 0
    prime_pos = " ".join(data["explanation"]["positive_factors"])
    adverse_neg = " ".join(data_adverse["explanation"]["negative_factors"])
    assert prime_pos != adverse_neg
