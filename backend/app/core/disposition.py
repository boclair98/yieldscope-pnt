"""Pure decision rules shared by the API and database-free tests."""

from uuid import UUID


def missing_proposal_fields(values: dict[str, str]) -> list[str]:
    """Whitespace-only references are not traceable evidence."""
    return [name for name, value in values.items() if not value.strip()]


def review_denial(
    status: str, author_id: UUID, reviewer_id: UUID
) -> tuple[int, str] | None:
    if status != "pending":
        return 409, "proposal already reviewed or legacy"
    if author_id == reviewer_id:
        return 403, "independent reviewer required"
    return None
