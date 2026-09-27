"""Shared test fixtures."""

import pytest
from app.store import profile_store


@pytest.fixture
def clean_store():
    """Clear the profile store before and after each test."""
    profile_store.clear()
    yield
    profile_store.clear()
