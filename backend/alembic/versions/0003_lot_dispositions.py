"""add auditable lot disposition actions

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-25 09:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lot_dispositions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "author_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("scenario", sa.String(16), nullable=False),
        sa.Column("lot_id", sa.String(32), nullable=False),
        sa.Column("action", sa.String(16), nullable=False),
        sa.Column("reason", sa.String(300), nullable=False),
        sa.Column("owner", sa.String(64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_lot_dispositions_author_id", "lot_dispositions", ["author_id"])
    op.create_index("ix_lot_dispositions_scenario", "lot_dispositions", ["scenario"])
    op.create_index("ix_lot_dispositions_lot_id", "lot_dispositions", ["lot_id"])
    op.create_index(
        "ix_lot_dispositions_created_at", "lot_dispositions", ["created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_lot_dispositions_created_at", table_name="lot_dispositions")
    op.drop_index("ix_lot_dispositions_lot_id", table_name="lot_dispositions")
    op.drop_index("ix_lot_dispositions_scenario", table_name="lot_dispositions")
    op.drop_index("ix_lot_dispositions_author_id", table_name="lot_dispositions")
    op.drop_table("lot_dispositions")
