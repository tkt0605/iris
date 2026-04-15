import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.auth import get_current_user

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


def override_auth():
    """テスト用: 認証をバイパスしてTEST_USER_IDを返す"""
    return TEST_USER_ID


@pytest.fixture
def auth_app():
    """認証をモックしたFastAPIアプリ"""
    app.dependency_overrides[get_current_user] = override_auth
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def client(auth_app):
    """テスト用HTTPクライアント"""
    async with AsyncClient(
        transport=ASGITransport(app=auth_app), base_url="http://test"
    ) as c:
        yield c
