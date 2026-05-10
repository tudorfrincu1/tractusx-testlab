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

"""Mock HTTP server — one FastAPI app per mock, runs in a background thread."""

from __future__ import annotations

import asyncio
import logging
import socket
import threading
from datetime import datetime, timezone
from typing import Any

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from tractusx_testlab.exceptions import MockServerError
from tractusx_testlab.mocks.models import EndpointRoute, RecordedRequest

logger = logging.getLogger(__name__)


class MockServer:
    """An in-process HTTP mock server backed by FastAPI + uvicorn.

    Each instance runs on its own port in a background thread.
    Endpoints are registered before or after startup.
    All incoming requests are recorded for later inspection.
    """

    def __init__(self, name: str) -> None:
        self._name = name
        self._app = FastAPI(title=f"TestLab Mock: {name}")
        self._routes: dict[str, EndpointRoute] = {}
        self._recorded: list[RecordedRequest] = []
        self._call_events: dict[str, asyncio.Event] = {}
        self._port: int | None = None
        self._server: uvicorn.Server | None = None
        self._thread: threading.Thread | None = None
        self._lock = threading.Lock()
        self._setup_catch_all()

    # ── Public API ─────────────────────────────────────────────────────────

    @property
    def name(self) -> str:
        return self._name

    @property
    def base_url(self) -> str:
        if self._port is None:
            raise MockServerError(f"Mock '{self._name}' has not been started")
        return f"http://localhost:{self._port}"

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def register_endpoint(
        self,
        method: str,
        path: str,
        status: int = 200,
        body: Any = None,
    ) -> None:
        """Register or overwrite an endpoint route."""
        route_key = _route_key(method, path)
        route = EndpointRoute(method=method.upper(), path=path, status=status, body=body)
        with self._lock:
            self._routes[route_key] = route
        logger.debug("Registered endpoint %s %s on mock '%s'", method, path, self._name)

    def get_recorded_requests(self, path: str | None = None) -> list[RecordedRequest]:
        """Return recorded requests, optionally filtered by path."""
        with self._lock:
            if path is None:
                return list(self._recorded)
            return [r for r in self._recorded if r.path == path]

    async def wait_for_call(self, path: str, timeout: float = 30.0) -> RecordedRequest:
        """Block until a request arrives at the given path (or timeout)."""
        event = asyncio.Event()
        event_key = path
        with self._lock:
            self._call_events[event_key] = event

        try:
            await asyncio.wait_for(event.wait(), timeout=timeout)
        except asyncio.TimeoutError as exc:
            raise MockServerError(
                f"Timed out waiting for call to '{path}' on mock '{self._name}'"
            ) from exc
        finally:
            with self._lock:
                self._call_events.pop(event_key, None)

        # Return the latest recorded request for this path
        matching = self.get_recorded_requests(path)
        return matching[-1]

    def start(self) -> None:
        """Start the mock server on a random free port in a background thread."""
        if self.is_running:
            return

        self._port = _find_free_port()
        config = uvicorn.Config(
            app=self._app,
            host="127.0.0.1",
            port=self._port,
            log_level="warning",
        )
        self._server = uvicorn.Server(config)

        self._thread = threading.Thread(
            target=self._server.run,
            name=f"mock-{self._name}",
            daemon=True,
        )
        self._thread.start()

        # Wait for server to become ready
        self._wait_until_ready()
        logger.info("Mock '%s' started at %s", self._name, self.base_url)

    def stop(self) -> None:
        """Shut down the mock server."""
        if self._server is not None:
            self._server.should_exit = True
        if self._thread is not None:
            self._thread.join(timeout=5.0)
            self._thread = None
        self._server = None
        logger.info("Mock '%s' stopped", self._name)

    # ── Internal ───────────────────────────────────────────────────────────

    def _setup_catch_all(self) -> None:
        """Register a catch-all route that dispatches to registered endpoints."""

        @self._app.api_route(
            "/{path:path}",
            methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        )
        async def _handle(request: Request, path: str) -> JSONResponse:
            return await self._dispatch(request, f"/{path}")

    async def _dispatch(self, request: Request, path: str) -> JSONResponse:
        """Match an incoming request to a registered route and record it."""
        body = await _read_body(request)

        recorded = RecordedRequest(
            method=request.method,
            path=path,
            headers=dict(request.headers),
            body=body,
            query_params=dict(request.query_params),
            timestamp=datetime.now(timezone.utc),
        )

        with self._lock:
            self._recorded.append(recorded)
            # Signal any waiters for this path
            event = self._call_events.get(path)

        if event is not None:
            event.set()

        # Look up registered route
        route_key = _route_key(request.method, path)
        with self._lock:
            route = self._routes.get(route_key)

        if route is None:
            return JSONResponse(
                status_code=404,
                content={"error": f"No mock endpoint registered for {request.method} {path}"},
            )

        response_body = route.body if route.body is not None else {}
        return JSONResponse(status_code=route.status, content=response_body)

    def _wait_until_ready(self, timeout: float = 5.0) -> None:
        """Poll until the server accepts connections."""
        import time

        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            try:
                with socket.create_connection(("127.0.0.1", self._port), timeout=0.1):  # type: ignore[arg-type]
                    return
            except OSError:
                time.sleep(0.05)
        raise MockServerError(f"Mock '{self._name}' failed to start within {timeout}s")


# ── Module-level helpers ───────────────────────────────────────────────────────


def _route_key(method: str, path: str) -> str:
    return f"{method.upper()}:{path}"


def _find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


async def _read_body(request: Request) -> Any:
    """Read the request body, attempting JSON parse first."""
    raw = await request.body()
    if not raw:
        return None
    try:
        return await request.json()
    except Exception:
        return raw.decode("utf-8", errors="replace")
