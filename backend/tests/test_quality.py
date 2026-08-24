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
async def test_dispositions_are_public_and_empty_for_fresh_db(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/quality/dispositions?scenario=stacker")
    assert response.status_code == 200
    assert response.json() == []


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
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["lot_id"] == "PT6A-0811"
    assert body["action"] == "hold"

    listed = await client.get("/api/quality/dispositions?scenario=stacker")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [body["id"]]


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
        },
    )
    assert response.status_code == 401
