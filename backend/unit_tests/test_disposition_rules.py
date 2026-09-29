from uuid import uuid4

from app.core.disposition import missing_proposal_fields, review_denial


def test_references_must_not_be_blank() -> None:
    assert missing_proposal_fields({"evidence_id": "  ", "spec_revision": "R3"}) == [
        "evidence_id"
    ]
    assert (
        missing_proposal_fields({"evidence_id": "DEMO-01", "spec_revision": "R3"}) == []
    )


def test_review_requires_independent_person_and_pending_status() -> None:
    author, reviewer = uuid4(), uuid4()
    assert review_denial("pending", author, author) == (
        403,
        "independent reviewer required",
    )
    assert review_denial("legacy", author, reviewer) == (
        409,
        "proposal already reviewed or legacy",
    )
    assert review_denial("approved", author, reviewer) == (
        409,
        "proposal already reviewed or legacy",
    )
    assert review_denial("pending", author, reviewer) is None
