from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any

class ScoreRequest(BaseModel):
    employment_type: str = Field(..., description="gig | salaried | self_employed")
    rent_payment_ratio: Optional[float] = 0.85
    utility_payment_ratio: Optional[float] = 0.85
    telecom_payment_ratio: Optional[float] = 0.85
    telecom_tenure_months: Optional[float] = 36.0
    monthly_bank_inflow: Optional[float] = 35000.0
    monthly_bank_outflow: Optional[float] = 22000.0
    avg_bank_balance: Optional[float] = 10000.0
    bounce_count_6m: Optional[int] = 0
    gig_monthly_earnings: Optional[float] = 15000.0
    gig_earnings_stability: Optional[float] = 0.75
    gig_months_active: Optional[float] = 24.0
    gig_rating: Optional[float] = 4.5
    income_to_expense_ratio: Optional[float] = 1.5
    payment_consistency: Optional[float] = 0.88
    data_conflict_count: Optional[int] = 0
    fraud_risk_score: Optional[float] = 0.05
    missing_data_ratio: Optional[float] = 0.0

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cleaned = {}
            for k, v in data.items():
                if v == "" and k != "employment_type":
                    continue
                cleaned[k] = v
            return cleaned
        return data

class ScoreResponse(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Calibrated credit risk score (0-100)")
    model_version: str
    feature_vector_hash: str
    features_used: int
