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

"""Execution context, step results, assertion evaluation, and failure detection."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from tractusx_testlab.exceptions import ExecutionError

if TYPE_CHECKING:
    from tractusx_testlab.models.test_models import Assertion, Severity


@dataclass
class ExecutionContext:
    """Mutable runtime state shared across all steps in a test."""

    variables: dict[str, Any] = field(default_factory=dict)
    created_resources: list[dict[str, Any]] = field(default_factory=list)

    def resolve_value(self, value: Any) -> Any:  # Any: step inputs can be any YAML type
        """Resolve a value — if it starts with '@', look up in variables."""
        if isinstance(value, str) and value.startswith("@"):
            var_name = value[1:]
            if var_name not in self.variables:
                raise ExecutionError(
                    f"Undefined variable '@{var_name}' — not set in execution context"
                )
            return self.variables[var_name]
        return value

    def resolve_inputs(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Resolve all values in an inputs dict, expanding @variable references."""
        return {key: self.resolve_value(val) for key, val in inputs.items()}

    def generate_id(self) -> str:
        """Return a new UUID4 string."""
        return str(uuid.uuid4())


@dataclass
class StepResult:
    """Output produced by a step executor."""

    response_status: int | None = None
    response_body: Any = None  # Any: body can be dict, list, str, None
    outputs: dict[str, Any] = field(default_factory=dict)


@dataclass
class AssertionResult:
    """Outcome of evaluating a single assertion against a StepResult."""

    assertion: Any  # Assertion from test_models — kept as Any to avoid circular import
    is_passed: bool
    message: str = ""


def _extract_path(body: Any, path: str | None) -> Any:  # Any: JSON body can be dict, list, scalar
    """Extract a value from body by dot-separated path.

    Supports numeric list indices (e.g. 'items.0.name').
    Returns None if any segment traversal fails.
    """
    if path is None:
        return body
    if body is None:
        return None

    current: Any = body  # Any: JSON traversal target can be dict, list, or scalar
    for segment in path.split("."):
        if isinstance(current, dict):
            current = current.get(segment)
        elif isinstance(current, list):
            if not re.fullmatch(r"\d+", segment):
                return None
            index = int(segment)
            if index >= len(current):
                return None
            current = current[index]
        else:
            return None
    return current


def evaluate_assertion(assertion: "Assertion", result: StepResult) -> AssertionResult:
    """Evaluate one assertion against a step result and return the outcome."""
    from tractusx_testlab.models.test_models import AssertionType

    is_passed, message = _evaluate_raw(assertion, result)

    if assertion.negate:
        is_passed = not is_passed

    return AssertionResult(assertion=assertion, is_passed=is_passed, message=message)


def _evaluate_raw(assertion: "Assertion", result: StepResult) -> tuple[bool, str]:
    """Return (is_passed, message) without applying negate."""
    from tractusx_testlab.models.test_models import AssertionType

    atype = assertion.type

    if atype == AssertionType.STATUS_CODE:
        actual = result.response_status
        passed = actual == assertion.value
        msg = "" if passed else f"Expected status {assertion.value}, got {actual}"
        return passed, msg

    if atype == AssertionType.EQUALS:
        actual = _extract_path(result.response_body, assertion.path)
        passed = actual == assertion.value
        return passed, "" if passed else "Values are not equal"

    if atype == AssertionType.CONTAINS:
        actual = _extract_path(result.response_body, assertion.path)
        if isinstance(actual, str):
            passed = str(assertion.value) in actual
        elif isinstance(actual, list):
            passed = assertion.value in actual
        else:
            return False, f"Value at path does not contain {assertion.value!r}"
        return passed, "" if passed else f"Value does not contain {assertion.value!r}"

    if atype == AssertionType.REGEX:
        actual = _extract_path(result.response_body, assertion.path)
        if not isinstance(actual, str):
            return False, "Value is not a string — cannot match regex"
        if not assertion.pattern:
            return False, "No pattern provided for REGEX assertion"
        passed = bool(re.search(assertion.pattern, actual))
        return passed, "" if passed else f"Value does not match pattern {assertion.pattern!r}"

    if atype == AssertionType.EXISTS:
        if assertion.path:
            actual = _extract_path(result.response_body, assertion.path)
            passed = actual is not None
        else:
            passed = result.response_body is not None
        return passed, "" if passed else "Expected value to exist but it was None"

    if atype == AssertionType.SCHEMA:
        passed = assertion.schema_def is not None
        return passed, "" if passed else "assertion failed — no schema_def provided"

    if atype == AssertionType.CHECK_REQUEST:
        return True, ""

    return False, "assertion failed"


def is_hard_failure(results: list[AssertionResult]) -> bool:
    """Return True if any result is failed and has HARD severity."""
    from tractusx_testlab.models.test_models import Severity

    return any(
        not r.is_passed and r.assertion.severity == Severity.HARD
        for r in results
    )
