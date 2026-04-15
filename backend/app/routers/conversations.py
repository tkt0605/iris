import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from app.core.auth import get_current_user
from app.db.database import get_db

router = APIRouter()


# ---- スキーマ ----

class ConversationCreate(BaseModel):
    title: str
    is_activate: bool = True


class ConversationUpdate(BaseModel):
    title: str


class MessageCreate(BaseModel):
    role: str  # "user" | "assistant"
    context: str
    audio_url: str | None = None
    audio_duration: float | None = None
    metadata: dict | None = None


# ---- エンドポイント ----

@router.get("/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
) -> list[dict]:
    """ログインユーザーの会話一覧を返す（新しい順）"""
    rows = await db.fetch(
        """
        SELECT id, user_id, title, is_activate, created_at, updated_at
        FROM conversations
        WHERE user_id = $1
        ORDER BY created_at DESC
        """,
        uuid.UUID(user_id),
    )
    return [dict(r) for r in rows]


@router.post("/conversations", status_code=201)
async def create_conversation(
    body: ConversationCreate,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    """新しい会話を作成する"""
    row = await db.fetchrow(
        """
        INSERT INTO conversations (user_id, title, is_activate)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, title, is_activate, created_at, updated_at
        """,
        uuid.UUID(user_id),
        body.title,
        body.is_activate,
    )
    return dict(row)


@router.patch("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    """会話タイトルを更新する（本人のみ）"""
    row = await db.fetchrow(
        """
        UPDATE conversations
        SET title = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id, user_id, title, is_activate, created_at, updated_at
        """,
        body.title,
        uuid.UUID(conversation_id),
        uuid.UUID(user_id),
    )
    if not row:
        raise HTTPException(status_code=404, detail="会話が見つかりません")
    return dict(row)


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
) -> list[dict]:
    """指定会話のメッセージ一覧を返す（本人のみ）"""
    # 所有確認
    owner = await db.fetchval(
        "SELECT user_id FROM conversations WHERE id = $1",
        uuid.UUID(conversation_id),
    )
    if not owner or str(owner) != user_id:
        raise HTTPException(status_code=403, detail="アクセス権がありません")

    rows = await db.fetch(
        """
        SELECT id, conversation_id, role, context, audio_url, audio_duration, metadata, created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
        """,
        uuid.UUID(conversation_id),
    )
    return [dict(r) for r in rows]


@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def create_message(
    conversation_id: str,
    body: MessageCreate,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    """メッセージを追加する（本人のみ）"""
    if body.role not in ("user", "assistant"):
        raise HTTPException(status_code=400, detail="role は user か assistant のみ")

    # 所有確認
    owner = await db.fetchval(
        "SELECT user_id FROM conversations WHERE id = $1",
        uuid.UUID(conversation_id),
    )
    if not owner or str(owner) != user_id:
        raise HTTPException(status_code=403, detail="アクセス権がありません")

    import json
    row = await db.fetchrow(
        """
        INSERT INTO messages (conversation_id, role, context, audio_url, audio_duration, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, conversation_id, role, context, audio_url, audio_duration, metadata, created_at
        """,
        uuid.UUID(conversation_id),
        body.role,
        body.context,
        body.audio_url,
        body.audio_duration,
        json.dumps(body.metadata or {}),
    )
    return dict(row)
