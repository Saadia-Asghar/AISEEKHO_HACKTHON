"""Clerk sync returns API token for KhidmatAI session."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


def test_clerk_sync_issues_token():
    client = TestClient(app)
    mock_user = {
        "clerk_user_id": "user_test_clerk_01",
        "display_name": "Clerk User",
        "phone": "+923001234567",
    }
    with patch("app.routers.auth.clerk_configured", return_value=True), patch(
        "app.routers.auth.fetch_clerk_user", return_value=mock_user
    ):
        r = client.post(
            "/api/auth/sync",
            json={
                "clerk_user_id": "user_test_clerk_01",
                "display_name": "Clerk User",
                "phone": "+923001234567",
            },
        )
    assert r.status_code == 200
    body = r.json()
    assert body.get("token")
    assert body.get("user_id", "").startswith("USR-")
    assert body.get("name") == "Clerk User"
