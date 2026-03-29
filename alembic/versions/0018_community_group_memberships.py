"""community group memberships for join / my groups

Revision ID: 0018
Revises: 0017
Create Date: 2026-03-29 12:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0018"
down_revision: Union[str, Sequence[str], None] = "0017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_group_memberships",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("community_group_id", UUID(as_uuid=True), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["community_group_id"], ["community_groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "community_group_id", name="uq_community_group_member"),
    )
    op.create_index(
        "idx_cg_memberships_user",
        "community_group_memberships",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "idx_cg_memberships_group",
        "community_group_memberships",
        ["community_group_id"],
        unique=False,
    )
    op.execute(
        text(
            """
            INSERT INTO community_group_memberships (id, user_id, community_group_id, joined_at)
            SELECT gen_random_uuid(), created_by_user_id, id, created_at
            FROM community_groups
            WHERE created_by_user_id IS NOT NULL
            """
        )
    )


def downgrade() -> None:
    op.drop_index("idx_cg_memberships_group", table_name="community_group_memberships")
    op.drop_index("idx_cg_memberships_user", table_name="community_group_memberships")
    op.drop_table("community_group_memberships")
