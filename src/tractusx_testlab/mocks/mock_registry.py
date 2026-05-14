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

"""MockRegistry: creates pre-configured MockServer instances from MockConfig."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.exceptions import MockServerError
from tractusx_testlab.mocks.mock_server import MockServer

if TYPE_CHECKING:
    from tractusx_testlab.models.test_models import MockConfig, MockEndpointConfig

# Default endpoints for each built-in mock type: (method, path, status, body)
_BUILTIN_ENDPOINTS: dict[str, list[tuple[str, str, int, object]]] = {
    "dtr": [
        ("GET", "/shell-descriptors", 200, []),
    ],
    "bpn_discovery": [
        ("POST", "/api/administration/connectors/bpnDiscovery", 200, {}),
    ],
    "connector_discovery": [
        ("POST", "/api/administration/connectors/discovery", 200, []),
    ],
    "submodel_server": [
        ("GET", "/submodel", 200, {}),
    ],
    "notification": [
        ("POST", "/notifications/receive", 200, {"status": "RECEIVED"}),
    ],
}


class MockRegistry:
    """Creates and configures MockServer instances from MockConfig declarations."""

    def create(self, config: "MockConfig") -> MockServer:
        """Create a configured MockServer from a MockConfig.

        For built-in types, default endpoints are pre-registered.
        The config.overrides replace matching (method, path) defaults.
        For 'custom' type, only config.endpoints are registered.

        Raises:
            MockServerError: If the mock type is not recognized.
        """
        mock_type = config.type

        if mock_type not in _BUILTIN_ENDPOINTS and mock_type != "custom":
            raise MockServerError(f"Unknown mock type: {mock_type!r}")

        server = MockServer(name=config.name)

        if mock_type == "custom":
            for ep in config.endpoints:
                server.register_endpoint(ep.method, ep.path, ep.status, ep.body)
            return server

        # Start with built-in defaults, then apply overrides
        defaults = list(_BUILTIN_ENDPOINTS[mock_type])
        override_map = {
            (ep.method.upper(), ep.path): ep for ep in config.overrides
        }

        for method, path, status, body in defaults:
            override = override_map.get((method.upper(), path))
            if override is not None:
                server.register_endpoint(
                    override.method, override.path, override.status, override.body
                )
            else:
                server.register_endpoint(method, path, status, body)

        # Also register overrides for paths not in defaults
        for (method, path), ep in override_map.items():
            default_paths = {(m.upper(), p) for m, p, _, _ in defaults}
            if (method, path) not in default_paths:
                server.register_endpoint(ep.method, ep.path, ep.status, ep.body)

        return server
