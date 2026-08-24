"""Persistence for signed-in engineer review notes.

The dashboard itself is a deterministic synthetic portfolio dataset rendered in
the static frontend. Notes are the intentionally small write surface: public
visitors can explore freely, while coders.kr identity gates POST requests.
"""

from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.identity import require_identity
from app.models import QualityReview
from app.routes.users import upsert_local_user

router = APIRouter(prefix="/api/quality", tags=["quality"])

Scenario = Literal["stacker", "socket", "muf"]


class ReviewIn(BaseModel):
    scenario: Scenario
    note: str = Field(min_length=1, max_length=500)


class ReviewOut(BaseModel):
    id: str
    scenario: str
    note: str
    author_name: str
    created_at: str


def _to_out(review: QualityReview) -> ReviewOut:
    return ReviewOut(
        id=str(review.id),
        scenario=review.scenario,
        note=review.note,
        author_name=review.author.display_name,
        created_at=review.created_at.isoformat(),
    )


@router.get("/reviews", response_model=list[ReviewOut])
async def list_reviews(
    session: Annotated[AsyncSession, Depends(get_session)],
    scenario: Scenario | None = None,
) -> list[ReviewOut]:
    query = (
        select(QualityReview)
        .options(selectinload(QualityReview.author))
        .order_by(desc(QualityReview.created_at))
        .limit(20)
    )
    if scenario is not None:
        query = query.where(QualityReview.scenario == scenario)
    result = await session.execute(query)
    return [_to_out(review) for review in result.scalars().all()]


@router.post("/reviews", response_model=ReviewOut, status_code=201)
async def create_review(
    body: ReviewIn,
    coders_id: Annotated[UUID, Depends(require_identity)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ReviewOut:
    user = await upsert_local_user(session, coders_id)
    review = QualityReview(
        author_id=user.id,
        scenario=body.scenario,
        note=body.note.strip(),
    )
    session.add(review)
    await session.flush()
    result = await session.execute(
        select(QualityReview)
        .options(selectinload(QualityReview.author))
        .where(QualityReview.id == review.id)
    )
    return _to_out(result.scalar_one())
