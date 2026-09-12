from pydantic import BaseModel, Field, model_validator
from typing import Optional, Any
from datetime import date, datetime

class ApplicantCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: Optional[str] = Field(None, description="YYYY-MM-DD format")
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{10,13}$")
    employment_type: str = Field(..., description="gig | salaried | self_employed")
    monthly_income: float = Field(..., gt=0)
    requested_loan_amount: float = Field(..., gt=0)

    # Alternate Data fields
    rent_payment_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    utility_payment_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    telecom_payment_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    telecom_tenure_months: Optional[float] = Field(None, ge=0.0)
    monthly_bank_inflow: Optional[float] = Field(None, ge=0.0)
    monthly_bank_outflow: Optional[float] = Field(None, ge=0.0)
    avg_bank_balance: Optional[float] = Field(None, ge=0.0)
    bounce_count_6m: Optional[int] = Field(None, ge=0)
    gig_monthly_earnings: Optional[float] = Field(None, ge=0.0)
    gig_earnings_stability: Optional[float] = Field(None, ge=0.0, le=1.0)
    gig_months_active: Optional[float] = Field(None, ge=0.0)
    gig_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    income_to_expense_ratio: Optional[float] = Field(None, ge=0.0)
    payment_consistency: Optional[float] = Field(None, ge=0.0, le=1.0)
    data_conflict_count: Optional[int] = Field(0, ge=0)
    fraud_risk_score: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    missing_data_ratio: Optional[float] = Field(0.0, ge=0.0, le=1.0)

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

class ApplicantResponse(ApplicantCreate):
    applicant_id: str
    created_at: str
