"""Platform identity contract retained by the YieldScope app."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_anonymous_me_is_unauthorized(client: AsyncClient) -> None:
    response = await client.get("/api/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_lazily_creates_local_user(
    client: AsyncClient, signed_in_headers: dict[str, str]
) -> None:
    response = await client.get("/api/me", headers=signed_in_headers)
    assert response.status_code == 200
    me = response.json()
    assert me["coders_id"] == signed_in_headers["X-Coders-User"]
    assert me["display_name"].startswith("user-")
