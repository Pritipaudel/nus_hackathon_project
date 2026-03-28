"""merge all

Revision ID: f3bb2f361069
Revises: 0007a, 0008
Create Date: 2026-03-28 21:53:56.649238

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3bb2f361069'
down_revision: Union[str, Sequence[str], None] = ('0007a', '0008')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
