"""Antigravity workflow API — live workflow definition + full pipeline run for judges."""

import importlib.util
import os

from fastapi import APIRouter, Depends, HTTPException

from app.antigravity.workflow import ORCHESTRATION_ENGINE, WORKFLOW_ID, workflow_definition
from app.deps.auth import optional_user_id
from app.models.schemas import OrchestrationResponse, ServiceRequest
from app.orchestrator import KhidmatOrchestrator

router = APIRouter(prefix="/api/antigravity", tags=["antigravity"])
orchestrator = KhidmatOrchestrator()


@router.get("/workflow")
def get_workflow():
    """Return registered Antigravity nodes, skills, and tools (for README / evaluator UI)."""
    adk_available = importlib.util.find_spec("google.adk") is not None
    return {
        **workflow_definition(),
        "adk_agent_available": adk_available,
        "adk_run_command": "adk web --port 8080  (from repo root, agents/ parent)",
        "api_entrypoints": {
            "full_pipeline": "POST /api/antigravity/run",
            "legacy_alias": "POST /api/orchestrate",
            "preview_search": "POST /api/discover",
        },
    }


@router.get("/status")
def antigravity_status():
    adk_available = importlib.util.find_spec("google.adk") is not None
    return {
        "orchestration_engine": ORCHESTRATION_ENGINE,
        "workflow_id": WORKFLOW_ID,
        "nodes_registered": 6,
        "gemini_configured": bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")),
        "google_adk_installed": adk_available,
        "live_workflow_in_code": True,
    }


@router.post("/run", response_model=OrchestrationResponse)
def run_antigravity_workflow(
    request: ServiceRequest,
    token_user_id: str | None = Depends(optional_user_id),
):
    """
    Full Challenge 2 pipeline through all 6 Antigravity nodes
    (intent → discovery → ranking → booking → follow-up → trace).
    """
    user_id = request.user_id or token_user_id
    if token_user_id and request.user_id and request.user_id != token_user_id:
        raise HTTPException(status_code=403, detail="user_id does not match token")
    try:
        result = orchestrator.run(
            request.message,
            request.session_id,
            request.customer_name,
            user_id,
            request.user_lat,
            request.user_lng,
            request.customer_phone,
            request.price_sort,
            max_distance_km=request.max_distance_km,
            min_rating=request.min_rating,
            verified_only=request.verified_only,
            available_today=request.available_today,
            lang=request.lang,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
