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

"""Result models — execution-time structures for steps, scripts, and TCKs."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from tractusx_testlab.models.definitions import Assertion
from tractusx_testlab.models.enums import (
    AssertionSeverity,
    ScriptStatus,
    StepStatus,
)
from tractusx_testlab.models.enums import StepPhase
from tractusx_testlab.models.preconditions import PreconditionLog


class HttpRequest(BaseModel):
    method: str
    url: str
    headers: Optional[dict] = None
    body: Optional[Any] = None


class HttpResponse(BaseModel):
    status_code: int
    headers: Optional[dict] = None
    body: Optional[Any] = None
    duration_ms: float = 0.0


class AssertionResult(BaseModel):
    assertion: Assertion
    passed: bool
    expected: Optional[Any] = None
    actual: Optional[Any] = None
    message: str = ""
    severity: AssertionSeverity = AssertionSeverity.HARD


class StepResult(BaseModel):
    step_name: str
    step_type: str = ""
    phase: StepPhase = StepPhase.MAIN
    status: StepStatus = StepStatus.PENDING
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    duration_s: Optional[float] = None
    request: Optional[HttpRequest] = None
    response: Optional[HttpResponse] = None
    error: Optional[str] = None
    error_traceback: Optional[str] = None
    output: Optional[Any] = None
    assertions: list[AssertionResult] = Field(default_factory=list)
    precondition_logs: list[PreconditionLog] = Field(default_factory=list)


class CallbackResult(BaseModel):
    listener_name: str
    path: str
    method: str = "POST"
    headers: dict = Field(default_factory=dict)
    payload: Optional[Any] = None
    received_at: Optional[datetime] = None
    timed_out: bool = False


class AssertionSummary(BaseModel):
    total: int = 0
    passed: int = 0
    failed_hard: int = 0
    failed_soft: int = 0


class ScriptResult(BaseModel):
    script_id: str = ""
    script_name: str = ""
    dataspace_version: str = ""
    status: ScriptStatus = ScriptStatus.IDLE
    steps: list[StepResult] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    total_duration_s: Optional[float] = None
    metadata: Optional[dict] = None
    assertion_summary: AssertionSummary = Field(default_factory=AssertionSummary)
    callback_results: list[CallbackResult] = Field(default_factory=list)
    error: Optional[str] = None


class TckResult(BaseModel):
    tck_id: str = ""
    package_name: str = ""
    status: ScriptStatus = ScriptStatus.IDLE
    scripts: list[ScriptResult] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    @property
    def duration_ms(self) -> Optional[float]:
        if self.started_at and self.finished_at:
            return (self.finished_at - self.started_at).total_seconds() * 1000
        return None

    @property
    def passed(self) -> int:
        return sum(
            1 for script in self.scripts
            for step in script.steps if step.status == StepStatus.PASSED
        )

    @property
    def total(self) -> int:
        return sum(len(script.steps) for script in self.scripts)

    @property
    def tck_name(self) -> str:
        return self.tck_id
