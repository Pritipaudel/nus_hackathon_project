"""Add role column to users

Revision ID: 0007
Revises: 6f7378a5e97d
Create Date: 2026-03-28

"""
from alembic import op
import sqlalchemy as sa

revision = "0007a"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE userrole AS ENUM ('USER_PATIENT', 'USER_HEALTH_WORKER')")
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.Enum("USER_PATIENT", "USER_HEALTH_WORKER", name="userrole"),
            nullable=False,
            server_default="USER_PATIENT",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
    op.execute("DROP TYPE userrole")
