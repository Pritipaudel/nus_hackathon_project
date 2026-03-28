"""add anonymous_username to users and backfill existing rows

Revision ID: 0013
Revises: 0012
Create Date: 2026-03-28 23:55:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0013"
down_revision: Union[str, Sequence[str], None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("anonymous_username", sa.String(), nullable=True))
    op.execute(
        "UPDATE users SET anonymous_username = email WHERE anonymous_username IS NULL"
    )
    op.alter_column(
        "users", "anonymous_username", existing_type=sa.String(), nullable=False
    )


def downgrade() -> None:
    op.drop_column("users", "anonymous_username")
