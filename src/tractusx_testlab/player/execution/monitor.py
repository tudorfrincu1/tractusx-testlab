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

"""ExecutionMonitor — tracks step/script progress and emits callbacks."""

from __future__ import annotations

import asyncio
from typing import Any, Callable

from tractusx_testlab.logging.structured import StructuredLogger
from tractusx_testlab.models import (
    JobStatus,
    ScriptResult,
    StepResult,
)


# Callback signature: (event_name, payload_dict) -> None
CallbackFn = Callable[[str, dict[str, Any]], Any]


class ExecutionMonitor:
    """Observes execution progress, logs structured events, and fires callbacks."""

    __slots__ = ("_logger", "_callbacks")

    def __init__(self, logger: StructuredLogger) -> None:
        self._logger = logger
        self._callbacks: list[CallbackFn] = []

    def add_callback(self, fn: CallbackFn) -> None:
        self._callbacks.append(fn)

    # ------------------------------------------------------------------
    # Events
    # ------------------------------------------------------------------

    def on_job_started(self, job_id: str, tck: str) -> None:
        self._emit("job.started", job_id=job_id, tck=tck)

    def on_script_started(self, job_id: str, script_name: str, index: int) -> None:
        self._emit("script.started", job_id=job_id, script=script_name, index=index)

    def on_step_started(self, job_id: str, step_index: int, step_type: str, step_name: str = "", phase: str = "main") -> None:
        self._emit(
            "step.started",
            job_id=job_id,
            step_index=step_index,
            step_name=step_name,
            step_type=step_type,
            phase=phase,
            status="running",
        )

    def on_step_completed(self, job_id: str, result: StepResult) -> None:
        payload: dict[str, Any] = {
            "job_id": job_id,
            "step_name": result.step_name,
            "step_type": result.step_type,
            "phase": result.phase.value.lower(),
            "status": result.status.value,
            "duration_s": result.duration_s,
        }
        if result.request:
            payload["request"] = result.request.model_dump(exclude_none=True)
        if result.response:
            payload["response"] = result.response.model_dump(exclude_none=True)
        if result.error:
            payload["error"] = result.error
        self._emit("step.completed", **payload)

    def on_step_waiting(self, job_id: str, step_index: int, listener_url: str) -> None:
        self._emit("step.waiting", job_id=job_id, step_index=step_index, listener_url=listener_url)

    def on_script_completed(self, job_id: str, result: ScriptResult) -> None:
        self._emit(
            "script.completed",
            job_id=job_id,
            script=result.script_name,
            status=result.status.value,
        )

    def on_job_completed(self, job_id: str, status: JobStatus) -> None:
        self._emit("job.completed", job_id=job_id, status=status.value)

    def on_job_paused(self, job_id: str) -> None:
        self._emit("job.paused", job_id=job_id)

    def on_job_resumed(self, job_id: str) -> None:
        self._emit("job.resumed", job_id=job_id)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _emit(self, event: str, **payload: Any) -> None:
        self._logger.info(event, **payload)
        for callback in self._callbacks:
            try:
                result = callback(event, payload)
                if asyncio.iscoroutine(result):
                    asyncio.ensure_future(result)
            except (RuntimeError, TypeError, ValueError) as exc:
                self._logger.warning("Callback failed for event '%s': %s", event, exc)
