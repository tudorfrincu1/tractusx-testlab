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

"""YAML compiler: parses and validates test YAML into Test model instances."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Union

import yaml
from pydantic import ValidationError as PydanticValidationError

from tractusx_testlab.exceptions import CompilationError, ValidationError
from tractusx_testlab.models.test_models import Test

_KNOWN_STEP_TYPES: frozenset[str] = frozenset({
    "create_asset",
    "create_policy",
    "create_contract_definition",
    "create_contract_def",
    "query_catalog",
    "query_catalog_by_asset_id",
    "query_catalog_by_bpnl",
    "negotiate_contract",
    "negotiate",
    "transfer_data",
    "initiate_transfer",
    "do_dsp",
    "do_dsp_with_bpnl",
    "get_edr",
    "fetch_from_edr",
    "http_request",
    "register_twin",
    "create_shell_descriptor",
    "get_shell_descriptor",
    "create_submodel_descriptor",
    "delete_shell_descriptor",
    "register_shell",
    "lookup_shell",
    "add_submodel",
    "send_notification",
    "discover_notification_assets",
    "cleanup_asset",
    "cleanup_policy",
    "cleanup_contract",
    "wait_for_callback",
    "get_dsp_version",
    "get_dsp_catalog",
    "negotiate_contract_dsp",
    "request_transfer_dsp",
    "get_transfer_state_dsp",
    "resolve_connector_address",
    "get_catalog_by_dct_type",
    "noop",
    "http_post",
    "http_get",
})

_VAR_REF_PATTERN: re.Pattern[str] = re.compile(r"^@(\w+)$")


def _validate_steps(data: dict) -> None:
    """Validate step types and variable references against declared inputs."""
    steps = data.get("steps") or []
    declared_inputs: set[str] = set((data.get("inputs") or {}).keys())

    for step in steps:
        if not isinstance(step, dict):
            continue
        step_type = step.get("type", "")
        if step_type not in _KNOWN_STEP_TYPES:
            raise ValidationError(f"Unknown step type: {step_type!r}")
        _check_variable_refs(step.get("inputs") or {}, declared_inputs)


def _check_variable_refs(inputs: dict, declared: set[str]) -> None:
    """Raise ValidationError if any @ref in inputs is not in declared variables."""
    for value in inputs.values():
        if not isinstance(value, str):
            continue
        match = _VAR_REF_PATTERN.match(value)
        if match:
            var_name = match.group(1)
            if var_name not in declared:
                raise ValidationError(
                    f"undefined variable '@{var_name}' — "
                    f"declare it in the 'inputs' section"
                )


def compile_yaml_string(yaml_str: str) -> Test:
    """Compile a YAML string into a Test model.

    Raises:
        CompilationError: For invalid YAML syntax or non-mapping top-level.
        ValidationError: For unknown step types or undefined variable references.
    """
    try:
        data = yaml.safe_load(yaml_str)
    except yaml.YAMLError as exc:
        raise CompilationError(f"Invalid YAML: {exc}") from exc

    if not isinstance(data, dict):
        raise CompilationError(
            f"Expected a YAML mapping, got {type(data).__name__}"
        )

    _validate_steps(data)

    try:
        return Test.model_validate(data)
    except PydanticValidationError as exc:
        raise CompilationError(f"Model validation failed: {exc}") from exc


def compile_yaml(path: Union[str, Path]) -> Test:
    """Compile a YAML file into a Test model.

    Raises:
        CompilationError: For I/O errors, invalid YAML, or non-mapping structure.
        ValidationError: For unknown step types or undefined variable references.
    """
    file_path = Path(path)
    try:
        yaml_str = file_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise CompilationError(f"Cannot read file {file_path}: {exc}") from exc

    return compile_yaml_string(yaml_str)
