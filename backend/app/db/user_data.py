"""User profiles, ratings, saved workers, and booking history."""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from app.db.database import _connect

PROVIDERS_PATH = Path(__file__).resolve().parent.parent / "data" / "providers.json"


def _load_providers_map() -> dict[str, dict[str, Any]]:
    with open(PROVIDERS_PATH, encoding="utf-8") as f:
        return {p["id"]: p for p in json.load(f)}


def init_user_tables() -> None:
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS provider_ratings (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                booking_id TEXT NOT NULL,
                stars INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
                comment TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, booking_id)
            );
            CREATE TABLE IF NOT EXISTS saved_providers (
                user_id TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                saved_at TEXT NOT NULL,
                PRIMARY KEY (user_id, provider_id)
            );
            """
        )
        user_cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
        if "clerk_id" not in user_cols:
            conn.execute("ALTER TABLE users ADD COLUMN clerk_id TEXT")
        if "phone" not in user_cols:
            conn.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        cols = {r[1] for r in conn.execute("PRAGMA table_info(bookings)").fetchall()}
        if "user_id" not in cols:
            conn.execute("ALTER TABLE bookings ADD COLUMN user_id TEXT")
        if "payment_status" not in cols:
            conn.execute("ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending'")
        if "amount_pkr" not in cols:
            conn.execute("ALTER TABLE bookings ADD COLUMN amount_pkr INTEGER")
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                booking_id TEXT NOT NULL,
                user_id TEXT,
                amount_pkr INTEGER NOT NULL,
                method TEXT NOT NULL,
                status TEXT NOT NULL,
                stripe_payment_intent_id TEXT,
                created_at TEXT NOT NULL,
                paid_at TEXT
            );
            CREATE TABLE IF NOT EXISTS notification_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id TEXT,
                channel TEXT,
                recipient TEXT,
                status TEXT,
                payload TEXT,
                created_at TEXT NOT NULL
            );
            """
        )


def sync_clerk_user(
    clerk_id: str,
    display_name: str,
    phone: str | None = None,
) -> dict[str, Any]:
    with _connect() as conn:
        row = conn.execute("SELECT id, display_name FROM users WHERE clerk_id = ?", (clerk_id,)).fetchone()
        if row:
            conn.execute(
                "UPDATE users SET display_name = ?, phone = ? WHERE clerk_id = ?",
                (display_name, phone, clerk_id),
            )
            return {
                "user_id": row["id"],
                "display_name": display_name,
                "clerk_id": clerk_id,
                "phone": phone,
            }
    created = create_user(display_name)
    with _connect() as conn:
        conn.execute(
            "UPDATE users SET clerk_id = ?, phone = ? WHERE id = ?",
            (clerk_id, phone, created["user_id"]),
        )
    return {**created, "clerk_id": clerk_id, "phone": phone}


def get_user_by_clerk(clerk_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT id, display_name, phone, created_at FROM users WHERE clerk_id = ?",
            (clerk_id,),
        ).fetchone()
    if not row:
        return None
    stats = get_user_stats(row["id"])
    return {
        "user_id": row["id"],
        "display_name": row["display_name"],
        "phone": row["phone"],
        "clerk_id": clerk_id,
        "created_at": row["created_at"],
        **stats,
    }


def create_user(display_name: str) -> dict[str, Any]:
    user_id = f"USR-{uuid.uuid4().hex[:12]}"
    created = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            "INSERT INTO users (id, display_name, created_at) VALUES (?, ?, ?)",
            (user_id, display_name.strip(), created),
        )
    return {"user_id": user_id, "display_name": display_name.strip(), "created_at": created}


def get_user(user_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute("SELECT id, display_name, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return None
    stats = get_user_stats(user_id)
    return {"user_id": row["id"], "display_name": row["display_name"], "created_at": row["created_at"], **stats}


def get_user_stats(user_id: str) -> dict[str, int]:
    with _connect() as conn:
        bookings = conn.execute("SELECT COUNT(*) as c FROM bookings WHERE user_id = ?", (user_id,)).fetchone()["c"]
        ratings = conn.execute("SELECT COUNT(*) as c FROM provider_ratings WHERE user_id = ?", (user_id,)).fetchone()["c"]
        saved = conn.execute("SELECT COUNT(*) as c FROM saved_providers WHERE user_id = ?", (user_id,)).fetchone()["c"]
    return {"bookings_count": bookings or 0, "ratings_count": ratings or 0, "saved_count": saved or 0}


def submit_rating(
    user_id: str,
    provider_id: str,
    booking_id: str,
    stars: int,
    comment: str | None = None,
) -> dict[str, Any]:
    stars = max(1, min(5, stars))
    rating_id = f"RT-{uuid.uuid4().hex[:10]}"
    created = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        booking = conn.execute(
            "SELECT id, provider_id, user_id FROM bookings WHERE id = ?",
            (booking_id,),
        ).fetchone()
        if not booking:
            raise ValueError("Booking not found")
        if booking["provider_id"] != provider_id:
            raise ValueError("Provider does not match this booking")
        if booking["user_id"] and booking["user_id"] != user_id:
            raise ValueError("Not your booking")
        existing = conn.execute(
            "SELECT id FROM provider_ratings WHERE user_id = ? AND booking_id = ?",
            (user_id, booking_id),
        ).fetchone()
        if existing:
            raise ValueError("You already rated this booking")
        conn.execute(
            """
            INSERT INTO provider_ratings (id, user_id, provider_id, booking_id, stars, comment, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (rating_id, user_id, provider_id, booking_id, stars, comment, created),
        )
        if booking["user_id"] is None:
            conn.execute("UPDATE bookings SET user_id = ? WHERE id = ?", (user_id, booking_id))
    agg = get_provider_aggregate_rating(provider_id)
    return {
        "rating_id": rating_id,
        "stars": stars,
        "comment": comment,
        "provider_aggregate": agg,
    }


def get_provider_aggregate_rating(provider_id: str) -> dict[str, Any]:
    providers = _load_providers_map()
    static = providers.get(provider_id, {})
    static_rating = float(static.get("rating", 4.0))
    static_reviews = int(static.get("reviews", 0))
    with _connect() as conn:
        row = conn.execute(
            "SELECT AVG(stars) as avg_stars, COUNT(*) as cnt FROM provider_ratings WHERE provider_id = ?",
            (provider_id,),
        ).fetchone()
    user_avg = float(row["avg_stars"]) if row["cnt"] else None
    user_count = int(row["cnt"] or 0)
    if user_count == 0:
        effective = static_rating
    else:
        # Blend: weight user votes more as count grows (max 60% user weight at 10+ votes)
        user_weight = min(0.6, user_count / (user_count + static_reviews + 5))
        effective = round(user_weight * user_avg + (1 - user_weight) * static_rating, 2)
    return {
        "provider_id": provider_id,
        "static_rating": static_rating,
        "static_reviews": static_reviews,
        "user_rating_avg": round(user_avg, 2) if user_avg else None,
        "user_rating_count": user_count,
        "effective_rating": effective,
    }


def get_personalization_context(user_id: str | None) -> dict[str, Any]:
    if not user_id:
        return {"saved_ids": set(), "user_ratings": {}, "past_provider_ids": set()}
    with _connect() as conn:
        saved = {
            r["provider_id"]
            for r in conn.execute(
                "SELECT provider_id FROM saved_providers WHERE user_id = ?", (user_id,)
            ).fetchall()
        }
        ratings = {
            r["provider_id"]: int(r["stars"])
            for r in conn.execute(
                "SELECT provider_id, stars FROM provider_ratings WHERE user_id = ?", (user_id,)
            ).fetchall()
        }
        past = {
            r["provider_id"]
            for r in conn.execute(
                "SELECT DISTINCT provider_id FROM bookings WHERE user_id = ?", (user_id,)
            ).fetchall()
        }
    return {"saved_ids": saved, "user_ratings": ratings, "past_provider_ids": past}


def save_provider(user_id: str, provider_id: str) -> dict[str, Any]:
    providers = _load_providers_map()
    if provider_id not in providers:
        raise ValueError("Provider not found")
    saved_at = datetime.utcnow().isoformat() + "Z"
    with _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO saved_providers (user_id, provider_id, saved_at)
            VALUES (?, ?, ?)
            """,
            (user_id, provider_id, saved_at),
        )
    return {"user_id": user_id, "provider_id": provider_id, "saved": True, "saved_at": saved_at}


def unsave_provider(user_id: str, provider_id: str) -> dict[str, Any]:
    with _connect() as conn:
        conn.execute(
            "DELETE FROM saved_providers WHERE user_id = ? AND provider_id = ?",
            (user_id, provider_id),
        )
    return {"user_id": user_id, "provider_id": provider_id, "saved": False}


def list_contacted_providers(user_id: str, limit: int = 8) -> list[dict[str, Any]]:
    """Workers this user has booked before, most recent first."""
    providers_map = _load_providers_map()
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT provider_id, MAX(created_at) as last_at, COUNT(*) as cnt
            FROM bookings
            WHERE user_id = ? AND provider_id IS NOT NULL
            GROUP BY provider_id
            ORDER BY last_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
    result: list[dict[str, Any]] = []
    for row in rows:
        p = providers_map.get(row["provider_id"])
        if not p:
            continue
        agg = get_provider_aggregate_rating(row["provider_id"])
        result.append(
            {
                "id": p["id"],
                "name": p["name"],
                "category": p["category"],
                "area": p["area"],
                "rating": agg["effective_rating"],
                "phone": p["phone"],
                "lat": p.get("lat"),
                "lng": p.get("lng"),
                "price_min_pkr": p.get("price_min_pkr"),
                "price_max_pkr": p.get("price_max_pkr"),
                "last_booked_at": row["last_at"],
                "bookings_count": int(row["cnt"]),
            }
        )
    return result


def list_saved_providers(user_id: str) -> list[dict[str, Any]]:
    providers_map = _load_providers_map()
    with _connect() as conn:
        rows = conn.execute(
            "SELECT provider_id, saved_at FROM saved_providers WHERE user_id = ? ORDER BY saved_at DESC",
            (user_id,),
        ).fetchall()
    result = []
    for row in rows:
        p = providers_map.get(row["provider_id"])
        if not p:
            continue
        agg = get_provider_aggregate_rating(row["provider_id"])
        ur = get_personalization_context(user_id)["user_ratings"].get(row["provider_id"])
        result.append(
            {
                "id": p["id"],
                "name": p["name"],
                "category": p["category"],
                "area": p["area"],
                "rating": agg["effective_rating"],
                "reviews": agg["static_reviews"] + agg["user_rating_count"],
                "phone": p["phone"],
                "saved_at": row["saved_at"],
                "your_rating": ur,
            }
        )
    return result


def list_user_bookings(user_id: str, limit: int = 30) -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT b.*, r.stars as user_stars, r.comment as user_comment
            FROM bookings b
            LEFT JOIN provider_ratings r ON r.booking_id = b.id AND r.user_id = ?
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT ?
            """,
            (user_id, user_id, limit),
        ).fetchall()
    return [
        {
            "booking_id": row["id"],
            "provider_id": row["provider_id"],
            "provider_name": row["provider_name"],
            "service_type": row["service_type"],
            "location": row["location"],
            "slot": row["slot"],
            "status": row["status"],
            "created_at": row["created_at"],
            "rated": row["user_stars"] is not None,
            "user_stars": row["user_stars"],
            "user_comment": row["user_comment"],
        }
        for row in rows
    ]


def is_provider_saved(user_id: str | None, provider_id: str) -> bool:
    if not user_id:
        return False
    with _connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM saved_providers WHERE user_id = ? AND provider_id = ?",
            (user_id, provider_id),
        ).fetchone()
    return row is not None


def get_rating_for_booking(user_id: str, booking_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT stars, comment, created_at FROM provider_ratings WHERE user_id = ? AND booking_id = ?",
            (user_id, booking_id),
        ).fetchone()
    if not row:
        return None
    return {"stars": row["stars"], "comment": row["comment"], "created_at": row["created_at"]}
