import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.db.database import get_db

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_CONV_ID = "00000000-0000-0000-0000-000000000002"


def _make_mock_db(rows=None, row=None, val=None):
    """asyncpg.Connectionのモックを生成する"""
    db = AsyncMock()
    db.fetch = AsyncMock(return_value=rows or [])
    db.fetchrow = AsyncMock(return_value=row)
    db.fetchval = AsyncMock(return_value=val)
    return db


@pytest.fixture
def mock_db_dep(auth_app):
    """get_dbをモックに差し替えるfixture"""
    mock_conn = _make_mock_db()

    async def override_db():
        yield mock_conn

    auth_app.dependency_overrides[get_db] = override_db
    yield mock_conn
    # conftest側でdependency_overridesはclearされるためここでは不要


@pytest.mark.asyncio
async def test_list_conversations_empty(client, mock_db_dep):
    """会話が0件のとき空リストを返す"""
    mock_db_dep.fetch = AsyncMock(return_value=[])
    res = await client.get("/api/conversations")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_create_conversation(client, mock_db_dep):
    """会話を作成すると201とデータを返す"""
    import uuid, datetime
    mock_db_dep.fetchrow = AsyncMock(
        return_value={
            "id": uuid.UUID(TEST_CONV_ID),
            "user_id": uuid.UUID(TEST_USER_ID),
            "title": "テスト会話",
            "is_activate": True,
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now(),
        }
    )
    res = await client.post(
        "/api/conversations", json={"title": "テスト会話"}
    )
    assert res.status_code == 201
    assert res.json()["title"] == "テスト会話"


@pytest.mark.asyncio
async def test_create_message(client, mock_db_dep):
    """メッセージを追加すると201とデータを返す"""
    import uuid, datetime
    # 所有確認用fetchvalでuser_idを返す
    mock_db_dep.fetchval = AsyncMock(return_value=uuid.UUID(TEST_USER_ID))
    mock_db_dep.fetchrow = AsyncMock(
        return_value={
            "id": uuid.UUID("00000000-0000-0000-0000-000000000003"),
            "conversation_id": uuid.UUID(TEST_CONV_ID),
            "role": "user",
            "context": "こんにちは",
            "audio_url": None,
            "audio_duration": None,
            "metadata": {},
            "created_at": datetime.datetime.now(),
        }
    )
    res = await client.post(
        f"/api/conversations/{TEST_CONV_ID}/messages",
        json={"role": "user", "context": "こんにちは"},
    )
    assert res.status_code == 201
    assert res.json()["role"] == "user"


@pytest.mark.asyncio
async def test_create_message_invalid_role(client, mock_db_dep):
    """不正なroleは400を返す"""
    res = await client.post(
        f"/api/conversations/{TEST_CONV_ID}/messages",
        json={"role": "system", "context": "test"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_update_conversation_not_found(client, mock_db_dep):
    """存在しない会話のタイトル更新は404を返す"""
    mock_db_dep.fetchrow = AsyncMock(return_value=None)
    res = await client.patch(
        f"/api/conversations/{TEST_CONV_ID}",
        json={"title": "新タイトル"},
    )
    assert res.status_code == 404
