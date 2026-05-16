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

import re
from typing import Any, Optional

from tractusx_testlab.models import (
    AssertionResult,
    AssertionSeverity,
    AssertionSummary,
    StepResult,
    ValueSource,
)
from tractusx_testlab.models.definitions import Assertion
from tractusx_testlab.models.enums import AssertionType
from tractusx_testlab.steps import _checks

# Matches a path segment with a predicate filter: ``name[key=value]``
_PREDICATE_RE = re.compile(r"^([^\[]+)\[([^=\]]+)=([^\]]*)\]$")
_SENTINEL = object()


def _snake_to_camel(name: str) -> str:
    """Convert ``snake_case`` to ``camelCase``."""
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _dict_get(d: dict, key: str) -> Any:
    """Get value from dict, trying original key first, then camelCase fallback."""
    if key in d:
        return d[key]
    camel = _snake_to_camel(key)
    if camel != key and camel in d:
        return d[camel]
    return None


def _traverse_dict(data: dict, path: str) -> Any:
    """Walk a nested dict/list structure along a dot-separated *path*."""
    parts = path.split(".")
    current: Any = data
    for part in parts:
        if current is None:
            return None
        m = _PREDICATE_RE.match(part)
        if m:
            name, pred_key, pred_val = m.group(1), m.group(2), m.group(3)
            current = _dict_get(current, name) if isinstance(current, dict) else None
            if not isinstance(current, list):
                return None
            current = _find_by_predicate(current, pred_key, pred_val)
        elif isinstance(current, dict):
            current = _dict_get(current, part)
        elif isinstance(current, list) and part.isdigit():
            idx = int(part)
            current = current[idx] if idx < len(current) else None
        else:
            return None
    return current


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
    # Individual assertion checks — delegated to _checks module
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_expected(assertion: Assertion, context_vars: dict) -> Any:
        if assertion.type == AssertionType.BETWEEN:
            return [assertion.min, assertion.max]
        if assertion.type == AssertionType.SCHEMA_VALIDATION:
            ref = assertion.schema_ref
            if isinstance(ref, str) and ref.startswith("@"):
                return context_vars.get(ref[1:], ref)
            return ref
        if assertion.type == AssertionType.ASSERT_FIELD:
            exp_val = assertion.expected
            if isinstance(exp_val, str) and exp_val.startswith("@"):
                exp_val = context_vars.get(exp_val[1:], exp_val)
            return {"operator": assertion.operator or "equals", "value": exp_val}
        if assertion.source == ValueSource.VARIABLE:
            var_name = assertion.value
            return context_vars.get(var_name, assertion.value)
        # Auto-resolve @var references in inline values
        val = assertion.value
        if isinstance(val, str) and val.startswith("@"):
            return context_vars.get(val[1:], val)
        return val

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
        # Unwrap StepOutput: check value dict → response attrs → StepOutput slots
        from tractusx_testlab.steps.base import StepOutput as _SO
        if isinstance(output, _SO):
            # Support compound dot-paths: split first segment for StepOutput resolution
            parts = path.split(".", 1)
            first = parts[0]
            rest = parts[1] if len(parts) > 1 else None

            # Map well-known aliases
            if first == "response_body":
                resolved = output.value if output.value is not None else (
                    output.response.body if output.response else None
                )
            elif isinstance(output.value, dict):
                result = _dict_get(output.value, first)
                if result is not None:
                    resolved = result
                elif not rest and ("." in path or "[" in path):
                    return _traverse_dict(output.value, path)
                else:
                    resolved = None
            else:
                resolved = None

            # Fall back to response attrs, StepOutput slots
            if resolved is None and output.response is not None:
                resp_val = getattr(output.response, first, _SENTINEL)
                if resp_val is not _SENTINEL:
                    resolved = resp_val
            # Check response body dict for keys like asset_id, policy_id
            if resolved is None and output.response is not None and isinstance(output.response.body, dict):
                body_val = output.response.body.get(first)
                if body_val is not None:
                    resolved = body_val
            if resolved is None:
                slot_val = getattr(output, first, _SENTINEL)
                if slot_val is not _SENTINEL:
                    resolved = slot_val

            # If there's a remaining path and resolved is navigable, continue
            if rest and resolved is not None:
                if isinstance(resolved, dict):
                    return _traverse_dict(resolved, rest)
                return getattr(resolved, rest, None)

            # Final fallback: full dot-path traversal on value dict
            if resolved is None and isinstance(output.value, dict):
                return _traverse_dict(output.value, path)
            return resolved

        if isinstance(output, dict):
            return _traverse_dict(output, path)
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
_ASSERTION_CHECKS = {
    AssertionType.EXACT: _checks.check_exact,
    AssertionType.STATUS_CODE: _checks.check_status_code,
    AssertionType.CONTAINS: _checks.check_contains,
    AssertionType.REGEX: _checks.check_regex,
    AssertionType.SCHEMA: _checks.check_schema,
    AssertionType.NOT_NULL: _checks.check_not_null,
    AssertionType.NOT_EMPTY: _checks.check_not_empty,
    AssertionType.EQUALS: _checks.check_equals,
    AssertionType.NOT_EQUALS: _checks.check_not_equals,
    AssertionType.NOT_CONTAINS: _checks.check_not_contains,
    AssertionType.SCHEMA_VALIDATION: _checks.check_schema_validation,
    AssertionType.GREATER_THAN: _checks.check_greater_than,
    AssertionType.LESS_THAN: _checks.check_less_than,
    AssertionType.GREATER_OR_EQUAL: _checks.check_greater_or_equal,
    AssertionType.LESS_OR_EQUAL: _checks.check_less_or_equal,
    AssertionType.BETWEEN: _checks.check_between,
    AssertionType.ASSERT_FIELD: _checks.check_assert_field,
}
