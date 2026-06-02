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

"""Precondition models — log entries produced during the precondition phase."""

from __future__ import annotations

import enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PreconditionLogCategory(str, enum.Enum):
    """Category of data a precondition log entry refers to."""

    EDC_POLICY = "EDC_POLICY"
    EDC_ASSET = "EDC_ASSET"
    EDC_CONTRACT = "EDC_CONTRACT"


class PreconditionLogType(str, enum.Enum):
    """Direction of a precondition log entry."""

    CONFIG = "CONFIG"    # TestLab gives data to the user
    REQUEST = "REQUEST"  # TestLab asks user for input


class PreconditionLog(BaseModel):
    """Single log entry produced by a precondition step."""

    model_config = ConfigDict(frozen=True)

    category: PreconditionLogCategory
    log_type: PreconditionLogType
    message: str
    data: dict[str, Any] = Field(default_factory=dict)
    input_type: str | None = None
    variable: str | None = None
