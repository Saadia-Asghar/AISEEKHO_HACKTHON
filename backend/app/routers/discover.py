"""Preview search (discover) and commit booking after user chooses."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps.auth import optional_user_id
from app.models.schemas import DiscoverResponse, ServiceRequest
from app.orchestrator import KhidmatOrchestrator

router = APIRouter(tags=["discover"])
orchestrator = KhidmatOrchestrator()


@router.post("/api/discover", response_model=DiscoverResponse)
def discover(
    request: ServiceRequest,
    token_user_id: str | None = Depends(optional_user_id),
):
    user_id = request.user_id or token_user_id
    if token_user_id and request.user_id and request.user_id != token_user_id:
        raise HTTPException(status_code=403, detail="user_id does not match token")
    try:
        return orchestrator.discover(
            request.message,
            request.session_id,
            request.customer_name,
            user_id,
            request.user_lat,
            request.user_lng,
            request.customer_phone,
            request.price_sort,
            max_distance_km=request.max_distance_km,
            min_rating=request.min_rating,
            verified_only=request.verified_only,
            available_today=request.available_today,
            lang=request.lang,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


class CreateBookingBody(BaseModel):
    session_id: str
    provider_id: str
    user_id: str
    customer_name: str | None = None
    customer_phone: str | None = None


@router.post("/api/bookings/create")
def create_booking_from_discover(
    body: CreateBookingBody,
    token_user_id: str | None = Depends(optional_user_id),
):
    if token_user_id and body.user_id != token_user_id:
        raise HTTPException(status_code=403, detail="user_id does not match token")
    try:
        return orchestrator.complete_booking(
            body.session_id,
            body.provider_id,
            body.user_id,
            body.customer_name,
            body.customer_phone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
