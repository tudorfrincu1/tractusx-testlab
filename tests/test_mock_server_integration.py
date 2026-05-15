###############################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2026 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
###############################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Integration tests for MockServer HTTP dispatch and request recording."""

from __future__ import annotations

import asyncio

import httpx
import pytest

from tractusx_testlab.exceptions import MockServerError
from tractusx_testlab.mocks.mock_server import MockServer


@pytest.fixture()
def server() -> MockServer:
    s = MockServer(name="integration-test")
    yield s
    if s.is_running:
        s.stop()


class TestMockServerHTTP:
    def test_get_registered_endpoint(self, server: MockServer) -> None:
        server.register_endpoint("GET", "/health", status=200, body={"ok": True})
        server.start()
        resp = httpx.get(f"{server.base_url}/health")
        assert resp.status_code == 200
        assert resp.json() == {"ok": True}

    def test_post_registered_endpoint(self, server: MockServer) -> None:
        server.register_endpoint("POST", "/data", status=201, body={"id": "abc"})
        server.start()
        resp = httpx.post(f"{server.base_url}/data", json={"key": "val"})
        assert resp.status_code == 201
        assert resp.json() == {"id": "abc"}

    def test_unregistered_endpoint_returns_404(self, server: MockServer) -> None:
        server.start()
        resp = httpx.get(f"{server.base_url}/nonexistent")
        assert resp.status_code == 404

    def test_recorded_requests(self, server: MockServer) -> None:
        server.register_endpoint("GET", "/track", status=200, body={})
        server.start()
        httpx.get(f"{server.base_url}/track")
        httpx.get(f"{server.base_url}/track")
        records = server.get_recorded_requests("/track")
        assert len(records) == 2
        assert records[0].method == "GET"
        assert records[0].path == "/track"

    def test_recorded_requests_filter_by_path(self, server: MockServer) -> None:
        server.register_endpoint("GET", "/a", status=200, body={})
        server.register_endpoint("GET", "/b", status=200, body={})
        server.start()
        httpx.get(f"{server.base_url}/a")
        httpx.get(f"{server.base_url}/b")
        httpx.get(f"{server.base_url}/a")
        assert len(server.get_recorded_requests("/a")) == 2
        assert len(server.get_recorded_requests("/b")) == 1

    def test_recorded_requests_all(self, server: MockServer) -> None:
        server.register_endpoint("GET", "/x", status=200, body={})
        server.start()
        httpx.get(f"{server.base_url}/x")
        all_records = server.get_recorded_requests()
        assert len(all_records) >= 1

    def test_post_body_recorded(self, server: MockServer) -> None:
        server.register_endpoint("POST", "/echo", status=200, body={})
        server.start()
        httpx.post(f"{server.base_url}/echo", json={"msg": "hello"})
        records = server.get_recorded_requests("/echo")
        assert records[0].body == {"msg": "hello"}

    def test_start_twice_is_idempotent(self, server: MockServer) -> None:
        server.start()
        port = server.base_url
        server.start()  # should not error
        assert server.base_url == port

    def test_stop_after_stop_is_safe(self, server: MockServer) -> None:
        server.start()
        server.stop()
        server.stop()  # should not error


class TestMockServerWaitForCall:
    @pytest.mark.asyncio
    async def test_wait_for_call_resolved(self, server: MockServer) -> None:
        server.register_endpoint("POST", "/callback", status=200, body={})
        server.start()

        async def send_request() -> None:
            await asyncio.sleep(0.1)
            async with httpx.AsyncClient() as client:
                await client.post(f"{server.base_url}/callback", json={"x": 1})

        task = asyncio.create_task(send_request())
        recorded = await server.wait_for_call("/callback", timeout=5.0)
        await task
        assert recorded.method == "POST"
        assert recorded.body == {"x": 1}

    @pytest.mark.asyncio
    async def test_wait_for_call_timeout(self, server: MockServer) -> None:
        server.start()
        with pytest.raises(MockServerError, match="Timed out"):
            await server.wait_for_call("/never-called", timeout=0.2)


class TestMockServerPlainTextBody:
    def test_plain_text_body_recorded(self, server: MockServer) -> None:
        server.register_endpoint("POST", "/text", status=200, body={})
        server.start()
        httpx.post(
            f"{server.base_url}/text",
            content="plain text",
            headers={"Content-Type": "text/plain"},
        )
        records = server.get_recorded_requests("/text")
        assert records[0].body == "plain text"
