"""direct_messages for worker-patient chat

Revision ID: 0017
Revises: 0016
Create Date: 2026-03-29 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0017"
down_revision: Union[str, Sequence[str], None] = "0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "direct_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("sender_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recipient_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "idx_direct_messages_sender_created",
        "direct_messages",
        ["sender_id", "created_at"],
    )
    op.create_index(
        "idx_direct_messages_recipient_created",
        "direct_messages",
        ["recipient_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_direct_messages_recipient_created", table_name="direct_messages")
    op.drop_index("idx_direct_messages_sender_created", table_name="direct_messages")
    op.drop_table("direct_messages")
