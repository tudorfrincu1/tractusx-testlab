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

"""MockRegistry — creates MockServer instances from template types."""

from __future__ import annotations

import logging

from tractusx_testlab.exceptions import MockServerError
from tractusx_testlab.models.test_models import MockConfig, MockEndpointConfig
from tractusx_testlab.mocks.mock_server import MockServer
from tractusx_testlab.mocks.templates.base import MockTemplate
from tractusx_testlab.mocks.templates.bpn_discovery import BpnDiscoveryTemplate
from tractusx_testlab.mocks.templates.connector_discovery import ConnectorDiscoveryTemplate
from tractusx_testlab.mocks.templates.dtr import DtrTemplate
from tractusx_testlab.mocks.templates.notification import NotificationTemplate
from tractusx_testlab.mocks.templates.submodel_server import SubmodelServerTemplate

logger = logging.getLogger(__name__)

# ── Built-in template registry ────────────────────────────────────────────────

_TEMPLATES: dict[str, type[MockTemplate]] = {
    "bpn_discovery": BpnDiscoveryTemplate,
    "connector_discovery": ConnectorDiscoveryTemplate,
    "dtr": DtrTemplate,
    "submodel_server": SubmodelServerTemplate,
    "notification": NotificationTemplate,
}


class MockRegistry:
    """Factory that creates configured MockServer instances from MockConfig."""

    def __init__(self) -> None:
        self._templates: dict[str, type[MockTemplate]] = dict(_TEMPLATES)

    def register_template(self, type_name: str, template_cls: type[MockTemplate]) -> None:
        """Register a custom mock template type."""
        self._templates[type_name] = template_cls

    def create(self, config: MockConfig) -> MockServer:
        """Create a MockServer from a MockConfig, applying template + overrides.

        For 'custom' type, only explicit endpoints are registered.
        For known types, template defaults are loaded, then overrides are applied.
        """
        server = MockServer(name=config.name)

        if config.type == "custom":
            endpoints = config.endpoints
        else:
            template_cls = self._templates.get(config.type)
            if template_cls is None:
                raise MockServerError(f"Unknown mock type '{config.type}'")
            template = template_cls()
            endpoints = _apply_overrides(template.get_default_endpoints(), config.overrides)

        for ep in endpoints:
            server.register_endpoint(
                method=ep.method,
                path=ep.path,
                status=ep.status,
                body=ep.body,
            )

        logger.info(
            "Created mock '%s' (type=%s) with %d endpoints",
            config.name,
            config.type,
            len(endpoints),
        )
        return server

    def create_all(self, configs: list[MockConfig]) -> list[MockServer]:
        """Create MockServer instances for all configs."""
        return [self.create(c) for c in configs]


def _apply_overrides(
    defaults: list[MockEndpointConfig],
    overrides: list[MockEndpointConfig],
) -> list[MockEndpointConfig]:
    """Merge override endpoints into defaults (override wins by method+path)."""
    result: dict[str, MockEndpointConfig] = {}
    for ep in defaults:
        key = f"{ep.method.upper()}:{ep.path}"
        result[key] = ep
    for ep in overrides:
        key = f"{ep.method.upper()}:{ep.path}"
        result[key] = ep
    return list(result.values())
