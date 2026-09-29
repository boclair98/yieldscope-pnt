import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """App-local user, keyed on the platform's coders_id.

    coders.kr already knows who this visitor is (they signed in via
    `mcp.coders.kr/sso/login`); we keep a row in our own DB the first
    time we see them so app-local data (Posts, preferences, …) can FK
    against a stable local UUID without joining out to the platform.

    When the platform someday hands us extra profile fields, sync
    `display_name` / `avatar_url` here on each request.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # The X-Coders-User value the gate sent. Unique per visitor.
    coders_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True), unique=True, nullable=False, index=True
    )
    # Editable inside the app. Default to a short slice of coders_id so
    # something shows up before the user picks a name.
    display_name: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now()
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()
    )

    quality_reviews: Mapped[list["QualityReview"]] = relationship(
        back_populates="author", cascade="all, delete-orphan"
    )
    lot_dispositions: Mapped[list["LotDisposition"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan",
        foreign_keys="LotDisposition.author_id",
    )


class QualityReview(Base):
    """Engineer review note attached to one synthetic quality case."""

    __tablename__ = "quality_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario: Mapped[str] = mapped_column(sa.String(16), nullable=False, index=True)
    note: Mapped[str] = mapped_column(sa.String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), index=True
    )

    author: Mapped[User] = relationship(back_populates="quality_reviews")


class LotDisposition(Base):
    """Demo decision proposal; never an actual MES/ship authorization."""

    __tablename__ = "lot_dispositions"
    __table_args__ = (
        sa.CheckConstraint(
            "status IN ('legacy', 'pending', 'approved', 'rejected')",
            name="ck_lot_disposition_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scenario: Mapped[str] = mapped_column(sa.String(16), nullable=False, index=True)
    lot_id: Mapped[str] = mapped_column(sa.String(32), nullable=False, index=True)
    action: Mapped[str] = mapped_column(sa.String(16), nullable=False)
    reason: Mapped[str] = mapped_column(sa.String(300), nullable=False)
    owner: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    evidence_id: Mapped[str] = mapped_column(sa.String(120), nullable=False, default="")
    program_revision: Mapped[str] = mapped_column(
        sa.String(80), nullable=False, default=""
    )
    spec_revision: Mapped[str] = mapped_column(
        sa.String(80), nullable=False, default=""
    )
    status: Mapped[str] = mapped_column(
        sa.String(16), nullable=False, default="pending"
    )
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(sa.String(300), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), index=True
    )

    author: Mapped[User] = relationship(
        back_populates="lot_dispositions", foreign_keys=[author_id]
    )
    reviewer: Mapped[User | None] = relationship(foreign_keys=[reviewer_id])
