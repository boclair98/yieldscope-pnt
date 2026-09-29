"""turn one-click dispositions into independently reviewed demo proposals

Revision ID: 0004
Revises: 0003
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | Sequence[str] | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "lot_dispositions",
        sa.Column("evidence_id", sa.String(120), nullable=False, server_default=""),
    )
    op.add_column(
        "lot_dispositions",
        sa.Column("program_revision", sa.String(80), nullable=False, server_default=""),
    )
    op.add_column(
        "lot_dispositions",
        sa.Column("spec_revision", sa.String(80), nullable=False, server_default=""),
    )
    # Old one-click records remain visible as legacy demo entries, never approved decisions.
    op.add_column(
        "lot_dispositions",
        sa.Column("status", sa.String(16), nullable=False, server_default="legacy"),
    )
    op.add_column(
        "lot_dispositions",
        sa.Column(
            "reviewer_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "lot_dispositions", sa.Column("review_note", sa.String(300), nullable=True)
    )
    op.add_column(
        "lot_dispositions",
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_check_constraint(
        "ck_lot_disposition_status",
        "lot_dispositions",
        "status IN ('legacy', 'pending', 'approved', 'rejected')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_lot_disposition_status", "lot_dispositions", type_="check")
    for column in (
        "reviewed_at",
        "review_note",
        "reviewer_id",
        "status",
        "spec_revision",
        "program_revision",
        "evidence_id",
    ):
        op.drop_column("lot_dispositions", column)
