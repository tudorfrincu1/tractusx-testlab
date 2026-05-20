#################################################################################
# Eclipse Tractus-X - Software Development KIT
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
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Catalog query strategies for pull_data shortcut blocks."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tractusx_sdk.dataspace.services.dsp.consumer import DspConsumerService

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CatalogResult:
    """Result of a catalog query."""

    datasets: list[dict] = field(default_factory=list)
    raw_catalog: dict = field(default_factory=dict)
    asset_id: str | None = None


class CatalogQueryError(Exception):
    """Catalog request failed."""

    def __init__(self, reason: str, status_code: int | None = None):
        self.status_code = status_code
        super().__init__(f"Catalog query failed: {reason}")


async def query_multi_filter(
    dsp_consumer: "DspConsumerService",
    filters: list[dict],
) -> CatalogResult:
    """Query catalog with multiple filter expressions.

    Args:
        dsp_consumer: DSP consumer service pointed at the counter-party.
        filters: List of filter dicts with keys: operand_left, operator, operand_right.

    Returns:
        CatalogResult with datasets extracted from the catalog response.

    Raises:
        CatalogQueryError: If the catalog request returns a non-200 status.
    """
    filter_expression = [
        {
            "operandLeft": f.get("operand_left", f.get("operandLeft", "")),
            "operator": f.get("operator", "="),
            "operandRight": f.get("operand_right", f.get("operandRight", "")),
        }
        for f in filters
        if isinstance(f, dict)
    ]

    if not filter_expression:
        raise CatalogQueryError(reason="empty filter expression list provided")

    response = dsp_consumer.request_catalog(filter_expression=filter_expression)
    if response.status_code != 200:
        raise CatalogQueryError(
            reason=f"status {response.status_code} with {len(filter_expression)} filters",
            status_code=response.status_code,
        )

    catalog = response.json()
    datasets = _extract_datasets(catalog)
    logger.debug("Multi-filter catalog returned %d datasets", len(datasets))
    return CatalogResult(datasets=datasets, raw_catalog=catalog)


async def skip_catalog(asset_id: str) -> CatalogResult:
    """Skip catalog query when asset_id is already known.

    Returns a stub CatalogResult with the asset_id set.
    """
    logger.debug("Skipping catalog query — using known asset_id=%s", asset_id)
    return CatalogResult(datasets=[], asset_id=asset_id)


def _extract_datasets(catalog: dict) -> list[dict]:
    """Extract dcat:dataset list from a catalog response."""
    datasets = catalog.get("dcat:dataset", [])
    if isinstance(datasets, dict):
        datasets = [datasets]
    return datasets
