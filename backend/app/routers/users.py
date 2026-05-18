from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import auth_db, user_data
from app.models.schemas import CreateUserRequest, SubmitRatingRequest


class UpdateUserBody(BaseModel):
    name: str | None = None
    language_pref: str | None = None
    location: str | None = None

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("")
def create_user(body: CreateUserRequest):
    if not body.display_name.strip():
        raise HTTPException(status_code=400, detail="display_name is required")
    return user_data.create_user(body.display_name)


@router.get("/{user_id}")
def get_user(user_id: str):
    user = user_data.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}")
def patch_user(user_id: str, body: UpdateUserBody):
    try:
        fields = {}
        if body.name is not None:
            fields["name"] = body.name
        if body.language_pref is not None:
            fields["language_pref"] = body.language_pref
        if body.location is not None:
            fields["location"] = body.location
        return auth_db.update_user_profile(user_id, **fields)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/{user_id}/saved")
def list_saved(user_id: str):
    return {"saved": user_data.list_saved_providers(user_id)}


@router.post("/{user_id}/saved/{provider_id}")
def save_worker(user_id: str, provider_id: str):
    try:
        return user_data.save_provider(user_id, provider_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("/{user_id}/saved/{provider_id}")
def unsave_worker(user_id: str, provider_id: str):
    return user_data.unsave_provider(user_id, provider_id)


@router.get("/{user_id}/bookings")
def list_bookings(user_id: str):
    return {"bookings": user_data.list_user_bookings(user_id)}


@router.post("/ratings")
def submit_rating(body: SubmitRatingRequest):
    try:
        return user_data.submit_rating(
            body.user_id,
            body.provider_id,
            body.booking_id,
            body.stars,
            body.comment,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
