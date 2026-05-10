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

"""Submodel Server mock template."""

from __future__ import annotations

from tractusx_testlab.models.test_models import MockEndpointConfig
from tractusx_testlab.mocks.templates.base import MockTemplate


class SubmodelServerTemplate(MockTemplate):
    """Mock for a generic AAS Submodel Server."""

    def get_default_endpoints(self) -> list[MockEndpointConfig]:
        return [
            MockEndpointConfig(
                method="GET",
                path="/submodel",
                status=200,
                body={
                    "modelType": "Submodel",
                    "id": "urn:uuid:00000000-0000-0000-0000-000000000001",
                    "idShort": "TestSubmodel",
                    "submodelElements": [],
                },
            ),
        ]
