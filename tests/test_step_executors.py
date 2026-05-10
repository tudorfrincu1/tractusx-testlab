###############################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2025 Contributors to the Eclipse Foundation
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

"""Tests for step executors."""

from __future__ import annotations

import pytest
import httpx

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.models.test_models import Step
from tractusx_testlab.mocks.mock_server import MockServer
from tractusx_testlab.runner.base_step import ExecutionContext, StepResult
from tractusx_testlab.runner.step_executors import (
    execute_http_request,
    execute_noop,
    execute_create_asset,
    execute_query_catalog,
    execute_negotiate_access,
    execute_fetch_data,
    get_executor,
)


class TestGetExecutor:
    def test_known_executor(self) -> None:
        executor = get_executor("http_request")
        assert executor is execute_http_request

    def test_unknown_executor_returns_noop(self) -> None:
        executor = get_executor("totally_unknown")
        assert executor is execute_noop

    def test_all_registered_types(self) -> None:
        known = ["http_request", "create_asset", "query_catalog", "negotiate_access", "fetch_data"]
        for step_type in known:
            executor = get_executor(step_type)
            assert executor is not execute_noop


class TestExecuteNoop:
    @pytest.mark.asyncio
    async def test_noop_returns_200(self) -> None:
        step = Step(type="unknown_step", name="Noop")
        ctx = ExecutionContext()
        result = await execute_noop(step, ctx)
        assert result.response_status == 200
        assert result.response_body["status"] == "noop"
        assert result.outputs == {}


class TestExecuteHttpRequest:
    @pytest.mark.asyncio
    async def test_missing_url_raises(self) -> None:
        step = Step(type="http_request", name="No URL", inputs={})
        ctx = ExecutionContext()
        with pytest.raises(ExecutionError, match="Missing 'url'"):
            await execute_http_request(step, ctx)

    @pytest.mark.asyncio
    async def test_get_request_against_mock(self) -> None:
        """Use a real mock server to test the HTTP executor."""
        server = MockServer(name="test-http")
        server.register_endpoint("GET", "/api/health", status=200, body={"status": "ok"})
        server.start()
        try:
            step = Step(
                type="http_request",
                name="Health Check",
                inputs={"method": "GET", "url": f"{server.base_url}/api/health"},
            )
            ctx = ExecutionContext()
            result = await execute_http_request(step, ctx)
            assert result.response_status == 200
            assert result.response_body == {"status": "ok"}
        finally:
            server.stop()

    @pytest.mark.asyncio
    async def test_post_request_with_body(self) -> None:
        server = MockServer(name="test-post")
        server.register_endpoint("POST", "/api/data", status=201, body={"id": "123"})
        server.start()
        try:
            step = Step(
                type="http_request",
                name="Post Data",
                inputs={
                    "method": "POST",
                    "url": f"{server.base_url}/api/data",
                    "body": {"key": "value"},
                },
            )
            ctx = ExecutionContext()
            result = await execute_http_request(step, ctx)
            assert result.response_status == 201
            assert result.response_body == {"id": "123"}
        finally:
            server.stop()

    @pytest.mark.asyncio
    async def test_variable_resolution_in_url(self) -> None:
        server = MockServer(name="test-var")
        server.register_endpoint("GET", "/ping", status=200, body={"pong": True})
        server.start()
        try:
            step = Step(
                type="http_request",
                name="Var URL",
                inputs={"method": "GET", "url": "@base_url"},
            )
            ctx = ExecutionContext()
            ctx.variables["base_url"] = f"{server.base_url}/ping"
            result = await execute_http_request(step, ctx)
            assert result.response_status == 200
        finally:
            server.stop()


class TestExecuteCreateAsset:
    @pytest.mark.asyncio
    async def test_create_asset(self) -> None:
        server = MockServer(name="provider-mock")
        server.register_endpoint(
            "POST", "/management/v3/assets", status=200, body={"@id": "asset-1"}
        )
        server.start()
        try:
            step = Step(
                type="create_asset",
                name="Create Asset",
                inputs={"name": "My Asset", "description": "desc", "base_url": "https://example.com/data"},
            )
            ctx = ExecutionContext()
            ctx.variables["provider_url"] = server.base_url
            ctx.variables["provider_api_key"] = "test-key"
            result = await execute_create_asset(step, ctx)
            assert result.response_status == 200
            assert "asset_id" in result.outputs
            assert len(ctx.created_resources) == 1
            assert ctx.created_resources[0]["type"] == "asset"
        finally:
            server.stop()


class TestExecuteQueryCatalog:
    @pytest.mark.asyncio
    async def test_query_catalog(self) -> None:
        server = MockServer(name="consumer-mock")
        server.register_endpoint(
            "POST", "/management/v3/catalog/request", status=200,
            body={"@type": "dcat:Catalog", "dcat:dataset": []},
        )
        server.start()
        try:
            step = Step(
                type="query_catalog",
                name="Query Catalog",
                inputs={"counter_party_url": "http://provider:8080"},
            )
            ctx = ExecutionContext()
            ctx.variables["consumer_url"] = server.base_url
            ctx.variables["consumer_api_key"] = "test-key"
            result = await execute_query_catalog(step, ctx)
            assert result.response_status == 200
            assert "catalog" in result.outputs
        finally:
            server.stop()


class TestExecuteNegotiateAccess:
    @pytest.mark.asyncio
    async def test_negotiate_access(self) -> None:
        server = MockServer(name="negotiate-mock")
        server.register_endpoint(
            "POST", "/management/v3/contractnegotiations", status=200,
            body={"@id": "negotiation-123"},
        )
        server.start()
        try:
            step = Step(
                type="negotiate_access",
                name="Negotiate",
                inputs={
                    "offer_id": "offer-1",
                    "asset_id": "asset-1",
                    "counter_party_url": "http://provider:8080",
                },
            )
            ctx = ExecutionContext()
            ctx.variables["consumer_url"] = server.base_url
            ctx.variables["consumer_api_key"] = "key"
            result = await execute_negotiate_access(step, ctx)
            assert result.response_status == 200
            assert result.outputs["negotiation_id"] == "negotiation-123"
        finally:
            server.stop()


class TestExecuteFetchData:
    @pytest.mark.asyncio
    async def test_fetch_data(self) -> None:
        server = MockServer(name="fetch-mock")
        server.register_endpoint(
            "POST", "/management/v3/transferprocesses", status=200,
            body={"@id": "transfer-456"},
        )
        server.start()
        try:
            step = Step(
                type="fetch_data",
                name="Fetch",
                inputs={"contract_id": "contract-1", "asset_id": "asset-1"},
            )
            ctx = ExecutionContext()
            ctx.variables["consumer_url"] = server.base_url
            ctx.variables["consumer_api_key"] = "key"
            ctx.variables["provider_url"] = "http://provider:8080"
            result = await execute_fetch_data(step, ctx)
            assert result.response_status == 200
            assert result.outputs["transfer_id"] == "transfer-456"
        finally:
            server.stop()
