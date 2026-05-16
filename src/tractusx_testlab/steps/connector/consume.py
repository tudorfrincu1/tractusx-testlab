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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). 
## It was reviewed and tested by a human committer.

"""Catalog, negotiation, and transfer steps — reuses SDK ConnectorConsumerService."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from tractusx_sdk.dataspace.services.dsp import DspServiceFactory
from tractusx_sdk.dataspace.tools.dsp_tools import DspTools
from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput
from tractusx_testlab.syntax import defaults
from tractusx_testlab.syntax.context_vars import (
    CATALOG_POLICY,
    CATALOG_TARGET,
    DATAPLANE_ENDPOINT,
    EDR_ENTRY,
    EDR_TOKEN,
    NEGOTIATION_ID,
    TRANSFER_ID,
)

if TYPE_CHECKING:
    from tractusx_sdk.dataspace.services.dsp.consumer import DspConsumerService
    from tractusx_testlab.player.execution.context import StepContext

logger = logging.getLogger(__name__)


def _create_dsp_consumer(protocol_url: str) -> "DspConsumerService":
    """Create a lightweight DSP consumer for direct protocol calls."""
    return DspServiceFactory.get_dsp_consumer_service(
        dataspace_version=defaults.DATASPACE_VERSION,
        base_url=protocol_url,
    )


@step("query_catalog")
class QueryCatalogStep(BaseStep):
    """Query a provider's catalog via DSP protocol."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        counter_party_address = params.get("counter_party_address") or params.get("provider_url", "")
        filter_expression = params.get("filter_expression")
        if not filter_expression:
            filter_dict = params.get("filter", {})
            if isinstance(filter_dict, dict):
                filter_expression = filter_dict.get("filter_expression")

        dsp_consumer = _create_dsp_consumer(counter_party_address)
        response = dsp_consumer.request_catalog(filter_expression=filter_expression)

        url = f"{counter_party_address}/catalog/request"
        if response.status_code != 200:
            logger.error(
                "Catalog request failed: status=%d, url=%s",
                response.status_code, url,
            )
            return StepOutput(
                value=None,
                request=HttpRequest(method="POST", url=url, body=params),
                response=HttpResponse(status_code=response.status_code, body=None),
            )

        result = response.json()

        datasets = result.get("dcat:dataset", [])
        if isinstance(datasets, dict):
            datasets = [datasets]
        context.set_variable("datasets", datasets)

        return StepOutput(
            value={"catalog": result, "datasets": datasets},
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=200, body=result),
        )


@step("query_catalog_by_asset_id")
class QueryCatalogByAssetIdStep(BaseStep):
    """Query the catalog filtered by a specific asset ID."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        result = consumer.get_catalog_by_asset_id(
            counter_party_id=params["counter_party_id"],
            counter_party_address=params["counter_party_address"],
            asset_id=params["asset_id"],
        )
        url = f"{context.get_consumer_base_url()}/v3/catalog/request"

        if result:
            try:
                valid_assets_policies = DspTools.filter_assets_and_policies(
                    catalog=result,
                    allowed_policies=params.get("policies", []),
                )
                if valid_assets_policies:
                    target, policy = valid_assets_policies[0]
                    context.set_variable(CATALOG_TARGET, target)
                    context.set_variable(CATALOG_POLICY, policy)
            except (KeyError, TypeError, ValueError, IndexError):
                pass  # Catalog extraction is best-effort; negotiate_contract will fail explicitly

        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=200 if result else 500, body=result),
        )


@step("query_catalog_by_bpnl")
class QueryCatalogByBpnlStep(BaseStep):
    """Query the catalog using BPNL-based connector discovery."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        result = consumer.get_catalog_with_bpnl(
            bpnl=params["bpnl"],
            counter_party_address=params.get("counter_party_address"),
            filter_expression=params.get("filter_expression"),
        )
        url = f"{context.get_consumer_base_url()}/v3/catalog/request"
        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=200 if result else 500, body=result),
        )


@step("negotiate_contract", aliases=["negotiate"])
class NegotiateContractStep(BaseStep):
    """Start a DSP contract negotiation directly with the provider."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        import uuid as _uuid

        counter_party_address = params.get("counter_party_address") or context.get_variable("provider_address", "")
        offer = params.get("policy") or params.get("offer_id") or context.get_variable(CATALOG_POLICY)
        consumer_pid = params.get("consumer_pid", f"urn:uuid:{_uuid.uuid4()}")

        # Use DSP protocol directly (same as catalog step) to avoid management API mismatch.
        dsp_consumer = _create_dsp_consumer(counter_party_address)
        resp = dsp_consumer.initiate_negotiation(
            offer=offer,
            consumer_pid=consumer_pid,
            callback_address=params.get("callback_address"),
        )

        url = f"{counter_party_address}/negotiations/request"
        try:
            body = resp.json()
        except (ValueError, TypeError):
            body = resp.text

        agreement_id = None
        negotiation_id = None
        if isinstance(body, dict):
            negotiation_id = body.get("@id")
            agreement = body.get("dspace:agreement", {})
            if isinstance(agreement, dict):
                agreement_id = agreement.get("@id")

        if negotiation_id:
            context.set_variable(NEGOTIATION_ID, negotiation_id)
        if agreement_id:
            context.set_variable("agreement_id", agreement_id)

        return StepOutput(
            value={"negotiation_id": negotiation_id, "agreement_id": agreement_id},
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(
                status_code=resp.status_code,
                body=body,
            ),
        )


@step("transfer_data", aliases=["initiate_transfer"])
class TransferDataStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        url = f"{context.get_consumer_base_url()}/v3/transferprocesses"

        if params.get("negotiation_id"):
            negotiation_id = params["negotiation_id"]
        else:
            negotiation_id = context.get_variable(NEGOTIATION_ID)

        edr_entry = consumer.get_edr_entry(
            negotiation_id=negotiation_id,
            verify=params.get("verify"),
        )

        data_address_result = None
        if edr_entry:
            transfer_process_id = edr_entry.get("transferProcessId") or edr_entry.get("@id")
            context.set_variable(TRANSFER_ID, transfer_process_id)
            context.set_variable(EDR_ENTRY, edr_entry)

            # Get the actual data address (endpoint + auth token) using the transfer process ID
            try:
                data_address_result = consumer.get_edr(
                    transfer_id=transfer_process_id,
                    verify=params.get("verify"),
                )
            except ConnectionError:
                logger.warning("Failed to retrieve EDR data address for transfer %s", transfer_process_id)

            if data_address_result:
                endpoint = data_address_result.get("endpoint")
                auth_token = data_address_result.get("authorization") or data_address_result.get("authCode")
                if endpoint:
                    context.set_variable("data_address", endpoint)
                    context.set_variable(DATAPLANE_ENDPOINT, endpoint)
                if auth_token:
                    context.set_variable(EDR_TOKEN, auth_token)
                    context.set_variable("edr_token", auth_token)

        endpoint = data_address_result.get("endpoint") if data_address_result else None
        auth_token = (
            data_address_result.get("authorization") or data_address_result.get("authCode")
        ) if data_address_result else None
        result_value = {
            "edr_entry": edr_entry,
            "data_address": endpoint,
            "edr_token": auth_token,
            "data_address_raw": data_address_result,
        }
        return StepOutput(
            value=result_value,
            request=HttpRequest(method="POST", url=url),
            response=HttpResponse(
                status_code=200 if edr_entry else 500,
                body=result_value,
            ),
        )


