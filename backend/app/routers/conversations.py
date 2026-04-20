import json
import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from app.core.auth import get_current_user
from app.db.database import get_db

router = APIRouter()

class ConversationCrate(BaseModel):
    title: str
    is_activate: bool = True

class ConversationUpdate(BaseModel):
    title: str

class MessgaeCreate(BaseModel):
    role: str
    context: str
    audio_url: str | None = None
    audio_duration: float | None = None
    metadata: dict | None = None

DATABASE_GET_CODE="""
SELECT id, user_id, title, is_activate, created_at, updated_at
FROM conversations
WHERE user_id = $1
ORDER BY created_at DESC
"""
DATABASE_POST_CODE="""
INSERT INTO conversations (user_id, title, is_activate)
VALUES ($1, $2, $3)
RETURNING id, user_id, title, is_activate, created_at, updated_at
"""
DATABASE_UPDATE_CODE="""
UPDATE conversations
SET title = $1, updated_at = Now()
WHERE id = $2 AND user_id = $3
RETURNING id, user_id, title, is_activate, created_at, updated_at
"""
MESSAGE_GET_CODE="""
SELECT id, role, context, audio_url, audio_duration, metadata, created_at, updated_at
FROM messages
WHERE conversation_id=$1
ORDER BY created_at ASC
"""
CONVERSATION_OWNER_CODE="""
SELECT user_id FROM conversations WHERE id =$1
"""
MESSAGE_POST_CODE="""
INSERT INTO messages (conversation_id, role, context, audio_url, audio_duration, metadata)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, conversation_id, role, context, audio_url, audio_duration, metadata, created_at
"""
@router.get("/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
) -> list[dict]:
    rows = await db.fetch(DATABASE_GET_CODE, uuid.UUID(user_id))
    return [
        dict(r) for r in rows
    ]


@router.post("/conversations", status_code=201)
async def create_conversations(
    body: ConversationCrate,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
) -> dict:
    row = await db.fetchrow(DATABASE_POST_CODE, uuid.UUID(user_id), body.title, body.is_activate)
    return dict(row)

@router.patch("/conversations/{conversation_id}")
async def update_conversations(
    conversation_id: str,
    body: ConversationUpdate,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    row = await db.fetchrow(DATABASE_UPDATE_CODE, body.title, uuid.UUID(conversation_id), uuid.UUID(user_id))
    if not row:
        raise HTTPException(status_code=404, detail="会話が見つかりません。")
    return dict(row)

@router.get("/conversations/{conversation_id}/messages")
async def list_message(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
) -> list[dict]:
    owner = await db.fetchval(
        CONVERSATION_OWNER_CODE,
        uuid.UUID(conversation_id)
    )
    if not owner:
        raise HTTPException(status_code=403, detail="アクセス権無し")
    row = await db.fetch(MESSAGE_GET_CODE, uuid.UUID(conversation_id))
    return [dict(r) for r in row]

@router.post('/conversations/{conversation_id}/messages', status_code=201)
async def create_message(
    conversation_id: str,
    body: MessgaeCreate,
    user_id: str = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
) -> dict:
    if body.role not in ("user", "assistant"):
        raise HTTPException(status_code=400, detail="roleは User か Assistant のみ")
    owner = await db.fetchval(
        CONVERSATION_OWNER_CODE,
        uuid.UUID(conversation_id)
    )
    if not owner or str(owner) != user_id:
        raise HTTPException(status_code=403, detail="アクセス権はありません。")
    row = await db.fetch(
        MESSAGE_POST_CODE,
        uuid.UUID(conversation_id),
        body.role,
        body.context,
        body.audio_url,
        body.audio_duration,
        json.dumps(body.metadata or {})
    )
    return dict(row)