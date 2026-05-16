import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import get_trace, init_db
from app.models.schemas import OrchestrationResponse, ServiceRequest
from app.orchestrator import KhidmatOrchestrator

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="KhidmatAI",
    description="AI Service Orchestrator for the Informal Economy — Google Antigravity Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = KhidmatOrchestrator()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "product": "KhidmatAI",
        "platform": "Google Antigravity + ADK-ready orchestrator",
        "agents": 6,
        "gemini_configured": bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")),
    }


@app.post("/api/orchestrate", response_model=OrchestrationResponse)
def orchestrate(request: ServiceRequest):
    try:
        return orchestrator.run(
            request.message,
            request.session_id,
            request.customer_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/trace/{session_id}")
def get_session_trace(session_id: str):
    data = get_trace(session_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Session trace not found")
    return {"session_id": session_id, **data}


@app.get("/api/examples")
def examples():
    return {
        "samples": [
            "Mujhe kal subah G-13 mein AC technician chahiye",
            "I need a plumber in F-7 urgently",
            "G-13 mein beautician chahiye kal shaam",
            "Electrician in DHA right now",
        ]
    }
