"""Ensure SQLite schema exists before each test (CI TestClient may skip app lifespan)."""

import pytest

from app.db.database import init_db


@pytest.fixture(autouse=True)
def _init_database():
    init_db()
    yield
