"""add icbt community mapping and user progress

Revision ID: 0012
Revises: 0011
Create Date: 2026-03-28 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0012"
down_revision: Union[str, Sequence[str], None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "icbt_programs",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_table(
        "icbt_program_communities",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("program_id", sa.UUID(), nullable=False),
        sa.Column("community_group_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["community_group_id"], ["community_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["program_id"], ["icbt_programs.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "program_id", "community_group_id", name="uq_icbt_program_community"
        ),
    )
    op.create_index(
        "idx_icbt_program_communities_program",
        "icbt_program_communities",
        ["program_id"],
        unique=False,
    )
    op.create_index(
        "idx_icbt_program_communities_community",
        "icbt_program_communities",
        ["community_group_id"],
        unique=False,
    )

    op.create_table(
        "user_icbt_program_progress",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("program_id", sa.UUID(), nullable=False),
        sa.Column("community_group_id", sa.UUID(), nullable=True),
        sa.Column(
            "progress_percent",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'ACTIVE'"),
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "last_activity_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "progress_percent >= 0 AND progress_percent <= 100",
            name="ck_user_icbt_progress_percent",
        ),
        sa.ForeignKeyConstraint(
            ["community_group_id"], ["community_groups.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["program_id"], ["icbt_programs.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "program_id", name="uq_user_icbt_program"),
    )
    op.create_index(
        "idx_user_icbt_progress_user",
        "user_icbt_program_progress",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "idx_user_icbt_progress_program",
        "user_icbt_program_progress",
        ["program_id"],
        unique=False,
    )
    op.create_index(
        "idx_user_icbt_progress_community",
        "user_icbt_program_progress",
        ["community_group_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_user_icbt_progress_community", table_name="user_icbt_program_progress"
    )
    op.drop_index(
        "idx_user_icbt_progress_program", table_name="user_icbt_program_progress"
    )
    op.drop_index(
        "idx_user_icbt_progress_user", table_name="user_icbt_program_progress"
    )
    op.drop_table("user_icbt_program_progress")

    op.drop_index(
        "idx_icbt_program_communities_community", table_name="icbt_program_communities"
    )
    op.drop_index(
        "idx_icbt_program_communities_program", table_name="icbt_program_communities"
    )
    op.drop_table("icbt_program_communities")

    op.drop_column("icbt_programs", "created_at")
