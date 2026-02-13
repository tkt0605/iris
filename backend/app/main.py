from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)
# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に設定してください
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy", "service": "iris-backend"}

@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {"message": "Welcome to Iris Backend API"}

@app.get("/test-openai")
def test_openai():
    # settingsから、OPENAI_API_KEYを取得
    return {"key_prefox": settings.OPENAI_API_KEY[:5]}