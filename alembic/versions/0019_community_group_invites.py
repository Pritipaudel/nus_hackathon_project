"""community group invite links

Revision ID: 0019
Revises: 0018
Create Date: 2026-03-29 14:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0019"
down_revision: Union[str, Sequence[str], None] = "0018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_group_invites",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("community_group_id", UUID(as_uuid=True), nullable=False),
        sa.Column("invited_by_user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("token", sa.String(length=80), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["community_group_id"], ["community_groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_community_group_invites_token"),
    )
    op.create_index(
        "idx_community_group_invites_group",
        "community_group_invites",
        ["community_group_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_community_group_invites_group", table_name="community_group_invites")
    op.drop_table("community_group_invites")
