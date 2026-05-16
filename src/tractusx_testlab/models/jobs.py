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

"""Job models — execution-time structures for job tracking and memory."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from tractusx_testlab.models.enums import JobStatus
from tractusx_testlab.models.results import TckResult as TckResult  # SDK alias


class JobEvent(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    event_type: str = ""
    description: str = ""
    data: Optional[dict] = None


class JobMemory(BaseModel):
    state: dict[str, Any] = Field(default_factory=dict)
    events: list[JobEvent] = Field(default_factory=list)

    def set(self, key: str, value: Any) -> None:
        self.state[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self.state.get(key, default)

    def has(self, key: str) -> bool:
        return key in self.state

    def log_event(self, event: JobEvent) -> None:
        self.events.append(event)


class Job(BaseModel):
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    package_name: Optional[str] = None
    tck_id: Optional[str] = None
    runtime_vars: dict = Field(default_factory=dict)
    memory: JobMemory = Field(default_factory=JobMemory)
    created_at: datetime = Field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    total_duration_s: Optional[float] = None
    current_script: Optional[str] = None
    current_step: Optional[str] = None
    waiting_for: Optional[str] = None
    result: Optional[TckResult] = None
    error: Optional[str] = None
