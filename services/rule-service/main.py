from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from routers.rules import router as rules_router
from service.rule_engine import rule_engine

app = FastAPI(
    title="SahajCredit - Rule Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rules_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "rule-service",
        "version": "1.0.0",
        "active_version": rule_engine.get_active_version()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=False)
