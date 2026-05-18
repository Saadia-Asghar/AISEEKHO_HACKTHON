from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import auth_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SendOtpBody(BaseModel):
    phone: str


class VerifyAuthBody(BaseModel):
    phone: str
    otp: str
    name: str | None = None


@router.post("/send-otp")
def send_otp(body: SendOtpBody):
    return auth_db.send_otp(body.phone)


@router.post("/verify")
def verify_auth(body: VerifyAuthBody):
    try:
        result = auth_db.verify_otp(body.phone, body.otp, body.name)
        return {
            "user_id": result["user_id"],
            "name": result["user"]["name"],
            "token": result["token"],
            "user": result["user"],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
