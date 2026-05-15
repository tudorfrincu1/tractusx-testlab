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

"""Tests for the TestRunner lifecycle."""

from __future__ import annotations

import pytest

from tractusx_testlab.models.test_models import (
    Assertion,
    AssertionType,
    ConnectorConfig,
    InputVariable,
    MockConfig,
    Severity,
    Step,
    Test,
)
from tractusx_testlab.runner.test_runner import TestReport, TestRunner, run_test


@pytest.fixture()
def runner() -> TestRunner:
    return TestRunner()


class TestRunnerNoSteps:
    @pytest.mark.asyncio
    async def test_empty_test_passes(self, runner: TestRunner) -> None:
        test = Test(name="Empty Test", steps=[])
        report = await runner.run(test)
        assert report.is_passed
        assert report.test_name == "Empty Test"
        assert report.steps == []

    @pytest.mark.asyncio
    async def test_seeds_input_variables(self, runner: TestRunner) -> None:
        test = Test(
            name="Input Test",
            inputs={"name": InputVariable(type="string", default="TestValue")},
            steps=[],
        )
        report = await runner.run(test)
        assert report.is_passed

    @pytest.mark.asyncio
    async def test_seeds_connector_variables(self, runner: TestRunner) -> None:
        test = Test(
            name="Connector Test",
            connectors={
                "provider": ConnectorConfig(url="http://p:8080", api_key="pk"),
            },
            steps=[],
        )
        report = await runner.run(test)
        assert report.is_passed


class TestRunnerWithSteps:
    @pytest.mark.asyncio
    async def test_noop_step_passes(self, runner: TestRunner) -> None:
        test = Test(
            name="Noop Test",
            steps=[
                Step(type="register_twin", name="Noop Step"),
            ],
        )
        report = await runner.run(test)
        assert report.is_passed
        assert len(report.steps) == 1
        assert report.steps[0].name == "Noop Step"
        assert report.steps[0].is_passed

    @pytest.mark.asyncio
    async def test_noop_with_status_assertion_passes(self, runner: TestRunner) -> None:
        """Noop returns status 200, so STATUS_CODE 200 should pass."""
        test = Test(
            name="Noop Assert Test",
            steps=[
                Step(
                    type="register_twin",
                    name="Assert Noop",
                    expect=[Assertion(type=AssertionType.STATUS_CODE, value=200)],
                ),
            ],
        )
        report = await runner.run(test)
        assert report.is_passed
        assert report.steps[0].assertion_results[0].is_passed

    @pytest.mark.asyncio
    async def test_hard_assertion_failure_stops_execution(self, runner: TestRunner) -> None:
        """If a hard assertion fails, subsequent steps are skipped."""
        test = Test(
            name="Hard Fail Test",
            steps=[
                Step(
                    type="register_twin",
                    name="Fail Step",
                    expect=[
                        Assertion(
                            type=AssertionType.STATUS_CODE,
                            value=404,  # noop returns 200
                            severity=Severity.HARD,
                        )
                    ],
                ),
                Step(type="register_twin", name="Should Not Run"),
            ],
        )
        report = await runner.run(test)
        assert not report.is_passed
        assert len(report.steps) == 1  # second step was skipped
        assert not report.steps[0].is_passed

    @pytest.mark.asyncio
    async def test_soft_assertion_failure_does_not_stop(self, runner: TestRunner) -> None:
        """Soft assertion failures don't stop execution."""
        test = Test(
            name="Soft Fail Test",
            steps=[
                Step(
                    type="register_twin",
                    name="Soft Fail",
                    expect=[
                        Assertion(
                            type=AssertionType.STATUS_CODE,
                            value=404,
                            severity=Severity.SOFT,
                        )
                    ],
                ),
                Step(type="register_twin", name="Should Run"),
            ],
        )
        report = await runner.run(test)
        assert report.is_passed  # soft failures don't fail the test
        assert len(report.steps) == 2


class TestRunnerWithMocks:
    @pytest.mark.asyncio
    async def test_mock_starts_and_stops(self, runner: TestRunner) -> None:
        test = Test(
            name="Mock Test",
            mocks=[MockConfig(type="dtr", name="test-dtr")],
            steps=[],
        )
        report = await runner.run(test)
        assert report.is_passed

    @pytest.mark.asyncio
    async def test_mock_url_available_as_variable(self, runner: TestRunner) -> None:
        """After mocks start, @mock_name_url should be available."""
        test = Test(
            name="Mock Var Test",
            mocks=[MockConfig(type="notification", name="notif")],
            steps=[],
        )
        report = await runner.run(test)
        assert report.is_passed


class TestRunTestSync:
    def test_run_test_sync_wrapper(self) -> None:
        test = Test(name="Sync Test", steps=[])
        report = run_test(test)
        assert isinstance(report, TestReport)
        assert report.is_passed


class TestRunnerErrorHandling:
    @pytest.mark.asyncio
    async def test_execution_error_in_step(self, runner: TestRunner) -> None:
        """Test that ExecutionError in a step is caught and reported."""
        test = Test(
            name="Error Test",
            steps=[
                Step(
                    type="http_request",
                    name="No URL",
                    inputs={},  # Missing url → ExecutionError
                ),
            ],
        )
        report = await runner.run(test)
        assert not report.is_passed
        assert report.steps[0].error is not None
        assert "url" in report.steps[0].error.lower()
