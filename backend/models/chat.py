import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.core.database import Base


class ChatSessionStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class ChatSenderRole(str, enum.Enum):
    PATIENT = "PATIENT"
    HEALTH_WORKER = "HEALTH_WORKER"


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    health_worker_id = Column(
        UUID(as_uuid=True),
        ForeignKey("health_workers.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(String(20), default=ChatSessionStatus.OPEN.value, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    patient = relationship("User", foreign_keys=[patient_id])
    health_worker = relationship("HealthWorker", foreign_keys=[health_worker_id])
    messages = relationship(
        "ChatMessage",
        back_populates="chat_session",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_chat_sessions_patient_created", "patient_id", "created_at"),
        Index("idx_chat_sessions_worker_created", "health_worker_id", "created_at"),
        Index("idx_chat_sessions_status", "status"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    chat_session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index("idx_chat_messages_session_created", "chat_session_id", "created_at"),
    )
