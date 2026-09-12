from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class AuditRecordRequest(BaseModel):
    applicant_id: str
    applicant_inputs: Dict[str, Any]
    model_version: str
    rule_version: str
    dataset_version: Optional[str] = "v1.0"
    preprocessor_version: Optional[str] = "v1.0"
    feature_vector_hash: str
    risk_score: float
    decision: str
    explanation_summary: str
    decision_time_sec: Optional[float] = None
    is_test: Optional[bool] = False

class AuditRecordResponse(BaseModel):
    audit_id: str
    applicant_id: str
    entry_hash: str
    prev_hash: str
    timestamp: str
    status: str = "RECORDED"

class AuditVerifyResponse(BaseModel):
    is_valid: bool
    total_records: int
    genesis_hash: str
    head_hash: str
    tampered_records: List[str] = []
    message: str

class AuditReproduceResponse(BaseModel):
    audit_id: str
    is_reproducible: bool
    original: Dict[str, Any]
    reproduced: Dict[str, Any]
    decision_match: bool
    risk_score_diff: float
    message: str
