import os
import yaml
import json
from typing import Dict, Any, List, Optional

CONFIG_DIR = os.environ.get(
    "RULES_CONFIG_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "config", "rules"))
)

class RuleEngine:
    def __init__(self, config_dir: str = CONFIG_DIR):
        self.config_dir = config_dir

    def get_active_version(self) -> str:
        pointer_file = os.path.join(self.config_dir, "active_pointer.yaml")
        if os.path.exists(pointer_file):
            with open(pointer_file, "r") as f:
                data = yaml.safe_load(f)
                return data.get("active_version", "v1.0.0")
        return "v1.0.0"

    def set_active_version(self, version: str) -> bool:
        pointer_file = os.path.join(self.config_dir, "active_pointer.yaml")
        with open(pointer_file, "r") as f:
            data = yaml.safe_load(f) or {}
        data["active_version"] = version
        with open(pointer_file, "w") as f:
            yaml.safe_dump(data, f)
        return True

    def get_rule_set(self, version: Optional[str] = None) -> Dict[str, Any]:
        if not version:
            version = self.get_active_version()

        rule_file = os.path.join(self.config_dir, f"rules_{version}.yaml")
        if not os.path.exists(rule_file):
            raise FileNotFoundError(f"Rule set version '{version}' not found at {rule_file}")

        with open(rule_file, "r") as f:
            return yaml.safe_load(f)

    def list_versions(self) -> List[Dict[str, Any]]:
        active = self.get_active_version()
        results = []
        if os.path.exists(self.config_dir):
            for fname in os.listdir(self.config_dir):
                if fname.startswith("rules_") and fname.endswith(".yaml"):
                    ver = fname.replace("rules_", "").replace(".yaml", "")
                    try:
                        content = self.get_rule_set(ver)
                        results.append({
                            "version": ver,
                            "effective_date": content.get("effective_date", ""),
                            "description": content.get("description", ""),
                            "is_active": (ver == active)
                        })
                    except Exception:
                        pass
        return sorted(results, key=lambda x: x["version"])

    def get_changelog(self) -> List[Dict[str, Any]]:
        cl_file = os.path.join(self.config_dir, "changelog.json")
        if os.path.exists(cl_file):
            with open(cl_file, "r") as f:
                return json.load(f)
        return []

    def evaluate(self, inputs: dict, version: Optional[str] = None) -> dict:
        rule_set = self.get_rule_set(version)
        thresholds = rule_set.get("thresholds", {})
        policies = rule_set.get("policies", {})
        hard_knockouts = policies.get("hard_knockouts", [])
        score_policy = policies.get("score_policy", {})

        reasons = []

        # 1. Evaluate Hard Knockouts
        for ko in hard_knockouts:
            field = ko.get("field")
            op = ko.get("operator")
            val = ko.get("value")
            action = ko.get("action", "REJECT")
            reason = ko.get("reason", "")

            field_val = inputs.get(field)
            if field_val is not None:
                triggered = False
                if op == ">" and field_val > val:
                    triggered = True
                elif op == "<" and field_val < val:
                    triggered = True
                elif op == ">=" and field_val >= val:
                    triggered = True
                elif op == "<=" and field_val <= val:
                    triggered = True
                elif op == "==" and field_val == val:
                    triggered = True

                if triggered:
                    reasons.append(f"Hard policy knockout triggered: {reason}")
                    return {
                        "decision": action,
                        "rule_version": rule_set.get("version", "unknown"),
                        "reasons": reasons,
                        "applied_thresholds": thresholds
                    }

        # 2. Evaluate Score Policy
        risk_score = inputs.get("risk_score", 100.0)
        monthly_income = inputs.get("monthly_income", 0.0)
        bounce_count = inputs.get("bounce_count_6m", 0)

        app_cond = score_policy.get("approve_condition", {})
        rev_cond = score_policy.get("review_condition", {})

        max_app_score = app_cond.get("max_score", thresholds.get("risk_score_approve_max", 35.0))
        min_app_income = app_cond.get("min_income", thresholds.get("min_monthly_income", 15000.0))
        max_app_bounces = app_cond.get("max_bounces", thresholds.get("max_bounce_count_6m", 2))
        max_rev_score = rev_cond.get("max_score", thresholds.get("risk_score_review_max", 60.0))

        if risk_score <= max_app_score and monthly_income >= min_app_income and bounce_count <= max_app_bounces:
            reasons.append(f"Calibrated risk score {risk_score:.1f} meets approve threshold (<= {max_app_score})")
            reasons.append(f"Income ₹{monthly_income:,.0f} meets minimum threshold (>= ₹{min_app_income:,.0f})")
            decision = "APPROVE"
        elif risk_score <= max_rev_score:
            reasons.append(f"Risk score {risk_score:.1f} falls in review band (<= {max_rev_score}); requires manual underwriter review")
            if monthly_income < min_app_income:
                reasons.append(f"Income ₹{monthly_income:,.0f} is below straight-approval floor (₹{min_app_income:,.0f})")
            if bounce_count > max_app_bounces:
                reasons.append(f"Bounce count {bounce_count} exceeds straight-approval limit ({max_app_bounces})")
            decision = "REVIEW"
        else:
            reasons.append(f"Risk score {risk_score:.1f} exceeds review cutoff (>{max_rev_score}); elevated credit risk")
            decision = "REJECT"

        return {
            "decision": decision,
            "rule_version": rule_set.get("version", "unknown"),
            "reasons": reasons,
            "applied_thresholds": thresholds
        }

rule_engine = RuleEngine()
