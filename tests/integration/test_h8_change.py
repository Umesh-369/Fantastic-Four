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

rule_mod = load_module("services/rule-service/main.py")

def test_h8_rapid_change_via_yaml_only():
    client = TestClient(rule_mod.app)

    # 1. Reset to baseline v1.0.0
    s_resp = client.post("/v1/rules/active", json={"version": "v1.0.0"})
    assert s_resp.status_code == 200
    assert s_resp.json()["active_version"] == "v1.0.0"

    # Applicant with income 13,500 (below v1.0.0 floor of 15,000, but low risk score 25.0)
    eval_payload = {
        "risk_score": 25.0,
        "monthly_income": 13500.0,
        "bounce_count_6m": 0,
        "fraud_risk_score": 0.05
    }

    # Evaluate under v1.0.0
    res_v1 = client.post("/v1/rules/evaluate", json=eval_payload).json()
    assert res_v1["rule_version"] == "v1.0.0"
    assert res_v1["decision"] == "REVIEW", "Under v1.0.0, income 13.5k is below 15k floor so must be REVIEW"

    # 2. Perform H+8 Rapid Change: Flip active pointer to v1.1.0 (min_monthly_income = 12000.0)
    # Zero lines of code modified in any service!
    flip_resp = client.post("/v1/rules/active", json={"version": "v1.1.0"})
    assert flip_resp.status_code == 200
    assert flip_resp.json()["active_version"] == "v1.1.0"

    # Re-evaluate identical payload
    res_v1_1 = client.post("/v1/rules/evaluate", json=eval_payload).json()
    assert res_v1_1["rule_version"] == "v1.1.0"
    assert res_v1_1["decision"] == "APPROVE", "Under v1.1.0, income 13.5k exceeds 12k floor so decision becomes APPROVE"

    # 3. Verify Changelog records the change
    cl_resp = client.get("/v1/rules/changelog")
    assert cl_resp.status_code == 200
    changelog = cl_resp.json()
    assert len(changelog) >= 2
    h8_entry = next((e for e in changelog if e["rule_version"] == "v1.1.0"), None)
    assert h8_entry is not None
    assert h8_entry["code_changes_required"] is False
    assert "rules_v1.1.0.yaml" in h8_entry["files_changed"][0]

    # Reset back to v1.0.0 for clean test isolation
    client.post("/v1/rules/active", json={"version": "v1.0.0"})
