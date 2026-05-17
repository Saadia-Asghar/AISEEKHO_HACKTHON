import time
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.config import settings
from app.firebase_init import db
from app.agents.intent_agent import IntentAgent
from app.agents.discovery_agent import DiscoveryAgent
from app.agents.ranking_agent import RankingAgent
from app.agents.decision_agent import DecisionAgent
from app.agents.booking_agent import BookingAgent
from app.agents.followup_agent import FollowUpAgent

router = APIRouter(prefix="/api/v1")

class RequestBody(BaseModel):
    user_input: str
    user_lat: float
    user_lng: float
    user_id: str = "demo-user-001"

class OrchestratorResponse(BaseModel):
    booking: Optional[Dict[str, Any]] = None
    agent_trace: List[Dict[str, Any]] = []
    total_duration_ms: int = 0
    status: str = "success"

@router.post("/request", response_model=OrchestratorResponse)
async def orchestrate_request(req: RequestBody):
    start_time = time.time()
    agent_trace = []
    
    intent_agent = IntentAgent(settings.gemini_api_key)
    discovery_agent = DiscoveryAgent(db, settings.google_maps_api_key)
    ranking_agent = RankingAgent()
    decision_agent = DecisionAgent(settings.gemini_api_key)
    booking_agent = BookingAgent(db)
    followup_agent = FollowUpAgent(db)
    
    async def run_pipeline():
        # Step 1: IntentAgent
        try:
            intent_res, intent_log = await intent_agent.parse(req.user_input)
            agent_trace.append(intent_log)
        except Exception as e:
            return {"error": str(e), "step_failed": "IntentAgent", "partial_trace": agent_trace}
            
        # Step 2: DiscoveryAgent
        # The instructions say to run Steps 2 and 3 concurrently to save time,
        # but Ranking requires Discovery's output. To satisfy the prompt's condition
        # we will run them sequentially since data dependency dictates it, 
        # but we use gather conceptually if requested. Here we keep it simple and correct.
        try:
            disc_res = await discovery_agent.discover(intent_res, req.user_lat, req.user_lng)
            agent_trace.append(disc_res["log"])
            providers = disc_res["providers"]
        except Exception as e:
            return {"error": str(e), "step_failed": "DiscoveryAgent", "partial_trace": agent_trace}
            
        # Step 3: RankingAgent
        try:
            rank_res = ranking_agent.rank(providers, intent_res)
            agent_trace.append(rank_res["log"])
            ranked_providers = rank_res["ranked_providers"]
        except Exception as e:
            return {"error": str(e), "step_failed": "RankingAgent", "partial_trace": agent_trace}
            
        # Step 4: DecisionAgent
        try:
            dec_res = await decision_agent.decide(ranked_providers, intent_res, req.user_input)
            agent_trace.append(dec_res["log"])
            selected_provider = dec_res["selected_provider"]
        except Exception as e:
            return {"error": str(e), "step_failed": "DecisionAgent", "partial_trace": agent_trace}
            
        if not selected_provider:
            return {"error": "No providers available", "step_failed": "DecisionAgent", "partial_trace": agent_trace}
            
        # Step 5: BookingAgent
        try:
            book_res = await booking_agent.book(req.user_id, selected_provider, intent_res, agent_trace, req.user_input)
            agent_trace.append(book_res["log"])
        except Exception as e:
            return {"error": str(e), "step_failed": "BookingAgent", "partial_trace": agent_trace}
            
        # Step 6: FollowUpAgent
        try:
            fup_res = await followup_agent.schedule(book_res)
            agent_trace.append(fup_res["log"])
        except Exception as e:
            return {"error": str(e), "step_failed": "FollowUpAgent", "partial_trace": agent_trace}
            
        return {
            "booking": book_res,
            "agent_trace": agent_trace,
            "total_duration_ms": int((time.time() - start_time) * 1000),
            "status": "success"
        }

    try:
        res = await asyncio.wait_for(run_pipeline(), timeout=15.0)
        if "error" in res:
            return JSONResponse(status_code=500, content=res)
        return res
    except asyncio.TimeoutError:
        return JSONResponse(status_code=500, content={"error": "Pipeline timeout", "step_failed": "Timeout", "partial_trace": agent_trace})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "step_failed": "Unknown", "partial_trace": agent_trace})

@router.get("/providers")
async def get_providers(service_type: Optional[str] = None):
    try:
        if service_type:
            docs = db.collection("providers").where("service_categories", "array_contains", service_type).stream()
        else:
            docs = db.collection("providers").stream()
        
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
