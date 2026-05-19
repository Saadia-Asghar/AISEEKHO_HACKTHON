"""Google Static Maps URL builder (uses GOOGLE_MAPS_API_KEY from backend .env)."""

import os
from typing import Any

MAP_W = 640
MAP_H = 400


def _bounds(
    markers: list[dict[str, Any]],
    user_lat: float | None,
    user_lng: float | None,
) -> dict[str, float]:
    lats = [float(m["lat"]) for m in markers]
    lngs = [float(m["lng"]) for m in markers]
    if user_lat is not None:
        lats.append(user_lat)
    if user_lng is not None:
        lngs.append(user_lng)
    pad = 0.008
    return {
        "min_lat": min(lats) - pad,
        "max_lat": max(lats) + pad,
        "min_lng": min(lngs) - pad,
        "max_lng": max(lngs) - pad,
        "center_lat": (min(lats) + max(lats)) / 2,
        "center_lng": (min(lngs) + max(lngs)) / 2,
    }


def build_google_static_map_url(
    markers: list[dict[str, Any]],
    user_lat: float | None = None,
    user_lng: float | None = None,
) -> str | None:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key or not markers:
        return None

    b = _bounds(markers, user_lat, user_lng)
    parts = [
        f"center={b['center_lat']},{b['center_lng']}",
        "zoom=14",
        f"size={MAP_W}x{MAP_H}",
        "scale=2",
        "maptype=roadmap",
    ]
    if user_lat is not None and user_lng is not None:
        parts.append(f"markers=color:green%7Clabel:Y%7C{user_lat},{user_lng}")
    for i, m in enumerate(markers):
        color = "orange" if m.get("is_recommended") else "violet"
        label = str((i % 9) + 1)
        parts.append(
            f"markers=color:{color}%7Clabel:{label}%7C{m['lat']},{m['lng']}"
        )
    return f"https://maps.googleapis.com/maps/api/staticmap?{'&'.join(parts)}&key={api_key}"
