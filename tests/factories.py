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

"""Factory functions for building test objects."""

from __future__ import annotations

from typing import Any

from tractusx_testlab.models.authoring.definitions import ScriptDefinition, StepDefinition
from tractusx_testlab.models.runtime.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)


def create_precondition_log(**overrides: Any) -> PreconditionLog:
    """Build a PreconditionLog with sensible defaults."""
    defaults: dict[str, Any] = {
        "category": PreconditionLogCategory.EDC_ASSET,
        "log_type": PreconditionLogType.CONFIG,
        "message": "Test precondition log",
        "data": {},
    }
    defaults.update(overrides)
    return PreconditionLog(**defaults)


def create_step_definition(**overrides: Any) -> StepDefinition:
    """Build a StepDefinition with sensible defaults."""
    defaults: dict[str, Any] = {
        "type": "precondition_asset_config",
        "params": {},
    }
    defaults.update(overrides)
    return StepDefinition(**defaults)


def create_script_with_preconditions(**overrides: Any) -> ScriptDefinition:
    """Build a ScriptDefinition with a preconditions list."""
    defaults: dict[str, Any] = {
        "name": "Test Script",
        "preconditions": [],
    }
    defaults.update(overrides)
    return ScriptDefinition(**defaults)
