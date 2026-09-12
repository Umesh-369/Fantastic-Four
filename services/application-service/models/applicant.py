from pydantic import BaseModel, Field, model_validator, field_validator
from typing import Optional, Any, Literal
from datetime import date, datetime

class ApplicantCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-zA-Z\s.'-]+$")
    date_of_birth: Optional[str] = Field(None, description="YYYY-MM-DD format")
    phone_number: str = Field(..., pattern=r"^[0-9]{10}$", description="Mobile number: exactly 10 digits")
    employment_type: Literal["gig", "salaried", "self_employed"] = Field(..., description="gig | salaried | self_employed")
    monthly_income: float = Field(..., gt=0.0, le=10_000_000.0)
    requested_loan_amount: float = Field(..., gt=0.0, le=10_000_000.0)

    # Alternate Data fields
    rent_payment_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    utility_payment_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    telecom_payment_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    telecom_tenure_months: Optional[float] = Field(None, ge=0.0, le=1200.0)
    monthly_bank_inflow: Optional[float] = Field(None, ge=0.0, le=100_000_000.0)
    monthly_bank_outflow: Optional[float] = Field(None, ge=0.0, le=100_000_000.0)
    avg_bank_balance: Optional[float] = Field(None, ge=0.0, le=100_000_000.0)
    bounce_count_6m: Optional[int] = Field(None, ge=0, le=100)
    gig_monthly_earnings: Optional[float] = Field(None, ge=0.0, le=100_000_000.0)
    gig_earnings_stability: Optional[float] = Field(None, ge=0.0, le=1.0)
    gig_months_active: Optional[float] = Field(None, ge=0.0, le=1200.0)
    gig_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    income_to_expense_ratio: Optional[float] = Field(None, ge=0.0, le=100.0)
    payment_consistency: Optional[float] = Field(None, ge=0.0, le=1.0)
    data_conflict_count: Optional[int] = Field(0, ge=0, le=100)
    fraud_risk_score: Optional[float] = Field(0.0, ge=0.0, le=1.0)
    missing_data_ratio: Optional[float] = Field(0.0, ge=0.0, le=1.0)

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        try:
            dob = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("date_of_birth must be a valid date in YYYY-MM-DD format")
        today = date.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        if age < 18:
            raise ValueError("Applicant must be at least 18 years old")
        if age > 120 or dob > today:
            raise ValueError("date_of_birth must represent a valid age between 18 and 120")
        return v

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cleaned = {}
            required_keys = {"full_name", "phone_number", "employment_type", "monthly_income", "requested_loan_amount"}
            for k, v in data.items():
                if v == "" and k not in required_keys:
                    continue
                cleaned[k] = v
            return cleaned
        return data

class ApplicantResponse(ApplicantCreate):
    applicant_id: str
    created_at: str
