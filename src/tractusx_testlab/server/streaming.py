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

"""SSE streaming routes and utilities for live test execution events."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from collections.abc import AsyncGenerator
from typing import Any

import yaml
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.responses import StreamingResponse

from tractusx_sdk.extensions.testlab.models import (
    ScriptKind as _SdkScriptKind,
    TestCaseDefinition as TckDefinition,  # SDK alias
)
from tractusx_testlab.models.enums import ScriptKind
from tractusx_sdk.extensions.testlab.player.execution.monitor import ExecutionMonitor
from tractusx_testlab.player.execution.player import TestlabPlayer
from tractusx_sdk.extensions.testlab.scripting.parser import YamlParser
from tractusx_sdk.extensions.testlab.scripting.script import TestCase as Tck  # SDK alias

from tractusx_testlab.server._event_buffer import BufferedEvent, EventBuffer

_logger = logging.getLogger(__name__)

_TERMINAL_EVENTS = frozenset({"job.completed", "job.failed", "job.cancelled"})

streaming_router = APIRouter(prefix="/test-execution", tags=["streaming"])


def _get_player(request: Request) -> TestlabPlayer:
    return request.app.state.player


def _get_event_buffer(request: Request) -> EventBuffer:
    """Lazy-init the event buffer on app state."""
    if not hasattr(request.app.state, "event_buffer"):
        request.app.state.event_buffer = EventBuffer()
    return request.app.state.event_buffer


# ──────────────────────────────────────────────────────────────────────
# YAML execution endpoint
# ──────────────────────────────────────────────────────────────────────


@streaming_router.post("/run/yaml", status_code=202)
async def run_yaml(
    request: Request,
    player: TestlabPlayer = Depends(_get_player),
) -> JSONResponse:
    """Execute a TCK from a raw YAML body.

    Accepts ``Content-Type: application/x-yaml`` or ``text/yaml``.
    Returns ``{"job_id": "...", "status": "queued"}``.
    """
    raw = await request.body()
    if not raw:
        raise HTTPException(400, "Request body must contain YAML content")

    try:
        data = yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        raise HTTPException(400, f"Invalid YAML: {exc}") from exc

    if not isinstance(data, dict):
        raise HTTPException(400, "YAML root must be a mapping")

    parser = YamlParser()
    kind_value = data.get("kind")
    has_tests = "tests" in data
    kind = ScriptKind(kind_value) if kind_value else (
        ScriptKind.TCK if has_tests else ScriptKind.TEST
    )

    try:
        if kind == ScriptKind.TCK:
            definition = parser.parse_tck_from_dict(data)
        else:
            script_def = parser.parse_script_from_dict(data)
            definition = TckDefinition(name=script_def.name, tests=[script_def])
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(422, f"Failed to parse YAML definition: {exc}") from exc

    tck = Tck(definition)
    job = player.jobs.create(tck.name)
    asyncio.create_task(_execute_tck_bg(player, tck, job.job_id))

    return JSONResponse(
        content={"job_id": job.job_id, "status": "queued"},
        status_code=202,
    )


async def _execute_tck_bg(
    player: TestlabPlayer, tck: Tck, job_id: str,
) -> None:
    """Run a TCK in the background, catching exceptions."""
    try:
        await player.run_tck(tck)
    except (RuntimeError, ValueError, OSError) as exc:
        _logger.warning("Background execution failed for job %s: %s", job_id, exc)


# ──────────────────────────────────────────────────────────────────────
# SSE streaming endpoint
# ──────────────────────────────────────────────────────────────────────


@streaming_router.get("/{job_id}/stream")
async def stream_job_events(
    job_id: str,
    request: Request,
    player: TestlabPlayer = Depends(_get_player),
    event_buffer: EventBuffer = Depends(_get_event_buffer),
) -> StreamingResponse:
    """Stream live execution events for a job via Server-Sent Events.

    Supports reconnection: send ``Last-Event-ID`` header to replay missed events.
    """
    job = player.jobs.get(job_id)
    if job is None:
        raise HTTPException(404, f"Job '{job_id}' not found")

    last_event_id_raw = request.headers.get("last-event-id")
    last_event_id: int | None = None
    if last_event_id_raw is not None:
        try:
            last_event_id = int(last_event_id_raw)
        except ValueError:
            last_event_id = None

    queue = create_event_queue(player.monitor)

    return StreamingResponse(
        sse_event_generator(queue, job_id, event_buffer, last_event_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ──────────────────────────────────────────────────────────────────────
# SSE generator utilities
# ──────────────────────────────────────────────────────────────────────


def create_event_queue(monitor: ExecutionMonitor) -> asyncio.Queue[tuple[str, dict[str, Any]]]:
    """Register a callback on *monitor* that pushes events into a queue.

    Returns the queue. The callback is sync-safe (uses ``put_nowait``).
    """
    queue: asyncio.Queue[tuple[str, dict[str, Any]]] = asyncio.Queue()

    def _push_event(event: str, payload: dict[str, Any]) -> None:
        queue.put_nowait((event, payload))

    monitor.add_callback(_push_event)
    return queue


async def sse_event_generator(
    queue: asyncio.Queue[tuple[str, dict[str, Any]]],
    job_id: str,
    event_buffer: EventBuffer,
    last_event_id: int | None = None,
    timeout_s: float = 600.0,
) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted strings from *queue* until a terminal event arrives.

    Features:
        - **Replay**: If *last_event_id* is set, replays buffered events first.
        - **Heartbeat**: Sends ``:keepalive`` comment every 15 s when idle.
        - **Event IDs**: Every event includes a monotonic ``id:`` field.
        - **Buffer**: Events are stored for future replay on reconnect.

    Args:
        queue: Event queue populated by :func:`create_event_queue`.
        job_id: Job identifier for buffer scoping.
        event_buffer: Shared event buffer instance.
        last_event_id: If set, replay events with ID > this value.
        timeout_s: Maximum seconds without a *real* event before closing.
    """
    # Phase 1: replay buffered events
    if last_event_id is not None:
        for buffered in event_buffer.get_events_after(job_id, last_event_id):
            yield _format_sse(buffered.id, buffered.event, buffered.data)

    # Phase 2: live stream with heartbeat
    last_real_event = time.monotonic()
    try:
        while True:
            try:
                event, payload = await asyncio.wait_for(queue.get(), timeout=15.0)
            except TimeoutError:
                if time.monotonic() - last_real_event > timeout_s:
                    event_id = event_buffer.next_id(job_id)
                    timeout_data = {"reason": "No events received within timeout"}
                    event_buffer.append(
                        job_id, BufferedEvent(id=event_id, event="stream.timeout", data=timeout_data),
                    )
                    yield _format_sse(event_id, "stream.timeout", timeout_data)
                    return
                yield ":keepalive\n\n"
                continue

            last_real_event = time.monotonic()
            event_id = event_buffer.next_id(job_id)
            event_buffer.append(job_id, BufferedEvent(id=event_id, event=event, data=payload))
            yield _format_sse(event_id, event, payload)

            if event in _TERMINAL_EVENTS:
                return
    except asyncio.CancelledError:
        _logger.debug("SSE stream cancelled by client disconnect")
        return


def _format_sse(event_id: int, event: str, data: dict[str, Any]) -> str:
    """Format a single SSE message with an ``id:`` field."""
    payload = json.dumps(data, default=str)
    return f"id: {event_id}\nevent: {event}\ndata: {payload}\n\n"
