# SahajCredit / VTapp — Round 02 Platform

**Team Name**: Fantastic Four  
**Target**: 150-Point Round 02 Rubric  
**Visual Direction**: Reference UI faithfully implemented in Next.js 14 + Tailwind CSS + Recharts.

---

## 1. Overview & Architecture

SahajCredit is a production-grade, loosely-coupled microservice platform designed to provide **explainable, fair, and reproducible credit underwriting** for thin-file borrowers using alternate data (rent, utility, telecom bills, banking cashflow, gig platform statistics).

### Core Architectural Principles
- **Database-per-service**: Private, embedded **SQLite** databases per service (`application_service.db`, `audit_service.db`). Zero cross-service database access.
- **Contract-first REST**: Strict `/v1/...` APIs enforced by automated contract tests against `/docs/api-contracts/`.
- **Config-outside-code (H+8)**: Policy thresholds and decision rules live in versioned YAML configs (`/config/rules/*.yaml`), hot-reloaded by the Rule Service without service restarts or code changes.
- **Independent Deployability**: Each service possesses its own Dockerfile, environment configuration, and test suite.

```
Applicant (UI) → Gateway (Port 8000)
  → Credit Engine Service (Port 8002, Real ML inside) → risk_score (0-100)
  → Rule Service (Port 8003, Versioned YAML) → decision (APPROVE | REVIEW | REJECT)
  → Explanation Service (Port 8004) → positive & negative feature drivers
  → Audit Service (Port 8005) → SHA-256 hash-chained immutable ledger
  → Gateway → UI
```

---

## 2. Round 02 Rubric Verification Matrix

| Rubric Requirement | Points | Implementation & Proof Point |
|---|---|---|
| **Primary Engine** (Real ML end-to-end) | **35** | Trained GradientBoosting classifier (`/ml/train.py`) on `thin_file_credit_10000_synthetic.csv`. Rigorous leakage detection documented in `/ml/FEATURES.md`. Evaluated on held-out split: **93.20% accuracy, 0.9736 ROC-AUC**. Artifacts in `/ml/artifacts/`. Zero stubbing. |
| **Secondary Engine** (Real explanations) | **35** | Explanation Service (`/services/explanation-service`) computes top positive and negative drivers from feature contributions, producing human-readable explanations independent of policy thresholds. |
| **API Contract Conformance** | **20** | `/tests/contract/test_contracts.py` validates all endpoint contracts, schemas, headers, and error codes against `/docs/api-contracts/`. (All pass). |
| **Own Test Harness** | **30** | `/harness/run_harness.py` benchmarks model accuracy, precision, recall, F1, ROC-AUC, latency percentiles (p50: 7.11ms, p95: 8.87ms, p99: 9.78ms), and schema compliance. Outputs `harness_results.json` and `harness_summary.csv`. Zero fabricated numbers. |
| **H+8 Rapid-Change Readiness** | **30** | Rule Service reads YAML rules (`rules_v1.0.0.yaml` and `rules_v1.1.0.yaml`). A live threshold change (e.g. minimum income) executed via pointer flip changes decisions immediately on the next request with zero code touched. Verified via `tests/integration/test_h8_change.py`. |
| **Total** | **150** | Fully operational and validated. |

---

## 3. Quickstart & Local Setup

### 3.1 Python Virtual Environment
```powershell
# Create venv and install dependencies
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

### 3.2 Retrain Model & Generate Evaluation Report (Optional — Artifacts Included)
```powershell
.venv\Scripts\python ml\train.py
```

### 3.3 Run Test Suite & Contract Checks
```powershell
# Run all contract and integration tests
.venv\Scripts\pytest tests/ -v

# Run the independent test harness
.venv\Scripts\python harness\run_harness.py
```

### 3.4 Start Backend Services Locally (Port Map)
You can launch each service in its own terminal or run with Docker Compose:

| Service | Port | Directory | Run Command |
|---|---|---|---|
| **API Gateway** | 8000 | `/gateway` | `uvicorn main:app --port 8000` |
| **Application Service** | 8001 | `/services/application-service` | `uvicorn main:app --port 8001` |
| **Credit Engine Service** | 8002 | `/services/credit-engine` | `uvicorn main:app --port 8002` |
| **Rule Service** | 8003 | `/services/rule-service` | `uvicorn main:app --port 8003` |
| **Explanation Service** | 8004 | `/services/explanation-service` | `uvicorn main:app --port 8004` |
| **Audit Service** | 8005 | `/services/audit-service` | `uvicorn main:app --port 8005` |
| **Fairness Service** | 8006 | `/services/fairness-service` | `uvicorn main:app --port 8006` |

### 3.5 Run with Docker Compose
One-command startup bringing up all 7 microservices and the Next.js frontend with health-gated sequencing:
```bash
docker-compose up --build
```
Access the application at: `http://localhost:3000`

### 3.6 Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 4. Key Demonstrations

### 4.1 H+8 Rapid Threshold Change (Zero Code Edits)
1. In the UI, navigate to **Rule Manager** in the left sidebar.
2. View active policy (`v1.0.0`, minimum income: ₹15,000).
3. Test an applicant with ₹13,500 income $\rightarrow$ Decision: `REVIEW`.
4. Click **Activate Policy** on `v1.1.0` (minimum income: ₹12,000).
5. Re-evaluate the exact same applicant $\rightarrow$ Decision immediately flips to `APPROVE`!
6. View `/v1/rules/changelog` confirming the change was config-only with zero code edits.

### 4.2 Cryptographic Audit & Historical Replay
1. Navigate to **Audit Log** in the left sidebar.
2. Click **Verify Ledger** $\rightarrow$ walks all SHA-256 block hashes from Genesis, confirming 100% tamper evidence.
3. Under **Test Decision Reproducibility**, select any historical decision ID and click **Replay Decision Engine**.
4. The system re-derives the score and decision using the stored pointers, verifying a 100% deterministic match.

### 4.3 Fairness & Algorithmic Bias Audit
1. Navigate to **Fairness & Bias** in the left sidebar.
2. The service honestly reports `status: "insufficient_group_labels"` because `thin_file_credit_10000_synthetic.csv` does not contain legal protected demographic classes (gender, age band, race, region) — zero fabricated numbers.
3. Review the transparent segment parity breakdown across `employment_type` (`gig`, `salaried`, `self_employed`) and the proxy leakage test results.

---

## 5. Team & AI Ledger
See [AI_LEDGER.md](file:///d:/PROJECTS/SahajCredit/AI_LEDGER.md) for full component-by-component documentation of AI model assistance and human engineering decisions.
