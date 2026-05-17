import pytest
import os
import time
from app.routers.orchestrator import orchestrate_request, RequestBody
from app.firebase_init import db

@pytest.mark.asyncio
async def test_pipeline_english():
    req = RequestBody(
        user_input="I need a plumber tomorrow morning in F-7 Islamabad",
        user_lat=33.7175,
        user_lng=73.0613,
        user_id="test-en-user"
    )
    
    res = await orchestrate_request(req)
    
    # Type depends on whether it's wrapped in JSONResponse during testing. 
    # Usually orchestrate_request returns a dict because FastAPI middleware handles the JSON.
    if hasattr(res, "body"):
        import json
        data = json.loads(res.body)
    else:
        data = res
        
    assert "error" not in data
    
    intent = data["agent_trace"][0]["output"]
    assert intent["service_type"] == "plumber"
    
    providers = data["agent_trace"][1]["output"]
    assert "Found" in providers # The discovery agent output string has "Found X providers"
    
    assert data["booking"]["booking_id"].startswith("BK-")
    assert len(data["agent_trace"]) == 6
    assert data["total_duration_ms"] < 15000

@pytest.mark.asyncio
async def test_pipeline_roman_urdu():
    req = RequestBody(
        user_input="Mujhe kal subah G-13 mein AC technician chahiye",
        user_lat=33.6844,
        user_lng=73.0479,
        user_id="test-ru-user"
    )
    
    res = await orchestrate_request(req)
    if hasattr(res, "body"):
        import json
        data = json.loads(res.body)
    else:
        data = res
        
    assert "error" not in data
    intent = data["agent_trace"][0]["output"]
    assert intent["service_type"] in ["ac_repair", "ac_technician"]
    assert intent["language_detected"] == "roman_ur"
    assert data["booking"]["booking_id"].startswith("BK-")

@pytest.mark.asyncio
async def test_pipeline_ambiguous():
    req = RequestBody(
        user_input="help",
        user_lat=33.6844,
        user_lng=73.0479,
        user_id="test-ambig-user"
    )
    
    res = await orchestrate_request(req)
    if hasattr(res, "body"):
        import json
        data = json.loads(res.body)
    else:
        data = res
        
    intent = data["agent_trace"][0]["output"]
    assert intent["clarification_needed"] is True
    assert intent["clarification_question"] is not None
    assert len(intent["clarification_question"]) > 0
