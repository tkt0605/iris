import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.auth import get_current_user
from app.db.database import get_db

TEST_USER_ID="550e8400-e29b-41d4-a716-446655440000"
TEST_CONV_ID="660e8400-e29b-41d4-a716-446655440001"
TEST_MSG_ID="770e8400-e29b-41d4-a716-446655440002"

@pytest.fixture
async def client():
    db = AsyncMock()
    async def mock_get_db():
        yield db
    with(
        patch("app.db.database.init_pool", new_callable=AsyncMock),
        patch("app.db.database.close_pool", new_callable=AsyncMock),
    ):
        app.dependency_overrides[get_current_user] = lambda: TEST_USER_ID
        app.dependency_overrides[get_db] = mock_get_db

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac, db
        app.dependency_overrides.clear()
    