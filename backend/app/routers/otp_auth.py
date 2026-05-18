from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import auth_db

router = APIRouter(prefix="/auth/otp", tags=["auth-otp"])
legacy_router = APIRouter(prefix="/api/auth/otp", tags=["auth-otp-legacy"])


class SendOtpBody(BaseModel):
    phone: str


class VerifyOtpBody(BaseModel):
    phone: str
    otp: str
    name: str | None = None


def _send(body: SendOtpBody):
    return auth_db.send_otp(body.phone)


def _verify(body: VerifyOtpBody):
    try:
        return auth_db.verify_otp(body.phone, body.otp, body.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/send")
def send_otp(body: SendOtpBody):
    return _send(body)


@router.post("/verify")
def verify_otp(body: VerifyOtpBody):
    return _verify(body)


@legacy_router.post("/send")
def send_otp_legacy(body: SendOtpBody):
    return _send(body)


@legacy_router.post("/verify")
def verify_otp_legacy(body: VerifyOtpBody):
    return _verify(body)
