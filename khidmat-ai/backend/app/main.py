from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import orchestrator
import time
import logging
from datetime import datetime, timezone
from app.firebase_init import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start_time) * 1000)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    return response

app.include_router(orchestrator.router)

@app.get("/health")
async def health_check():
    status = {"status": "ok", "service": "KhidmatAI Backend", "timestamp": datetime.now(timezone.utc).isoformat()}
    try:
        # Check Firestore connectivity
        db.collection("providers").limit(1).get()
        status["firestore"] = "ok"
    except Exception as e:
        status["firestore"] = "error"
        logger.error(f"Firestore health check failed: {e}")
        
    return status
