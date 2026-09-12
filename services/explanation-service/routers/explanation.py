from fastapi import APIRouter, HTTPException
from models.explanation import ExplainRequest, ExplainResponse
from service.explainer import explanation_engine

router = APIRouter(prefix="/v1", tags=["explanation"])

@router.post("/explain", response_model=ExplainResponse)
def handle_explain(payload: ExplainRequest):
    try:
        res = explanation_engine.explain(
            feature_vector=payload.feature_vector,
            risk_score=payload.risk_score,
            decision=payload.decision or "REVIEW"
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
