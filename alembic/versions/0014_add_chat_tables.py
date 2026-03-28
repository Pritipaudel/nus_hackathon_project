"""add chat sessions and messages tables

Revision ID: 0014
Revises: 0013
Create Date: 2026-03-29 00:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0014"
down_revision: Union[str, Sequence[str], None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("health_worker_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["health_worker_id"], ["health_workers.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_chat_sessions_patient_created",
        "chat_sessions",
        ["patient_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "idx_chat_sessions_worker_created",
        "chat_sessions",
        ["health_worker_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "idx_chat_sessions_status",
        "chat_sessions",
        ["status"],
        unique=False,
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("chat_session_id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("sender_role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["chat_session_id"], ["chat_sessions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_chat_messages_session_created",
        "chat_messages",
        ["chat_session_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_chat_messages_session_created", table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_index("idx_chat_sessions_status", table_name="chat_sessions")
    op.drop_index("idx_chat_sessions_worker_created", table_name="chat_sessions")
    op.drop_index("idx_chat_sessions_patient_created", table_name="chat_sessions")
    op.drop_table("chat_sessions")
