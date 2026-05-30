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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
## It was reviewed and tested by a human committer.

"""Lightweight DSP protocol consumer for direct catalog/negotiation calls."""

from __future__ import annotations

import httpx


class _DspConsumer:
    """Lightweight DSP protocol consumer for direct catalog/negotiation calls."""

    _DSP_CONTEXT = {
        "dspace": "https://w3id.org/dspace/2024/1/",
        "odrl": "http://www.w3.org/ns/odrl/2/",
        "dcat": "http://www.w3.org/ns/dcat#",
    }

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")

    def request_catalog(self, *, filter_expression: list[dict] | None = None) -> httpx.Response:
        """POST a DSP catalog request to the provider."""
        payload: dict = {"@context": self._DSP_CONTEXT, "@type": "dspace:CatalogRequestMessage"}
        if filter_expression:
            payload["filterExpression"] = filter_expression
        return httpx.post(f"{self._base_url}/catalog/request", json=payload, timeout=30.0)

    def initiate_negotiation(
        self,
        *,
        offer: dict | str | None,
        consumer_pid: str,
        callback_address: str | None = None,
    ) -> httpx.Response:
        """POST a DSP negotiation request to the provider."""
        payload: dict = {
            "@context": self._DSP_CONTEXT,
            "@type": "dspace:ContractNegotiationMessage",
            "dspace:consumerPid": consumer_pid,
        }
        if offer:
            payload["dspace:offer"] = offer
        if callback_address:
            payload["dspace:callbackAddress"] = callback_address
        return httpx.post(f"{self._base_url}/negotiations/request", json=payload, timeout=30.0)


def _create_dsp_consumer(protocol_url: str) -> _DspConsumer:
    """Create a lightweight DSP consumer for direct protocol calls."""
    return _DspConsumer(base_url=protocol_url)
