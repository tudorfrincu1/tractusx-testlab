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

"""Data models for the mock server subsystem."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RecordedRequest(BaseModel):
    """An HTTP request captured by a mock server endpoint."""

    model_config = ConfigDict(frozen=True)

    method: str
    path: str
    headers: dict[str, str] = Field(default_factory=dict)
    body: Any = None
    query_params: dict[str, str] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EndpointRoute(BaseModel):
    """Internal representation of a registered mock endpoint route."""

    model_config = ConfigDict(frozen=True)

    method: str
    path: str
    status: int = 200
    body: Any = None
