#################################################################################
# Eclipse Tractus-X - Software Development KIT
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

"""json_path_extract validation type — extracts and validates nested values inline."""

from __future__ import annotations

from typing import Any, Optional

from tractusx_testlab.models.definitions import Assertion
from tractusx_testlab.models.results import AssertionResult


def evaluate_json_path_extract(
    assertion: Assertion,
    output: Any,
    context_vars: dict,
    extract_actual_fn: Any,
    evaluate_fn: Any,
) -> AssertionResult:
    """Handle json_path_extract as a validation type.

    Extracts a value from the output/variable using json_path, optionally
    stores it, and recursively evaluates nested validate assertions.

    Args:
        assertion: The assertion definition with json_path and optional nested validate.
        output: The step output to extract from.
        context_vars: Mutable dict of context variables (for storage and resolution).
        extract_actual_fn: Callable to extract a value from output by path.
        evaluate_fn: Callable to recursively evaluate nested assertions.
    """
    from tractusx_testlab.steps.utility.json_extract import _extract_by_path

    # Resolve source data: assertion.path comes from 'output' alias in YAML
    source_name = assertion.path
    if source_name and source_name in context_vars:
        data = context_vars[source_name]
    else:
        data = extract_actual_fn(output, source_name)

    json_path = assertion.json_path
    if not json_path:
        return AssertionResult(
            assertion=assertion,
            passed=False,
            expected="json_path field required",
            actual=None,
            message="json_path_extract validation requires 'json_path' field",
            severity=assertion.severity,
        )

    try:
        extracted = _extract_by_path(data, json_path)
    except (KeyError, IndexError, TypeError) as exc:
        return AssertionResult(
            assertion=assertion,
            passed=False,
            expected=f"value at path '{json_path}'",
            actual=None,
            message=f"Path extraction failed: {exc}",
            severity=assertion.severity,
        )

    # Store extracted value in context if requested
    if assertion.store_in_variable:
        context_vars[assertion.store_in_variable] = extracted

    # Evaluate nested validations on extracted value
    nested_failures: list[str] = []
    if assertion.nested_validate:
        # Pass context_vars as output so nested assertions can resolve
        # stored variables via their 'output' field (path alias)
        nested_results = evaluate_fn(
            assertion.nested_validate, context_vars, context_vars
        )
        nested_failures = [r.message for r in nested_results if not r.passed]

    passed = len(nested_failures) == 0
    message = "; ".join(nested_failures) if nested_failures else ""

    return AssertionResult(
        assertion=assertion,
        passed=passed,
        expected=f"value at path '{json_path}'",
        actual=extracted,
        message=message,
        severity=assertion.severity,
    )
