import math

AREA_COORDS: dict[str, tuple[float, float]] = {
    "G-13": (33.6842, 72.9784),
    "G-12": (33.6780, 72.9720),
    "G-11": (33.6790, 72.9700),
    "G-10": (33.6750, 72.9650),
    "F-7": (33.7215, 73.0432),
    "F-8": (33.7150, 73.0380),
    "I-8": (33.6598, 73.0412),
    "I-9": (33.6520, 73.0350),
    "BAHRIA": (33.5400, 73.1200),
    "DHA": (33.5200, 73.1500),
    "BLUE AREA": (33.7100, 73.0600),
    "ISLAMABAD": (33.6844, 73.0479),
}

DEFAULT_RADIUS_KM = 5.0
WIDEN_RADIUS_KM = 10.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 1)


def resolve_user_coords(location: str) -> tuple[float, float]:
    from app.services.google_maps import resolve_coords

    lat, lng, _source = resolve_coords(location)
    return lat, lng
