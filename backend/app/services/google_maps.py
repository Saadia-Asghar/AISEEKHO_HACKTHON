"""Google Geocoding API — resolve sector names to lat/lng."""

import os
from typing import Any

import httpx

from app.services.geo import AREA_COORDS


def geocode_location(location: str) -> tuple[float, float] | None:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    query = f"{location}, Islamabad, Pakistan"
    try:
        with httpx.Client(timeout=8.0) as client:
            r = client.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"address": query, "key": api_key},
            )
            r.raise_for_status()
            data: dict[str, Any] = r.json()
        if data.get("status") != "OK" or not data.get("results"):
            return None
        loc = data["results"][0]["geometry"]["location"]
        return float(loc["lat"]), float(loc["lng"])
    except Exception:
        return None


def resolve_coords(location: str) -> tuple[float, float, str]:
    """Returns (lat, lng, source) where source is google_maps | local."""
    mapped = geocode_location(location)
    if mapped:
        return mapped[0], mapped[1], "google_maps"
    key = location.upper().replace(" ", "")
    for area, coords in AREA_COORDS.items():
        if area in key or key in area:
            return coords[0], coords[1], "local"
    return AREA_COORDS["G-13"][0], AREA_COORDS["G-13"][1], "local"
