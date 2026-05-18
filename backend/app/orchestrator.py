from uuid import uuid4

from app.agents.booking_agent import BookingAgent
from app.agents.discovery_agent import ProviderDiscoveryAgent
from app.agents.followup_agent import FollowUpAgent
from app.agents.intent_agent import IntentUnderstandingAgent
from app.agents.ranking_agent import RankingAgent
from app.agents.trace_agent import TraceAgent
from app.db import database
from app.db import payments_db
from app.models.schemas import (
    LocationInfo,
    OrchestrationResponse,
    PaymentInfo,
    PersonalizationSummary,
    TraceEntry,
    TraceSummary,
)
from app.services.payments import create_payment


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
        user_id: str | None = None,
        user_lat: float | None = None,
        user_lng: float | None = None,
        customer_phone: str | None = None,
    ) -> OrchestrationResponse:
        database.init_db()
        sid = session_id or str(uuid4())
        context: dict = {
            "message": message,
            "session_id": sid,
            "customer_name": customer_name,
            "user_id": user_id,
            "user_lat": user_lat,
            "user_lng": user_lng,
            "customer_phone": customer_phone,
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

        personalization: PersonalizationSummary | None = context.get("personalization")
        booking = context["booking"]
        amount = booking.amount_pkr or 1500
        pay_raw = create_payment(booking.booking_id, amount, method="card", user_id=user_id)
        payments_db.save_payment(
            pay_raw["payment_id"],
            booking.booking_id,
            user_id,
            amount,
            pay_raw.get("method", "card"),
            pay_raw.get("status", "pending"),
            pay_raw.get("stripe_payment_intent_id"),
        )
        payment = PaymentInfo(
            payment_id=pay_raw["payment_id"],
            booking_id=booking.booking_id,
            amount_pkr=amount,
            method=pay_raw.get("method", "card"),
            status=pay_raw.get("status", "pending"),
            simulated=pay_raw.get("simulated", False),
            instructions=pay_raw.get("instructions"),
            stripe_client_secret=pay_raw.get("stripe_client_secret"),
            stripe_payment_intent_id=pay_raw.get("stripe_payment_intent_id"),
        )
        loc = context.get("user_location")
        user_location = LocationInfo(**loc) if loc else None

        return OrchestrationResponse(
            session_id=sid,
            intent=context["intent"],
            candidates=context["candidates"],
            top_three=top_three,
            recommended=context["recommended"],
            booking=booking,
            payment=payment,
            follow_up=context["follow_up"],
            trace=traces,
            trace_summary=summary,
            personalization=personalization,
            rate_booking=False,
            user_location=user_location,
            notifications=[],
        )


ServiceOrchestrator = KhidmatOrchestrator
