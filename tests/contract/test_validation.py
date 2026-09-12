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

gateway_app = load_app("gateway/main.py")
app_app = load_app("services/application-service/main.py")
credit_app = load_app("services/credit-engine/main.py")
rule_app = load_app("services/rule-service/main.py")
explain_app = load_app("services/explanation-service/main.py")
audit_app = load_app("services/audit-service/main.py")

VALID_GATEWAY_PAYLOAD = {
    "full_name": "Aarav Sharma",
    "date_of_birth": "1995-05-20",
    "phone_number": "9876543210",
    "employment_type": "gig",
    "monthly_income": 40000.0,
    "requested_loan_amount": 50000.0,
    "rent_payment_ratio": 0.95,
    "utility_payment_ratio": 0.90,
    "telecom_payment_ratio": 0.92,
    "telecom_tenure_months": 36.0,
    "monthly_bank_inflow": 42000.0,
    "monthly_bank_outflow": 25000.0,
    "avg_bank_balance": 15000.0,
    "bounce_count_6m": 0,
    "gig_monthly_earnings": 30000.0,
    "gig_earnings_stability": 0.85,
    "gig_months_active": 24.0,
    "gig_rating": 4.8,
    "income_to_expense_ratio": 1.68,
    "payment_consistency": 0.92,
    "data_conflict_count": 0,
    "fraud_risk_score": 0.05,
    "missing_data_ratio": 0.0,
}

# ---------------------------------------------------------------------------
# 1. Mobile Number Boundary Tests (Gateway & Application Service)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("app_to_test, endpoint", [
    (gateway_app, "/v1/decisions/evaluate"),
    (app_app, "/v1/applicants"),
])
def test_mobile_number_boundary_cases(app_to_test, endpoint):
    client = TestClient(app_to_test)

    # 9 digits -> reject (422)
    payload_9_digits = dict(VALID_GATEWAY_PAYLOAD, phone_number="987654321")
    resp = client.post(endpoint, json=payload_9_digits)
    assert resp.status_code == 422, f"Expected 422 for 9-digit phone, got {resp.status_code}"

    # 11 digits -> reject (422)
    payload_11_digits = dict(VALID_GATEWAY_PAYLOAD, phone_number="98765432101")
    resp = client.post(endpoint, json=payload_11_digits)
    assert resp.status_code == 422, f"Expected 422 for 11-digit phone, got {resp.status_code}"

    # Invalid characters (letters, spaces, dashes, symbols, + prefix) -> reject (422)
    invalid_phones = [
        "98765abcde",
        "98765 43210",
        "987-654-3210",
        "987654321@",
        "+919876543210",
        " 9876543210",
        "9876543210 ",
    ]
    for inv_phone in invalid_phones:
        payload_inv = dict(VALID_GATEWAY_PAYLOAD, phone_number=inv_phone)
        resp = client.post(endpoint, json=payload_inv)
        assert resp.status_code == 422, f"Expected 422 for invalid phone '{inv_phone}', got {resp.status_code}"

    # 10 digits -> accepted at Application Service (returns 201)
    if endpoint == "/v1/applicants":
        payload_10_digits = dict(VALID_GATEWAY_PAYLOAD, phone_number="9876543210")
        resp = client.post(endpoint, json=payload_10_digits)
        assert resp.status_code == 201
        assert resp.json()["phone_number"] == "9876543210"

# ---------------------------------------------------------------------------
# 2. Full Name & Date of Birth Boundary Tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("app_to_test, endpoint", [
    (gateway_app, "/v1/decisions/evaluate"),
    (app_app, "/v1/applicants"),
])
def test_full_name_and_dob_boundaries(app_to_test, endpoint):
    client = TestClient(app_to_test)

    # Name too short (< 2 characters) -> 422
    p = dict(VALID_GATEWAY_PAYLOAD, full_name="A")
    assert client.post(endpoint, json=p).status_code == 422

    # Name with disallowed numbers/symbols -> 422
    p = dict(VALID_GATEWAY_PAYLOAD, full_name="John123")
    assert client.post(endpoint, json=p).status_code == 422

    p = dict(VALID_GATEWAY_PAYLOAD, full_name="Jane@Doe")
    assert client.post(endpoint, json=p).status_code == 422

    # Valid name with hyphens / apostrophes / dots -> accepted
    if endpoint == "/v1/applicants":
        p = dict(VALID_GATEWAY_PAYLOAD, full_name="Mary-Jane O'Connor Jr.")
        assert client.post(endpoint, json=p).status_code == 201

    # Date of birth under 18 years old -> 422
    p = dict(VALID_GATEWAY_PAYLOAD, date_of_birth="2020-01-01")
    assert client.post(endpoint, json=p).status_code == 422

    # Future date of birth -> 422
    p = dict(VALID_GATEWAY_PAYLOAD, date_of_birth="2035-05-10")
    assert client.post(endpoint, json=p).status_code == 422

    # Malformed date string -> 422
    p = dict(VALID_GATEWAY_PAYLOAD, date_of_birth="not-a-date")
    assert client.post(endpoint, json=p).status_code == 422

# ---------------------------------------------------------------------------
# 3. Categorical Enum Validation
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("app_to_test, endpoint", [
    (gateway_app, "/v1/decisions/evaluate"),
    (app_app, "/v1/applicants"),
    (credit_app, "/v1/credit-engine/score"),
])
def test_employment_type_categorical_enum(app_to_test, endpoint):
    client = TestClient(app_to_test)

    invalid_categories = ["unemployed", "student", "freelancer", "GIG", "Salaried", "other", ""]
    for inv_cat in invalid_categories:
        p = dict(VALID_GATEWAY_PAYLOAD, employment_type=inv_cat)
        resp = client.post(endpoint, json=p)
        assert resp.status_code == 422, f"Expected 422 for category '{inv_cat}', got {resp.status_code}"

    # Valid enum options
    for valid_cat in ["gig", "salaried", "self_employed"]:
        if endpoint == "/v1/applicants":
            p = dict(VALID_GATEWAY_PAYLOAD, employment_type=valid_cat)
            resp = client.post(endpoint, json=p)
            assert resp.status_code == 201
        elif endpoint == "/v1/credit-engine/score":
            p = dict(VALID_GATEWAY_PAYLOAD, employment_type=valid_cat)
            resp = client.post(endpoint, json=p)
            assert resp.status_code == 200

# ---------------------------------------------------------------------------
# 4. Numeric Minimum/Maximum Boundaries & Negative Values
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("app_to_test, endpoint", [
    (gateway_app, "/v1/decisions/evaluate"),
    (app_app, "/v1/applicants"),
])
def test_numeric_min_max_and_negatives(app_to_test, endpoint):
    client = TestClient(app_to_test)

    # Monthly income <= 0 or negative -> 422
    for bad_income in [0, -1, -50000]:
        p = dict(VALID_GATEWAY_PAYLOAD, monthly_income=bad_income)
        assert client.post(endpoint, json=p).status_code == 422, f"Expected 422 for monthly_income={bad_income}"

    # Requested loan amount <= 0 or negative -> 422
    for bad_loan in [0, -100, -100000]:
        p = dict(VALID_GATEWAY_PAYLOAD, requested_loan_amount=bad_loan)
        assert client.post(endpoint, json=p).status_code == 422, f"Expected 422 for requested_loan_amount={bad_loan}"

    # Negative cashflow and counts -> 422
    negative_cases = [
        {"avg_bank_balance": -100.0},
        {"monthly_bank_inflow": -500.0},
        {"monthly_bank_outflow": -1000.0},
        {"bounce_count_6m": -1},
        {"telecom_tenure_months": -5.0},
        {"gig_monthly_earnings": -100.0},
        {"gig_months_active": -1.0},
        {"data_conflict_count": -2},
        {"income_to_expense_ratio": -0.5},
    ]
    for neg_case in negative_cases:
        p = dict(VALID_GATEWAY_PAYLOAD, **neg_case)
        assert client.post(endpoint, json=p).status_code == 422, f"Expected 422 for {neg_case}"

# ---------------------------------------------------------------------------
# 5. Out-of-Range Ratios, Percentages, and Ratings
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("app_to_test, endpoint", [
    (gateway_app, "/v1/decisions/evaluate"),
    (app_app, "/v1/applicants"),
    (credit_app, "/v1/credit-engine/score"),
])
def test_ratio_and_rating_boundaries(app_to_test, endpoint):
    client = TestClient(app_to_test)

    out_of_range_ratios = [
        {"rent_payment_ratio": 1.05},
        {"rent_payment_ratio": -0.01},
        {"utility_payment_ratio": 1.5},
        {"utility_payment_ratio": -0.1},
        {"telecom_payment_ratio": 2.0},
        {"telecom_payment_ratio": -0.5},
        {"gig_earnings_stability": 1.01},
        {"gig_earnings_stability": -0.1},
        {"payment_consistency": 1.2},
        {"payment_consistency": -0.05},
        {"fraud_risk_score": 1.1},
        {"fraud_risk_score": -0.1},
        {"missing_data_ratio": 1.01},
        {"missing_data_ratio": -0.1},
    ]
    for case in out_of_range_ratios:
        p = dict(VALID_GATEWAY_PAYLOAD, **case)
        assert client.post(endpoint, json=p).status_code == 422, f"Expected 422 for ratio boundary {case}"

    out_of_range_ratings = [
        {"gig_rating": 0.5},
        {"gig_rating": 0.0},
        {"gig_rating": 5.1},
        {"gig_rating": 6.0},
        {"gig_rating": -1.0},
    ]
    for case in out_of_range_ratings:
        p = dict(VALID_GATEWAY_PAYLOAD, **case)
        assert client.post(endpoint, json=p).status_code == 422, f"Expected 422 for rating boundary {case}"

# ---------------------------------------------------------------------------
# 6. Rule Service Input Hardening Tests
# ---------------------------------------------------------------------------

def test_rule_service_input_boundaries():
    client = TestClient(rule_app)

    valid_rule_req = {
        "risk_score": 25.0,
        "monthly_income": 35000.0,
        "bounce_count_6m": 0,
        "fraud_risk_score": 0.05,
        "data_conflict_count": 0,
        "rent_payment_ratio": 0.90,
        "income_to_expense_ratio": 1.5
    }

    # Valid request passes
    resp = client.post("/v1/rules/evaluate", json=valid_rule_req)
    assert resp.status_code == 200

    # Negative risk score -> 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, risk_score=-1.0)).status_code == 422

    # Risk score > 100 -> 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, risk_score=105.0)).status_code == 422

    # Negative income -> 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, monthly_income=-500.0)).status_code == 422

    # Negative bounce count -> 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, bounce_count_6m=-2)).status_code == 422

    # Fraud risk score > 1.0 or < 0.0 -> 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, fraud_risk_score=1.5)).status_code == 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, fraud_risk_score=-0.1)).status_code == 422

    # Rent payment ratio > 1.0 or < 0.0 -> 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, rent_payment_ratio=1.2)).status_code == 422
    assert client.post("/v1/rules/evaluate", json=dict(valid_rule_req, rent_payment_ratio=-0.1)).status_code == 422

# ---------------------------------------------------------------------------
# 7. Explanation & Audit Services Input Hardening Tests
# ---------------------------------------------------------------------------

def test_explanation_and_audit_boundaries():
    explain_client = TestClient(explain_app)
    audit_client = TestClient(audit_app)

    # Explanation service invalid decision enum -> 422
    exp_req = {
        "feature_vector": {"rent_payment_ratio": 0.9},
        "risk_score": 25.0,
        "decision": "INVALID_DECISION"
    }
    assert explain_client.post("/v1/explain", json=exp_req).status_code == 422

    # Explanation service invalid ratio in feature_vector -> 422
    exp_req_bad_ratio = {
        "feature_vector": {"rent_payment_ratio": 1.8},
        "risk_score": 25.0,
        "decision": "APPROVE"
    }
    assert explain_client.post("/v1/explain", json=exp_req_bad_ratio).status_code == 422

    # Audit service invalid decision enum -> 422
    audit_req = {
        "applicant_id": "APP_123",
        "applicant_inputs": {"monthly_income": 30000.0},
        "model_version": "v1.0.0",
        "rule_version": "v1.0.0",
        "feature_vector_hash": "sha256:abc1234567",
        "risk_score": 20.0,
        "decision": "NOT_A_DECISION",
        "explanation_summary": "Test"
    }
    assert audit_client.post("/v1/audit/record", json=audit_req).status_code == 422

    # Audit service risk_score out of range -> 422
    audit_req_bad_score = dict(audit_req, decision="APPROVE", risk_score=150.0)
    assert audit_client.post("/v1/audit/record", json=audit_req_bad_score).status_code == 422
