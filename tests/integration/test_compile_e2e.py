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

"""End-to-end integration tests for the TCK parse → compile → execute pipeline."""

from __future__ import annotations

import asyncio
import importlib
import json
import sys
from pathlib import Path
from typing import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import yaml
from fastapi import APIRouter, FastAPI
from httpx import ASGITransport, AsyncClient

from tractusx_testlab.models.definitions import ScriptDefinition, TckDefinition
from tractusx_testlab.models.enums import ScriptKind
from tractusx_testlab.scripting.parser import YamlParser
from tractusx_testlab.scripting.script import Tck, TestScript

_FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
_SRC_DIR = str(Path(__file__).resolve().parent.parent.parent / "src")


# ──────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────


@pytest.fixture()
def simple_tck_yaml() -> str:
    """Load the simple TCK YAML fixture as a string."""
    return (_FIXTURES_DIR / "simple_tck.yaml").read_text(encoding="utf-8")


@pytest.fixture()
def simple_tck_data(simple_tck_yaml: str) -> dict:
    """Parse the simple TCK YAML fixture into a dict."""
    return yaml.safe_load(simple_tck_yaml)


# ──────────────────────────────────────────────────────────────────────
# Unit-level: parse → TckDefinition → Tck
# ──────────────────────────────────────────────────────────────────────


class TestTckParseCompilePipeline:
    """Verify the full parse → TckDefinition → Tck pipeline with a real YAML fixture."""

    def test_parse_tck_from_dict_returns_tck_definition(
        self, simple_tck_data: dict,
    ) -> None:
        """YamlParser.parse_tck_from_dict produces a valid TckDefinition."""
        definition = YamlParser.parse_tck_from_dict(simple_tck_data)

        assert isinstance(definition, TckDefinition)
        assert definition.name == "simple-ping-test"
        assert definition.kind == ScriptKind.TCK

    def test_tck_definition_contains_inline_tests(
        self, simple_tck_data: dict,
    ) -> None:
        """Inline test dicts inside ``tests:`` are parsed into ScriptDefinition objects."""
        definition = YamlParser.parse_tck_from_dict(simple_tck_data)

        assert len(definition.tests) == 1
        test = definition.tests[0]
        assert isinstance(test, ScriptDefinition)
        assert test.name == "ping-http"

    def test_tck_definition_test_has_steps(
        self, simple_tck_data: dict,
    ) -> None:
        """Each inline ScriptDefinition carries its steps."""
        definition = YamlParser.parse_tck_from_dict(simple_tck_data)
        test = definition.tests[0]

        assert isinstance(test, ScriptDefinition)
        assert len(test.steps) == 1
        assert test.steps[0].type == "http_request"

    def test_tck_scripts_not_empty(
        self, simple_tck_data: dict,
    ) -> None:
        """Tck wrapper correctly wraps definition tests as TestScript objects (Bug 2 regression)."""
        definition = YamlParser.parse_tck_from_dict(simple_tck_data)
        tck = Tck(definition)

        assert tck.scripts, "tck.scripts must not be empty — regression on Bug 2"
        assert len(tck.scripts) == 1
        assert isinstance(tck.scripts[0], TestScript)

    def test_tck_script_has_steps(
        self, simple_tck_data: dict,
    ) -> None:
        """TestScript exposes its step definitions through the definition wrapper."""
        definition = YamlParser.parse_tck_from_dict(simple_tck_data)
        tck = Tck(definition)
        script = tck.scripts[0]

        assert script.name == "ping-http"
        assert script.step_count() == 1

    def test_tck_total_steps(
        self, simple_tck_data: dict,
    ) -> None:
        """Tck.total_steps aggregates across all scripts."""
        definition = YamlParser.parse_tck_from_dict(simple_tck_data)
        tck = Tck(definition)

        assert tck.total_steps() == 1

    def test_parse_tck_from_file(self) -> None:
        """YamlParser.parse_tck loads from a file path directly."""
        path = _FIXTURES_DIR / "simple_tck.yaml"
        definition = YamlParser.parse_tck(path)

        assert definition.name == "simple-ping-test"
        assert len(definition.tests) == 1


# ──────────────────────────────────────────────────────────────────────
# HTTP endpoint integration: POST /testlab/test-execution/run
# ──────────────────────────────────────────────────────────────────────


@pytest.fixture()
def mock_player() -> MagicMock:
    """MagicMock player with real JobManager."""
    from tractusx_testlab.player.execution.monitor import ExecutionMonitor
    from tractusx_testlab.player.jobs import JobManager

    player = MagicMock()
    player.jobs = JobManager()
    player.monitor = ExecutionMonitor(MagicMock())
    player.run_tck = AsyncMock()
    return player


@pytest.fixture()
def streaming_app(mock_player: MagicMock) -> FastAPI:
    """FastAPI app wired with the streaming router and mocked player."""
    from tractusx_testlab.server.streaming import streaming_router

    application = FastAPI()
    application.state.player = mock_player
    application.state.storage = MagicMock()
    application.state.callbacks = MagicMock()
    application.include_router(streaming_router, prefix="/testlab")
    return application


@pytest.fixture()
async def async_client(streaming_app: FastAPI) -> AsyncClient:
    """Async HTTP client backed by the test FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=streaming_app),
        base_url="http://test",
    ) as c:
        yield c


class TestRunYamlEndpointE2E:
    """End-to-end: submit real TCK YAML to the /run/yaml endpoint."""

    @pytest.mark.asyncio
    async def test_submit_tck_yaml_returns_queued(
        self,
        async_client: AsyncClient,
        mock_player: MagicMock,
        simple_tck_yaml: str,
    ) -> None:
        """Submitting a valid TCK YAML returns 202 with a job_id — no 422 error."""
        response = await async_client.post(
            "/testlab/test-execution/run",
            content=simple_tck_yaml.encode(),
        )

        assert response.status_code == 202, (
            f"Expected 202, got {response.status_code}: {response.text}"
        )
        body = response.json()
        assert "job_id" in body
        assert body["status"] == "queued"

    @pytest.mark.asyncio
    async def test_submit_tck_yaml_triggers_player_run(
        self,
        async_client: AsyncClient,
        mock_player: MagicMock,
        simple_tck_yaml: str,
    ) -> None:
        """The endpoint fires player.run_tck with a Tck object containing scripts."""
        await async_client.post(
            "/testlab/test-execution/run",
            content=simple_tck_yaml.encode(),
        )

        # Allow the background task to run
        await asyncio.sleep(0.1)

        mock_player.run_tck.assert_called_once()
        tck_arg = mock_player.run_tck.call_args[0][0]
        assert isinstance(tck_arg, Tck)
        assert tck_arg.scripts, "Tck passed to player must have scripts"

    @pytest.mark.asyncio
    async def test_submit_single_test_yaml_also_works(
        self,
        async_client: AsyncClient,
        mock_player: MagicMock,
    ) -> None:
        """A bare test YAML (no ``kind: tck``) is auto-wrapped into a Tck."""
        single_test_yaml = (
            "name: bare-test\n"
            "steps:\n"
            "  - type: http_request\n"
            "    params:\n"
            "      method: GET\n"
            "      url: http://localhost/ping\n"
        )

        response = await async_client.post(
            "/testlab/test-execution/run",
            content=single_test_yaml.encode(),
        )

        assert response.status_code == 202
        await asyncio.sleep(0.1)
        mock_player.run_tck.assert_called_once()
