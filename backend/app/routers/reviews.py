import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import user_data
from app.db.database import _connect

router = APIRouter(tags=["reviews"])


class ReviewBody(BaseModel):
    booking_id: str
    user_id: str
    provider_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


@router.post("/api/reviews")
def create_review(body: ReviewBody):
    try:
        return user_data.submit_rating(
            body.user_id,
            body.provider_id,
            body.booking_id,
            body.rating,
            body.comment,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/api/providers/{provider_id}/reviews")
def list_provider_reviews(provider_id: str, limit: int = 20):
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT r.stars, r.comment, r.created_at, u.display_name
            FROM provider_ratings r
            LEFT JOIN users u ON u.id = r.user_id
            WHERE r.provider_id = ?
            ORDER BY r.created_at DESC
            LIMIT ?
            """,
            (provider_id, limit),
        ).fetchall()
    agg = user_data.get_provider_aggregate_rating(provider_id)
    return {
        "provider_id": provider_id,
        "average_rating": agg["effective_rating"],
        "total_reviews": agg["user_rating_count"] + agg["static_reviews"],
        "reviews": [
            {
                "rating": row["stars"],
                "comment": row["comment"],
                "created_at": row["created_at"],
                "user_name": row["display_name"] or "HazirAI User",
            }
            for row in rows
        ],
    }
