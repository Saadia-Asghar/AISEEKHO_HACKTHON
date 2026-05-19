"""Provider accept/decline (WhatsApp webhook–style demo API)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import bookings_db

router = APIRouter(prefix="/api/provider", tags=["provider"])


class ProviderRespondBody(BaseModel):
    provider_id: str
    action: str = Field(..., pattern="^(accept|decline)$")


@router.post("/jobs/{booking_id}/respond")
def respond_to_job(booking_id: str, body: ProviderRespondBody):
    """Simulates provider tapping Accept/Decline on WhatsApp."""
    try:
        if body.action == "accept":
            return bookings_db.start_booking(booking_id)
        return bookings_db.cancel_booking(booking_id, None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
