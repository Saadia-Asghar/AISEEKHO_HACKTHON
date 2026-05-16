"""
Google ADK root agent — optional LLM layer on top of the FastAPI orchestrator.
Run from repo root: adk web --port 8080  (with agents/ as parent)
Requires GOOGLE_API_KEY in agents/service_orchestrator/.env
"""

import json
import os

import httpx

try:
    from google.adk.agents.llm_agent import Agent
except ImportError:
    Agent = None  # type: ignore

BACKEND_URL = os.getenv("ORCHESTRATOR_API", "http://127.0.0.1:8000")


def orchestrate_service_request(message: str) -> dict:
    """Tool: delegates to the multi-agent FastAPI pipeline."""
    with httpx.Client(timeout=60.0) as client:
        r = client.post(
            f"{BACKEND_URL}/api/orchestrate",
            json={"message": message},
        )
        r.raise_for_status()
        return r.json()


def format_booking_summary(result: dict) -> str:
    intent = result.get("intent", {})
    rec = result.get("recommended", {})
    booking = result.get("booking", {})
    follow = result.get("follow_up", {})
    return (
        f"Service: {intent.get('service_label')}\n"
        f"Location: {intent.get('location')}\n"
        f"Time: {intent.get('time_expression')}\n"
        f"Provider: {rec.get('name')} ({rec.get('distance_km')} km)\n"
        f"Booking: {booking.get('booking_id')} at {booking.get('slot')}\n"
        f"Follow-up: {follow.get('status_update')}"
    )


if Agent is not None:
    root_agent = Agent(
        model="gemini-2.0-flash",
        name="informal_economy_orchestrator",
        description=(
            "Orchestrates informal-economy service requests in Urdu, Roman Urdu, and English."
        ),
        instruction=(
            "You help users book local services (plumber, AC technician, tutor, etc.) "
            "in Pakistan. Use orchestrate_service_request for every booking request. "
            "Explain provider choice using the reasoning in the API response trace."
        ),
        tools=[orchestrate_service_request],
    )
else:
    root_agent = None
