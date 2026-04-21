from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth import decode_token, get_user_by_api_token


async def _resolve_token(db: AsyncSession, token: str) -> User | None:
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user

    user = await get_user_by_api_token(db, token)
    if user and user.is_active:
        return user
    return None


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Extract user from JWT or API token. Returns None if not authenticated."""
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        user = await _resolve_token(db, auth_header[7:])
        if user is not None:
            return user

    # Check cookie
    access_token = request.cookies.get("access_token")
    if access_token:
        user = await _resolve_token(db, access_token)
        if user is not None:
            return user

    # Fallback: token in query string. Needed for EventSource / <img> / download
    # links that can't attach headers. Only honoured over HTTPS in production.
    query_token = request.query_params.get("token")
    if query_token:
        user = await _resolve_token(db, query_token)
        if user is not None:
            return user

    return None


async def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    """Require authenticated user. Raises 401 if not authenticated."""
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
