import uuid
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from models.supabase_client import get_supabase_client
from core.config import settings
import os
import logging
import uuid

logger = logging.getLogger(__name__)
load_dotenv()
router = APIRouter()
supabase = get_supabase_client()
app = FastAPI(title=os.getenv('PROJECT_NAME'))
# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 本番環境では適切に設定してください
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NoteRequest(BaseModel):
    context: str
    user_id: uuid.UUID
    # role: str
@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy", "service": "iris-backend"}

@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {"message": "Welcome to Iris Backend API"}

@app.post('/save_note')
async def save_note(request: NoteRequest):
    try:
        generated_title = request.context[:15] + "..." if len(request.context) > 15 else request.context
        conv_response = supabase.table("conversations").insert({
            "id": request.id,
            "title": generated_title,
            "is_activate": True,
            "user_id": str(request.user_id),
        }).execute()
        if not conv_response.data:
            raise HTTPException(status_code=400, detail="Conversation not saved")
        new_conversation_id = conv_response.data[0]["id"]
        message_response = supabase.table('messages').insert({
            "conversation_id": new_conversation_id,
            "context": request.context
        }).execute()
        if not message_response.data:
            raise HTTPException(status_code=400, detail="Message not saved")
        return {
            "state": "success",
            "conversation_id": new_conversation_id,
            "title": generated_title,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    #1. 最初のコンテキストの15文字を抽出してタイトル生成
    
    #2. データベースに保存

