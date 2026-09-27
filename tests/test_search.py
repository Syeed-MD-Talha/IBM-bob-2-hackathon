"""Tests for the /search endpoint."""

from fastapi.testclient import TestClient

from app.main import app
from app.store import profile_store

client = TestClient(app)


def test_search_with_query():
    profile_store["alice"] = {"username": "alice", "bio": "dev"}
    profile_store["alex"] = {"username": "alex", "bio": "designer"}
    profile_store["bob"] = {"username": "bob", "bio": "manager"}

    response = client.get("/search?q=al")
    data = response.json()
    assert data["total"] == 2
    assert len(data["results"]) == 2


def test_search_empty_query():
    profile_store["carol"] = {"username": "carol", "bio": "tester"}
    response = client.get("/search?q=")
    data = response.json()
    assert data["total"] == 0
    assert data["results"] == []


def test_search_pagination():
    """Regression test: pagination must return exactly `limit` results, not limit-1."""
    profile_store.clear()
    for i in range(5):
        profile_store[f"user{i}"] = {"username": f"user{i}", "bio": "dev"}

    response = client.get("/search?q=user&offset=0&limit=3")
    data = response.json()
    assert data["total"] == 5
    assert len(data["results"]) == 3
