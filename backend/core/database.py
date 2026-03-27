import os

from fastapi import Request
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from app.core.config import (
        POSTGRES_DB,
        POSTGRES_HOST,
        POSTGRES_PASSWORD,
        POSTGRES_PORT,
        POSTGRES_USER,
    )
except ImportError:
    POSTGRES_DB = os.getenv("POSTGRES_DB", "appdb")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "55432")
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")

try:
    from app.services.pgqueuer.service import PGQueuerService
except ImportError:

    class PGQueuerService:
        def __init__(self, queries):
            self.queries = queries


DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"  # from env file
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

Base = declarative_base()
engine = create_engine(DATABASE_URL, pool_size=500, max_overflow=400, pool_timeout=60)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

# Async engine and session
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=500,
    max_overflow=400,
    pool_timeout=60,
    echo=False,
)
AsyncSessionLocal = sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)


def create_tables():
    Base.metadata.create_all(bind=engine)


async def get_pgq_queries(request: Request) -> PGQueuerService:
    return PGQueuerService(request.app.extra["pgq_queries"])


def get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


async def get_async_db():
    """Async database session dependency"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


if __name__ == "__main__":
    print("Running database.py smoke test...")
    print(f"Using DATABASE_URL: {DATABASE_URL}")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connectivity test passed.")
    except Exception as exc:
        print(f"Database connectivity test failed: {exc}")
        raise SystemExit(1)
