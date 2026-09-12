from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ExplainRequest(BaseModel):
    feature_vector: Dict[str, Any]
    risk_score: float = Field(..., ge=0.0, le=100.0)
    decision: Optional[str] = "REVIEW"

class FactorDetail(BaseModel):
    feature: str
    impact: str = Field(..., description="POSITIVE | NEGATIVE")
    weight: float
    description: str

class ExplainResponse(BaseModel):
    positive_factors: List[str]
    negative_factors: List[str]
    factor_details: Optional[List[FactorDetail]] = None
    summary_text: str
    engine_type: str = "transparent_feature_attribution_v1"
