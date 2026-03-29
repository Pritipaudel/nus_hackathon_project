"""add community problems

Revision ID: 0016
Revises: 0015
Create Date: 2026-03-29 11:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0016"
down_revision: Union[str, Sequence[str], None] = "0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(op.f("ix_anonymous_problems_category"), "anonymous_problems", ["category"], unique=False)

    op.create_table(
        "problem_upvotes",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("problem_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["problem_id"], ["anonymous_problems.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("problem_id", "user_id", name="uq_problem_user_upvote")
    )
    op.create_index(op.f("ix_problem_upvotes_problem_id"), "problem_upvotes", ["problem_id"], unique=False)
    op.create_index(op.f("ix_problem_upvotes_user_id"), "problem_upvotes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_problem_upvotes_user_id"), table_name="problem_upvotes")
    op.drop_index(op.f("ix_problem_upvotes_problem_id"), table_name="problem_upvotes")
    op.drop_table("problem_upvotes")
    op.drop_index(op.f("ix_anonymous_problems_category"), table_name="anonymous_problems")
    op.drop_table("anonymous_problems")
