import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.core.database import Base


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class HealthWorker(Base):
    __tablename__ = "health_workers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(120), nullable=False)
    organization = Column(String(200), nullable=False)
    community_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_groups.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    community_group = relationship("CommunityGroup")

    __table_args__ = (
        Index("idx_health_workers_community_id", "community_id"),
        Index("idx_health_workers_verified", "is_verified"),
    )


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    health_worker_id = Column(
        UUID(as_uuid=True),
        ForeignKey("health_workers.id", ondelete="CASCADE"),
        nullable=False,
    )
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    meeting_link = Column(Text, nullable=False)
    status = Column(String(20), default=MeetingStatus.SCHEDULED.value, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_meetings_user_scheduled", "user_id", "scheduled_at"),
        Index("idx_meetings_worker_scheduled", "health_worker_id", "scheduled_at"),
    )


class TrainingProgram(Base):
    __tablename__ = "training_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    organization = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class TrainingEnrollment(Base):
    __tablename__ = "training_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    program_id = Column(
        UUID(as_uuid=True),
        ForeignKey("training_programs.id", ondelete="CASCADE"),
        nullable=False,
    )
    enrolled_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "program_id", name="uq_training_enrollment"),
        Index("idx_training_enrollments_user", "user_id"),
        Index("idx_training_enrollments_program", "program_id"),
    )


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    organization = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (UniqueConstraint("title", "organization", name="uq_cert_org"),)

    user_certifications = relationship(
        "UserCertification",
        back_populates="certification",
        cascade="all, delete-orphan",
    )


class UserCertification(Base):
    __tablename__ = "user_certifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    certification_id = Column(
        UUID(as_uuid=True),
        ForeignKey("certifications.id", ondelete="CASCADE"),
        nullable=False,
    )
    issued_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    verified = Column(Boolean, default=True, nullable=False)

    certification = relationship("Certification", back_populates="user_certifications")

    __table_args__ = (
        UniqueConstraint("user_id", "certification_id", name="uq_user_certification"),
        Index("idx_user_certifications_user", "user_id"),
        Index("idx_user_certifications_cert", "certification_id"),
    )
