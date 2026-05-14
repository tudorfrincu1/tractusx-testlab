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

"""Pydantic v2 models for test scripts — Test, Step, Assertion, and supporting types."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AssertionType(str, Enum):
    """Supported assertion evaluation strategies."""

    STATUS_CODE = "STATUS_CODE"
    EQUALS = "EQUALS"
    CONTAINS = "CONTAINS"
    REGEX = "REGEX"
    EXISTS = "EXISTS"
    SCHEMA = "SCHEMA"
    CHECK_REQUEST = "CHECK_REQUEST"


class Severity(str, Enum):
    """Assertion failure severity — HARD stops execution; SOFT records and continues."""

    HARD = "HARD"
    SOFT = "SOFT"


class Assertion(BaseModel):
    """A single assertion evaluated against a step result."""

    model_config = ConfigDict(frozen=True, populate_by_name=True)

    type: AssertionType
    value: Any = None  # Any: assertion value can be int, str, dict, None
    severity: Severity = Severity.HARD
    negate: bool = False
    path: str | None = None
    pattern: str | None = None
    schema_def: dict | None = Field(default=None, alias="schema")


class Step(BaseModel):
    """A single executable step within a test."""

    model_config = ConfigDict(frozen=True)

    type: str
    name: str = ""
    inputs: dict = Field(default_factory=dict)
    outputs: dict = Field(default_factory=dict)
    expect: list[Assertion] = Field(default_factory=list)
    timeout: int = 30


class ConnectorConfig(BaseModel):
    """Connection parameters for a single EDC connector endpoint."""

    url: str
    api_key: str = ""


class InputVariable(BaseModel):
    """Declaration of a test-level input variable with optional default."""

    type: str = "string"
    default: Any = None  # Any: default can be str, int, bool, None


class MockEndpointConfig(BaseModel):
    """Configuration for a single mock endpoint."""

    model_config = ConfigDict(frozen=True)

    method: str = "GET"
    path: str
    status: int = 200
    body: Any = None  # Any: response body can be dict, list, str, None


class MockConfig(BaseModel):
    """Configuration for a mock service instance."""

    model_config = ConfigDict(frozen=True)

    type: str
    name: str
    endpoints: list[MockEndpointConfig] = Field(default_factory=list)
    overrides: list[MockEndpointConfig] = Field(default_factory=list)


class Test(BaseModel):
    """Complete test definition compiled from a YAML script."""

    model_config = ConfigDict(frozen=True)

    name: str
    version: str = "1.0"
    dataspace: str = "saturn"
    description: str = ""
    connectors: dict[str, ConnectorConfig] = Field(default_factory=dict)
    inputs: dict[str, InputVariable] = Field(default_factory=dict)
    mocks: list[MockConfig] = Field(default_factory=list)
    steps: list[Step] = Field(default_factory=list)
    auto_cleanup: bool = True
