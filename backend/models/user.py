import uuid
from datetime import datetime, timezone
from typing import Literal

import sqlalchemy as sa
from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from backend.core.database import Base

UserRole = Literal["USER-PATIENT", "USER-HEALTH-WORKER"]
USER_PATIENT_ROLE: UserRole = "USER-PATIENT"
USER_HEALTH_WORKER_ROLE: UserRole = "USER-HEALTH-WORKER"
DEFAULT_USER_ROLE: UserRole = USER_PATIENT_ROLE
ALLOWED_USER_ROLES: set[str] = {USER_PATIENT_ROLE, USER_HEALTH_WORKER_ROLE}


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    anonymous_username = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(32), default=DEFAULT_USER_ROLE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_onboarded = Column(Boolean, default=True, nullable=False)
    onboarding_step = Column(sa.Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
