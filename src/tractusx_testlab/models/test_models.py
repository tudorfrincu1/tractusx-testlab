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

"""Pydantic v2 models for TestLab YAML test definitions."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ── Enums ──────────────────────────────────────────────────────────────────────


class AssertionType(str, Enum):
    """Supported assertion types for step verification."""

    STATUS_CODE = "STATUS_CODE"
    EQUALS = "EQUALS"
    CONTAINS = "CONTAINS"
    REGEX = "REGEX"
    EXISTS = "EXISTS"
    SCHEMA = "SCHEMA"
    CHECK_REQUEST = "CHECK_REQUEST"


class Severity(str, Enum):
    """Assertion severity — HARD fails the test, SOFT emits a warning."""

    HARD = "HARD"
    SOFT = "SOFT"


# ── Value Objects (immutable) ──────────────────────────────────────────────────


class Assertion(BaseModel):
    """A single verification check attached to a step."""

    model_config = ConfigDict(frozen=True, populate_by_name=True)

    type: AssertionType
    severity: Severity = Severity.HARD
    value: Any = None
    path: str | None = None
    pattern: str | None = None
    schema_def: dict[str, Any] | None = Field(None, alias="schema")
    negate: bool = False
    field: str | None = None
    operator: str | None = None


class MockEndpointConfig(BaseModel):
    """Configuration for a single mock endpoint route."""

    model_config = ConfigDict(frozen=True)

    method: str = "GET"
    path: str
    status: int = 200
    body: Any = None


class ConnectorConfig(BaseModel):
    """Connection details for a dataspace connector."""

    model_config = ConfigDict(frozen=True)

    url: str
    api_key: str


class InputVariable(BaseModel):
    """A test input variable with type and optional default."""

    model_config = ConfigDict(frozen=True)

    type: str = "string"
    default: Any = None


# ── Composite Models ───────────────────────────────────────────────────────────


class MockConfig(BaseModel):
    """Configuration for a mock service instance."""

    model_config = ConfigDict(frozen=True)

    type: str
    name: str
    overrides: list[MockEndpointConfig] = Field(default_factory=list)
    endpoints: list[MockEndpointConfig] = Field(default_factory=list)


class Step(BaseModel):
    """A single executable step in a test sequence."""

    model_config = ConfigDict(frozen=True)

    type: str
    name: str
    inputs: dict[str, Any] = Field(default_factory=dict)
    outputs: dict[str, str] = Field(default_factory=dict)
    expect: list[Assertion] = Field(default_factory=list)
    mock: str | None = None
    path: str | None = None
    timeout: int = 30


class TemplateStep(BaseModel):
    """A template step that expands into a reusable step sequence at compile time."""

    model_config = ConfigDict(frozen=True)

    template: str
    params: dict[str, Any] = Field(default_factory=dict)
    name: str | None = None


class Test(BaseModel):
    """Top-level test definition — the root model for a YAML test file."""

    model_config = ConfigDict(frozen=True)

    name: str
    version: str = "1.0"
    dataspace: str = "saturn"
    description: str = ""
    connectors: dict[str, ConnectorConfig] = Field(default_factory=dict)
    inputs: dict[str, InputVariable] = Field(default_factory=dict)
    mocks: list[MockConfig] = Field(default_factory=list)
    steps: list[Step | TemplateStep] = Field(default_factory=list)
    auto_cleanup: bool = True
