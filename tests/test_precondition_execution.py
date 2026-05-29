#################################################################################
# Eclipse Tractus-X - Software Development KIT
#
# Copyright (c) 2026 Catena-X Autonomotive Network e.V.
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Tests for execute_precondition_steps — the precondition execution engine."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tractusx_testlab.models.enums import StepPhase
from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.models.results import StepResult
from tractusx_testlab.player.execution.preconditions import (
    _extract_precondition_logs,
    execute_precondition_steps,
)

from factories import create_precondition_log, create_step_definition

_MODULE = "tractusx_testlab.player.execution.preconditions"


@pytest.fixture()
def patched_precondition_deps():
    """Patch ConditionEvaluator, StepRegistry, run_step, store_step_outputs."""
    with patch(f"{_MODULE}.ConditionEvaluator") as mock_cond, \
         patch(f"{_MODULE}.StepRegistry") as mock_registry, \
         patch(f"{_MODULE}.run_step", new_callable=AsyncMock) as mock_run, \
         patch(f"{_MODULE}.store_step_outputs") as mock_store:
        yield mock_cond, mock_registry, mock_run, mock_store


def _make_script(preconditions: list | None = None, name: str = "test") -> MagicMock:
    script = MagicMock()
    script.name = name
    script.definition.preconditions = preconditions or []
    script.definition.version = "saturn"
    return script


def _make_passed_result(step_name: str = "s", step_type: str = "t") -> StepResult:
    return StepResult(step_name=step_name, step_type=step_type, status="PASSED")


def _make_failed_result(step_name: str = "s", step_type: str = "t") -> StepResult:
    return StepResult(
        step_name=step_name, step_type=step_type, status="FAILED", error="boom",
    )


# ---------------------------------------------------------------------------
# _extract_precondition_logs
# ---------------------------------------------------------------------------


class TestExtractPreconditionLogs:
    def test_extracts_logs_from_list(self) -> None:
        log = create_precondition_log()
        assert _extract_precondition_logs([log]) == [log]

    def test_ignores_non_log_items(self) -> None:
        log = create_precondition_log()
        result = _extract_precondition_logs([log, "not a log", 42])
        assert result == [log]

    def test_returns_empty_for_non_list(self) -> None:
        assert _extract_precondition_logs("not a list") == []

    def test_returns_empty_for_none(self) -> None:
        assert _extract_precondition_logs(None) == []


# ---------------------------------------------------------------------------
# execute_precondition_steps
# ---------------------------------------------------------------------------


class TestExecutePreconditionSteps:
    @pytest.mark.asyncio
    async def test_empty_preconditions_returns_completed(self) -> None:
        script = _make_script(preconditions=[])
        ctx = MagicMock()
        monitor = MagicMock()
        jobs = MagicMock()

        results, status = await execute_precondition_steps(
            script, ctx, "job-1", monitor, jobs,
        )
        assert results == []
        assert status.value == "COMPLETED"

    @pytest.mark.asyncio
    async def test_runs_all_precondition_steps(
        self, patched_precondition_deps,
    ) -> None:
        mock_cond, mock_registry, mock_run, mock_store = patched_precondition_deps
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = MagicMock()
        mock_run.return_value = _make_passed_result()

        step1 = create_step_definition(type="precondition_asset_config")
        step2 = create_step_definition(type="precondition_policy_config")
        script = _make_script(preconditions=[step1, step2])

        results, status = await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        assert len(results) == 2
        assert status.value == "COMPLETED"

    @pytest.mark.asyncio
    async def test_sets_phase_to_precondition(
        self, patched_precondition_deps,
    ) -> None:
        mock_cond, mock_registry, mock_run, mock_store = patched_precondition_deps
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = MagicMock()
        mock_run.return_value = _make_passed_result()

        step = create_step_definition(type="precondition_asset_config")
        script = _make_script(preconditions=[step])

        results, _ = await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        assert results[0].phase == StepPhase.PRECONDITION

    @pytest.mark.asyncio
    async def test_stops_on_failure(
        self, patched_precondition_deps,
    ) -> None:
        mock_cond, mock_registry, mock_run, mock_store = patched_precondition_deps
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = MagicMock()
        mock_run.return_value = _make_failed_result()

        step1 = create_step_definition(type="precondition_asset_config")
        step2 = create_step_definition(type="precondition_policy_config")
        script = _make_script(preconditions=[step1, step2])

        results, status = await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        assert len(results) == 1
        assert status.value == "FAILED"

    @pytest.mark.asyncio
    async def test_calls_store_step_outputs(
        self, patched_precondition_deps,
    ) -> None:
        mock_cond, mock_registry, mock_run, mock_store = patched_precondition_deps
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = MagicMock()
        mock_run.return_value = _make_passed_result()

        step = create_step_definition(type="precondition_asset_config")
        script = _make_script(preconditions=[step])

        await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        mock_store.assert_called_once()

    @pytest.mark.asyncio
    async def test_extracts_precondition_logs_into_result(
        self, patched_precondition_deps,
    ) -> None:
        mock_cond, mock_registry, mock_run, mock_store = patched_precondition_deps
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = MagicMock()

        log = create_precondition_log(message="from output")
        result = _make_passed_result()
        result.output = [log]
        mock_run.return_value = result

        step = create_step_definition(type="precondition_asset_config")
        script = _make_script(preconditions=[step])

        results, _ = await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        assert len(results[0].precondition_logs) == 1
        assert results[0].precondition_logs[0].message == "from output"

    @pytest.mark.asyncio
    @patch(f"{_MODULE}.StepRegistry")
    @patch(f"{_MODULE}.ConditionEvaluator")
    async def test_missing_step_implementation_fails(
        self,
        mock_cond: MagicMock,
        mock_registry: MagicMock,
    ) -> None:
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = None

        step = create_step_definition(type="precondition_missing")
        script = _make_script(preconditions=[step])

        results, status = await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        assert status.value == "FAILED"
        assert "No implementation" in results[0].error

    @pytest.mark.asyncio
    @patch(f"{_MODULE}.StepRegistry")
    @patch(f"{_MODULE}.ConditionEvaluator")
    async def test_skipped_step_when_condition_false(
        self,
        mock_cond: MagicMock,
        mock_registry: MagicMock,
    ) -> None:
        mock_cond.should_run.return_value = False

        step = create_step_definition(type="precondition_asset_config")
        script = _make_script(preconditions=[step])

        results, status = await execute_precondition_steps(
            script, MagicMock(), "job-1", MagicMock(), MagicMock(),
        )
        assert len(results) == 1
        assert results[0].status.value == "SKIPPED"
        assert status.value == "COMPLETED"

    @pytest.mark.asyncio
    async def test_monitor_receives_events(
        self, patched_precondition_deps,
    ) -> None:
        mock_cond, mock_registry, mock_run, mock_store = patched_precondition_deps
        mock_cond.should_run.return_value = True
        mock_registry.get.return_value = MagicMock()
        mock_run.return_value = _make_passed_result()

        step = create_step_definition(type="precondition_asset_config")
        script = _make_script(preconditions=[step])
        monitor = MagicMock()

        await execute_precondition_steps(
            script, MagicMock(), "job-1", monitor, MagicMock(),
        )
        monitor.on_step_started.assert_called_once()
        monitor.on_step_completed.assert_called_once()
