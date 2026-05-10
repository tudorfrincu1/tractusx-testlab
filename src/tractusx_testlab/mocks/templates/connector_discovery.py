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

"""Connector Discovery mock template."""

from __future__ import annotations

from tractusx_testlab.models.test_models import MockEndpointConfig
from tractusx_testlab.mocks.templates.base import MockTemplate


class ConnectorDiscoveryTemplate(MockTemplate):
    """Mock for the Connector Discovery Service (EDC Discovery)."""

    def get_default_endpoints(self) -> list[MockEndpointConfig]:
        return [
            MockEndpointConfig(
                method="POST",
                path="/api/v1.0/administration/connectors/discovery",
                status=200,
                body=[
                    {
                        "bpn": "BPNL00000003CRHK",
                        "connectorEndpoint": [
                            "https://connector.example.com/api/v1/dsp"
                        ],
                    }
                ],
            ),
        ]
