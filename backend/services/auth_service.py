from datetime import datetime, timedelta, timezone
import uuid

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.models.community import CommunityGroup
from backend.models.user import (
    ALLOWED_USER_ROLES,
    USER_HEALTH_WORKER_ROLE,
    User,
    UserRole,
)
from backend.repository.health_worker_repository import HealthWorkerRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

TokenRole = UserRole
ALLOWED_TOKEN_ROLES: set[str] = ALLOWED_USER_ROLES


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, role: TokenRole) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_access_token(token: str) -> tuple[str, TokenRole]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        subject: str | None = payload.get("sub")
        role = payload.get("role")
        if subject is None or role not in ALLOWED_TOKEN_ROLES:
            raise ValueError("Invalid token payload")
        return subject, role
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def authenticate_user(user: User | None, plain_password: str) -> User:
    if user is None or not verify_password(plain_password, user.hashed_password):
        raise ValueError("Invalid credentials")
    if not user.is_active:
        raise ValueError("Account is disabled")
    return user


def onboard_health_worker(
    db: Session,
    current_user: User,
    username: str,
    organization: str,
    community_id: uuid.UUID,
):
    community = (
        db.query(CommunityGroup).filter(CommunityGroup.id == community_id).first()
    )
    if community is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Community not found",
        )

    worker_repo = HealthWorkerRepository(db)
    health_worker = worker_repo.upsert_health_worker_profile(
        user_id=current_user.id,
        username=username.strip(),
        organization=organization.strip(),
        community_id=community_id,
    )

    current_user.role = USER_HEALTH_WORKER_ROLE
    current_user.is_onboarded = True
    current_user.onboarding_step = 0

    db.commit()
    db.refresh(current_user)
    db.refresh(health_worker)

    return current_user, health_worker
