import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from backend.core.database import Base

class AnonymousProblem(Base):
    __tablename__ = "anonymous_problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="General", index=True)
    severity_level = Column(Integer, default=1, nullable=True)
    community_group_id = Column(UUID(as_uuid=True), ForeignKey("community_groups.id", ondelete="SET NULL"), nullable=True)
    upvote_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ProblemUpvote(Base):
    __tablename__ = "problem_upvotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_problems.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("problem_id", "user_id", name="uq_problem_user_upvote"),
    )
