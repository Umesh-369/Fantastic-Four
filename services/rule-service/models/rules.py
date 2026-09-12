from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any

class RuleEvaluateRequest(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0)
    monthly_income: float = Field(..., ge=0.0)
    bounce_count_6m: Optional[int] = 0
    fraud_risk_score: Optional[float] = 0.0
    data_conflict_count: Optional[int] = 0
    rent_payment_ratio: Optional[float] = None
    income_to_expense_ratio: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cleaned = {}
            for k, v in data.items():
                if v == "":
                    continue
                cleaned[k] = v
            return cleaned
        return data

class RuleEvaluateResponse(BaseModel):
    decision: str = Field(..., description="APPROVE | REVIEW | REJECT")
    rule_version: str
    reasons: List[str]
    applied_thresholds: Dict[str, Any]

class RuleVersionInfo(BaseModel):
    version: str
    effective_date: str
    description: str
    is_active: bool

class ChangelogEntry(BaseModel):
    change_id: str
    rule_version: str
    time_received: str
    time_completed: str
    author: str
    description: str
    files_changed: List[str]
    config_diff: str
    affected_services: List[str]
    code_changes_required: bool
    test_results: str
