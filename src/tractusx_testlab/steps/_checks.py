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
from typing import Any

import jsonschema


def check_exact(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    passed = actual == expected
    return passed, "" if passed else f"Expected {expected!r}, got {actual!r}"


def check_status_code(actual: Any, expected: Any, output: Any) -> tuple[bool, str]:
    actual_code = actual if isinstance(actual, int) else getattr(output, "status_code", None)
    passed = actual_code == expected
    return passed, "" if passed else f"Expected status_code={expected}, got {actual_code}"


def check_contains(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    if isinstance(actual, str) and isinstance(expected, str):
        passed = expected in actual
    elif isinstance(actual, list):
        passed = expected in actual
    elif isinstance(actual, dict):
        passed = expected in actual.values()
    else:
        passed = False
    return passed, "" if passed else f"Expected output to contain {expected!r}"


def check_not_contains(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    if isinstance(actual, str) and isinstance(expected, str):
        passed = expected not in actual
    elif isinstance(actual, (list, dict)):
        passed = expected not in actual
    else:
        passed = True
    return passed, "" if passed else f"Expected output to NOT contain {expected!r}"


def check_regex(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    passed = bool(re.search(expected, actual)) if isinstance(actual, str) and isinstance(expected, str) else False
    return passed, "" if passed else f"Pattern {expected!r} not found in output"


def check_schema(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    try:
        schema = expected if isinstance(expected, dict) else json.loads(expected)
        jsonschema.validate(actual, schema)
        return True, ""
    except jsonschema.ValidationError as exc:
        return False, f"Schema validation failed: {exc.message}"
    except (json.JSONDecodeError, TypeError) as exc:
        return False, f"Invalid schema: {exc}"


def check_schema_validation(_actual: Any, _expected: Any, _output: Any) -> tuple[bool, str]:
    """Validate against a schema URN — placeholder until external resolver is wired."""
    return False, "SCHEMA_VALIDATION requires external schema resolver (not yet wired)"


def check_not_null(actual: Any, _expected: Any, _output: Any) -> tuple[bool, str]:
    passed = actual is not None
    return passed, "" if passed else "Expected non-null value, got None"


def check_not_empty(actual: Any, _expected: Any, _output: Any) -> tuple[bool, str]:
    if actual is None:
        return False, "Expected non-empty value, got None"
    if isinstance(actual, (str, list, dict)):
        passed = len(actual) > 0
        return passed, "" if passed else f"Expected non-empty value, got empty {type(actual).__name__}"
    return True, ""


def check_equals(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    passed = actual == expected
    return passed, "" if passed else f"Expected {expected!r}, got {actual!r}"


def check_not_equals(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    passed = actual != expected
    return passed, "" if passed else f"Expected value != {expected!r}, got {actual!r}"


def check_greater_than(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    try:
        passed = float(actual) > float(expected)
        return passed, "" if passed else f"Expected {actual} > {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_less_than(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    try:
        passed = float(actual) < float(expected)
        return passed, "" if passed else f"Expected {actual} < {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_greater_or_equal(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    try:
        passed = float(actual) >= float(expected)
        return passed, "" if passed else f"Expected {actual} >= {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_less_or_equal(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
    try:
        passed = float(actual) <= float(expected)
        return passed, "" if passed else f"Expected {actual} <= {expected}"
    except (TypeError, ValueError) as exc:
        return False, f"Cannot compare: {exc}"


def check_between(actual: Any, expected: Any, _output: Any) -> tuple[bool, str]:
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
