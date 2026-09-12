# SahajCredit Feature Engineering & Leakage Detection Report

## 1. Dataset Overview
- **Dataset File**: `thin_file_credit_10000_synthetic.csv`
- **Summary File**: `thin_file_credit_10000_summary.csv`
- **Total Records**: 10,000
- **Total Columns**: 23
- **Baseline Class Distribution**:
  - `APPROVE`: 6,198 (61.98%)
  - `REFER`: 1,999 (19.99%)
  - `DECLINE`: 1,803 (18.03%)
- **Data Conflicts**: 806 records (8.06%)
- **Falsified Records**: 342 records (3.42%)
- **Mean Missing Data Ratio**: 0.0643

---

## 2. Target Variable Identification & Analysis

### Candidate Targets
1. `credit_risk_score` (continuous float: min 0.000, max 0.471)
2. `decision` (multiclass categorical: `APPROVE`, `REFER`, `DECLINE`)
3. `adverse_risk_label` (binary indicator: adverse outcome where `decision == 'DECLINE'`)

### Target Decision Rationale
The application architecture divides responsibilities cleanly:
1. **Credit Engine (ML inside)** predicts a continuous **Risk Score** ($0 - 100$).
2. **Rule Engine** evaluates the policy rules and thresholds over the predicted risk score and application inputs to decide `APPROVE`, `REFER`, or `DECLINE`.

To ensure the ML model predicts calibrated risk probability, the primary model target is formulated as **adverse credit risk** (`is_adverse = 1` for `DECLINE`, `0` otherwise). The predicted probability $P(\text{adverse})$ is scaled to $0 - 100$ as `risk_score = round(prob * 100, 1)`.

This enables standard supervised classification metrics on a held-out test split:
- **Accuracy**
- **Precision**
- **Recall**
- **F1 Score**
- **ROC-AUC**

---

## 3. Leakage Detection & Column Exclusions

Rigorous leakage detection was conducted prior to model design:

| Column Name | Category | Action | Rationale for Exclusion / Inclusion |
|---|---|---|---|
| `applicant_id` | Identifier | **EXCLUDED** | High-cardinality synthetic identifier (`A00001` - `A10000`). Has zero predictive meaning and causes identity leakage/memorization. |
| `credit_risk_score` | Derived / Target Duplicate | **EXCLUDED** | Direct synthetic precursor/transform of the `decision` label. In the dataset, `credit_risk_score <= 0.161` maps 100% to APPROVE, `0.162 - 0.214` to REFER, and `> 0.214` to DECLINE (99.74% deterministic partition). Including this column would result in 100% artificial target leakage. |
| `decision` | Target Label | **EXCLUDED FROM INPUTS** | Outcome label evaluated by policy. Predicting risk cannot take policy outcome as an input. |
| `falsified_record_flag` | Post-Outcome Audit Flag | **EXCLUDED** | This flag indicates a post-intake forensic audit discovery (e.g. fabricated rent or inflated income detected downstream). Including it would cause temporal leakage because it is unavailable at the point of initial intake. |
| `falsification_type` | Post-Outcome Audit Tag | **EXCLUDED** | Categorical breakdown of downstream forensic findings (`inflated_income`, `fabricated_rent_history`, etc.). Post-intake audit tag; unavailable at application time. |

---

## 4. Retained Model Input Features (Application & Alternate Data)

The retained features represent genuine alternate data available at loan application time for thin-file borrowers:

### 4.1 Categorical Features
- `employment_type`: Borrower employment status (`gig`, `self_employed`, `salaried`). One-hot encoded.

### 4.2 Cashflow & Banking Features
- `monthly_bank_inflow`: Total monthly deposits/inflow into bank account (INR).
- `monthly_bank_outflow`: Total monthly expenses/outflow from bank account (INR).
- `avg_bank_balance`: Average monthly balance maintained (INR).
- `income_to_expense_ratio`: Cashflow buffer ratio (`monthly_bank_inflow / monthly_bank_outflow`).
- `bounce_count_6m`: Number of transaction/cheque bounces in the past 6 months.

### 4.3 Alternate Bill Payment Ratios & Consistency
- `rent_payment_ratio`: Ratio of on-time rental payments over last 12 months.
- `utility_payment_ratio`: Ratio of on-time electricity/water/gas payments.
- `telecom_payment_ratio`: Ratio of on-time mobile postpaid / broadband recharges.
- `telecom_tenure_months`: Stability metric indicating duration with current telecom operator.
- `payment_consistency`: Aggregated multi-source payment discipline index.

### 4.4 Gig Economy & Platform Worker Alternate Data
- `gig_monthly_earnings`: Reported platform income (INR) for gig/freelance workers.
- `gig_earnings_stability`: Volatility index of weekly/monthly payouts ($0.0 - 1.0$).
- `gig_months_active`: Duration active on gig platforms.
- `gig_rating`: Customer/platform review rating ($1.0 - 5.0$).

### 4.5 Intake Risk & Data Quality Indicators
- `data_conflict_count`: Discrepancies identified between self-reported figures and bank statement parsing.
- `fraud_risk_score`: Initial anomaly/device/identity verification score generated at intake.
- `missing_data_ratio`: Ratio of unverified/missing alternate data fields.

---

## 5. Preprocessing & Artifact Versioning
- Missing values are imputed using median for numeric features and most frequent strategy for categoricals.
- Numeric scaling: Standard scaling applied to skewed monetary and tenure metrics.
- Preprocessor artifact: `/ml/artifacts/preprocessor_v1.joblib`
- Model artifact: `/ml/artifacts/model_v1.joblib`
- Evaluation report: `/ml/reports/eval_v1.json`
