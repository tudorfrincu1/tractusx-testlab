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

"""Evaluates assertion blocks against step outputs."""

from __future__ import annotations

import json
import re
from typing import Any, Optional

import jsonschema

# Matches a path segment with a predicate filter: ``name[key=value]``
_PREDICATE_RE = re.compile(r"^([^\[]+)\[([^=\]]+)=([^\]]*)\]$")

from tractusx_testlab.models import (
    Assertion,
    AssertionResult,
    AssertionSeverity,
    AssertionSummary,
    AssertionType,
    StepResult,
    ValueSource,
)


class AssertionEngine:
    """Evaluates a list of assertions against a step's output value."""

    @staticmethod
    def evaluate(
        assertions: list[Assertion],
        output: Any,
        context_vars: Optional[dict] = None,
    ) -> list[AssertionResult]:
        return [
            AssertionEngine._evaluate_one(assertion, output, context_vars or {})
            for assertion in assertions
        ]

    @staticmethod
    def _evaluate_one(
        assertion: Assertion,
        output: Any,
        context_vars: dict,
    ) -> AssertionResult:
        expected = AssertionEngine._resolve_expected(assertion, context_vars)
        actual = AssertionEngine._extract_actual(output, assertion.path)

        check = _ASSERTION_CHECKS.get(assertion.type)
        if check is None:
            passed, message = False, f"Unknown assertion type: {assertion.type}"
        else:
            passed, message = check(actual, expected, output)

        return AssertionResult(
            assertion=assertion,
            passed=passed,
            expected=expected,
            actual=actual,
            message=message if not passed else "",
            severity=assertion.severity,
        )

    # ------------------------------------------------------------------
    # Individual assertion checks — each returns (passed, failure_message)
    # ------------------------------------------------------------------

    @staticmethod
    def _check_exact(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
        passed = actual == expected
        return passed, "" if passed else f"Expected {expected!r}, got {actual!r}"

    @staticmethod
    def _check_status_code(actual: Any, expected: Any, output: Any) -> tuple[bool, str]:
        actual_code = actual if isinstance(actual, int) else getattr(output, "status_code", None)
        passed = actual_code == expected
        return passed, "" if passed else f"Expected status_code={expected}, got {actual_code}"

    @staticmethod
    def _check_contains(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
        if isinstance(actual, str) and isinstance(expected, str):
            passed = expected in actual
        elif isinstance(actual, list):
            passed = expected in actual
        elif isinstance(actual, dict):
            passed = expected in actual.values()
        else:
            passed = False
        return passed, "" if passed else f"Expected output to contain {expected!r}"

    @staticmethod
    def _check_regex(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
        passed = bool(re.search(expected, actual)) if isinstance(actual, str) and isinstance(expected, str) else False
        return passed, "" if passed else f"Pattern {expected!r} not found in output"

    @staticmethod
    def _check_schema(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
        try:
            schema = expected if isinstance(expected, dict) else json.loads(expected)
            jsonschema.validate(actual, schema)
            return True, ""
        except jsonschema.ValidationError as exc:
            return False, f"Schema validation failed: {exc.message}"
        except (json.JSONDecodeError, TypeError) as exc:
            return False, f"Invalid schema: {exc}"

    @staticmethod
    def _resolve_expected(assertion: Assertion, context_vars: dict) -> Any:
        if assertion.source == ValueSource.VARIABLE:
            var_name = assertion.value
            return context_vars.get(var_name, assertion.value)
        return assertion.value

    @staticmethod
    def extract_path(output: Any, path: Optional[str]) -> Any:
        """Extract a value from a nested dict/list/object using dot-separated *path*.

        Supports predicate-based array filtering: ``items[key='value']``
        selects the first element in the ``items`` list whose ``key`` field
        equals ``value``.  For example::

            componentResults[component='Hashicorp Vault Health'].isHealthy

        resolves as:

        1. ``componentResults`` → the full array
        2. ``[component='Hashicorp Vault Health']`` → first element where
           ``component == "Hashicorp Vault Health"``
        3. ``.isHealthy`` → the ``isHealthy`` value from that element

        **Quoting:** single-quoted values do exact string comparison;
        unquoted values use type coercion (booleans case-insensitive,
        numbers by ``str()``).
        """
        if path is None:
            return output
        if isinstance(output, dict):
            parts = path.split(".")
            current = output
            for part in parts:
                if current is None:
                    return None
                m = _PREDICATE_RE.match(part)
                if m:
                    name, pred_key, pred_val = m.group(1), m.group(2), m.group(3)
                    if isinstance(current, dict):
                        current = current.get(name)
                    else:
                        return None
                    if not isinstance(current, list):
                        return None
                    current = _find_by_predicate(current, pred_key, pred_val)
                elif isinstance(current, dict):
                    current = current.get(part)
                elif isinstance(current, list) and part.isdigit():
                    idx = int(part)
                    current = current[idx] if idx < len(current) else None
                else:
                    return None
            return current
        return getattr(output, path, None)

    # Keep old name as internal alias for backward compatibility
    _extract_actual = extract_path

    @staticmethod
    def has_hard_failure(results: list[AssertionResult]) -> bool:
        return any(
            not result.passed and result.severity == AssertionSeverity.HARD
            for result in results
        )

    @staticmethod
    def build_summary(step_results: list[StepResult]) -> AssertionSummary:
        """Aggregate assertion counts across step results."""
        total = passed = failed_hard = failed_soft = 0
        for step_result in step_results:
            for assertion_result in step_result.assertions:
                total += 1
                if assertion_result.passed:
                    passed += 1
                elif assertion_result.severity.value == "HARD":
                    failed_hard += 1
                else:
                    failed_soft += 1
        return AssertionSummary(
            total=total, passed=passed,
            failed_hard=failed_hard, failed_soft=failed_soft,
        )


def _match_predicate_value(actual: Any, expected: str) -> bool:
    """Return ``True`` when *actual* is semantically equal to the predicate string.

    Quoted values (``'...'``) are compared as exact strings.
    Unquoted values use type coercion (booleans case-insensitive, numbers by
    string representation).
    """
    if actual is None:
        return False
    # Quoted value → exact string comparison
    if len(expected) >= 2 and expected[0] == "'" and expected[-1] == "'":
        return str(actual) == expected[1:-1]
    # Unquoted → type-coerced comparison
    if isinstance(actual, str):
        return actual == expected
    if isinstance(actual, bool):
        return str(actual).lower() == expected.lower()
    return str(actual) == expected


def _find_by_predicate(items: list, key: str, value: str) -> Any:
    """Return the first element in *items* whose *key* matches *value*."""
    for item in items:
        if isinstance(item, dict) and _match_predicate_value(item.get(key), value):
            return item
    return None


# Dispatch table mapping assertion types to their check functions.
# Defined at module level after the class so names resolve cleanly.
_ASSERTION_CHECKS = {
    AssertionType.EXACT: AssertionEngine._check_exact,
    AssertionType.STATUS_CODE: AssertionEngine._check_status_code,
    AssertionType.CONTAINS: AssertionEngine._check_contains,
    AssertionType.REGEX: AssertionEngine._check_regex,
    AssertionType.SCHEMA: AssertionEngine._check_schema,
}
