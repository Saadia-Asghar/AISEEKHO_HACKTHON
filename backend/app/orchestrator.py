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
    AlternativeRanking,
    LocationInfo,
    OrchestrationResponse,
    PaymentInfo,
    PersonalizationSummary,
    Provider,
    ProviderScoreSummary,
    RankingResult,
    TraceEntry,
    TraceSummary,
)
from app.db import auth_db
from app.services.payments import create_payment


class KhidmatOrchestrator:
    """
    HazirAI 5-agent pipeline (+ trace logging):
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
        customer_name: str | None = None,
        user_id: str | None = None,
        user_lat: float | None = None,
        user_lng: float | None = None,
        customer_phone: str | None = None,
    ) -> OrchestrationResponse:
        database.init_db()
        sid = session_id or str(uuid4())
        resolved_name = customer_name or "Guest"
        if user_id and not customer_name:
            try:
                profile = auth_db.get_user_profile(user_id)
                resolved_name = profile.get("name") or resolved_name
            except ValueError:
                pass
        context: dict = {
            "message": message,
            "session_id": sid,
            "customer_name": resolved_name,
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
        recommended: Provider = context["recommended"]
        ranking = self._build_ranking(recommended, top_three)
        alternatives = self._build_alternatives(top_three)

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
            recommended=recommended,
            ranking=ranking,
            alternatives=alternatives,
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


    @staticmethod
    def _build_ranking(top: Provider, ranked: list[Provider]) -> RankingResult:
        alts: list[AlternativeRanking] = []
        for p in ranked:
            if p.id == top.id:
                continue
            bd = p.score_breakdown or {}
            alts.append(
                AlternativeRanking(
                    provider=p,
                    score=p.score or 0.0,
                    distance_km=p.distance_km,
                    rating=p.effective_rating or p.rating,
                    availability=bd.get("availability_25pct", 0.0) / 0.25 if bd else 0.0,
                    score_breakdown=bd,
                )
            )
            if len(alts) >= 2:
                break
        return RankingResult(top_provider=top, alternatives=alts)

    @staticmethod
    def _build_alternatives(ranked: list[Provider]) -> list[ProviderScoreSummary]:
        out: list[ProviderScoreSummary] = []
        for p in ranked[1:3]:
            bd = p.score_breakdown or {}
            out.append(
                ProviderScoreSummary(
                    name=p.name,
                    provider_id=p.id,
                    score=p.score or 0.0,
                    distance_score=bd.get("distance_40pct", 0.0),
                    rating_score=bd.get("rating_35pct", 0.0),
                    availability_score=bd.get("availability_25pct", 0.0),
                    total_score=p.score or 0.0,
                )
            )
        return out


ServiceOrchestrator = KhidmatOrchestrator
