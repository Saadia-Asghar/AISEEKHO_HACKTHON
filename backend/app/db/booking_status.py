"""Booking status state machine: PENDING → CONFIRMED → COMPLETED | CANCELLED."""

from typing import Any

VALID_TRANSITIONS: dict[str, set[str]] = {
    "PENDING": {"CONFIRMED", "CANCELLED"},
    "PENDING_PAYMENT": {"CONFIRMED", "CANCELLED"},  # legacy rows
    "CONFIRMED": {"COMPLETED", "CANCELLED"},
    "REMINDER_SCHEDULED": {"COMPLETED", "CANCELLED", "CONFIRMED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
    "cancelled": {"CANCELLED"},
}


def normalize_status(status: str) -> str:
    s = (status or "PENDING").upper()
    if s == "CANCELLED":
        return "CANCELLED"
    return s


def can_transition(current: str, new: str) -> bool:
    cur = normalize_status(current)
    nxt = normalize_status(new)
    if cur == nxt:
        return True
    allowed = VALID_TRANSITIONS.get(cur, set())
    return nxt in allowed


def transition(current: str, new: str) -> str:
    if not can_transition(current, new):
        raise ValueError(f"Cannot transition booking from {current} to {new}")
    return normalize_status(new)
