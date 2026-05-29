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

"""Individual assertion check functions used by AssertionEngine."""

from __future__ import annotations

import json
import re

import jsonschema


def check_exact(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual value equals expected exactly."""
    passed = actual == expected
    return passed, "" if passed else f"Expected {expected!r}, got {actual!r}"


def check_status_code(actual: object, expected: object, output: object) -> tuple[bool, str]:
    """Check that the HTTP status code matches expected."""
    actual_code = actual if isinstance(actual, int) else getattr(output, "status_code", None)
    passed = actual_code == expected
    return passed, "" if passed else f"Expected status_code={expected}, got {actual_code}"


def check_contains(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual contains expected (string, list, or dict values)."""
    if isinstance(actual, str) and isinstance(expected, str):
        passed = expected in actual
    elif isinstance(actual, list):
        passed = expected in actual
    elif isinstance(actual, dict):
        passed = expected in actual.values()
    else:
        passed = False
    return passed, "" if passed else f"Expected output to contain {expected!r}"


def check_not_contains(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual does not contain expected."""
    if isinstance(actual, str) and isinstance(expected, str):
        passed = expected not in actual
    elif isinstance(actual, (list, dict)):
        passed = expected not in actual
    else:
        passed = True
    return passed, "" if passed else f"Expected output to NOT contain {expected!r}"


def check_regex(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual string matches the expected regex pattern."""
    passed = bool(re.search(expected, actual)) if isinstance(actual, str) and isinstance(expected, str) else False
    return passed, "" if passed else f"Pattern {expected!r} not found in output"


def check_schema(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Validate actual against a JSON schema (dict or JSON string)."""
    try:
        schema = expected if isinstance(expected, dict) else json.loads(expected)
        jsonschema.validate(actual, schema)
        return True, ""
    except jsonschema.ValidationError as exc:
        return False, f"Schema validation failed: {exc.message}"
    except (json.JSONDecodeError, TypeError) as exc:
        return False, f"Invalid schema: {exc}"


def check_schema_validation(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Validate *actual* against a JSON schema provided in *expected*.

    *expected* should be a parsed JSON schema dict (loaded by ``load_schema``).
    """
    if expected is None:
        return False, "SCHEMA_VALIDATION: no schema provided"
    try:
        schema = expected if isinstance(expected, dict) else json.loads(expected)
        jsonschema.validate(actual, schema)
        return True, ""
    except jsonschema.ValidationError as exc:
        return False, f"Schema validation failed: {exc.message}"
    except (json.JSONDecodeError, TypeError) as exc:
        return False, f"Invalid schema: {exc}"


def check_not_null(actual: object, _expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is not None."""
    passed = actual is not None
    return passed, "" if passed else "Expected non-null value, got None"


def check_not_empty(actual: object, _expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is not empty (None, empty string, list, or dict)."""
    if actual is None:
        return False, "Expected non-empty value, got None"
    if isinstance(actual, (str, list, dict)):
        passed = len(actual) > 0
        return passed, "" if passed else f"Expected non-empty value, got empty {type(actual).__name__}"
    return True, ""


def check_equals(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual equals expected."""
    passed = actual == expected
    return passed, "" if passed else f"Expected {expected!r}, got {actual!r}"


def check_not_equals(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual does not equal expected."""
    passed = actual != expected
    return passed, "" if passed else f"Expected value != {expected!r}, got {actual!r}"


def check_greater_than(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is strictly greater than expected."""
    try:
        passed = float(actual) > float(expected)
        return passed, "" if passed else f"Expected {actual} > {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_less_than(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is strictly less than expected."""
    try:
        passed = float(actual) < float(expected)
        return passed, "" if passed else f"Expected {actual} < {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_greater_or_equal(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is greater than or equal to expected."""
    try:
        passed = float(actual) >= float(expected)
        return passed, "" if passed else f"Expected {actual} >= {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_less_or_equal(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is less than or equal to expected."""
    try:
        passed = float(actual) <= float(expected)
        return passed, "" if passed else f"Expected {actual} <= {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_between(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check value is within [min, max] range. Expected is (min, max) tuple or list."""
    try:
        if isinstance(expected, (list, tuple)) and len(expected) == 2:
            lo, hi = float(expected[0]), float(expected[1])
        else:
            return False, f"BETWEEN expects [min, max], got {expected!r}"
        val = float(actual)
        passed = lo <= val <= hi
        return passed, "" if passed else f"Expected {lo} <= {actual} <= {hi}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_assert_field(actual: object, expected: object, _output: object) -> tuple[bool, str]:
    """Check a field value using an operator + expected pair.

    *expected* must be a dict with ``operator`` and optionally ``value`` keys.
    Supported operators: equals, not_null, not_empty, contains, not_contains.
    """
    if not isinstance(expected, dict):
        return False, f"ASSERT_FIELD expects {{operator, value}} dict, got {type(expected).__name__}"

    operator = expected.get("operator", "equals")
    exp_value = expected.get("value")

    if operator == "equals":
        passed = actual == exp_value
        return passed, "" if passed else f"Expected {exp_value!r}, got {actual!r}"
    if operator == "not_null":
        passed = actual is not None
        return passed, "" if passed else "Expected non-null value, got None"
    if operator == "not_empty":
        passed = actual is not None and actual != "" and actual != [] and actual != {}
        return passed, "" if passed else f"Expected non-empty value, got {actual!r}"
    if operator == "contains":
        passed = exp_value in actual if isinstance(actual, (str, list, dict)) else False
        return passed, "" if passed else f"Expected {actual!r} to contain {exp_value!r}"
    if operator == "not_contains":
        passed = exp_value not in actual if isinstance(actual, (str, list, dict)) else True
        return passed, "" if passed else f"Expected {actual!r} to NOT contain {exp_value!r}"

    return False, f"Unknown ASSERT_FIELD operator: {operator}"
