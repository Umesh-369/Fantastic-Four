import os
import httpx
from fastapi import APIRouter, Request, Response, HTTPException

router = APIRouter(prefix="/v1", tags=["proxy"])

APP_SERVICE_URL = os.environ.get("APPLICATION_SERVICE_URL", "http://localhost:8001")
CREDIT_ENGINE_URL = os.environ.get("CREDIT_ENGINE_URL", "http://localhost:8002")
RULE_SERVICE_URL = os.environ.get("RULE_SERVICE_URL", "http://localhost:8003")
EXPLAIN_SERVICE_URL = os.environ.get("EXPLANATION_SERVICE_URL", "http://localhost:8004")
AUDIT_SERVICE_URL = os.environ.get("AUDIT_SERVICE_URL", "http://localhost:8005")
FAIRNESS_SERVICE_URL = os.environ.get("FAIRNESS_SERVICE_URL", "http://localhost:8006")

async def forward_request(target_url: str, request: Request) -> Response:
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
            )
            # Filter hop-by-hop headers
            response_headers = {
                k: v for k, v in resp.headers.items()
                if k.lower() not in ("content-length", "content-encoding", "transfer-encoding")
            }
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=response_headers,
                media_type=resp.headers.get("content-type"),
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Service unavailable: {str(exc)}")

# --- Applicants Proxy ---
@router.api_route("/applicants", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_applicants_root(request: Request):
    return await forward_request(f"{APP_SERVICE_URL}/v1/applicants", request)

@router.api_route("/applicants/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_applicants_sub(path: str, request: Request):
    return await forward_request(f"{APP_SERVICE_URL}/v1/applicants/{path}", request)

# --- Rules Proxy ---
@router.api_route("/rules", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_rules_root(request: Request):
    return await forward_request(f"{RULE_SERVICE_URL}/v1/rules", request)

@router.api_route("/rules/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_rules_sub(path: str, request: Request):
    return await forward_request(f"{RULE_SERVICE_URL}/v1/rules/{path}", request)

# --- Audit Proxy ---
@router.api_route("/audit", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_audit_root(request: Request):
    return await forward_request(f"{AUDIT_SERVICE_URL}/v1/audit", request)

@router.api_route("/audit/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_audit_sub(path: str, request: Request):
    return await forward_request(f"{AUDIT_SERVICE_URL}/v1/audit/{path}", request)

# --- Fairness Proxy ---
@router.api_route("/fairness", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_fairness_root(request: Request):
    return await forward_request(f"{FAIRNESS_SERVICE_URL}/v1/fairness", request)

@router.api_route("/fairness/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_fairness_sub(path: str, request: Request):
    return await forward_request(f"{FAIRNESS_SERVICE_URL}/v1/fairness/{path}", request)

# --- Credit Engine Proxy ---
@router.api_route("/credit-engine", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_credit_engine_root(request: Request):
    return await forward_request(f"{CREDIT_ENGINE_URL}/v1/credit-engine", request)

@router.api_route("/credit-engine/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_credit_engine_sub(path: str, request: Request):
    return await forward_request(f"{CREDIT_ENGINE_URL}/v1/credit-engine/{path}", request)

# --- Explanation Proxy ---
@router.api_route("/explain", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_explain_root(request: Request):
    return await forward_request(f"{EXPLAIN_SERVICE_URL}/v1/explain", request)

@router.api_route("/explain/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_explain_sub(path: str, request: Request):
    return await forward_request(f"{EXPLAIN_SERVICE_URL}/v1/explain/{path}", request)

# --- Consolidated System Health ---
@router.get("/system/services-status")
async def get_system_services_status():
    services_to_check = [
        {"name": "API Gateway", "port": 8000, "url": "self", "status": "ONLINE"},
        {"name": "Application Service", "port": 8001, "url": f"{APP_SERVICE_URL}/health"},
        {"name": "Credit Engine (ML)", "port": 8002, "url": f"{CREDIT_ENGINE_URL}/health"},
        {"name": "Rule Service (H+8)", "port": 8003, "url": f"{RULE_SERVICE_URL}/health"},
        {"name": "Explanation Service", "port": 8004, "url": f"{EXPLAIN_SERVICE_URL}/health"},
        {"name": "Audit Service", "port": 8005, "url": f"{AUDIT_SERVICE_URL}/health"},
        {"name": "Fairness Service", "port": 8006, "url": f"{FAIRNESS_SERVICE_URL}/health"},
    ]

    async with httpx.AsyncClient(timeout=3.0) as client:
        results = []
        for svc in services_to_check:
            if svc["url"] == "self":
                results.append({
                    "name": svc["name"],
                    "port": svc["port"],
                    "status": "ONLINE"
                })
                continue
            try:
                res = await client.get(svc["url"])
                is_online = res.status_code == 200
                results.append({
                    "name": svc["name"],
                    "port": svc["port"],
                    "status": "ONLINE" if is_online else "OFFLINE"
                })
            except Exception:
                results.append({
                    "name": svc["name"],
                    "port": svc["port"],
                    "status": "OFFLINE"
                })

    return {"services": results}
