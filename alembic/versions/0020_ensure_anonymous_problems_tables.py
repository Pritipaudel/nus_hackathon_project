"""Ensure anonymous_problems + problem_upvotes exist (repair missing 0016).

Revision ID: 0020
Revises: 0019
Create Date: 2026-03-29

Some environments were stamped past 0016 without the tables being created.
This migration is idempotent: it no-ops when tables already exist.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0020"
down_revision: Union[str, Sequence[str], None] = "0019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    if "anonymous_problems" in insp.get_table_names():
        return

    op.create_table(
        "anonymous_problems",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False, server_default="General"),
        sa.Column("severity_level", sa.Integer(), nullable=True, server_default="1"),
        sa.Column("community_group_id", UUID(as_uuid=True), nullable=True),
        sa.Column("upvote_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["community_group_id"], ["community_groups.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_anonymous_problems_category"),
        "anonymous_problems",
        ["category"],
        unique=False,
    )

    op.create_table(
        "problem_upvotes",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("problem_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["problem_id"], ["anonymous_problems.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("problem_id", "user_id", name="uq_problem_user_upvote"),
    )
    op.create_index(
        op.f("ix_problem_upvotes_problem_id"),
        "problem_upvotes",
        ["problem_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_problem_upvotes_user_id"),
        "problem_upvotes",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    # Tables may pre-exist from 0016; do not drop to avoid data loss.
    pass
