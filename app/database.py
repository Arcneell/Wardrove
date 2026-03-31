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


# --- XP System (migrated from old database.py) ---

XP_PER_IMPORT = 1
XP_PER_UPDATE = 0
XP_PER_SESSION = 5
MAX_LEVEL = 100

RANK_TITLES = {
    1: "Script Kiddie",
    3: "Packet Sniffer",
    5: "Signal Hunter",
    8: "Spectrum Crawler",
    12: "RF Scout",
    16: "Wave Rider",
    22: "Airspace Mapper",
    30: "Ether Walker",
    40: "Frequency Ghost",
    55: "Wardriving Legend",
    70: "Phantom Scanner",
    85: "Radio God",
    100: "Omniscient Eye",
}


def xp_for_level(level: int) -> int:
    if level <= 1:
        return 0
    lvl = min(level, MAX_LEVEL)
    return lvl * (lvl - 1) * (lvl + 20) * 5


def level_from_xp(xp: int) -> int:
    level = 1
    while level < MAX_LEVEL and xp_for_level(level + 1) <= xp:
        level += 1
    return level


def rank_title(level: int) -> str:
    title = "Script Kiddie"
    for threshold, name in sorted(RANK_TITLES.items()):
        if level >= threshold:
            title = name
    return title
