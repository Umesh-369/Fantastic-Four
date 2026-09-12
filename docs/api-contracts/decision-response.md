# API Contract: Credit Decision Response

## Endpoint: `POST /v1/decisions/evaluate`

### Description
Single unified decision endpoint exposed by API Gateway, orchestrating applicant intake, credit scoring, rule evaluation, explanation generation, and immutable audit recording.

### Request Payload
```json
{
  "applicant_id": "optional-string",
  "full_name": "string (min 2 chars)",
  "date_of_birth": "YYYY-MM-DD",
  "phone_number": "string (valid 10-digit Indian phone)",
  "employment_type": "gig | salaried | self_employed",
  "monthly_income": 35000.0,
  "requested_loan_amount": 50000.0,
  "rent_payment_ratio": 0.95,
  "utility_payment_ratio": 0.92,
  "telecom_payment_ratio": 0.90,
  "telecom_tenure_months": 48.0,
  "monthly_bank_inflow": 42000.0,
  "monthly_bank_outflow": 25000.0,
  "avg_bank_balance": 15000.0,
  "bounce_count_6m": 0,
  "gig_monthly_earnings": 30000.0,
  "gig_earnings_stability": 0.85,
  "gig_months_active": 36,
  "gig_rating": 4.8,
  "income_to_expense_ratio": 1.68,
  "payment_consistency": 0.94,
  "data_conflict_count": 0,
  "fraud_risk_score": 0.05,
  "missing_data_ratio": 0.0
}
```

### Response Payload (`200 OK`)
```json
{
  "risk_score": 12.4,
  "decision": "APPROVE",
  "explanation": {
    "positive_factors": [
      "High payment consistency across utilities and telecom (0.94)",
      "Strong cashflow buffer with income-to-expense ratio of 1.68",
      "Zero account bounces over the past 6 months"
    ],
    "negative_factors": [],
    "summary_text": "Application approved: Strong alternate payment consistency and healthy liquidity profile mitigate thin-file credit risk."
  },
  "model_version": "v1.0.0",
  "rule_version": "v1.0.0",
  "audit_id": "aud_7a9f8b2c",
  "timestamp": "2026-09-12T12:00:00.000Z"
}
```

### Response Status Codes
- `200 OK`: Successful evaluation.
- `422 Unprocessable Entity`: Input validation error (e.g. negative income, invalid employment type).
- `503 Service Unavailable`: Downstream service dependency outage.
