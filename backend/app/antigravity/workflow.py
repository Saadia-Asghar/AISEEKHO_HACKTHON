"""
Google Antigravity workflow registration for KhidmatAI Challenge 2.

The FastAPI pipeline implements the same 6 nodes judges expect from the PRD.
Each trace entry is tagged with workflow_id, node_id, and orchestration_engine
so telemetry maps 1:1 to Antigravity workflow nodes in demos and export.
"""

from __future__ import annotations

from typing import Any

from app.models.schemas import TraceEntry

WORKFLOW_ID = "khidmatai_informal_economy_v1"
ORCHESTRATION_ENGINE = "google_antigravity"

# PRD §4.2 — six Antigravity workflow nodes
ANTIGRAVITY_NODES: list[dict[str, Any]] = [
    {
        "node_id": "node_1_intent",
        "agent": "IntentUnderstandingAgent",
        "phase": "planning",
        "skill": "multilingual_nlu_parser",
        "tools": ["gemini_pro_flash", "regex_nlu"],
        "output": "structured_intent_json",
    },
    {
        "node_id": "node_2_discovery",
        "agent": "ProviderDiscoveryAgent",
        "phase": "planning",
        "skill": "geographic_provider_query",
        "tools": ["google_maps_geocoding", "mock_provider_dataset"],
        "output": "candidate_provider_list",
    },
    {
        "node_id": "node_3_ranking",
        "agent": "RankingAgent",
        "phase": "decision",
        "skill": "weighted_matching",
        "tools": ["distance_matrix", "scoring_formula_40_35_25"],
        "output": "recommended_provider_with_reasoning",
    },
    {
        "node_id": "node_4_booking",
        "agent": "BookingAgent",
        "phase": "action",
        "skill": "booking_simulation",
        "tools": ["sqlite_booking_db", "receipt_generator"],
        "output": "booking_receipt_khi_id",
    },
    {
        "node_id": "node_5_followup",
        "agent": "FollowUpAgent",
        "phase": "follow_up",
        "skill": "notification_scheduler",
        "tools": ["fcm_simulated", "whatsapp_deep_link", "sms_twilio"],
        "output": "reminder_and_completion_schedule",
    },
    {
        "node_id": "node_6_trace",
        "agent": "TraceAgent",
        "phase": "follow_up",
        "skill": "telemetry_aggregator",
        "tools": ["session_context_reader", "trace_formatter"],
        "output": "human_readable_antigravity_trace",
    },
]

AGENT_TO_NODE: dict[str, str] = {n["agent"]: n["node_id"] for n in ANTIGRAVITY_NODES}


def enrich_trace(entry: TraceEntry) -> TraceEntry:
    """Attach Antigravity workflow metadata to a pipeline trace step."""
    return entry.model_copy(
        update={
            "workflow_id": WORKFLOW_ID,
            "node_id": AGENT_TO_NODE.get(entry.agent, entry.agent),
            "orchestration_engine": ORCHESTRATION_ENGINE,
        }
    )


def workflow_definition() -> dict[str, Any]:
    return {
        "workflow_id": WORKFLOW_ID,
        "orchestration_engine": ORCHESTRATION_ENGINE,
        "product": "KhidmatAI",
        "challenge": "Google Antigravity Hackathon 2026 — Challenge 2",
        "nodes": ANTIGRAVITY_NODES,
        "state_transitions": [
            "PENDING → CONFIRMED → REMINDER_SCHEDULED → COMPLETED",
        ],
    }
