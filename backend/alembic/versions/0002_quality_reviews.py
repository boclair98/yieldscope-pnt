"""add engineer quality review notes

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-24 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "quality_reviews",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "author_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("scenario", sa.String(16), nullable=False),
        sa.Column("note", sa.String(500), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_quality_reviews_author_id", "quality_reviews", ["author_id"])
    op.create_index("ix_quality_reviews_scenario", "quality_reviews", ["scenario"])
    op.create_index("ix_quality_reviews_created_at", "quality_reviews", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_quality_reviews_created_at", table_name="quality_reviews")
    op.drop_index("ix_quality_reviews_scenario", table_name="quality_reviews")
    op.drop_index("ix_quality_reviews_author_id", table_name="quality_reviews")
    op.drop_table("quality_reviews")
