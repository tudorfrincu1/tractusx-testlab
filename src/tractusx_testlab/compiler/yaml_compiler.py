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

"""YAML compiler — parses and validates test YAML into Pydantic models."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError as PydanticValidationError

from tractusx_testlab.exceptions import CompilationError, ValidationError
from tractusx_testlab.models.test_models import Test

logger = logging.getLogger(__name__)


# ── Known step types (must match block catalog IDs) ────────────────────────────

_KNOWN_STEP_TYPES: frozenset[str] = frozenset(
    {
        "mock_service",
        "mock_endpoint",
        "wait_for_call",
        "upload_data",
        "create_asset",
        "set_access_rules",
        "publish_offer",
        "query_catalog",
        "find_connector",
        "negotiate_access",
        "fetch_data",
        "send_data",
        "register_twin",
        "lookup_twin",
        "add_submodel",
        "send_notification",
        "register_notification_endpoint",
        "http_request",
    }
)


def compile_yaml(source: str | Path) -> Test:
    """Parse a YAML test file and return a validated Test model.

    Args:
        source: Either a file path or a raw YAML string.

    Returns:
        A fully validated Test model.

    Raises:
        CompilationError: If the YAML is malformed or cannot be parsed.
        ValidationError: If the parsed data fails semantic validation.
    """
    raw = _load_raw(source)
    test = _parse(raw, source_label=_source_label(source))
    _validate_semantics(test)
    logger.info("Compiled test '%s' with %d steps", test.name, len(test.steps))
    return test


def compile_yaml_string(content: str) -> Test:
    """Convenience wrapper for compiling a YAML string directly."""
    return compile_yaml(content)


# ── Internal helpers ───────────────────────────────────────────────────────────


def _source_label(source: str | Path) -> str:
    if isinstance(source, Path):
        return str(source)
    first_line = source.strip().split("\n", 1)[0][:60]
    return f"<string: {first_line}...>"


def _load_raw(source: str | Path) -> dict[str, Any]:
    """Load YAML from a file path or raw string into a dict."""
    try:
        if isinstance(source, Path):
            text = source.read_text(encoding="utf-8")
        elif not source.strip().startswith("{") and "\n" in source:
            # Looks like raw YAML content
            text = source
        else:
            # Might be a path string
            path = Path(source)
            if path.is_file():
                text = path.read_text(encoding="utf-8")
            else:
                text = source

        data = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        raise CompilationError(
            f"Invalid YAML syntax: {exc}", source=_source_label(source)
        ) from exc

    if not isinstance(data, dict):
        raise CompilationError(
            f"Expected a YAML mapping at root, got {type(data).__name__}",
            source=_source_label(source),
        )
    return data


def _parse(raw: dict[str, Any], source_label: str) -> Test:
    """Parse a raw dict into a validated Test Pydantic model."""
    try:
        return Test.model_validate(raw)
    except PydanticValidationError as exc:
        errors = "; ".join(
            f"{'.'.join(str(loc) for loc in e['loc'])}: {e['msg']}"
            for e in exc.errors()
        )
        raise CompilationError(
            f"Validation failed: {errors}", source=source_label
        ) from exc


def _validate_semantics(test: Test) -> None:
    """Run semantic checks that go beyond Pydantic's structural validation."""
    _check_step_types(test)
    _check_variable_references(test)
    _check_duplicate_step_names(test)


def _check_step_types(test: Test) -> None:
    """Verify all step types are known."""
    for step in test.steps:
        if step.type not in _KNOWN_STEP_TYPES:
            raise ValidationError(
                f"Unknown step type '{step.type}'",
                field=f"steps[{step.name}].type",
            )


def _check_variable_references(test: Test) -> None:
    """Verify that @variable references point to declared inputs or prior outputs."""
    available: set[str] = set(test.inputs.keys())

    for step in test.steps:
        # Check inputs for @references
        for key, value in step.inputs.items():
            if isinstance(value, str) and value.startswith("@"):
                var_name = value[1:]
                if var_name not in available:
                    raise ValidationError(
                        f"Step '{step.name}' references undefined variable '@{var_name}'",
                        field=f"steps[{step.name}].inputs.{key}",
                    )

        # Register this step's outputs as available for subsequent steps
        for output_name in step.outputs.values():
            available.add(output_name)


def _check_duplicate_step_names(test: Test) -> None:
    """Verify step names are unique within a test."""
    seen: set[str] = set()
    for step in test.steps:
        if step.name in seen:
            raise ValidationError(
                f"Duplicate step name '{step.name}'",
                field=f"steps[{step.name}]",
            )
        seen.add(step.name)
