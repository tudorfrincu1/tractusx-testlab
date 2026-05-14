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

from tractusx_testlab.syntax import defaults, keys

from tractusx_testlab.models import (
    Assertion,
    AssertionSeverity,
    AssertionType,
    DependencyRef,
    FailurePolicy,
    ServiceDefinition,
    ServiceType,
    ValueSource,
    VariableDefinition,
)
from tractusx_testlab.models.definitions import StepDefinition


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

    return StepDefinition(
        type=raw.get(keys.TYPE, defaults.NAME),
        description=raw.get(keys.DESCRIPTION),
        params=raw.get(keys.PARAMS, {}),
        on_failure=FailurePolicy(raw[keys.ON_FAILURE]) if keys.ON_FAILURE in raw else FailurePolicy.ABORT,
        timeout_s=raw.get(keys.TIMEOUT_S),
        expect=expectations,
        store_in_memory=raw.get(keys.STORE_IN_MEMORY),
        if_condition=raw.get(keys.IF),
    )


def parse_assertion(raw: dict) -> Assertion:
    """Parse a single assertion dict into an Assertion model."""
    return Assertion(
        type=AssertionType(raw.get(keys.TYPE, defaults.ASSERTION_TYPE)),
        severity=AssertionSeverity(raw.get(keys.SEVERITY, defaults.ASSERTION_SEVERITY)),
        source=ValueSource(raw.get(keys.SOURCE, defaults.VALUE_SOURCE)),
        value=raw.get(keys.VALUE),
        path=raw.get(keys.PATH),
        description=raw.get(keys.DESCRIPTION),
    )


def parse_service(raw: dict) -> ServiceDefinition:
    """Parse a single service dict into a ServiceDefinition."""
    raw_type = raw.get(keys.TYPE, defaults.SERVICE_TYPE)
    return ServiceDefinition(
        name=raw.get(keys.NAME, defaults.NAME),
        type=ServiceType(raw_type.upper() if isinstance(raw_type, str) else raw_type),
        base_url=raw.get(keys.BASE_URL, defaults.BASE_URL),
        auth=raw.get(keys.AUTH, {}),
        params=raw.get(keys.PARAMS),
    )


def parse_depends_on(raw: list) -> list[Union[str, DependencyRef]]:
    """Parse ``depends_on`` entries — strings or file-reference dicts."""
    result: list[Union[str, DependencyRef]] = []
    for entry in raw:
        if isinstance(entry, str):
            result.append(entry)
        elif isinstance(entry, dict) and keys.FILE in entry:
            result.append(DependencyRef(
                file=entry[keys.FILE],
                outputs=entry.get(keys.OUTPUTS, []),
            ))
        else:
            raise ValueError(f"Invalid depends_on entry: {entry}")
    return result
