from fastapi import APIRouter, HTTPException, Query

from app.db import bookings_db

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("")
def list_user_bookings(
    user_id: str,
    tab: str | None = Query(None, description="upcoming | past | cancelled"),
):
    return {"bookings": bookings_db.list_bookings(user_id, tab)}


@router.get("/upcoming/count")
def upcoming_count(user_id: str):
    return {"count": bookings_db.count_upcoming(user_id)}


@router.patch("/{booking_id}/cancel")
def cancel_booking(booking_id: str, user_id: str | None = None):
    try:
        return bookings_db.cancel_booking(booking_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
