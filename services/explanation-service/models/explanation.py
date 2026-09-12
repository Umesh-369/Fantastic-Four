from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional, Literal

class ExplainRequest(BaseModel):
    feature_vector: Dict[str, Any]
    risk_score: float = Field(..., ge=0.0, le=100.0)
    decision: Optional[Literal["APPROVE", "REVIEW", "REJECT"]] = "REVIEW"

    @field_validator("feature_vector")
    @classmethod
    def validate_feature_vector(cls, fv: Dict[str, Any]) -> Dict[str, Any]:
        ratio_fields = {"rent_payment_ratio", "utility_payment_ratio", "telecom_payment_ratio", "gig_earnings_stability", "payment_consistency", "fraud_risk_score", "missing_data_ratio"}
        non_negative_fields = {"telecom_tenure_months", "monthly_bank_inflow", "monthly_bank_outflow", "avg_bank_balance", "bounce_count_6m", "gig_monthly_earnings", "gig_months_active", "income_to_expense_ratio", "data_conflict_count"}
        for k, v in fv.items():
            if v is not None and isinstance(v, (int, float)):
                if k in ratio_fields and not (0.0 <= v <= 1.0):
                    raise ValueError(f"{k} must be between 0.0 and 1.0, got {v}")
                if k in non_negative_fields and v < 0:
                    raise ValueError(f"{k} cannot be negative, got {v}")
                if k == "gig_rating" and not (1.0 <= v <= 5.0):
                    raise ValueError(f"gig_rating must be between 1.0 and 5.0, got {v}")
        return fv

class FactorDetail(BaseModel):
    feature: str
    impact: Literal["POSITIVE", "NEGATIVE"] = Field(..., description="POSITIVE | NEGATIVE")
    weight: float
    description: str

class ExplainResponse(BaseModel):
    positive_factors: List[str]
    negative_factors: List[str]
    factor_details: Optional[List[FactorDetail]] = None
    summary_text: str
    engine_type: str = "transparent_feature_attribution_v1"
