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

from typing import Optional

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
from tractusx_testlab.steps._checks.extraction import (
    extract_path,
    _traverse_dict,
    _dict_get,
    _snake_to_camel,
    _match_predicate_value,
    _find_by_predicate,
    _PREDICATE_RE,
    _SENTINEL,
)


class AssertionEngine:
    """Evaluates a list of assertions against a step's output value."""

    @staticmethod
    def evaluate(
        assertions: list[Assertion],
        output: object,
        context_vars: Optional[dict[str, object]] = None,
    ) -> list[AssertionResult]:
        return [
            AssertionEngine._evaluate_one(assertion, output, context_vars or {})
            for assertion in assertions
        ]

    @staticmethod
    def _evaluate_one(
        assertion: Assertion,
        output: object,
        context_vars: dict[str, object],
    ) -> AssertionResult:
        if assertion.type == AssertionType.JSON_PATH_EXTRACT:
            from tractusx_testlab.steps._checks.json_path import (
                evaluate_json_path_extract,
            )
            return evaluate_json_path_extract(
                assertion, output, context_vars,
                extract_actual_fn=AssertionEngine.extract_path,
                evaluate_fn=AssertionEngine.evaluate,
            )

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
    def _resolve_expected(assertion: Assertion, context_vars: dict[str, object]) -> object:
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
    def extract_path(output: object, path: Optional[str]) -> object:
        """Extract a value from a nested dict/list/object using dot-separated *path*."""
        return extract_path(output, path)

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
