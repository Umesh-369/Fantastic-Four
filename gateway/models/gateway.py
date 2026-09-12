from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any

class DecisionRequest(BaseModel):
    applicant_id: Optional[str] = None
    full_name: str = Field(..., min_length=2)
    date_of_birth: Optional[str] = None
    phone_number: str = Field(..., min_length=10)
    employment_type: str = Field(..., description="gig | salaried | self_employed")
    monthly_income: float = Field(..., gt=0)
    requested_loan_amount: float = Field(..., gt=0)

    # Alternate data
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
    income_to_expense_ratio: Optional[float] = 1.50
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
                if v == "" and k not in ("full_name", "phone_number", "employment_type"):
                    continue
                cleaned[k] = v
            return cleaned
        return data

class ExplanationObject(BaseModel):
    positive_factors: List[str]
    negative_factors: List[str]
    summary_text: str

class DecisionResponse(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0)
    decision: str = Field(..., description="APPROVE | REVIEW | REJECT")
    explanation: ExplanationObject
    model_version: str
    rule_version: str
    audit_id: str
    timestamp: str

class DashboardSummary(BaseModel):
    total_applications: int
    approved_count: int
    approved_pct: float
    rejected_count: int
    rejected_pct: float
    review_count: int
    review_pct: float
    avg_decision_time_sec: float
    active_rule_version: str
    active_model_version: str
    audit_chain_valid: bool
