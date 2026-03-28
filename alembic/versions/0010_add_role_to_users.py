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
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    user_columns = {column["name"] for column in inspector.get_columns("users")}

    if "role" not in user_columns:
        op.add_column(
            "users",
            sa.Column(
                "role",
                sa.String(length=32),
                nullable=True,
                server_default="USER-PATIENT",
            ),
        )
    else:
        # Older revisions created `role` as a PostgreSQL enum. Cast to string so
        # we can normalize values to the current hyphenated format.
        op.execute(
            "ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(32) USING role::text"
        )

    op.execute(
        "UPDATE users "
        "SET role = CASE "
        "WHEN role = 'USER_PATIENT' THEN 'USER-PATIENT' "
        "WHEN role = 'USER_HEALTH_WORKER' THEN 'USER-HEALTH-WORKER' "
        "ELSE role END"
    )
    op.execute("UPDATE users SET role = 'USER-PATIENT' WHERE role IS NULL")
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=32),
        nullable=False,
        server_default="USER-PATIENT",
    )
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role_allowed")
    op.create_check_constraint(
        "ck_users_role_allowed",
        "users",
        "role IN ('USER-PATIENT', 'USER-HEALTH-WORKER')",
    )

    # If the enum type from older revisions exists and is no longer referenced,
    # dropping it keeps the schema tidy.
    op.execute("DROP TYPE IF EXISTS userrole")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role_allowed")

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" in user_columns:
        op.drop_column("users", "role")
