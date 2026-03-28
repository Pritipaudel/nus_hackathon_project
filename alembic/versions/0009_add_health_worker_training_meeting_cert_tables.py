"""add health worker, meeting, training, and certification tables

Revision ID: 0009
Revises: 0008
Create Date: 2026-03-28 19:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0009"
down_revision: Union[str, Sequence[str], None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "health_workers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("username", sa.String(length=120), nullable=False),
        sa.Column("organization", sa.String(length=200), nullable=False),
        sa.Column("community", sa.String(length=120), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_health_workers_community", "health_workers", ["community"], unique=False
    )
    op.create_index(
        "idx_health_workers_verified", "health_workers", ["is_verified"], unique=False
    )

    op.create_table(
        "meetings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("health_worker_id", sa.UUID(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("meeting_link", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["health_worker_id"], ["health_workers.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_meetings_user_scheduled",
        "meetings",
        ["user_id", "scheduled_at"],
        unique=False,
    )
    op.create_index(
        "idx_meetings_worker_scheduled",
        "meetings",
        ["health_worker_id", "scheduled_at"],
        unique=False,
    )

    op.create_table(
        "training_programs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("organization", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "training_enrollments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("program_id", sa.UUID(), nullable=False),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["program_id"], ["training_programs.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "program_id", name="uq_training_enrollment"),
    )
    op.create_index(
        "idx_training_enrollments_user",
        "training_enrollments",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "idx_training_enrollments_program",
        "training_enrollments",
        ["program_id"],
        unique=False,
    )

    op.create_table(
        "certifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("organization", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("title", "organization", name="uq_cert_org"),
    )

    op.create_table(
        "user_certifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("certification_id", sa.UUID(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["certification_id"], ["certifications.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "certification_id", name="uq_user_certification"
        ),
    )
    op.create_index(
        "idx_user_certifications_user", "user_certifications", ["user_id"], unique=False
    )
    op.create_index(
        "idx_user_certifications_cert",
        "user_certifications",
        ["certification_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_user_certifications_cert", table_name="user_certifications")
    op.drop_index("idx_user_certifications_user", table_name="user_certifications")
    op.drop_table("user_certifications")

    op.drop_table("certifications")

    op.drop_index("idx_training_enrollments_program", table_name="training_enrollments")
    op.drop_index("idx_training_enrollments_user", table_name="training_enrollments")
    op.drop_table("training_enrollments")

    op.drop_table("training_programs")

    op.drop_index("idx_meetings_worker_scheduled", table_name="meetings")
    op.drop_index("idx_meetings_user_scheduled", table_name="meetings")
    op.drop_table("meetings")

    op.drop_index("idx_health_workers_verified", table_name="health_workers")
    op.drop_index("idx_health_workers_community", table_name="health_workers")
    op.drop_table("health_workers")
