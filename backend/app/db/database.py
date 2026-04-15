import asyncpg
from typing import AsyncGenerator
from app.core.config import settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    """アプリ起動時にコネクションプールを初期化する"""
    global _pool
    _pool = await asyncpg.create_pool(settings.DATABASE_URL)


async def close_pool() -> None:
    """アプリ終了時にプールをクローズする"""
    if _pool:
        await _pool.close()


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """DBコネクションをDI経由で提供する"""
    async with _pool.acquire() as conn:
        yield conn
