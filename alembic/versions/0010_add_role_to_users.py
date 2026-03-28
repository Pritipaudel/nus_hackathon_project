"""add role to users and backfill existing rows

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-28 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0010"
down_revision: Union[str, Sequence[str], None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=32),
            nullable=True,
            server_default="USER-PATIENT",
        ),
    )
    op.execute("UPDATE users SET role = 'USER-PATIENT' WHERE role IS NULL")
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=32),
        nullable=False,
        server_default="USER-PATIENT",
    )
    op.create_check_constraint(
        "ck_users_role_allowed",
        "users",
        "role IN ('USER-PATIENT', 'USER-HEALTH-WORKER')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_role_allowed", "users", type_="check")
    op.drop_column("users", "role")
