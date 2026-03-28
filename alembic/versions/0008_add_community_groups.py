"""add community groups and post group tag

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-28 18:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0008"
down_revision: Union[str, Sequence[str], None] = "0007.5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "community_groups",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("group_type", sa.String(length=30), nullable=False),
        sa.Column("value", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "group_type", "value", name="uq_community_groups_type_value"
        ),
    )
    op.create_index(
        "idx_community_groups_type", "community_groups", ["group_type"], unique=False
    )
    op.create_index(
        "idx_community_groups_value", "community_groups", ["value"], unique=False
    )

    op.add_column(
        "community_posts", sa.Column("community_group_id", sa.UUID(), nullable=True)
    )
    op.create_foreign_key(
        "fk_community_posts_community_group_id",
        "community_posts",
        "community_groups",
        ["community_group_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_community_posts_community_group_id",
        "community_posts",
        ["community_group_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_community_posts_community_group_id", table_name="community_posts"
    )
    op.drop_constraint(
        "fk_community_posts_community_group_id", "community_posts", type_="foreignkey"
    )
    op.drop_column("community_posts", "community_group_id")

    op.drop_index("idx_community_groups_value", table_name="community_groups")
    op.drop_index("idx_community_groups_type", table_name="community_groups")
    op.drop_table("community_groups")
