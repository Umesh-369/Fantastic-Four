from fastapi import APIRouter, HTTPException, Query
from models.audit import (
    AuditRecordRequest, AuditRecordResponse, AuditVerifyResponse, AuditReproduceResponse
)
from service.ledger import record_decision, verify_ledger, reproduce_decision, list_records, get_record_by_id

router = APIRouter(prefix="/v1/audit", tags=["audit"])

@router.post("/record", response_model=AuditRecordResponse, status_code=201)
def handle_record(payload: AuditRecordRequest):
    try:
        return record_decision(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify", response_model=AuditVerifyResponse)
def handle_verify():
    try:
        return verify_ledger()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records")
def handle_list_records(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), include_test: bool = Query(False)):
    return list_records(limit=limit, offset=offset, include_test=include_test)

@router.get("/{audit_id}", response_model=None)
def handle_get_record(audit_id: str):
    rec = get_record_by_id(audit_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Audit record not found")
    return rec

@router.get("/{audit_id}/reproduce", response_model=AuditReproduceResponse)
def handle_reproduce(audit_id: str):
    try:
        return reproduce_decision(audit_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
