"""convert health_workers community to community_group foreign key

Revision ID: 0011
Revises: 0010
Create Date: 2026-03-28 23:40:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0011"
down_revision: Union[str, Sequence[str], None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("health_workers", sa.Column("community_id", sa.UUID(), nullable=True))

    # Best-effort backfill by matching legacy community text to a group value.
    op.execute(
        """
        UPDATE health_workers AS hw
        SET community_id = matched.id
        FROM (
            SELECT hw_inner.id AS worker_id, (
                SELECT cg.id
                FROM community_groups AS cg
                WHERE lower(cg.value) = lower(hw_inner.community)
                ORDER BY cg.created_at ASC
                LIMIT 1
            ) AS id
            FROM health_workers AS hw_inner
            WHERE hw_inner.community IS NOT NULL
        ) AS matched
        WHERE hw.id = matched.worker_id AND matched.id IS NOT NULL
        """
    )

    op.create_foreign_key(
        "fk_health_workers_community_id",
        "health_workers",
        "community_groups",
        ["community_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_health_workers_community_id",
        "health_workers",
        ["community_id"],
        unique=False,
    )

    op.drop_index("idx_health_workers_community", table_name="health_workers")
    op.drop_column("health_workers", "community")


def downgrade() -> None:
    op.add_column(
        "health_workers", sa.Column("community", sa.String(length=120), nullable=True)
    )

    op.execute(
        """
        UPDATE health_workers AS hw
        SET community = cg.value
        FROM community_groups AS cg
        WHERE hw.community_id = cg.id
        """
    )

    op.drop_index("idx_health_workers_community_id", table_name="health_workers")
    op.drop_constraint(
        "fk_health_workers_community_id", "health_workers", type_="foreignkey"
    )
    op.drop_column("health_workers", "community_id")

    op.create_index(
        "idx_health_workers_community", "health_workers", ["community"], unique=False
    )
