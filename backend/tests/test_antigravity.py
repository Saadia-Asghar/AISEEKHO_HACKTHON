"""Antigravity workflow API tests."""

from app.antigravity.workflow import WORKFLOW_ID, enrich_trace, workflow_definition
from app.models.schemas import AgentPhase, TraceEntry


def test_workflow_has_six_nodes():
    wf = workflow_definition()
    assert wf["workflow_id"] == WORKFLOW_ID
    assert len(wf["nodes"]) == 6


def test_trace_enriched_with_antigravity_metadata():
    entry = TraceEntry(
        agent="IntentUnderstandingAgent",
        phase=AgentPhase.PLANNING,
        action="parse",
        reasoning="test",
    )
    enriched = enrich_trace(entry)
    assert enriched.orchestration_engine == "google_antigravity"
    assert enriched.node_id == "node_1_intent"
    assert enriched.workflow_id == WORKFLOW_ID
