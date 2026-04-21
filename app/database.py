from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=30,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args={"ssl": False},  # No SSL for internal Docker network
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a database session."""
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables and add missing columns for schema updates."""
    from app.models.base import Base
    # Step 1: create all tables (clean transaction)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Step 2: add missing columns in separate transactions
    # (each ALTER in its own transaction so a failure doesn't poison others)
    await _add_missing_columns()


async def _add_missing_columns():
    """Safely add columns that may not exist on older databases.

    Each migration runs in its own transaction because PostgreSQL aborts
    the entire transaction when a statement fails (e.g. column already exists).
    """
    migrations = [
        ("badge_definitions", "icon_emoji", "VARCHAR(8)"),
        ("badge_definitions", "category", "VARCHAR(32)"),
        ("badge_definitions", "tier", "INTEGER DEFAULT 1"),
        ("upload_transactions", "gps_points", "INTEGER DEFAULT 0"),
    ]
    for table, column, col_type in migrations:
        try:
            async with engine.begin() as conn:
                await conn.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                )
        except Exception:
            pass  # Column already exists


