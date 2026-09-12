from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal

class AuditRecordRequest(BaseModel):
    applicant_id: str = Field(..., min_length=1, max_length=100)
    applicant_inputs: Dict[str, Any]
    model_version: str = Field(..., min_length=1, max_length=50)
    rule_version: str = Field(..., min_length=1, max_length=50)
    dataset_version: Optional[str] = "v1.0"
    preprocessor_version: Optional[str] = "v1.0"
    feature_vector_hash: str = Field(..., min_length=10, max_length=128)
    risk_score: float = Field(..., ge=0.0, le=100.0)
    decision: Literal["APPROVE", "REVIEW", "REJECT"] = Field(..., description="APPROVE | REVIEW | REJECT")
    explanation_summary: str = Field(..., min_length=1)
    decision_time_sec: Optional[float] = Field(None, ge=0.0)
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
