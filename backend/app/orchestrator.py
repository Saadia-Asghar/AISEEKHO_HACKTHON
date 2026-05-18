from uuid import uuid4

from app.agents.booking_agent import BookingAgent
from app.agents.discovery_agent import ProviderDiscoveryAgent
from app.agents.followup_agent import FollowUpAgent
from app.agents.intent_agent import IntentUnderstandingAgent
from app.agents.ranking_agent import RankingAgent
from app.agents.trace_agent import TraceAgent
from app.db import database
from app.models.schemas import OrchestrationResponse, TraceEntry, TraceSummary


class KhidmatOrchestrator:
    """
    KhidmatAI 6-agent pipeline (PRD §4.2), orchestrated for Google Antigravity:
    Intent → Discovery → Ranking → Booking → Follow-Up → Trace
    """

    def __init__(self) -> None:
        self.core_pipeline = [
            IntentUnderstandingAgent(),
            ProviderDiscoveryAgent(),
            RankingAgent(),
            BookingAgent(),
            FollowUpAgent(),
        ]
        self.trace_agent = TraceAgent()

    def run(
        self,
        message: str,
        session_id: str | None = None,
        customer_name: str = "Demo Customer",
    ) -> OrchestrationResponse:
        database.init_db()
        sid = session_id or str(uuid4())
        context: dict = {
            "message": message,
            "session_id": sid,
            "customer_name": customer_name,
        }
        traces: list[TraceEntry] = []

        for agent in self.core_pipeline:
            context = agent.run(context)
            traces.append(context.pop("last_trace"))

        context["all_traces"] = traces
        context = self.trace_agent.run(context)
        traces.append(context.pop("last_trace"))

        summary: TraceSummary = context["trace_summary"]
        database.save_trace(sid, [t.model_dump() for t in traces], summary.model_dump())

        top_three = context.get("top_three", context["candidates"][:3])

        return OrchestrationResponse(
            session_id=sid,
            intent=context["intent"],
            candidates=context["candidates"],
            top_three=top_three,
            recommended=context["recommended"],
            booking=context["booking"],
            follow_up=context["follow_up"],
            trace=traces,
            trace_summary=summary,
        )


ServiceOrchestrator = KhidmatOrchestrator
