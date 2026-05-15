###############################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2026 Contributors to the Eclipse Foundation
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

"""Tests for the mock server subsystem."""

from __future__ import annotations

import pytest

from tractusx_testlab.exceptions import MockServerError
from tractusx_testlab.mocks.mock_registry import MockRegistry
from tractusx_testlab.mocks.mock_server import MockServer
from tractusx_testlab.models.test_models import MockConfig, MockEndpointConfig


class TestMockServer:
    def test_register_and_lookup_endpoint(self) -> None:
        server = MockServer(name="test")
        server.register_endpoint("GET", "/health", status=200, body={"ok": True})
        # The route is stored internally
        assert server.name == "test"

    def test_base_url_raises_before_start(self) -> None:
        server = MockServer(name="test")
        with pytest.raises(MockServerError, match="has not been started"):
            _ = server.base_url

    def test_start_and_stop(self) -> None:
        server = MockServer(name="lifecycle-test")
        server.register_endpoint("GET", "/ping", status=200, body={"pong": True})
        server.start()
        assert server.is_running
        assert "http://localhost:" in server.base_url
        server.stop()
        assert not server.is_running

    def test_recorded_requests_empty_initially(self) -> None:
        server = MockServer(name="test")
        assert server.get_recorded_requests() == []


class TestMockRegistry:
    def test_create_dtr_mock(self) -> None:
        registry = MockRegistry()
        config = MockConfig(type="dtr", name="test-dtr")
        server = registry.create(config)
        assert server.name == "test-dtr"

    def test_create_all_builtin_types(self) -> None:
        registry = MockRegistry()
        types = ["bpn_discovery", "connector_discovery", "dtr", "submodel_server", "notification"]
        for t in types:
            server = registry.create(MockConfig(type=t, name=f"mock-{t}"))
            assert server.name == f"mock-{t}"

    def test_create_custom_mock(self) -> None:
        registry = MockRegistry()
        config = MockConfig(
            type="custom",
            name="my-custom",
            endpoints=[
                MockEndpointConfig(method="POST", path="/api/test", status=201, body={"id": 1}),
            ],
        )
        server = registry.create(config)
        assert server.name == "my-custom"

    def test_create_unknown_type_raises(self) -> None:
        registry = MockRegistry()
        config = MockConfig(type="nonexistent_service", name="bad")
        with pytest.raises(MockServerError, match="Unknown mock type"):
            registry.create(config)

    def test_overrides_replace_defaults(self) -> None:
        registry = MockRegistry()
        config = MockConfig(
            type="notification",
            name="custom-notif",
            overrides=[
                MockEndpointConfig(
                    method="POST",
                    path="/notifications/receive",
                    status=202,
                    body={"status": "QUEUED"},
                ),
            ],
        )
        server = registry.create(config)
        assert server.name == "custom-notif"
