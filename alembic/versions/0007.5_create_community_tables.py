"""create community tables

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-28 16:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0007.5"
down_revision: Union[str, Sequence[str], None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_posts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_community_posts_created_at",
        "community_posts",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "idx_community_posts_category_created_at",
        "community_posts",
        ["category", "created_at"],
        unique=False,
    )

    op.create_table(
        "community_post_media",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("media_type", sa.String(length=20), nullable=False),
        sa.Column("object_key", sa.String(length=255), nullable=False),
        sa.Column("media_url", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["post_id"], ["community_posts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_community_post_media_post_id",
        "community_post_media",
        ["post_id"],
        unique=False,
    )

    op.create_table(
        "community_post_reactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("reaction_type", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["post_id"], ["community_posts.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "post_id", "user_id", name="uq_community_post_reactions_post_user"
        ),
    )
    op.create_index(
        "idx_community_post_reactions_post_id",
        "community_post_reactions",
        ["post_id"],
        unique=False,
    )

    op.create_table(
        "community_post_flags",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["post_id"], ["community_posts.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "post_id", "user_id", name="uq_community_post_flags_post_user"
        ),
    )
    op.create_index(
        "idx_community_post_flags_post_id",
        "community_post_flags",
        ["post_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_community_post_flags_post_id", table_name="community_post_flags")
    op.drop_table("community_post_flags")

    op.drop_index(
        "idx_community_post_reactions_post_id", table_name="community_post_reactions"
    )
    op.drop_table("community_post_reactions")

    op.drop_index("idx_community_post_media_post_id", table_name="community_post_media")
    op.drop_table("community_post_media")

    op.drop_index(
        "idx_community_posts_category_created_at", table_name="community_posts"
    )
    op.drop_index("idx_community_posts_created_at", table_name="community_posts")
    op.drop_table("community_posts")
