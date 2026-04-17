import asyncpg
from typing import AsyncGenerator
from app.core.config import settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    _pool = await asyncpg.create_pool(settings.DATABASE_URL)

async def close_pool() -> None:
    if _pool:
        await _pool.close()

async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    async with _pool.acquire() as conn:
        yield conn