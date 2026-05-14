#################################################################################
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
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""Test runner: orchestrates step execution, mock lifecycle, and report generation."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.runner.base_step import (
    AssertionResult,
    ExecutionContext,
    evaluate_assertion,
    is_hard_failure,
)
from tractusx_testlab.runner.step_executors import get_executor

if TYPE_CHECKING:
    from tractusx_testlab.models.test_models import Test

_log = logging.getLogger(__name__)


@dataclass
class StepReport:
    """Execution report for a single step."""

    name: str
    is_passed: bool
    assertion_results: list[AssertionResult] = field(default_factory=list)
    error: str | None = None


@dataclass
class TestReport:
    """Aggregated execution report for a complete test."""

    test_name: str
    is_passed: bool
    steps: list[StepReport] = field(default_factory=list)


class TestRunner:
    """Executes a Test and returns a TestReport."""

    async def run(self, test: "Test") -> TestReport:
        """Run all steps, evaluate assertions, manage mock lifecycle."""
        from tractusx_testlab.mocks.mock_registry import MockRegistry
        from tractusx_testlab.mocks.mock_server import MockServer

        ctx = ExecutionContext()

        # Seed input variables with declared defaults
        for name, var in test.inputs.items():
            if var.default is not None:
                ctx.variables[name] = var.default

        # Seed connector variables
        for name, connector in test.connectors.items():
            ctx.variables[f"{name}_url"] = connector.url
            ctx.variables[f"{name}_api_key"] = connector.api_key

        # Start mock servers and seed their URLs
        registry = MockRegistry()
        mock_servers: list[MockServer] = []
        for mock_config in test.mocks:
            server = registry.create(mock_config)
            server.start()
            mock_servers.append(server)
            ctx.variables[f"{mock_config.name}_url"] = server.base_url

        step_reports: list[StepReport] = []

        try:
            for step in test.steps:
                executor = get_executor(step.type)
                try:
                    result = await executor(step, ctx)

                    # Propagate step outputs into context variables
                    for key, val in result.outputs.items():
                        ctx.variables[key] = val

                    assertion_results = [
                        evaluate_assertion(a, result) for a in step.expect
                    ]
                    hard_fail = is_hard_failure(assertion_results)

                    step_reports.append(StepReport(
                        name=step.name,
                        is_passed=not hard_fail,
                        assertion_results=assertion_results,
                    ))

                    if hard_fail:
                        break

                except ExecutionError as exc:
                    _log.warning("Step '%s' raised ExecutionError: %s", step.name, exc)
                    step_reports.append(StepReport(
                        name=step.name,
                        is_passed=False,
                        error=str(exc),
                    ))
                    break
        finally:
            for server in mock_servers:
                server.stop()

        overall_passed = all(s.is_passed for s in step_reports)
        return TestReport(
            test_name=test.name,
            is_passed=overall_passed,
            steps=step_reports,
        )


def run_test(test: "Test") -> TestReport:
    """Synchronous wrapper around TestRunner.run."""
    return asyncio.run(TestRunner().run(test))
