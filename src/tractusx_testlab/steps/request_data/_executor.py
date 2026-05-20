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

"""Main executor for pull_data shortcut steps (catalog → negotiate → transfer → EDR)."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from tractusx_sdk.dataspace.services.dsp import DspServiceFactory

from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.steps.base import BaseStep, StepOutput
from tractusx_testlab.steps.pull_data._catalog import (
    CatalogQueryError,
    CatalogResult,
    query_multi_filter,
)
from tractusx_testlab.steps.pull_data._constants import (
    CATALOG_MULTI_FILTER,
    DEFAULT_MAX_WAIT,
    DEFAULT_POLL_INTERVAL,
    SELECT_BY_INDEX,
    SELECT_BY_POLICY,
    SELECT_BY_PRECONDITION,
)
from tractusx_testlab.syntax import defaults
from tractusx_testlab.steps.pull_data._dsp_flow import (
    EdrExtractionError,
    NegotiationError,
    TransferError,
    extract_edr,
    initiate_transfer,
    negotiate_contract,
)
from tractusx_testlab.steps.pull_data._selection import (
    DatasetSelectionError,
    select_by_index,
    select_by_policy_constraints,
    select_by_precondition_policy,
)

if TYPE_CHECKING:
    from tractusx_sdk.dataspace.services.dsp.consumer import DspConsumerService
    from tractusx_testlab.player.execution.context import StepContext

logger = logging.getLogger(__name__)


class RequestDataExecutor(BaseStep):
    """Executes the full catalog → negotiate → transfer → EDR flow.

    Configured per step type with a catalog strategy and selection strategy.
    Dataspace version is resolved at runtime from step params or defaults.
    """

    __slots__ = ("_catalog_strategy", "_selection_strategy")

    def __init__(
        self,
        catalog_strategy: str,
        selection_strategy: str,
    ) -> None:
        self._catalog_strategy = catalog_strategy
        self._selection_strategy = selection_strategy

    async def execute(
        self,
        params: dict,
        context: "StepContext",
        definition: StepDefinition,
    ) -> StepOutput:
        """Run the full pull_data flow."""
        counter_party_address = params.get("counter_party_address", "")
        max_wait = params.get("max_wait", DEFAULT_MAX_WAIT)
        poll_interval = params.get("poll_interval", DEFAULT_POLL_INTERVAL)

        dataspace_version = params.get("dataspace_version", defaults.DATASPACE_VERSION)
        dsp_consumer = DspServiceFactory.get_dsp_consumer_service(
            dataspace_version=dataspace_version,
            base_url=counter_party_address,
        )

        # 1. Query catalog
        catalog_result = await self._query_catalog(dsp_consumer, params)

        # 2. Select dataset
        dataset, asset_id = self._select_dataset(catalog_result, params)

        # 3. Extract offer from dataset
        offer = self._extract_offer(dataset, catalog_result)

        # 4. Negotiate contract
        agreement_id = await negotiate_contract(
            dsp_consumer=dsp_consumer,
            offer=offer,
            callback_address=params.get("callback_address"),
            max_wait=max_wait,
            poll_interval=poll_interval,
        )

        # 5. Initiate transfer
        transfer_id = await initiate_transfer(
            dsp_consumer=dsp_consumer,
            agreement_id=agreement_id,
            transfer_type=params.get("transfer_type"),
            callback_address=params.get("callback_address"),
            max_wait=max_wait,
            poll_interval=poll_interval,
        )

        # 6. Extract EDR
        edr_token, dataplane_url = await extract_edr(
            dsp_consumer=dsp_consumer,
            transfer_id=transfer_id,
            max_wait=max_wait,
            poll_interval=poll_interval,
        )

        # 7. Store outputs in context
        outputs: dict[str, str] = {
            "edr_token": edr_token,
            "dataplane_url": dataplane_url,
            "agreement_id": agreement_id,
            "transfer_id": transfer_id,
        }
        if asset_id:
            outputs["asset_id"] = asset_id

        for key, val in outputs.items():
            context.set_variable(key, val)

        return StepOutput(
            value=outputs,
            request=HttpRequest(method="POST", url=counter_party_address),
            response=HttpResponse(status_code=200, body=outputs),
        )

    # ------------------------------------------------------------------
    # Catalog phase
    # ------------------------------------------------------------------

    async def _query_catalog(
        self,
        dsp_consumer: "DspConsumerService",
        params: dict,
    ) -> CatalogResult:
        """Dispatch to the configured catalog strategy."""
        if self._catalog_strategy == CATALOG_MULTI_FILTER:
            return await query_multi_filter(
                dsp_consumer=dsp_consumer,
                filters=params.get("filter_expression_list", []),
            )
        raise CatalogQueryError(reason=f"unknown catalog strategy: {self._catalog_strategy}")

    # ------------------------------------------------------------------
    # Selection phase
    # ------------------------------------------------------------------

    def _select_dataset(
        self,
        catalog_result: CatalogResult,
        params: dict,
    ) -> tuple[dict, str | None]:
        """Select a dataset and return (dataset, asset_id)."""
        datasets = catalog_result.datasets

        if self._selection_strategy == SELECT_BY_INDEX:
            dataset = select_by_index(datasets, params.get("dataset_index"))
        elif self._selection_strategy == SELECT_BY_POLICY:
            dataset = select_by_policy_constraints(
                datasets, params.get("policy_constraints", [])
            )
        elif self._selection_strategy == SELECT_BY_PRECONDITION:
            dataset = select_by_precondition_policy(
                datasets, params.get("precondition_policy", {})
            )
        else:
            raise DatasetSelectionError(
                reason=f"unknown selection strategy: {self._selection_strategy}",
                available_count=len(datasets),
            )

        asset_id = dataset.get("@id") or dataset.get("edc:id") or dataset.get("id")
        return dataset, asset_id

    # ------------------------------------------------------------------
    # Offer extraction
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_offer(dataset: dict, catalog_result: CatalogResult) -> dict | str:
        """Extract the policy/offer from the selected dataset."""
        if not dataset:
            return catalog_result.asset_id or ""

        policies = dataset.get("odrl:hasPolicy", [])
        if isinstance(policies, dict):
            policies = [policies]
        if policies:
            return policies[0]
        return dataset.get("@id", "")
