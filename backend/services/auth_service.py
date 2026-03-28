from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.core.config import settings
from backend.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        subject: str | None = payload.get("sub")
        if subject is None:
            raise ValueError("Invalid token payload")
        return subject
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def authenticate_user(user: User | None, plain_password: str) -> User:
    if user is None or not verify_password(plain_password, user.hashed_password):
        raise ValueError("Invalid credentials")
    if not user.is_active:
        raise ValueError("Account is disabled")
    return user
