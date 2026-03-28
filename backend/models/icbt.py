import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.core.database import Base


class ICBTProgram(Base):
    __tablename__ = "icbt_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty_level = Column(String(50), nullable=True)
    duration_days = Column(Integer, nullable=True)
    url = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    communities = relationship(
        "ICBTProgramCommunity",
        back_populates="program",
        cascade="all, delete-orphan",
    )
    user_progress = relationship(
        "UserICBTProgramProgress",
        back_populates="program",
        cascade="all, delete-orphan",
    )


class ICBTProgramCommunity(Base):
    __tablename__ = "icbt_program_communities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id = Column(
        UUID(as_uuid=True),
        ForeignKey("icbt_programs.id", ondelete="CASCADE"),
        nullable=False,
    )
    community_group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    program = relationship("ICBTProgram", back_populates="communities")
    community_group = relationship("CommunityGroup")

    __table_args__ = (
        UniqueConstraint(
            "program_id",
            "community_group_id",
            name="uq_icbt_program_community",
        ),
        Index(
            "idx_icbt_program_communities_program",
            "program_id",
        ),
        Index(
            "idx_icbt_program_communities_community",
            "community_group_id",
        ),
    )


class ICBTProgramStatus:
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class UserICBTProgramProgress(Base):
    __tablename__ = "user_icbt_program_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    program_id = Column(
        UUID(as_uuid=True),
        ForeignKey("icbt_programs.id", ondelete="CASCADE"),
        nullable=False,
    )
    community_group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_groups.id", ondelete="SET NULL"),
        nullable=True,
    )
    progress_percent = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default=ICBTProgramStatus.ACTIVE, nullable=False)
    started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    last_activity_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    program = relationship("ICBTProgram", back_populates="user_progress")
    community_group = relationship("CommunityGroup")

    __table_args__ = (
        UniqueConstraint("user_id", "program_id", name="uq_user_icbt_program"),
        CheckConstraint(
            "progress_percent >= 0 AND progress_percent <= 100",
            name="ck_user_icbt_progress_percent",
        ),
        Index("idx_user_icbt_progress_user", "user_id"),
        Index("idx_user_icbt_progress_program", "program_id"),
        Index("idx_user_icbt_progress_community", "community_group_id"),
    )

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
