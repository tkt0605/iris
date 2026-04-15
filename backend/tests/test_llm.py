import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.auth import get_current_user

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


def _mock_gemini_response(text: str) -> MagicMock:
    m = MagicMock()
    m.text = text
    return m


@pytest.fixture
def client_no_auth():
    """認証なしのクライアント（401テスト用）"""
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_llm_no_auth(client_no_auth):
    """認証ヘッダーなしは401を返す"""
    async with client_no_auth as c:
        res = await c.post("/api/llm", json={"userText": "hello"})
    assert res.status_code == 403  # HTTPBearer は未認証時403


@pytest.mark.asyncio
async def test_llm_missing_user_text(client):
    """userTextなしは422を返す"""
    res = await client.post("/api/llm", json={})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_llm_success(client):
    """正常リクエストはreplyとtitleを返す"""
    with patch("app.routers.llm.genai") as mock_genai:
        # GenerativeModelのgenerate_contentをモック
        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response("テスト返答")
        mock_genai.GenerativeModel.return_value = mock_model
        mock_genai.GenerationConfig = MagicMock()

        res = await client.post(
            "/api/llm",
            json={"userText": "今日の天気は？", "conversationHistory": []},
        )

    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "title" in data


@pytest.mark.asyncio
async def test_llm_with_history(client):
    """会話履歴ありのリクエストが正常に処理される"""
    with patch("app.routers.llm.genai") as mock_genai:
        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response("返答")
        mock_genai.GenerativeModel.return_value = mock_model
        mock_genai.GenerationConfig = MagicMock()

        res = await client.post(
            "/api/llm",
            json={
                "userText": "続けて",
                "conversationHistory": [
                    {"role": "user", "context": "最初の質問"},
                    {"role": "assistant", "context": "最初の返答"},
                ],
            },
        )

    assert res.status_code == 200
