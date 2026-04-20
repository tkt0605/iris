import asyncio
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.core.config import settings

router = APIRouter()

genai.configure(api_key=settings.GEMINI_API_KEY)

_SYSTEM_INSTRUCTION=f"""
あなたは「IRIS」という名前のAIアシスタントです。
このアプリケーションは{settings.PRODUCER}によって開発された音声対話システムです。

#### 入力について
ユーザーの発言は音声認識（Whisper）によって文字起こしされています。
誤変換や言い間違いが含まれる可能性があるため、文脈から意図を適切に補完してください。

#### 返答のルール
    - 常に日本語で返答してください
    - 会話の流れと過去のやり取りを踏まえて返答してください
    - マークダウン記法（**太字**、- リストなど）は使わず、自然な文章で返答してください
    - 返答は簡潔にまとめ、長くなる場合は要点を優先してください
    - フレンドリーかつ丁寧なトーンを維持してください

#### できないこと
    - リアルタイムの情報（天気・ニュースなど）の取得
    - 外部サービスへのアクセス
"""

class Message(BaseModel):
    role: str
    context: str

class LLMRequest(BaseModel):
    userText: str
    conversationHistory: list[Message]

class LLMResponse(BaseModel):
    reply: str
    title: str

@router.post("/llm", response_model=LLMResponse)
async def call_llm(
    body: LLMRequest,
    _: str=Depends(get_current_user),
) -> LLMResponse:
    if not body.userText:
        raise HTTPException(status_code=400, detail="userTextが必要です。")
    
    history=[
        {
            "role": "model" if m.role == "assistant" else "user",
            "parts": [
                {
                    "text": m.context,
                }
            ]
        }
        for m in body.conversationHistory
    ]
    reply_model=genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=_SYSTEM_INSTRUCTION
    )
    title_model = genai.GenerativeModel("gemini-2.5-flash")

    try:
        reply_result, title_result = await asyncio.gather(
            asyncio.to_thread(
                reply_model.generate_content,
                history + [
                    {
                        "role": "user",
                        "parts":[{"text": body.userText}]
                    }
                ],
                generation_config = genai.GenerationConfig(max_output_tokens=512),
            ),
            asyncio.to_thread(
                title_model.generate_content,
                f"以下のテキストを10文字から15字以内で要約してください。\nテキスト：{body.userText}",
                generation_config = genai.GenerationConfig(max_output_tokens=30)
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {e}")
    
    return LLMResponse(reply=reply_result.text, title=title_result.text)