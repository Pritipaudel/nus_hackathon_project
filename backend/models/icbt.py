import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from backend.core.database import Base

class ICBTProgram(Base):
    __tablename__ = "icbt_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty_level = Column(String(50), nullable=True)
    duration_days = Column(Integer, nullable=True)
    url = Column(String(500), nullable=True)

class ICBTEnrollment(Base):
    __tablename__ = "icbt_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    program_id = Column(UUID(as_uuid=True), ForeignKey("icbt_programs.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="ACTIVE")
    progress_percent = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class ICBTModuleProgress(Base):
    __tablename__ = "icbt_module_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    module_id = Column(String(255), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="completed")
    completed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
