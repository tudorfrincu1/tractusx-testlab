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

"""Base step protocol and built-in step executor registry."""

from __future__ import annotations

import logging
import re
import uuid
from typing import Any, Protocol

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.models.test_models import Assertion, AssertionType, Severity, Step

logger = logging.getLogger(__name__)


# ── Step Executor Protocol ─────────────────────────────────────────────────────


class StepExecutor(Protocol):
    """Protocol for step executors — one per step type."""

    async def execute(
        self,
        step: Step,
        context: ExecutionContext,
    ) -> StepResult:
        """Execute a step and return the result."""
        ...


# ── Data containers ────────────────────────────────────────────────────────────


class StepResult:
    """Result of executing a single step."""

    __slots__ = ("outputs", "response_status", "response_body", "response_headers")

    def __init__(
        self,
        outputs: dict[str, Any] | None = None,
        response_status: int | None = None,
        response_body: Any = None,
        response_headers: dict[str, str] | None = None,
    ) -> None:
        self.outputs = outputs or {}
        self.response_status = response_status
        self.response_body = response_body
        self.response_headers = response_headers or {}


class AssertionResult:
    """Result of evaluating a single assertion."""

    __slots__ = ("assertion", "is_passed", "message")

    def __init__(self, assertion: Assertion, *, is_passed: bool, message: str = "") -> None:
        self.assertion = assertion
        self.is_passed = is_passed
        self.message = message


class ExecutionContext:
    """Shared mutable context carried through a test execution."""

    def __init__(self) -> None:
        self.variables: dict[str, Any] = {}
        self.mock_urls: dict[str, str] = {}
        self.created_resources: list[dict[str, Any]] = []

    def resolve_value(self, value: Any) -> Any:
        """Resolve @variable references in a value."""
        if isinstance(value, str) and value.startswith("@"):
            var_name = value[1:]
            if var_name not in self.variables:
                raise ExecutionError(f"Undefined variable '@{var_name}'")
            return self.variables[var_name]
        return value

    def resolve_inputs(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Resolve all @variable references in a step's inputs dict."""
        return {k: self.resolve_value(v) for k, v in inputs.items()}

    def generate_id(self) -> str:
        """Generate a UUID for auto-generated identifiers."""
        return str(uuid.uuid4())


# ── Assertion evaluator ────────────────────────────────────────────────────────


def evaluate_assertion(assertion: Assertion, result: StepResult) -> AssertionResult:
    """Evaluate a single assertion against a step result."""
    try:
        is_passed = _check_assertion(assertion, result)
        if assertion.negate:
            is_passed = not is_passed
        message = "" if is_passed else _failure_message(assertion, result)
        return AssertionResult(assertion, is_passed=is_passed, message=message)
    except Exception as exc:
        return AssertionResult(assertion, is_passed=False, message=str(exc))


def _check_assertion(assertion: Assertion, result: StepResult) -> bool:
    """Core assertion check logic (before negation)."""
    match assertion.type:
        case AssertionType.STATUS_CODE:
            return result.response_status == int(assertion.value)

        case AssertionType.EQUALS:
            actual = _extract_path(result.response_body, assertion.path)
            return actual == assertion.value

        case AssertionType.CONTAINS:
            actual = _extract_path(result.response_body, assertion.path)
            if isinstance(actual, str):
                return str(assertion.value) in actual
            if isinstance(actual, (list, dict)):
                return assertion.value in actual
            return False

        case AssertionType.REGEX:
            actual = _extract_path(result.response_body, assertion.path)
            if not isinstance(actual, str) or assertion.pattern is None:
                return False
            return bool(re.search(assertion.pattern, actual))

        case AssertionType.EXISTS:
            return _path_exists(result.response_body, assertion.path)

        case AssertionType.SCHEMA:
            # Schema validation placeholder — full jsonschema support deferred
            return assertion.schema_def is not None

        case AssertionType.CHECK_REQUEST:
            # Handled by the runner with mock recorded requests
            return True

        case _:
            return False


def _extract_path(body: Any, path: str | None) -> Any:
    """Extract a value from a nested dict using dot-separated path."""
    if path is None or body is None:
        return body
    current = body
    for segment in path.split("."):
        if isinstance(current, dict):
            current = current.get(segment)
        elif isinstance(current, list):
            try:
                current = current[int(segment)]
            except (ValueError, IndexError):
                return None
        else:
            return None
    return current


def _path_exists(body: Any, path: str | None) -> bool:
    """Check whether a dot-path exists in the body."""
    if path is None:
        return body is not None
    current = body
    for segment in path.split("."):
        if isinstance(current, dict):
            if segment not in current:
                return False
            current = current[segment]
        elif isinstance(current, list):
            try:
                current = current[int(segment)]
            except (ValueError, IndexError):
                return False
        else:
            return False
    return True


def _failure_message(assertion: Assertion, result: StepResult) -> str:
    """Build a human-readable failure message."""
    match assertion.type:
        case AssertionType.STATUS_CODE:
            return f"Expected status {assertion.value}, got {result.response_status}"
        case AssertionType.EQUALS:
            actual = _extract_path(result.response_body, assertion.path)
            return f"Expected '{assertion.value}' at '{assertion.path}', got '{actual}'"
        case AssertionType.CONTAINS:
            return f"Expected '{assertion.path}' to contain '{assertion.value}'"
        case AssertionType.REGEX:
            return f"Expected '{assertion.path}' to match pattern '{assertion.pattern}'"
        case AssertionType.EXISTS:
            return f"Expected path '{assertion.path}' to exist"
        case _:
            return f"Assertion {assertion.type.value} failed"


def is_hard_failure(results: list[AssertionResult]) -> bool:
    """Return True if any HARD assertion has failed."""
    return any(
        not r.is_passed and r.assertion.severity == Severity.HARD
        for r in results
    )
