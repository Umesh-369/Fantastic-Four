from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SegmentMetric(BaseModel):
    segment: str
    total_count: int
    approval_rate: float
    refer_rate: float
    decline_rate: float
    tpr: float
    fpr: float

class FairnessReportResponse(BaseModel):
    status: str
    reason: str
    available_columns: List[str]
    protected_attributes_found: List[str]
    proxy_leakage_test: Optional[Dict[str, Any]] = None
    employment_segment_analysis: Optional[List[SegmentMetric]] = None
    disparate_impact_ratio: Optional[float] = None
    equalized_odds_difference: Optional[float] = None
