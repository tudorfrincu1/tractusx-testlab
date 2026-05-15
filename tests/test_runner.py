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

"""Tests for the runner subsystem (base_step, assertions, context)."""

from __future__ import annotations

import pytest

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.models.test_models import Assertion, AssertionType, Severity
from tractusx_testlab.runner.base_step import (
    AssertionResult,
    ExecutionContext,
    StepResult,
    evaluate_assertion,
    is_hard_failure,
)


class TestExecutionContext:
    def test_resolve_simple_value(self) -> None:
        ctx = ExecutionContext()
        assert ctx.resolve_value("hello") == "hello"

    def test_resolve_variable_reference(self) -> None:
        ctx = ExecutionContext()
        ctx.variables["asset_id"] = "uuid-123"
        assert ctx.resolve_value("@asset_id") == "uuid-123"

    def test_resolve_undefined_variable_raises(self) -> None:
        ctx = ExecutionContext()
        with pytest.raises(ExecutionError, match="Undefined variable"):
            ctx.resolve_value("@missing")

    def test_resolve_inputs(self) -> None:
        ctx = ExecutionContext()
        ctx.variables["name"] = "Test Part"
        resolved = ctx.resolve_inputs({"label": "@name", "count": 42})
        assert resolved == {"label": "Test Part", "count": 42}

    def test_generate_id(self) -> None:
        ctx = ExecutionContext()
        id1 = ctx.generate_id()
        id2 = ctx.generate_id()
        assert id1 != id2
        assert len(id1) == 36  # UUID format


class TestAssertionEvaluation:
    def test_status_code_pass(self) -> None:
        a = Assertion(type=AssertionType.STATUS_CODE, value=200)
        result = StepResult(response_status=200)
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_status_code_fail(self) -> None:
        a = Assertion(type=AssertionType.STATUS_CODE, value=200)
        result = StepResult(response_status=404)
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed
        assert "404" in ar.message

    def test_equals_pass(self) -> None:
        a = Assertion(type=AssertionType.EQUALS, path="status", value="ok")
        result = StepResult(response_body={"status": "ok"})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_equals_fail(self) -> None:
        a = Assertion(type=AssertionType.EQUALS, path="status", value="ok")
        result = StepResult(response_body={"status": "error"})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_contains_pass(self) -> None:
        a = Assertion(type=AssertionType.CONTAINS, path="message", value="success")
        result = StepResult(response_body={"message": "Operation success"})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_contains_in_list(self) -> None:
        a = Assertion(type=AssertionType.CONTAINS, path="items", value="a")
        result = StepResult(response_body={"items": ["a", "b", "c"]})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_contains_fail_non_string(self) -> None:
        a = Assertion(type=AssertionType.CONTAINS, path="count", value="x")
        result = StepResult(response_body={"count": 42})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_contains_fail_message(self) -> None:
        a = Assertion(type=AssertionType.CONTAINS, path="msg", value="missing")
        result = StepResult(response_body={"msg": "hello"})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed
        assert "contain" in ar.message

    def test_regex_pass(self) -> None:
        a = Assertion(type=AssertionType.REGEX, path="id", pattern=r"^urn:uuid:")
        result = StepResult(response_body={"id": "urn:uuid:abc-123"})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_regex_fail_no_match(self) -> None:
        a = Assertion(type=AssertionType.REGEX, path="id", pattern=r"^urn:uuid:")
        result = StepResult(response_body={"id": "not-a-uuid"})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed
        assert "match" in ar.message

    def test_regex_fail_non_string(self) -> None:
        a = Assertion(type=AssertionType.REGEX, path="count", pattern=r"\d+")
        result = StepResult(response_body={"count": 42})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_regex_fail_no_pattern(self) -> None:
        a = Assertion(type=AssertionType.REGEX, path="id")
        result = StepResult(response_body={"id": "something"})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_exists_pass(self) -> None:
        a = Assertion(type=AssertionType.EXISTS, path="data.items")
        result = StepResult(response_body={"data": {"items": []}})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_exists_fail(self) -> None:
        a = Assertion(type=AssertionType.EXISTS, path="data.missing")
        result = StepResult(response_body={"data": {}})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed
        assert "exist" in ar.message

    def test_exists_no_path(self) -> None:
        a = Assertion(type=AssertionType.EXISTS)
        result = StepResult(response_body={"some": "data"})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_exists_no_path_none_body(self) -> None:
        a = Assertion(type=AssertionType.EXISTS)
        result = StepResult(response_body=None)
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_schema_with_schema_def(self) -> None:
        a = Assertion(type=AssertionType.SCHEMA, schema_def={"type": "object"})
        result = StepResult(response_body={})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_schema_without_schema_def(self) -> None:
        a = Assertion(type=AssertionType.SCHEMA)
        result = StepResult(response_body={})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_check_request_always_passes(self) -> None:
        a = Assertion(type=AssertionType.CHECK_REQUEST)
        result = StepResult()
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_negate_inverts_result(self) -> None:
        a = Assertion(type=AssertionType.STATUS_CODE, value=404, negate=True)
        result = StepResult(response_status=200)
        ar = evaluate_assertion(a, result)
        assert ar.is_passed  # 200 != 404, negated = pass

    def test_nested_path_extraction(self) -> None:
        a = Assertion(type=AssertionType.EQUALS, path="a.b.c", value=42)
        result = StepResult(response_body={"a": {"b": {"c": 42}}})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_list_index_path(self) -> None:
        a = Assertion(type=AssertionType.EQUALS, path="items.0.name", value="first")
        result = StepResult(response_body={"items": [{"name": "first"}]})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_path_through_non_container(self) -> None:
        """Extracting a path through a scalar returns None."""
        a = Assertion(type=AssertionType.EQUALS, path="a.b.c", value="x")
        result = StepResult(response_body={"a": "scalar"})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_list_bad_index(self) -> None:
        a = Assertion(type=AssertionType.EXISTS, path="items.99")
        result = StepResult(response_body={"items": [1, 2]})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_list_non_numeric_index(self) -> None:
        a = Assertion(type=AssertionType.EXISTS, path="items.abc")
        result = StepResult(response_body={"items": [1, 2]})
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed

    def test_extract_path_none_body(self) -> None:
        a = Assertion(type=AssertionType.EQUALS, path="a", value=None)
        result = StepResult(response_body=None)
        ar = evaluate_assertion(a, result)
        assert ar.is_passed  # None == None

    def test_extract_path_no_path(self) -> None:
        a = Assertion(type=AssertionType.EQUALS, value={"key": "val"})
        result = StepResult(response_body={"key": "val"})
        ar = evaluate_assertion(a, result)
        assert ar.is_passed

    def test_default_failure_message(self) -> None:
        """Unknown/fallback assertion types get generic failure message."""
        a = Assertion(type=AssertionType.SCHEMA)  # schema_def is None → fails
        result = StepResult()
        ar = evaluate_assertion(a, result)
        assert not ar.is_passed
        assert "failed" in ar.message.lower()


class TestIsHardFailure:
    def test_no_failures(self) -> None:
        results = [
            AssertionResult(
                Assertion(type=AssertionType.STATUS_CODE, value=200),
                is_passed=True,
            ),
        ]
        assert not is_hard_failure(results)

    def test_soft_failure_not_hard(self) -> None:
        results = [
            AssertionResult(
                Assertion(type=AssertionType.CONTAINS, value="x", severity=Severity.SOFT),
                is_passed=False,
            ),
        ]
        assert not is_hard_failure(results)

    def test_hard_failure(self) -> None:
        results = [
            AssertionResult(
                Assertion(type=AssertionType.STATUS_CODE, value=200, severity=Severity.HARD),
                is_passed=False,
            ),
        ]
        assert is_hard_failure(results)
