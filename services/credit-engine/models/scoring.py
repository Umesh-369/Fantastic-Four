from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any, Literal

class ScoreRequest(BaseModel):
    employment_type: Literal["gig", "salaried", "self_employed"] = Field(..., description="gig | salaried | self_employed")
    rent_payment_ratio: Optional[float] = Field(0.85, ge=0.0, le=1.0)
    utility_payment_ratio: Optional[float] = Field(0.85, ge=0.0, le=1.0)
    telecom_payment_ratio: Optional[float] = Field(0.85, ge=0.0, le=1.0)
    telecom_tenure_months: Optional[float] = Field(36.0, ge=0.0, le=1200.0)
    monthly_bank_inflow: Optional[float] = Field(35000.0, ge=0.0, le=100_000_000.0)
    monthly_bank_outflow: Optional[float] = Field(22000.0, ge=0.0, le=100_000_000.0)
    avg_bank_balance: Optional[float] = Field(10000.0, ge=0.0, le=100_000_000.0)
    bounce_count_6m: Optional[int] = Field(0, ge=0, le=100)
    gig_monthly_earnings: Optional[float] = Field(15000.0, ge=0.0, le=100_000_000.0)
    gig_earnings_stability: Optional[float] = Field(0.75, ge=0.0, le=1.0)
    gig_months_active: Optional[float] = Field(24.0, ge=0.0, le=1200.0)
    gig_rating: Optional[float] = Field(4.5, ge=1.0, le=5.0)
    income_to_expense_ratio: Optional[float] = Field(1.5, ge=0.0, le=100.0)
    payment_consistency: Optional[float] = Field(0.88, ge=0.0, le=1.0)
    data_conflict_count: Optional[int] = Field(0, ge=0, le=100)
    fraud_risk_score: Optional[float] = Field(0.05, ge=0.0, le=1.0)
    missing_data_ratio: Optional[float] = Field(0.0, ge=0.0, le=1.0)

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
