from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from routers.decision import router as decision_router
from routers.dashboard import router as dashboard_router

app = FastAPI(
    title="SahajCredit - API Gateway",
    version="1.0.0",
    description="Unified API Gateway orchestrating credit decision flow, audits, rules, and aggregates."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(decision_router)
app.include_router(dashboard_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "gateway",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
