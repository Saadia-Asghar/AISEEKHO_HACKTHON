from typing import Any

from app.agents.base import BaseAgent
from app.models.schemas import AgentPhase, Provider


class RankingAgent(BaseAgent):
    name = "RankingAgent"
    phase = AgentPhase.DECISION

    def _score(self, provider: Provider, time_hint: str, urgency: bool) -> tuple[float, str, dict[str, float]]:
        # PRD: 40% distance (inverse km), 35% rating (1-5), 25% availability (binary)
        distance_component = max(0.0, 10.0 - 2.0 * min(provider.distance_km, 5.0))
        rating_component = (provider.rating / 5.0) * 10.0
        availability_component = 10.0 if provider.available_now and provider.available_slots else 0.0

        if urgency and provider.available_slots:
            availability_component = 10.0

        if time_hint in ("tomorrow_morning", "morning") and provider.available_slots:
            if any(int(s.split(":")[0]) < 12 for s in provider.available_slots):
                availability_component = max(availability_component, 10.0)

        breakdown = {
            "distance_40pct": round(distance_component * 0.4, 2),
            "rating_35pct": round(rating_component * 0.35, 2),
            "availability_25pct": round(availability_component * 0.25, 2),
        }
        total = round(sum(breakdown.values()), 2)
        reason = (
            f"Total {total}/10 — distance {provider.distance_km}km → {breakdown['distance_40pct']} (40%), "
            f"rating {provider.rating}★ → {breakdown['rating_35pct']} (35%), "
            f"availability → {breakdown['availability_25pct']} (25%)."
        )
        return total, reason, breakdown

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        intent = context["intent"]
        candidates: list[Provider] = context.get("candidates", [])

        if not candidates:
            raise ValueError("No providers found for this request.")

        ranked: list[Provider] = []
        for p in candidates:
            score, reason, breakdown = self._score(p, intent.parsed_datetime_hint, intent.urgency)
            ranked.append(
                p.model_copy(
                    update={"score": score, "rank_reason": reason, "score_breakdown": breakdown}
                )
            )
        ranked.sort(key=lambda x: x.score or 0, reverse=True)

        recommended = ranked[0]
        top_three = ranked[:3]
        context["candidates"] = ranked
        context["top_three"] = top_three
        context["recommended"] = recommended
        context["last_trace"] = self.trace(
            "rank_and_select",
            {"candidate_count": len(candidates), "time_hint": intent.parsed_datetime_hint},
            {
                "recommended_id": recommended.id,
                "recommended_name": recommended.name,
                "top_3": [
                    {
                        "name": r.name,
                        "score": r.score,
                        "breakdown": r.score_breakdown,
                        "distance_km": r.distance_km,
                    }
                    for r in top_three
                ],
            },
            (
                f"Selected '{recommended.name}' at {recommended.distance_km} km, score {recommended.score}. "
                f"{recommended.rank_reason}"
            ),
        )
        return context
