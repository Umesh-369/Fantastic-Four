from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from routers.scoring import router as scoring_router
from service.model_manager import model_manager

app = FastAPI(
    title="SahajCredit - Credit Engine Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scoring_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "credit-engine",
        "version": "1.0.0",
        "model_loaded": model_manager.model is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=False)
