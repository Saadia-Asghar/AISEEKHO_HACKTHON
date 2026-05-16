import json
from pathlib import Path
from typing import Any

from app.agents.base import BaseAgent
from app.models.schemas import AgentPhase, Provider
from app.services.geo import (
    DEFAULT_RADIUS_KM,
    WIDEN_RADIUS_KM,
    haversine_km,
    resolve_user_coords,
)

PROVIDERS_PATH = Path(__file__).resolve().parent.parent / "data" / "providers.json"


class ProviderDiscoveryAgent(BaseAgent):
    name = "ProviderDiscoveryAgent"
    phase = AgentPhase.PLANNING

    def _load_providers(self) -> list[dict[str, Any]]:
        with open(PROVIDERS_PATH, encoding="utf-8") as f:
            return json.load(f)

    def _filter(
        self,
        all_providers: list[dict[str, Any]],
        intent,
        user_lat: float,
        user_lng: float,
        radius_km: float,
    ) -> list[Provider]:
        matches: list[Provider] = []
        for p in all_providers:
            cats = p.get("categories", [p["category"]])
            if intent.service_type != "general" and intent.service_type not in cats:
                continue
            dist = haversine_km(user_lat, user_lng, p["lat"], p["lng"])
            if dist > radius_km:
                continue
            slots = p["available_slots"]
            matches.append(
                Provider(
                    id=p["id"],
                    name=p["name"],
                    category=p["category"],
                    area=p["area"],
                    distance_km=dist,
                    rating=p["rating"],
                    reviews=p["reviews"],
                    available_slots=slots,
                    phone=p["phone"],
                    available_now=bool(slots),
                )
            )
        matches.sort(key=lambda x: x.distance_km)
        return matches

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        intent = context["intent"]
        user_lat, user_lng = resolve_user_coords(intent.location)
        all_providers = self._load_providers()

        radius = DEFAULT_RADIUS_KM
        matches = self._filter(all_providers, intent, user_lat, user_lng, radius)
        widened = False

        if len(matches) < 3:
            radius = WIDEN_RADIUS_KM
            matches = self._filter(all_providers, intent, user_lat, user_lng, radius)
            widened = True

        if not matches:
            raise ValueError(
                f"No providers found for '{intent.service_label}' within {radius} km of {intent.location}. "
                "Try a nearby sector or different service."
            )

        context["candidates"] = matches
        context["discovery_radius_km"] = radius
        context["last_trace"] = self.trace(
            "discover_providers",
            {
                "service_type": intent.service_type,
                "location": intent.location,
                "radius_km": radius,
                "widened": widened,
            },
            {
                "count": len(matches),
                "within_radius": [m.name for m in matches[:5]],
                "tool": "mock_places_api",
            },
            (
                f"Found {len(matches)} providers within {radius} km "
                f"({'widened from 5 km' if widened else 'default 5 km'}). "
                "Google Maps Places API registered as Antigravity tool (mock fallback active)."
            ),
        )
        return context
