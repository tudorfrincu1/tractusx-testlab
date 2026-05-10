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

from typing import TYPE_CHECKING

from tractusx_sdk.dataspace.tools.dsp_tools import DspTools
from tractusx_sdk.extensions.testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_sdk.extensions.testlab.scripting.registry import step
from tractusx_sdk.extensions.testlab.steps.base import BaseStep, StepOutput
from tractusx_sdk.extensions.testlab.syntax.context_vars import (
    CATALOG_POLICY,
    CATALOG_TARGET,
    DATAPLANE_ENDPOINT,
    EDR_ENTRY,
    EDR_TOKEN,
    NEGOTIATION_ID,
    TRANSFER_ID,
)

if TYPE_CHECKING:
    from tractusx_sdk.extensions.testlab.player.execution.context import StepContext


@step("query_catalog")
class QueryCatalogStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        counter_party_address = params["counter_party_address"]
        counter_party_id = params.get("counter_party_id", "")

        if params.get("filter_expression"):
            result = consumer.get_catalog_with_filter(
                counter_party_id=counter_party_id,
                counter_party_address=counter_party_address,
                filter_expression=params["filter_expression"],
            )
        elif params.get("asset_id"):
            result = consumer.get_catalog_by_asset_id(
                counter_party_id=counter_party_id,
                counter_party_address=counter_party_address,
                asset_id=params["asset_id"],
            )
        else:
            result = consumer.get_catalog(
                counter_party_id=counter_party_id,
                counter_party_address=counter_party_address,
            )

        url = f"{context.get_consumer_base_url()}/v3/catalog/request"
        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=200 if result else 500, body=result),
        )


@step("query_catalog_by_asset_id")
class QueryCatalogByAssetIdStep(BaseStep):
    """Query the catalog filtered by a specific asset ID.

    Params:
        counter_party_address (str): DSP URL of the provider.
        counter_party_id (str): BPN of the provider.
        asset_id (str): The asset ID to filter by.
        policies (list, optional): Allow-list of accepted policies. None accepts any.
    """

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        result = consumer.get_catalog_by_asset_id(
            counter_party_id=params["counter_party_id"],
            counter_party_address=params["counter_party_address"],
            asset_id=params["asset_id"],
        )
        url = f"{context.get_consumer_base_url()}/v3/catalog/request"

        # Auto-extract target (asset ID) and policy from catalog for downstream steps
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
            except Exception:
                pass  # Catalog extraction is best-effort; negotiate_contract will fail explicitly

        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=200 if result else 500, body=result),
        )


@step("query_catalog_by_bpnl")
class QueryCatalogByBpnlStep(BaseStep):
    """Query the catalog using BPNL-based connector discovery.

    In Saturn, the BPNL is used to discover the connector protocol and
    address automatically.

    Params:
        bpnl (str): Business Partner Number of the counterparty.
        counter_party_address (str, optional): DSP URL (discovered via BPNL in Saturn).
        filter_expression (list[dict], optional): Additional filter criteria.
    """

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


@step("negotiate_contract")
class NegotiateContractStep(BaseStep):
    """Start an EDR contract negotiation.

    Params:
        counter_party_id (str): BPN of the provider.
        counter_party_address (str): DSP URL of the provider.
        target (str, optional): Asset ID from catalog. Falls back to ``catalog_target`` in context.
        policy (dict, optional): Offer policy from catalog. Falls back to ``catalog_policy`` in context.
    """

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        url = f"{context.get_consumer_base_url()}/v3/contractnegotiations"

        target = params.get("target") or context.get_variable(CATALOG_TARGET)
        policy = params.get("policy") or context.get_variable(CATALOG_POLICY)

        negotiation_id = consumer.start_edr_negotiation(
            counter_party_id=params["counter_party_id"],
            counter_party_address=params["counter_party_address"],
            target=target,
            policy=policy,
        )

        context.set_variable(NEGOTIATION_ID, negotiation_id)

        return StepOutput(
            value={"negotiation_id": negotiation_id},
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(
                status_code=200 if negotiation_id else 500,
                body={"negotiation_id": negotiation_id},
            ),
        )


@step("transfer_data")
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

        if edr_entry:
            context.set_variable(TRANSFER_ID, edr_entry.get("transferProcessId"))
            context.set_variable(EDR_ENTRY, edr_entry)

        return StepOutput(
            value=edr_entry,
            request=HttpRequest(method="POST", url=url),
            response=HttpResponse(
                status_code=200 if edr_entry else 500,
                body=edr_entry,
            ),
        )


@step("do_dsp")
class DoDspStep(BaseStep):
    """Full DSP flow: catalog → negotiate → transfer → EDR in one step."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        url = f"{context.get_consumer_base_url()}"

        endpoint, token = consumer.do_dsp(
            counter_party_id=params["counter_party_id"],
            counter_party_address=params["counter_party_address"],
            filter_expression=params.get("filter_expression", []),
            policies=params.get("policies"),
            max_wait=params.get("max_wait", 60),
            poll_interval=params.get("poll_interval", 1),
        )

        context.set_variable(DATAPLANE_ENDPOINT, endpoint)
        context.set_variable(EDR_TOKEN, token)

        return StepOutput(
            value={"endpoint": endpoint, "token_prefix": token[:10] + "..." if token else None},
            request=HttpRequest(method="POST", url=url),
            response=HttpResponse(status_code=200, body={"endpoint": endpoint}),
        )


@step("do_dsp_with_bpnl")
class DoDspWithBpnlStep(BaseStep):
    """Full DSP flow via BPNL: discover → catalog → negotiate → transfer → EDR."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        consumer = context.get_consumer_service()
        url = f"{context.get_consumer_base_url()}"

        endpoint, token = consumer.do_dsp_with_bpnl(
            bpnl=params.get("bpnl") or params.get("counter_party_id"),
            counter_party_address=params.get("counter_party_address"),
            filter_expression=params.get("filter_expression", []),
            policies=params.get("policies"),
            max_wait=params.get("max_wait", 60),
            poll_interval=params.get("poll_interval", 1),
        )

        context.set_variable(DATAPLANE_ENDPOINT, endpoint)
        context.set_variable(EDR_TOKEN, token)

        return StepOutput(
            value={"endpoint": endpoint, "token_prefix": token[:10] + "..." if token else None},
            request=HttpRequest(method="POST", url=url),
            response=HttpResponse(status_code=200, body={"endpoint": endpoint}),
        )
