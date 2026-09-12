from fastapi import APIRouter, HTTPException
from models.scoring import ScoreRequest, ScoreResponse
from service.model_manager import model_manager

router = APIRouter(prefix="/v1/credit-engine", tags=["credit-engine"])

@router.post("/score", response_model=ScoreResponse)
def handle_score(payload: ScoreRequest):
    try:
        result = model_manager.score(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.get("/metadata")
def handle_metadata():
    return {
        "model_version": model_manager.model_version,
        "is_loaded": model_manager.model is not None,
        "artifacts_dir": model_manager.artifacts_dir
    }
