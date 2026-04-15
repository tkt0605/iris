from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_pool, close_pool
from app.routers import llm, conversations


@asynccontextmanager
async def lifespan(app: FastAPI):
    """起動時にDBプールを初期化、終了時にクローズ"""
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="IRIS Backend", lifespan=lifespan)

# フロントエンド（localhost:3000）からのCORSを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
