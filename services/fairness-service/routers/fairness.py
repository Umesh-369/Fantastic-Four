from fastapi import APIRouter
from models.fairness import FairnessReportResponse
from service.fairness_analyzer import fairness_analyzer

router = APIRouter(prefix="/v1/fairness", tags=["fairness"])

@router.get("/report", response_model=FairnessReportResponse)
def handle_fairness_report():
    return fairness_analyzer.analyze()
