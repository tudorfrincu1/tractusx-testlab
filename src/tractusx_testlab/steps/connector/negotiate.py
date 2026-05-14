#################################################################################
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
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""Simplified negotiate and initiate_transfer steps for frontend-facing YAML scripts."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput
from tractusx_testlab.syntax.context_vars import EDR_ENTRY, NEGOTIATION_ID, TRANSFER_ID

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


@step("negotiate")
class NegotiateStep(BaseStep):
    """Negotiate a contract for a specific offer.

    Params:
        counter_party_address (str): DSP endpoint of the provider.
        offer_id (str): ID of the offer/policy to negotiate.
        asset_id (str): ID of the asset to negotiate for.
        counter_party_id (str, optional): BPN of the provider.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        consumer = context.get_consumer_service()
        url = f"{context.get_consumer_base_url()}/v3/contractnegotiations"

        negotiation_id = consumer.start_edr_negotiation(
            counter_party_id=params.get("counter_party_id", ""),
            counter_party_address=params["counter_party_address"],
            target=params["asset_id"],
            policy={"odrl:hasPolicy": {"@id": params["offer_id"]}},
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


@step("initiate_transfer")
class InitiateTransferStep(BaseStep):
    """Initiate a data transfer using a finalized contract agreement.

    Params:
        agreement_id (str): Contract agreement ID from negotiation.
        asset_id (str): ID of the asset to transfer.
        transfer_type (str): Transfer type (HttpData-PULL, HttpData-PUSH, AmazonS3-PUSH).
        negotiation_id (str, optional): Negotiation ID, falls back to context variable.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        consumer = context.get_consumer_service()
        url = f"{context.get_consumer_base_url()}/v3/transferprocesses"

        negotiation_id = params.get("negotiation_id") or context.get_variable(
            NEGOTIATION_ID
        )

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
