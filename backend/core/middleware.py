from collections.abc import Callable
from typing import Awaitable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from backend.core.database import SessionLocal
from backend.repository.user_repository import UserRepository
from backend.services.auth_service import decode_access_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request.state.user = None

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return await call_next(request)

        token = auth_header.removeprefix("Bearer ").strip()

        try:
            user_id = decode_access_token(token)
        except ValueError:
            return await call_next(request)

        db = SessionLocal()
        try:
            user = UserRepository(db).get_by_id(user_id)
            request.state.user = user
        finally:
            db.close()

        return await call_next(request)
