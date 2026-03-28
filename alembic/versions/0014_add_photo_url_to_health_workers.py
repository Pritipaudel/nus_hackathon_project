"""add photo_url to health_workers

Revision ID: 0014
Revises: 0013
Create Date: 2026-03-28 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0014"
down_revision: Union[str, Sequence[str], None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "health_workers",
        sa.Column("photo_url", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("health_workers", "photo_url")
