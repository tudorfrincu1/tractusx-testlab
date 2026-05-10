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

"""TestRunner — orchestrates the full test lifecycle."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.models.test_models import Test
from tractusx_testlab.mocks.mock_registry import MockRegistry
from tractusx_testlab.mocks.mock_server import MockServer
from tractusx_testlab.runner.base_step import (
    AssertionResult,
    ExecutionContext,
    StepResult,
    evaluate_assertion,
    is_hard_failure,
)
from tractusx_testlab.runner.step_executors import get_executor

logger = logging.getLogger(__name__)


# ── Result models ──────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class StepReport:
    """Report for a single executed step."""

    name: str
    step_type: str
    is_passed: bool
    assertion_results: list[AssertionResult] = field(default_factory=list)
    outputs: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@dataclass(frozen=True)
class TestReport:
    """Top-level report for a full test execution."""

    test_name: str
    is_passed: bool
    steps: list[StepReport] = field(default_factory=list)
    error: str | None = None


# ── Runner ─────────────────────────────────────────────────────────────────────


class TestRunner:
    """Executes a compiled Test model through its full lifecycle.

    Lifecycle:
        1. Resolve input variables
        2. Start mock servers
        3. Execute steps sequentially
        4. Evaluate assertions
        5. Stop mock servers
        6. Return test report
    """

    def __init__(self) -> None:
        self._mock_registry = MockRegistry()

    async def run(self, test: Test) -> TestReport:
        """Execute the full test and return a report."""
        context = ExecutionContext()
        mock_servers: list[MockServer] = []

        try:
            # 1. Seed variables from test inputs
            _seed_variables(test, context)

            # 2. Seed connector variables
            _seed_connectors(test, context)

            # 3. Start mock servers
            mock_servers = self._start_mocks(test, context)

            # 4. Execute steps
            step_reports = await self._execute_steps(test, context)

            # 5. Determine overall pass/fail
            is_passed = all(sr.is_passed for sr in step_reports)

            return TestReport(
                test_name=test.name,
                is_passed=is_passed,
                steps=step_reports,
            )

        except Exception as exc:
            logger.exception("Test '%s' failed with unhandled error", test.name)
            return TestReport(
                test_name=test.name,
                is_passed=False,
                error=str(exc),
            )

        finally:
            # 6. Stop mock servers
            for server in mock_servers:
                try:
                    server.stop()
                except Exception:
                    logger.warning("Failed to stop mock '%s'", server.name)

    def _start_mocks(self, test: Test, context: ExecutionContext) -> list[MockServer]:
        """Create and start all mock servers, storing their URLs in context."""
        servers = self._mock_registry.create_all(test.mocks)
        for server in servers:
            server.start()
            context.mock_urls[server.name] = server.base_url
            context.variables[f"{server.name}_url"] = server.base_url
            logger.info("Mock '%s' available at %s", server.name, server.base_url)
        return servers

    async def _execute_steps(
        self, test: Test, context: ExecutionContext
    ) -> list[StepReport]:
        """Execute each step sequentially and collect reports."""
        reports: list[StepReport] = []

        for step in test.steps:
            logger.info("Executing step '%s' (type: %s)", step.name, step.type)

            try:
                executor = get_executor(step.type)
                result: StepResult = await executor(step, context)

                # Store outputs as variables
                for var_name, value in result.outputs.items():
                    context.variables[var_name] = value

                # Evaluate assertions
                assertion_results = [
                    evaluate_assertion(a, result) for a in step.expect
                ]

                step_passed = not is_hard_failure(assertion_results)

                report = StepReport(
                    name=step.name,
                    step_type=step.type,
                    is_passed=step_passed,
                    assertion_results=assertion_results,
                    outputs=result.outputs,
                )

            except ExecutionError as exc:
                logger.error("Step '%s' failed: %s", step.name, exc)
                report = StepReport(
                    name=step.name,
                    step_type=step.type,
                    is_passed=False,
                    error=str(exc),
                )

            except Exception as exc:
                logger.exception("Step '%s' crashed", step.name)
                report = StepReport(
                    name=step.name,
                    step_type=step.type,
                    is_passed=False,
                    error=f"Unexpected error: {exc}",
                )

            reports.append(report)

            # Stop on hard failure
            if not report.is_passed:
                logger.warning("Step '%s' failed — aborting remaining steps", step.name)
                break

        return reports


# ── Helpers ────────────────────────────────────────────────────────────────────


def _seed_variables(test: Test, context: ExecutionContext) -> None:
    """Populate context variables from test input definitions."""
    for name, var in test.inputs.items():
        if var.default is not None:
            context.variables[name] = var.default


def _seed_connectors(test: Test, context: ExecutionContext) -> None:
    """Expose connector config as context variables."""
    for role, config in test.connectors.items():
        context.variables[f"{role}_url"] = config.url
        context.variables[f"{role}_api_key"] = config.api_key


def run_test(test: Test) -> TestReport:
    """Synchronous convenience wrapper for running a test."""
    runner = TestRunner()
    return asyncio.run(runner.run(test))
