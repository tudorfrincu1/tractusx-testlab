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

"""Abstract base for mock templates and the built-in template registry."""

from __future__ import annotations

from abc import ABC, abstractmethod

from tractusx_testlab.models.test_models import MockEndpointConfig


class MockTemplate(ABC):
    """Base class for mock service templates.

    Each template provides a set of default endpoints that mimic a real
    Tractus-X service (DTR, BPN Discovery, etc.).
    """

    @abstractmethod
    def get_default_endpoints(self) -> list[MockEndpointConfig]:
        """Return the default endpoint configurations for this template type."""
