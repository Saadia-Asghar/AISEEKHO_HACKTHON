"""Map helpers — static map URL using server-side GOOGLE_MAPS_API_KEY."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.static_map import build_google_static_map_url

router = APIRouter(prefix="/api/maps", tags=["maps"])


class MapMarkerIn(BaseModel):
    id: str = ""
    name: str = ""
    lat: float
    lng: float
    is_recommended: bool = False
    area: str = ""
    category: str = ""
    distance_km: float = 0
    rating: float = 0


class StaticMapRequest(BaseModel):
    markers: list[MapMarkerIn] = Field(default_factory=list)
    user_lat: float | None = None
    user_lng: float | None = None


@router.post("/static")
def static_map_url(body: StaticMapRequest):
    """Build Google Static Maps URL (key stays on server)."""
    if not body.markers:
        raise HTTPException(status_code=400, detail="markers required")
    url = build_google_static_map_url(
        [m.model_dump() for m in body.markers],
        body.user_lat,
        body.user_lng,
    )
    if not url:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_MAPS_API_KEY not configured in backend/.env",
        )
    return {"url": url, "provider": "google_static_maps"}


@router.get("/status")
def maps_status():
    import os

    configured = bool(os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    return {"google_maps_configured": configured, "static_maps_endpoint": "/api/maps/static"}
