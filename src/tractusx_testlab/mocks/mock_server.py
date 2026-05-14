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

"""Lightweight HTTP mock server backed by stdlib HTTPServer running in a daemon thread."""

from __future__ import annotations

import asyncio
import json
import logging
import threading
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

from tractusx_testlab.exceptions import MockServerError

_log = logging.getLogger(__name__)


@dataclass
class RecordedRequest:
    """A single HTTP request recorded by the mock server."""

    method: str
    path: str
    body: Any = None  # Any: body can be dict, str, None


@dataclass
class _Endpoint:
    method: str
    path: str
    status: int
    body: Any  # Any: response body can be dict, list, str, None


def _make_handler(mock_server: "MockServer") -> type:
    """Factory that creates a request handler class bound to a MockServer instance."""

    class _Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            self._dispatch("GET")

        def do_POST(self) -> None:
            self._dispatch("POST")

        def do_PUT(self) -> None:
            self._dispatch("PUT")

        def do_DELETE(self) -> None:
            self._dispatch("DELETE")

        def do_PATCH(self) -> None:
            self._dispatch("PATCH")

        def _dispatch(self, method: str) -> None:
            body = self._read_body()
            path = self.path.split("?")[0]

            with mock_server._lock:
                mock_server._recorded.append(
                    RecordedRequest(method=method, path=path, body=body)
                )
                endpoint = mock_server._find_endpoint(method, path)

            if endpoint is None:
                self._send_json(404, {"error": "not found"})
                return

            resp_body = endpoint.body
            if isinstance(resp_body, (dict, list)):
                self._send_json(endpoint.status, resp_body)
            elif resp_body is not None:
                self._send_text(endpoint.status, str(resp_body))
            else:
                self._send_json(endpoint.status, {})

        def _read_body(self) -> Any:
            length_header = self.headers.get("Content-Length")
            if not length_header:
                return None
            try:
                length = int(length_header)
                raw = self.rfile.read(length)
                content_type = self.headers.get("Content-Type", "")
                if "json" in content_type:
                    return json.loads(raw.decode("utf-8"))
                return raw.decode("utf-8")
            except (ValueError, OSError):
                return None

        def _send_json(self, status: int, data: Any) -> None:
            payload = json.dumps(data).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def _send_text(self, status: int, text: str) -> None:
            payload = text.encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, fmt: str, *args: Any) -> None:
            pass  # suppress stdlib HTTP server request logging

    return _Handler


class MockServer:
    """Thread-safe HTTP mock server using stdlib HTTPServer on a random port."""

    def __init__(self, name: str) -> None:
        self._name = name
        self._endpoints: list[_Endpoint] = []
        self._recorded: list[RecordedRequest] = []
        self._lock = threading.Lock()
        self._server: HTTPServer | None = None
        self._thread: threading.Thread | None = None

    @property
    def name(self) -> str:
        return self._name

    def register_endpoint(
        self, method: str, path: str, status: int, body: Any
    ) -> None:
        """Register a response for the given method + path combination."""
        with self._lock:
            self._endpoints.append(
                _Endpoint(method=method.upper(), path=path, status=status, body=body)
            )

    def _find_endpoint(self, method: str, path: str) -> _Endpoint | None:
        """Return the last matching endpoint or None. Caller must hold _lock."""
        for ep in reversed(self._endpoints):
            if ep.method == method.upper() and ep.path == path:
                return ep
        return None

    def start(self) -> None:
        """Start the mock server in a daemon thread (idempotent)."""
        if self._server is not None:
            return
        handler_class = _make_handler(self)
        self._server = HTTPServer(("localhost", 0), handler_class)
        self._thread = threading.Thread(
            target=self._server.serve_forever,
            daemon=True,
            name=f"mock-{self._name}",
        )
        self._thread.start()
        _log.debug("MockServer '%s' started on %s", self._name, self._server.server_address)

    def stop(self) -> None:
        """Shut down the mock server (idempotent)."""
        if self._server is None:
            return
        self._server.shutdown()
        self._server = None
        if self._thread is not None:
            self._thread.join(timeout=5)
            self._thread = None

    @property
    def is_running(self) -> bool:
        return self._server is not None

    @property
    def base_url(self) -> str:
        """Return the base URL. Raises MockServerError if not started."""
        if self._server is None:
            raise MockServerError(
                f"Mock server '{self._name}' has not been started"
            )
        host, port = self._server.server_address
        return f"http://localhost:{port}"

    def get_recorded_requests(
        self, path: str | None = None
    ) -> list[RecordedRequest]:
        """Return recorded requests, optionally filtered by path."""
        with self._lock:
            if path is None:
                return list(self._recorded)
            return [r for r in self._recorded if r.path == path]

    async def wait_for_call(
        self, path: str, timeout: float = 5.0
    ) -> RecordedRequest:
        """Poll until a request to path is recorded, or raise MockServerError on timeout."""
        loop = asyncio.get_event_loop()
        deadline = loop.time() + timeout
        while True:
            records = self.get_recorded_requests(path)
            if records:
                return records[-1]
            if loop.time() >= deadline:
                raise MockServerError(
                    f"Timed out waiting for call to '{path}' on mock '{self._name}'"
                )
            await asyncio.sleep(0.05)
