"""Lightweight ops dashboard (protect with ADMIN_KEY in production)."""

import os
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse

from app.db.database import _connect, init_db

router = APIRouter(tags=["admin"])


def _check_admin(key: str | None) -> None:
    expected = os.getenv("ADMIN_KEY", "khidmat-dev-admin")
    if not key or key != expected:
        raise HTTPException(status_code=401, detail="Invalid admin key")


@router.get("/api/admin/stats")
def admin_stats(admin_key: str | None = Query(None, alias="key")):
    _check_admin(admin_key)
    init_db()
    with _connect() as conn:
        bookings = conn.execute("SELECT COUNT(*) as c FROM bookings").fetchone()["c"]
        pending = conn.execute(
            "SELECT COUNT(*) as c FROM bookings WHERE UPPER(status) = 'PENDING'"
        ).fetchone()["c"]
        confirmed = conn.execute(
            "SELECT COUNT(*) as c FROM bookings WHERE UPPER(status) = 'CONFIRMED'"
        ).fetchone()["c"]
        cancelled = conn.execute(
            "SELECT COUNT(*) as c FROM bookings WHERE UPPER(status) = 'CANCELLED'"
        ).fetchone()["c"]
        users = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        ratings = conn.execute("SELECT COUNT(*) as c FROM provider_ratings").fetchone()["c"]
        traces = conn.execute("SELECT COUNT(*) as c FROM agent_traces").fetchone()["c"]
        failed = conn.execute(
            """
            SELECT COUNT(*) as c FROM agent_traces
            WHERE summary_json LIKE '%error%' OR summary_json LIKE '%failed%'
            """
        ).fetchone()["c"]
    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "bookings_total": bookings,
        "bookings_pending": pending,
        "bookings_confirmed": confirmed,
        "bookings_cancelled": cancelled,
        "users": users,
        "reviews": ratings,
        "search_sessions": traces,
        "failed_or_error_traces": failed,
        "maps_configured": bool(os.getenv("GOOGLE_MAPS_API_KEY")),
        "gemini_configured": bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")),
    }


@router.get("/api/admin", response_class=HTMLResponse)
def admin_dashboard(admin_key: str | None = Query(None, alias="key")):
    stats = admin_stats(admin_key)
    rows = "".join(
        f"<tr><td>{k}</td><td><strong>{v}</strong></td></tr>"
        for k, v in stats.items()
        if k != "generated_at"
    )
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>KhidmatAI Ops</title>
<style>body{{font-family:system-ui;background:#0a0a0f;color:#f4f1ff;padding:24px}}
table{{border-collapse:collapse;width:100%;max-width:480px}}
td,th{{border:1px solid #333;padding:10px;text-align:left}}
th{{color:#9b7fd4}}</style></head>
<body><h1>KhidmatAI Ops</h1><p>Updated {stats["generated_at"]}</p>
<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>{rows}</tbody></table>
<p style="margin-top:24px;color:#888">Add <code>?key=ADMIN_KEY</code> in production.</p></body></html>"""
