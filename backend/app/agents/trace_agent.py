from typing import Any

from app.agents.base import BaseAgent
from app.models.schemas import AgentPhase, TraceEntry, TraceSummary


class TraceAgent(BaseAgent):
    name = "TraceAgent"
    phase = AgentPhase.FOLLOW_UP

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        traces: list[TraceEntry] = context.get("all_traces", [])
        booking = context.get("booking")
        recommended = context.get("recommended")
        intent = context.get("intent")

        lines = [
            "KhidmatAI — Antigravity Workflow Trace",
            f"Session: {context['session_id']}",
            "",
        ]
        for i, t in enumerate(traces, 1):
            lines.append(f"{i}. [{t.agent}] {t.action}")
            lines.append(f"   Phase: {t.phase.value} | {t.timestamp}")
            lines.append(f"   Reasoning: {t.reasoning}")
            lines.append("")

        outcome = (
            f"Booked {recommended.name if recommended else 'N/A'} "
            f"({booking.booking_id if booking else 'N/A'}) for {intent.service_label if intent else 'service'}."
        )
        lines.append(f"Outcome: {outcome}")

        summary = TraceSummary(
            steps=len(traces),
            outcome=outcome,
            agents=[t.agent for t in traces],
            human_readable="\n".join(lines),
        )
        context["trace_summary"] = summary
        context["last_trace"] = self.trace(
            "compile_workflow_trace",
            {"trace_steps": len(traces)},
            summary.model_dump(),
            "Compiled human-readable Antigravity trace for judges and demo export.",
        )
        return context
