import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
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


class CommunityCategory(str, enum.Enum):
    ANXIETY = "ANXIETY"
    DEPRESSION = "DEPRESSION"
    TRAUMA = "TRAUMA"
    STRESS = "STRESS"
    GENERAL = "GENERAL"


class ReactionType(str, enum.Enum):
    UPVOTE = "UPVOTE"
    HELPFUL = "HELPFUL"


class MediaType(str, enum.Enum):
    PHOTO = "PHOTO"
    VIDEO = "VIDEO"


class CommunityGroupType(str, enum.Enum):
    RELIGION = "RELIGION"
    ETHNICITY_CASTE = "ETHNICITY_CASTE"
    GENDER = "GENDER"
    RACE = "RACE"
    CUSTOM = "CUSTOM"


class CommunityGroup(Base):
    __tablename__ = "community_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    group_type = Column(String(30), nullable=False)
    value = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    created_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    posts = relationship("CommunityPost", back_populates="community_group")
    memberships = relationship(
        "CommunityGroupMembership",
        back_populates="community_group",
        cascade="all, delete-orphan",
    )
    invites = relationship(
        "CommunityGroupInvite",
        back_populates="community_group",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("group_type", "value", name="uq_community_groups_type_value"),
        Index("idx_community_groups_type", "group_type"),
        Index("idx_community_groups_value", "value"),
    )


class CommunityGroupMembership(Base):
    __tablename__ = "community_group_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    community_group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    community_group = relationship("CommunityGroup", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint(
            "user_id", "community_group_id", name="uq_community_group_member"
        ),
        Index("idx_cg_memberships_user", "user_id"),
        Index("idx_cg_memberships_group", "community_group_id"),
    )


class CommunityGroupInvite(Base):
    __tablename__ = "community_group_invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    community_group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_groups.id", ondelete="CASCADE"),
        nullable=False,
    )
    invited_by_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    token = Column(String(80), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    community_group = relationship("CommunityGroup", back_populates="invites")

    __table_args__ = (Index("idx_community_group_invites_group", "community_group_id"),)


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=False)
    category = Column(
        String(50), nullable=False, default=CommunityCategory.GENERAL.value
    )
    community_group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_groups.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    media = relationship(
        "CommunityPostMedia", back_populates="post", cascade="all, delete-orphan"
    )
    reactions = relationship(
        "CommunityPostReaction", back_populates="post", cascade="all, delete-orphan"
    )
    flags = relationship(
        "CommunityPostFlag", back_populates="post", cascade="all, delete-orphan"
    )
    community_group = relationship("CommunityGroup", back_populates="posts")

    __table_args__ = (
        Index("idx_community_posts_created_at", "created_at"),
        Index("idx_community_posts_category_created_at", "category", "created_at"),
        Index("idx_community_posts_community_group_id", "community_group_id"),
    )


class CommunityPostMedia(Base):
    __tablename__ = "community_post_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_type = Column(String(20), nullable=False)
    object_key = Column(String(255), nullable=False)
    media_url = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    post = relationship("CommunityPost", back_populates="media")

    __table_args__ = (Index("idx_community_post_media_post_id", "post_id"),)


class CommunityPostReaction(Base):
    __tablename__ = "community_post_reactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reaction_type = Column(String(20), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    post = relationship("CommunityPost", back_populates="reactions")

    __table_args__ = (
        UniqueConstraint(
            "post_id", "user_id", name="uq_community_post_reactions_post_user"
        ),
        Index("idx_community_post_reactions_post_id", "post_id"),
    )


class CommunityPostFlag(Base):
    __tablename__ = "community_post_flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(
        UUID(as_uuid=True),
        ForeignKey("community_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reason = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    post = relationship("CommunityPost", back_populates="flags")

    __table_args__ = (
        UniqueConstraint(
            "post_id", "user_id", name="uq_community_post_flags_post_user"
        ),
        Index("idx_community_post_flags_post_id", "post_id"),
    )
