import uuid
from datetime import datetime, timezone
from .conftest import TEST_CONV_ID, TEST_MSG_ID, TEST_USER_ID

_NOW = datetime.now(timezone.utc)

def _conv(title="テスト会話"):
    return {
        "id": uuid.UUID(TEST_CONV_ID),
        "user_id": uuid.UUID(TEST_USER_ID),
        "title": title,
        "is_activate": True,
        "created_at": _NOW,
        "updated_at": _NOW,
    }
def _msg(role="user"):
    return {
        "id": uuid.UUID(TEST_MSG_ID),
        "role": role,
        "context": "こんにちは",
        "audio_url": None,
        "audio_duration": None,
        "metadata": "{}",
        "created_at": _NOW,
        "updated_at": _NOW,
    }
# ── GET /api/conversations ──────────────────────────────────────────
async def test_list_conversations_正常系(client):
    ac, db = client
    db.fetch.return_value = [_conv()]
    res = await ac.get("/api/conversations")
    assert res.status_code == 200
    assert res.json()[0]["title"] == "テスト会話"
async def test_list_conversations_