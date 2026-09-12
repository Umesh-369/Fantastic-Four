from fastapi import APIRouter, HTTPException, Body
from typing import Optional, List
from models.rules import RuleEvaluateRequest, RuleEvaluateResponse, RuleVersionInfo, ChangelogEntry
from service.rule_engine import rule_engine

router = APIRouter(prefix="/v1/rules", tags=["rules"])

@router.get("/active")
def get_active_rule_set():
    try:
        active_ver = rule_engine.get_active_version()
        data = rule_engine.get_rule_set(active_ver)
        return {"active_version": active_ver, "rule_set": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/versions", response_model=List[RuleVersionInfo])
def list_rule_versions():
    return rule_engine.list_versions()

@router.get("/changelog", response_model=List[ChangelogEntry])
def get_rule_changelog():
    return rule_engine.get_changelog()

@router.get("/{version}")
def get_rule_version(version: str):
    try:
        data = rule_engine.get_rule_set(version)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Rule version {version} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/active")
def switch_active_version(payload: dict = Body(...)):
    new_version = payload.get("version")
    if not new_version:
        raise HTTPException(status_code=400, detail="version field required")
    try:
        # Verify version exists
        rule_engine.get_rule_set(new_version)
        rule_engine.set_active_version(new_version)
        return {"status": "success", "active_version": new_version}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Rule version {new_version} not found")

@router.post("/evaluate", response_model=RuleEvaluateResponse)
def evaluate_rules(payload: RuleEvaluateRequest, version: Optional[str] = None):
    try:
        res = rule_engine.evaluate(payload.model_dump(), version=version)
        return res
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Rule version not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
