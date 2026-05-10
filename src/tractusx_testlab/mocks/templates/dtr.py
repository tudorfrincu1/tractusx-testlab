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

"""Digital Twin Registry (DTR) mock template."""

from __future__ import annotations

from tractusx_testlab.models.test_models import MockEndpointConfig
from tractusx_testlab.mocks.templates.base import MockTemplate


_SAMPLE_DESCRIPTOR = {
    "id": "urn:uuid:e5efb206-7ace-43d5-8a97-f0a1deadbeef",
    "idShort": "TestTwin",
    "specificAssetIds": [
        {"name": "manufacturerPartId", "value": "MPI-001"},
    ],
    "submodelDescriptors": [],
}


class DtrTemplate(MockTemplate):
    """Mock for the AAS Digital Twin Registry."""

    def get_default_endpoints(self) -> list[MockEndpointConfig]:
        return [
            MockEndpointConfig(
                method="GET",
                path="/shell-descriptors",
                status=200,
                body={"result": [_SAMPLE_DESCRIPTOR], "paging_metadata": {}},
            ),
            MockEndpointConfig(
                method="POST",
                path="/shell-descriptors",
                status=201,
                body=_SAMPLE_DESCRIPTOR,
            ),
            MockEndpointConfig(
                method="GET",
                path="/shell-descriptors/lookup",
                status=200,
                body={"result": [_SAMPLE_DESCRIPTOR["id"]], "paging_metadata": {}},
            ),
            MockEndpointConfig(
                method="GET",
                path="/shell-descriptors/{id}/submodel-descriptors",
                status=200,
                body={"result": [], "paging_metadata": {}},
            ),
            MockEndpointConfig(
                method="POST",
                path="/shell-descriptors/{id}/submodel-descriptors",
                status=201,
                body={
                    "id": "urn:uuid:00000000-0000-0000-0000-000000000001",
                    "idShort": "TestSubmodel",
                    "semanticId": {"type": "ExternalReference", "keys": []},
                    "endpoints": [],
                },
            ),
        ]
