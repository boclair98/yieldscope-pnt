"""Review-note API contract for the YieldScope quality cases."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_reviews_are_public_and_empty_for_fresh_db(client: AsyncClient) -> None:
    response = await client.get("/api/quality/reviews?scenario=stacker")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_anonymous_cannot_create_review(client: AsyncClient) -> None:
    response = await client.post(
        "/api/quality/reviews",
        json={"scenario": "stacker", "note": "confirm calibration"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_signed_in_review_round_trip(
    client: AsyncClient, signed_in_headers: dict[str, str]
) -> None:
    created = await client.post(
        "/api/quality/reviews",
        headers=signed_in_headers,
        json={"scenario": "socket", "note": "Track the PM interlock for 2 weeks."},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["scenario"] == "socket"
    assert body["note"] == "Track the PM interlock for 2 weeks."
    assert body["author_name"].startswith("user-")

    listed = await client.get("/api/quality/reviews?scenario=socket")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [body["id"]]


@pytest.mark.asyncio
async def test_review_input_is_bounded(
    client: AsyncClient, signed_in_headers: dict[str, str]
) -> None:
    invalid_case = await client.post(
        "/api/quality/reviews",
        headers=signed_in_headers,
        json={"scenario": "secret-fab", "note": "no"},
    )
    assert invalid_case.status_code == 422

    oversized = await client.post(
        "/api/quality/reviews",
        headers=signed_in_headers,
        json={"scenario": "muf", "note": "x" * 501},
    )
    assert oversized.status_code == 422


@pytest.mark.asyncio
async def test_dispositions_require_identity(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/quality/dispositions?scenario=stacker")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_signed_in_disposition_round_trip(
    client: AsyncClient, signed_in_headers: dict[str, str]
) -> None:
    created = await client.post(
        "/api/quality/dispositions",
        headers=signed_in_headers,
        json={
            "scenario": "stacker",
            "lot_id": "PT6A-0811",
            "action": "hold",
            "reason": "Open bin 재현 및 alternate tester 확인 전 출하 보류",
            "owner": "Test QE",
            "evidence_id": "DEMO-FA-001",
            "program_revision": "FT-M8-042",
            "spec_revision": "DEMO-SPEC-R1",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["lot_id"] == "PT6A-0811"
    assert body["action"] == "hold"
    assert body["status"] == "pending"
    assert body["evidence_id"] == "DEMO-FA-001"

    listed = await client.get(
        "/api/quality/dispositions?scenario=stacker", headers=signed_in_headers
    )
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [body["id"]]

    self_review = await client.post(
        f"/api/quality/dispositions/{body['id']}/review",
        headers=signed_in_headers,
        json={"decision": "approved", "note": "Evidence reviewed"},
    )
    assert self_review.status_code == 403

    from uuid import uuid4

    other_headers = {"X-Coders-User": str(uuid4())}
    reviewed = await client.post(
        f"/api/quality/dispositions/{body['id']}/review",
        headers=other_headers,
        json={"decision": "approved", "note": "Evidence and revisions checked"},
    )
    assert reviewed.status_code == 200, reviewed.text
    assert reviewed.json()["status"] == "approved"
    assert reviewed.json()["reviewer_name"] is not None

    duplicate = await client.post(
        f"/api/quality/dispositions/{body['id']}/review",
        headers=other_headers,
        json={"decision": "rejected", "note": "Late review attempt"},
    )
    assert duplicate.status_code == 409


@pytest.mark.asyncio
async def test_anonymous_cannot_create_disposition(client: AsyncClient) -> None:
    response = await client.post(
        "/api/quality/dispositions",
        json={
            "scenario": "socket",
            "lot_id": "LT-001",
            "action": "release",
            "reason": "Golden sample pass",
            "owner": "Test QE",
            "evidence_id": "DEMO-GOLDEN-01",
            "program_revision": "FT-HBM-118",
            "spec_revision": "DEMO-SPEC-R2",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_release_proposal_requires_traceable_evidence(
    client: AsyncClient, signed_in_headers: dict[str, str]
) -> None:
    response = await client.post(
        "/api/quality/dispositions",
        headers=signed_in_headers,
        json={
            "scenario": "socket",
            "lot_id": "DEMO-LOT-1",
            "action": "release",
            "reason": "Golden sample correlation checked",
            "owner": "Test QE",
            "evidence_id": "   ",
            "program_revision": "FT-HBM-118",
            "spec_revision": "DEMO-SPEC-R2",
        },
    )
    assert response.status_code == 422
