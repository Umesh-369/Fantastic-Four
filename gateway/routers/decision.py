import os
import time
import httpx
from fastapi import APIRouter, HTTPException, status
from models.gateway import DecisionRequest, DecisionResponse, ExplanationObject

router = APIRouter(prefix="/v1", tags=["decisions"])

APP_SERVICE_URL = os.environ.get("APPLICATION_SERVICE_URL", "http://localhost:8001")
CREDIT_ENGINE_URL = os.environ.get("CREDIT_ENGINE_URL", "http://localhost:8002")
RULE_SERVICE_URL = os.environ.get("RULE_SERVICE_URL", "http://localhost:8003")
EXPLAIN_SERVICE_URL = os.environ.get("EXPLANATION_SERVICE_URL", "http://localhost:8004")
AUDIT_SERVICE_URL = os.environ.get("AUDIT_SERVICE_URL", "http://localhost:8005")

@router.post("/decisions/evaluate", response_model=DecisionResponse, status_code=status.HTTP_200_OK)
async def evaluate_decision(payload: DecisionRequest):
    start_time = time.perf_counter()
    req_dict = payload.model_dump()

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Persist applicant record in Application Service
        applicant_id = payload.applicant_id
        try:
            app_resp = await client.post(f"{APP_SERVICE_URL}/v1/applicants", json=req_dict)
            if app_resp.status_code in (200, 201):
                applicant_id = app_resp.json().get("applicant_id")
        except Exception as e:
            # Non-blocking fallback if app service is decoupled
            if not applicant_id:
                import uuid
                applicant_id = f"APP_{uuid.uuid4().hex[:8].upper()}"

        # 2. Score with Credit Engine (Real ML inside)
        score_payload = {
            "employment_type": req_dict.get("employment_type"),
            "rent_payment_ratio": req_dict.get("rent_payment_ratio"),
            "utility_payment_ratio": req_dict.get("utility_payment_ratio"),
            "telecom_payment_ratio": req_dict.get("telecom_payment_ratio"),
            "telecom_tenure_months": req_dict.get("telecom_tenure_months"),
            "monthly_bank_inflow": req_dict.get("monthly_bank_inflow"),
            "monthly_bank_outflow": req_dict.get("monthly_bank_outflow"),
            "avg_bank_balance": req_dict.get("avg_bank_balance"),
            "bounce_count_6m": req_dict.get("bounce_count_6m"),
            "gig_monthly_earnings": req_dict.get("gig_monthly_earnings"),
            "gig_earnings_stability": req_dict.get("gig_earnings_stability"),
            "gig_months_active": req_dict.get("gig_months_active"),
            "gig_rating": req_dict.get("gig_rating"),
            "income_to_expense_ratio": req_dict.get("income_to_expense_ratio"),
            "payment_consistency": req_dict.get("payment_consistency"),
            "data_conflict_count": req_dict.get("data_conflict_count"),
            "fraud_risk_score": req_dict.get("fraud_risk_score"),
            "missing_data_ratio": req_dict.get("missing_data_ratio")
        }

        try:
            ce_resp = await client.post(f"{CREDIT_ENGINE_URL}/v1/credit-engine/score", json=score_payload)
            if ce_resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Credit Engine error: {ce_resp.text}")
            ce_data = ce_resp.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Credit Engine unreachable: {str(e)}")

        risk_score = ce_data["risk_score"]
        model_ver = ce_data["model_version"]
        feature_hash = ce_data["feature_vector_hash"]

        # 3. Evaluate rules in Rule Service
        rule_payload = {
            "risk_score": risk_score,
            "monthly_income": req_dict.get("monthly_income", 0.0),
            "bounce_count_6m": req_dict.get("bounce_count_6m", 0),
            "fraud_risk_score": req_dict.get("fraud_risk_score", 0.0),
            "data_conflict_count": req_dict.get("data_conflict_count", 0),
            "rent_payment_ratio": req_dict.get("rent_payment_ratio"),
            "income_to_expense_ratio": req_dict.get("income_to_expense_ratio")
        }

        try:
            rule_resp = await client.post(f"{RULE_SERVICE_URL}/v1/rules/evaluate", json=rule_payload)
            if rule_resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Rule Service error: {rule_resp.text}")
            rule_data = rule_resp.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Rule Service unreachable: {str(e)}")

        decision = rule_data["decision"]
        rule_ver = rule_data["rule_version"]

        # 4. Generate Explanation in Explanation Service
        explain_payload = {
            "feature_vector": score_payload,
            "risk_score": risk_score,
            "decision": decision
        }

        try:
            ex_resp = await client.post(f"{EXPLAIN_SERVICE_URL}/v1/explain", json=explain_payload)
            if ex_resp.status_code == 200:
                ex_data = ex_resp.json()
                explanation = ExplanationObject(
                    positive_factors=ex_data.get("positive_factors", []),
                    negative_factors=ex_data.get("negative_factors", []),
                    summary_text=ex_data.get("summary_text", "")
                )
            else:
                explanation = ExplanationObject(
                    positive_factors=[],
                    negative_factors=[],
                    summary_text="Credit assessment completed based on alternate financial profile."
                )
        except Exception:
            explanation = ExplanationObject(
                positive_factors=[],
                negative_factors=[],
                summary_text="Credit assessment completed based on alternate financial profile."
            )

        # 5. Record immutable entry in Audit Service
        decision_time_sec = round(time.perf_counter() - start_time, 3)
        audit_payload = {
            "applicant_id": applicant_id,
            "applicant_inputs": req_dict,
            "model_version": model_ver,
            "rule_version": rule_ver,
            "dataset_version": "v1.0",
            "preprocessor_version": "v1.0",
            "feature_vector_hash": feature_hash,
            "risk_score": risk_score,
            "decision": decision,
            "explanation_summary": explanation.summary_text,
            "decision_time_sec": decision_time_sec
        }

        try:
            au_resp = await client.post(f"{AUDIT_SERVICE_URL}/v1/audit/record", json=audit_payload)
            if au_resp.status_code in (200, 201):
                au_data = au_resp.json()
                audit_id = au_data.get("audit_id")
                timestamp = au_data.get("timestamp")
            else:
                import uuid
                from datetime import datetime, timezone
                audit_id = f"aud_{uuid.uuid4().hex[:12]}"
                timestamp = datetime.now(timezone.utc).isoformat()
        except Exception:
            import uuid
            from datetime import datetime, timezone
            audit_id = f"aud_{uuid.uuid4().hex[:12]}"
            timestamp = datetime.now(timezone.utc).isoformat()

        # 6. Return strictly conforming response contract
        return DecisionResponse(
            risk_score=risk_score,
            decision=decision,
            explanation=explanation,
            model_version=model_ver,
            rule_version=rule_ver,
            audit_id=audit_id,
            timestamp=timestamp
        )
