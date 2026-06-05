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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
## It was reviewed and tested by a human committer.

"""ADR-0019 topology models: the ``dataspace`` and ``infrastructure`` blocks."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# Capability keys come from the hardcoded v1 registry (ADR-0019 §1). The mock
# server is the engine's own built-in component and is therefore never a
# capability — it is intentionally absent from both sides.
CapabilityKey = Literal["connector", "dtr"]

# The two bindable sides of the topology (ADR-0019 §1).
SideKey = Literal["engine", "sut"]


class DataspaceContext(BaseModel):
    """The ecosystem context a run targets — the single source of the version."""

    model_config = ConfigDict(frozen=True)

    ecosystem: str
    version: str


class Standard(BaseModel):
    """Optional standard constraint on a capability (ADR-0019 §1)."""

    model_config = ConfigDict(frozen=True)

    id: str
    version: Optional[str] = None

    def effective_version(self, dataspace_version: str) -> str:
        """Resolve the constraint version, inheriting ``dataspace.version`` when omitted."""
        return self.version or dataspace_version


class CapabilityRequirement(BaseModel):
    """One capability requirement: an explicit ``required`` flag plus an optional standard."""

    model_config = ConfigDict(frozen=True)

    required: bool
    standard: Optional[Standard] = None


class InfrastructureConfig(BaseModel):
    """The two bindable sides, each keyed by capability (ADR-0019 §1)."""

    model_config = ConfigDict(frozen=True)

    engine: dict[CapabilityKey, CapabilityRequirement] = Field(default_factory=dict)
    sut: dict[CapabilityKey, CapabilityRequirement] = Field(default_factory=dict)
