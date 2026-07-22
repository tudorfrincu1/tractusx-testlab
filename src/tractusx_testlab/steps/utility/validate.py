################################################################################
# Eclipse Tractus-X - Tractus-X TestLab
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
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""validate/assert, validate/field and validate/schema — standalone assertion steps."""

from __future__ import annotations

import json
import re
from typing import TYPE_CHECKING, Any

import jsonschema

from tractusx_testlab.models import StepDefinitionV2
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


def _check(operator: str, actual: Any, expected: Any) -> tuple[bool, str]:
    """Apply *operator* to *actual*/*expected*; return ``(passed, error_message)``."""
    if operator == "not_null":
        return actual is not None, "Expected non-null value, got None"
    if operator == "null":
        return actual is None, f"Expected null, got {actual!r}"
    if operator == "not_empty":
        return bool(actual), f"Expected non-empty value, got {actual!r}"
    if operator == "equals":
        passed = actual == expected or str(actual) == str(expected)
        return passed, f"Expected {expected!r}, got {actual!r}"
    if operator == "not_equals":
        passed = actual != expected and str(actual) != str(expected)
        return passed, f"Expected value != {expected!r}, got {actual!r}"
    if operator == "matches_regex":
        passed = isinstance(actual, str) and bool(re.search(str(expected), actual))
        return passed, f"Pattern {expected!r} not matched in {actual!r}"
    if operator == "contains":
        passed = str(expected) in str(actual) if actual is not None else False
        return passed, f"Expected {actual!r} to contain {expected!r}"
    if operator == "not_contains":
        passed = str(expected) not in str(actual) if actual is not None else True
        return passed, f"Expected {actual!r} to NOT contain {expected!r}"
    raise ValueError(f"Unknown operator: {operator!r}")


def _get_nested(obj: Any, path: str) -> Any:
    """Traverse a dot-separated path through nested dicts/lists."""
    current = obj
    for segment in path.split("."):
        if isinstance(current, dict):
            current = current.get(segment)
        elif isinstance(current, list) and segment.isdigit():
            current = current[int(segment)]
        else:
            return None
        if current is None:
            return None
    return current


@step("validate/assert")
class ValidateAssertStep(BaseStep):
    """Assert that a value satisfies an operator condition.

    Raises ``ValueError`` on failure so the runner marks the step as FAILED.

    Params:
        input: The value to validate (resolved variable reference).
        operator: One of ``not_null``, ``null``, ``not_empty``, ``equals``,
                  ``not_equals``, ``matches_regex``, ``contains``, ``not_contains``.
        value: Expected value (required for binary operators).
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinitionV2,
    ) -> StepOutput:
        actual = params.get("input")
        operator = params.get("operator", "not_null")
        expected = params.get("value")
        passed, message = _check(operator, actual, expected)
        if not passed:
            raise ValueError(f"Assertion failed [{operator}]: {message}")
        return StepOutput(value=actual)


@step("validate/field")
class ValidateFieldStep(BaseStep):
    """Assert that a field at a dot-separated path satisfies an operator condition.

    Raises ``ValueError`` on failure so the runner marks the step as FAILED.

    Params:
        input: Object (dict) to extract the field from.
        path: Dot-separated key path (e.g. ``header.messageId``).
        operator: Assertion operator (same as ``validate/assert``).
        value: Expected value (for binary operators).
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinitionV2,
    ) -> StepOutput:
        obj = params.get("input")
        path = params.get("path", "")
        operator = params.get("operator", "not_null")
        expected = params.get("value")
        actual = _get_nested(obj, path) if path else obj
        passed, message = _check(operator, actual, expected)
        if not passed:
            raise ValueError(
                f"Field assertion failed [{path}][{operator}]: {message}"
            )
        return StepOutput(value=actual)


def _coerce_json(value: Any, label: str) -> Any:
    """Return *value* as parsed JSON, decoding it first when it is a raw string.

    HTTP steps hand back response bodies as text, and an unresolved
    ``${{ env.schemas.X }}`` reference also arrives as a string — decoding here
    keeps the common case working and turns the unresolved case into a clear
    error rather than a confusing schema-validation failure.
    """
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Schema validation {label} is not valid JSON: {value[:120]!r} ({exc})"
        ) from exc


@step("validate/schema")
class ValidateSchemaStep(BaseStep):
    """Validate a JSON payload against a JSON Schema document.

    Raises ``ValueError`` on failure so the runner marks the step as FAILED.

    Params:
        input: The payload to validate (dict, list, or JSON string).
        schema: A JSON Schema document — typically ``${{ env.schemas.<id> }}``,
                which the player seeds from the TCK ``env.schemas`` block.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinitionV2,
    ) -> StepOutput:
        if "schema" not in params:
            raise ValueError("validate/schema requires a 'schema' parameter")
        payload = _coerce_json(params.get("input"), "input")
        schema = _coerce_json(params["schema"], "schema")

        if not isinstance(schema, dict):
            raise ValueError(
                f"validate/schema expects a JSON Schema object, got "
                f"{type(schema).__name__}. Check that the schema reference resolves."
            )

        validator_cls = jsonschema.validators.validator_for(schema)
        try:
            validator_cls.check_schema(schema)
        except jsonschema.SchemaError as exc:
            raise ValueError(f"Invalid JSON Schema: {exc.message}") from exc

        errors = sorted(validator_cls(schema).iter_errors(payload), key=lambda e: list(e.path))
        if errors:
            details = "; ".join(
                f"{'/'.join(str(p) for p in err.path) or '<root>'}: {err.message}"
                for err in errors
            )
            raise ValueError(
                f"Schema validation failed ({len(errors)} error(s)): {details}"
            )
        return StepOutput(value=payload)
