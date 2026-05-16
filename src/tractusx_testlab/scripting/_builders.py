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

"""Builders for parsing YAML step, assertion, service, and variable definitions."""

from __future__ import annotations

from typing import Union

from tractusx_testlab.syntax import defaults
import tractusx_testlab.syntax.keys as keys

from tractusx_testlab.models import (
    AssertionSeverity,
    FailurePolicy,
    ValueSource,
    VariableDefinition,
)
from tractusx_testlab.models.definitions import Assertion, ServiceDefinition, StepDefinition
from tractusx_testlab.models.enums import AssertionType, ServiceType

# Maps compact assertion keys to (AssertionType, has_value).
_COMPACT_ASSERTION_MAP: dict[str, tuple[AssertionType, bool]] = {
    keys.NOT_NULL: (AssertionType.NOT_NULL, False),
    keys.NOT_EMPTY: (AssertionType.NOT_EMPTY, False),
    keys.EQUALS: (AssertionType.EQUALS, True),
    keys.NOT_EQUALS: (AssertionType.NOT_EQUALS, True),
    keys.CONTAINS_KEY: (AssertionType.CONTAINS, True),
    keys.NOT_CONTAINS_KEY: (AssertionType.NOT_CONTAINS, True),
    keys.MATCHES: (AssertionType.REGEX, True),
    keys.SCHEMA_KEY: (AssertionType.SCHEMA, True),
    keys.VALIDATES_AGAINST_SCHEMA: (AssertionType.SCHEMA_VALIDATION, True),
    keys.GREATER_THAN: (AssertionType.GREATER_THAN, True),
    keys.LESS_THAN: (AssertionType.LESS_THAN, True),
    keys.GREATER_OR_EQUAL: (AssertionType.GREATER_OR_EQUAL, True),
    keys.LESS_OR_EQUAL: (AssertionType.LESS_OR_EQUAL, True),
    keys.BETWEEN: (AssertionType.BETWEEN, False),
}


def parse_variables(raw: dict) -> dict[str, VariableDefinition]:
    """Parse a variables mapping into VariableDefinition instances."""
    result = {}
    for name, spec in raw.items():
        if isinstance(spec, dict):
            result[name] = VariableDefinition(name=name, **spec)
        else:
            result[name] = VariableDefinition(name=name, default=spec)
    return result


def parse_step(raw: dict) -> StepDefinition:
    """Parse a single step dict into a StepDefinition."""
    expect_raw = raw.get(keys.EXPECT, [])
    expectations = [parse_assertion(assertion_data) for assertion_data in expect_raw]

    output_defs_raw = raw.get(keys.OUTPUT_DEFINITIONS, [])
    params = dict(raw.get(keys.PARAMS, {}))

    store_in_var = raw.get("store_in_variable") or params.pop("store_in_variable", None)
    if store_in_var:
        store_in_memory = {store_in_var: "."}
    else:
        store_in_memory = raw.get(keys.STORE_IN_MEMORY)

    return StepDefinition(
        type=raw.get(keys.TYPE, defaults.NAME),
        description=raw.get(keys.DESCRIPTION),
        params=params,
        on_failure=FailurePolicy(raw[keys.ON_FAILURE]) if keys.ON_FAILURE in raw else FailurePolicy.ABORT,
        timeout_s=raw.get(keys.TIMEOUT_S),
        expect=expectations,
        store_in_memory=store_in_memory,
        store_in_variable=store_in_var,
        if_condition=raw.get(keys.IF),
        output_definitions=output_defs_raw,
    )


def parse_assertion(raw: dict) -> Assertion:
    """Parse a single assertion dict into an Assertion model.

    Supports two formats:
    - Typed: ``{type: "NOT_NULL", output: "datasets"}`` (new — ``type`` key present)
    - Compact: ``{output: "datasets", not_null: true}`` (legacy — operator-as-key)
    """
    if keys.TYPE in raw:
        return _parse_typed_assertion(raw)

    if keys.OUTPUT in raw:
        return _parse_compact_assertion(raw)

    # Fallback: bare classic format (no output, no type) — legacy SDK style
    return Assertion(
        type=AssertionType(raw.get(keys.TYPE, defaults.ASSERTION_TYPE)),
        severity=AssertionSeverity(raw.get(keys.SEVERITY, defaults.ASSERTION_SEVERITY)),
        source=ValueSource(raw.get(keys.SOURCE, defaults.VALUE_SOURCE)),
        value=raw.get(keys.VALUE),
        path=raw.get(keys.PATH),
        description=raw.get(keys.DESCRIPTION),
    )


def _parse_typed_assertion(raw: dict) -> Assertion:
    """Parse an assertion written in the explicit typed format."""
    assertion_type = AssertionType(raw[keys.TYPE])
    output_field = raw.get(keys.OUTPUT)
    path_field = raw.get(keys.PATH)
    if output_field and path_field:
        combined_path = f"{output_field}.{path_field}"
    else:
        combined_path = output_field or path_field
    schema_ref = raw.get(keys.ASSERTION_SCHEMA)

    min_val = raw.get(keys.ASSERTION_MIN)
    max_val = raw.get(keys.ASSERTION_MAX)

    return Assertion(
        type=assertion_type,
        severity=AssertionSeverity(raw.get(keys.SEVERITY, defaults.ASSERTION_SEVERITY)),
        source=ValueSource(raw.get(keys.SOURCE, defaults.VALUE_SOURCE)),
        value=raw.get(keys.VALUE),
        path=combined_path,
        description=raw.get(keys.DESCRIPTION),
        schema_ref=schema_ref,
        min=min_val,
        max=max_val,
        operator=raw.get("operator"),
        expected=raw.get("expected"),
    )


def _parse_compact_assertion(raw: dict) -> Assertion:
    """Parse an assertion written in the compact ``output:`` format (legacy)."""
    output_field = raw[keys.OUTPUT]
    assertion_type: AssertionType | None = None
    assertion_value = None
    schema_ref = None
    min_val = None
    max_val = None

    for compact_key, (a_type, has_value) in _COMPACT_ASSERTION_MAP.items():
        if compact_key in raw:
            assertion_type = a_type
            raw_value = raw[compact_key]
            if a_type == AssertionType.BETWEEN and isinstance(raw_value, list):
                min_val = raw_value[0] if len(raw_value) > 0 else None
                max_val = raw_value[1] if len(raw_value) > 1 else None
            elif a_type == AssertionType.SCHEMA_VALIDATION:
                schema_ref = raw_value
            elif has_value:
                assertion_value = raw_value
            break

    if assertion_type is None:
        assertion_type = AssertionType(defaults.ASSERTION_TYPE)

    return Assertion(
        type=assertion_type,
        severity=AssertionSeverity(raw.get(keys.SEVERITY, defaults.ASSERTION_SEVERITY)),
        source=ValueSource(raw.get(keys.SOURCE, defaults.VALUE_SOURCE)),
        value=assertion_value,
        path=output_field,
        description=raw.get(keys.DESCRIPTION),
        schema_ref=schema_ref,
        min=min_val,
        max=max_val,
    )


def parse_service(raw: dict) -> ServiceDefinition:
    """Parse a single service dict into a ServiceDefinition."""
    raw_type = raw.get(keys.TYPE, defaults.SERVICE_TYPE)

    base_url = raw.get(keys.BASE_URL, "")
    config_block = raw.get(keys.CONFIG)
    if not base_url and isinstance(config_block, dict):
        base_url = config_block.get(keys.MANAGEMENT_URL, defaults.BASE_URL)

    return ServiceDefinition(
        name=raw.get(keys.NAME, defaults.NAME),
        type=ServiceType(raw_type.upper() if isinstance(raw_type, str) else raw_type),
        base_url=base_url or defaults.BASE_URL,
        auth=raw.get(keys.AUTH, {}),
        params=raw.get(keys.PARAMS),
    )

