"""add profile fields to health_workers

Revision ID: 0015
Revises: 0014
Create Date: 2026-03-28 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0015"
down_revision: Union[str, Sequence[str], None] = "0014a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("health_workers", sa.Column("title", sa.String(120), nullable=True))
    op.add_column("health_workers", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("health_workers", sa.Column("specialties", sa.String(500), nullable=True))
    op.add_column("health_workers", sa.Column("languages", sa.String(300), nullable=True))
    op.add_column("health_workers", sa.Column("availability", sa.String(20), nullable=True, server_default="available"))
    op.add_column("health_workers", sa.Column("sessions_count", sa.Integer(), nullable=True, server_default="0"))


def downgrade() -> None:
    op.drop_column("health_workers", "sessions_count")
    op.drop_column("health_workers", "availability")
    op.drop_column("health_workers", "languages")
    op.drop_column("health_workers", "specialties")
    op.drop_column("health_workers", "bio")
    op.drop_column("health_workers", "title")
