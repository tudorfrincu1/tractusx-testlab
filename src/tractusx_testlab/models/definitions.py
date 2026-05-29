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

"""Definition models — authoring / compile-time structures for scripts and TCKs."""

from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, Field

from tractusx_testlab.models.enums import (
    AssertionSeverity,
    FailurePolicy,
    SdkCallMode,
    ValueSource,
)
from tractusx_testlab.models.enums import AssertionType, ScriptKind, ServiceType


class VariableDefinition(BaseModel):
    """Schema for a declared variable in a test script."""

    name: str
    type: str = "str"
    default: Optional[Any] = None
    runtime: bool = False
    description: Optional[str] = None


class Assertion(BaseModel):
    """Validation rule applied to a step output."""

    type: AssertionType
    severity: AssertionSeverity = AssertionSeverity.HARD
    source: ValueSource = ValueSource.INLINE
    value: Optional[Any] = None
    path: Optional[str] = Field(default=None, alias="output")
    description: Optional[str] = None
    schema_ref: Optional[str] = Field(default=None, alias="schema")
    min: Optional[Any] = None
    max: Optional[Any] = None
    operator: Optional[str] = None
    expected: Optional[Any] = None
    json_path: Optional[str] = None
    store_in_variable: Optional[str] = None
    nested_validate: Optional[list["Assertion"]] = Field(
        default=None, alias="validate"
    )

    model_config = {"populate_by_name": True}


class StepDefinition(BaseModel):
    """Compile-time definition of a single test step."""

    type: str
    name: Optional[str] = None
    description: Optional[str] = None
    params: dict = Field(default_factory=dict)
    on_failure: FailurePolicy = FailurePolicy.ABORT
    timeout_s: Optional[float] = None
    validate: list[Assertion] = Field(default_factory=list)
    store_in_memory: Optional[dict[str, str]] = None
    store_in_variable: Optional[str] = None
    if_condition: Optional[str] = Field(default=None, alias="if")
    output_definitions: list[dict[str, str]] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class ServiceDefinition(BaseModel):
    """Declaration of an external service used by a test script."""

    name: str
    type: ServiceType
    base_url: str
    auth: dict = Field(default_factory=dict)
    params: Optional[dict] = None


class ScriptDefinition(BaseModel):
    """Top-level definition of a test script with phases and services."""

    kind: ScriptKind = ScriptKind.TEST
    name: str
    version: str = "1.0"
    dataspace_version: str = "saturn"
    description: Optional[str] = None
    import_from: Optional[str] = None
    allow_sdk_calls: SdkCallMode = SdkCallMode.ALLOWLIST
    outputs: dict[str, str] = Field(default_factory=dict)
    variables: dict[str, VariableDefinition] = Field(default_factory=dict)
    services: list[ServiceDefinition] = Field(default_factory=list)
    preconditions: list[StepDefinition] = Field(default_factory=list)
    setup: list[StepDefinition] = Field(default_factory=list)
    steps: list[StepDefinition] = Field(default_factory=list)
    teardown: list[StepDefinition] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)


class ImportDefinition(BaseModel):
    """Reference to an external script to import into a TCK."""

    import_ref: str
    override: Optional[dict] = None


class TckDefinition(BaseModel):
    """Top-level definition of a TCK package containing multiple tests."""

    kind: ScriptKind = ScriptKind.TCK
    name: str
    version: str = "1.0"
    description: Optional[str] = None
    shared_variables: Optional[dict[str, VariableDefinition]] = None
    tests: list[Union[ScriptDefinition, str]] = Field(default_factory=list)
    imports: list[ImportDefinition] = Field(default_factory=list)
