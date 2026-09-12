from fastapi import APIRouter, HTTPException, Query
from models.applicant import ApplicantCreate, ApplicantResponse
from service.applicant_service import create_applicant, get_applicant, list_applicants

router = APIRouter(prefix="/v1/applicants", tags=["applicants"])

@router.post("", response_model=ApplicantResponse, status_code=201)
def handle_create_applicant(payload: ApplicantCreate):
    return create_applicant(payload.model_dump())

@router.get("/{applicant_id}", response_model=ApplicantResponse)
def handle_get_applicant(applicant_id: str):
    record = get_applicant(applicant_id)
    if not record:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return record

@router.get("")
def handle_list_applicants(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    return list_applicants(limit=limit, offset=offset)
