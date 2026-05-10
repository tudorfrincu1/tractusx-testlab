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

"""DSP protocol-level steps for conformity assessment testing.

These steps bypass the EDC Management API and communicate directly with
DSP protocol endpoints. Used for CX-0018 CAC testing where the test
acts as a DSP participant to verify protocol-level compliance.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_sdk.extensions.testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_sdk.extensions.testlab.scripting.registry import step
from tractusx_sdk.extensions.testlab.steps.base import BaseStep, StepOutput
from tractusx_sdk.extensions.testlab.syntax.context_vars import (
    DSP_CATALOG,
    DSP_CONTRACT_AGREEMENT_ID,
    DSP_NEGOTIATION_CONSUMER_PID,
    DSP_NEGOTIATION_PROVIDER_PID,
    DSP_NEGOTIATION_STATE,
    DSP_OFFER,
    DSP_OFFER_ID,
    DSP_TRANSFER_CONSUMER_PID,
    DSP_TRANSFER_PROVIDER_PID,
    DSP_TRANSFER_STATE,
)

if TYPE_CHECKING:
    from tractusx_sdk.extensions.testlab.player.execution.context import StepContext

# DSP JSON-LD property keys
_DSPACE_PROVIDER_PID = "dspace:providerPid"
_DSPACE_CONSUMER_PID = "dspace:consumerPid"
_DSPACE_STATE = "dspace:state"
_DSPACE_AGREEMENT_ID = "dspace:agreementId"


@step("dsp_version")
class DspVersionStep(BaseStep):
    """Query the DSP version endpoint directly.

    Sends ``GET .well-known/dspace-version`` to the provider's
    DSP protocol endpoint using the ``DSP_CONSUMER`` service.

    Returns the raw protocol response for assertion.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        dsp = context.get_dsp_consumer_service(params.get("service"))
        resp = dsp.get_version()

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        return StepOutput(
            value=body,
            request=HttpRequest(
                method="GET",
                url=f"{dsp.base_url}/.well-known/dspace-version",
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_catalog_request")
class DspCatalogRequestStep(BaseStep):
    """Send a DSP CatalogRequestMessage directly to the provider.

    Constructs a proper ``dspace:CatalogRequestMessage`` in JSON-LD
    and sends it to the provider's ``catalog/request`` endpoint.
    This tests the actual DSP protocol wire format, not the Management API.

    Params:
        service (str, optional): Named DSP_CONSUMER service to use.
        filter_expression (list[dict], optional): DCAT filter criteria.

    Stores in context:
        dsp_catalog: The full catalog response.
        dsp_offer: The first offer found (if any).
        dsp_offer_id: The first offer ID found (if any).
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        dsp = context.get_dsp_consumer_service(params.get("service"))
        filter_expression = params.get("filter_expression")

        resp = dsp.request_catalog(filter_expression=filter_expression)

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        # Auto-extract first offer for downstream steps
        if isinstance(body, dict):
            context.set_variable(DSP_CATALOG, body)
            datasets = body.get("dcat:dataset") or body.get("dspace:dataset") or []
            if isinstance(datasets, dict):
                datasets = [datasets]
            if datasets:
                first = datasets[0]
                offer = first.get("odrl:hasPolicy") or first.get("dspace:hasPolicy")
                if isinstance(offer, list) and offer:
                    offer = offer[0]
                if offer:
                    context.set_variable(DSP_OFFER, offer)
                    context.set_variable(DSP_OFFER_ID, offer.get("@id"))

        return StepOutput(
            value=body,
            request=HttpRequest(
                method="POST",
                url=f"{dsp.base_url}/catalog/request",
                body={"filter_expression": filter_expression},
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_negotiate")
class DspNegotiateStep(BaseStep):
    """Send a DSP ContractRequestMessage directly to the provider.

    Params:
        service (str, optional): Named DSP_CONSUMER service to use.
        offer (dict, optional): ODRL Offer from catalog. Falls back to ``dsp_offer``.
        consumer_pid (str, optional): Consumer process ID. Auto-generated if omitted.
        callback_address (str, optional): Consumer DSP callback URL.

    Stores in context:
        dsp_negotiation_provider_pid: Provider-assigned process ID (``dspace:providerPid``).
        dsp_negotiation_consumer_pid: Consumer process ID (``dspace:consumerPid``).
        dsp_negotiation_state: Current negotiation state (``dspace:state``).
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        import uuid

        dsp = context.get_dsp_consumer_service(params.get("service"))
        offer = params.get("offer") or context.get_variable(DSP_OFFER)
        consumer_pid = params.get("consumer_pid", f"urn:uuid:{uuid.uuid4()}")
        callback_address = params.get("callback_address")

        resp = dsp.initiate_negotiation(
            offer=offer,
            consumer_pid=consumer_pid,
            callback_address=callback_address,
        )

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        # Extract and store DSP negotiation state for downstream steps
        if isinstance(body, dict):
            provider_pid = body.get(_DSPACE_PROVIDER_PID)
            if provider_pid:
                context.set_variable(DSP_NEGOTIATION_PROVIDER_PID, provider_pid)
            c_pid = body.get(_DSPACE_CONSUMER_PID)
            if c_pid:
                context.set_variable(DSP_NEGOTIATION_CONSUMER_PID, c_pid)
            state = body.get(_DSPACE_STATE)
            if state:
                context.set_variable(DSP_NEGOTIATION_STATE, state)

        return StepOutput(
            value=body,
            request=HttpRequest(
                method="POST",
                url=f"{dsp.base_url}/negotiations/initial",
                body={"offer": offer, "consumer_pid": consumer_pid},
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_get_negotiation")
class DspGetNegotiationStep(BaseStep):
    """Poll a DSP negotiation state by provider PID.

    Sends ``GET negotiations/{provider_pid}`` to retrieve the current
    negotiation process state. Used to wait for async negotiation to
    reach a target state (e.g., ``FINALIZED``, ``AGREED``).

    Params:
        service (str, optional): Named DSP_CONSUMER service to use.
        provider_pid (str, optional): Provider PID. Falls back to ``dsp_negotiation_provider_pid``.

    Stores in context:
        dsp_negotiation_state: Current negotiation state (``dspace:state``).
        contract_agreement_id: Agreement ID once negotiation is FINALIZED.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        dsp = context.get_dsp_consumer_service(params.get("service"))
        provider_pid = params.get("provider_pid") or context.get_variable(
            DSP_NEGOTIATION_PROVIDER_PID,
        )

        resp = dsp.get_negotiation(provider_pid=provider_pid)

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        if isinstance(body, dict):
            state = body.get(_DSPACE_STATE)
            if state:
                context.set_variable(DSP_NEGOTIATION_STATE, state)
            agreement_id = body.get(_DSPACE_AGREEMENT_ID)
            if agreement_id:
                context.set_variable(DSP_CONTRACT_AGREEMENT_ID, agreement_id)

        return StepOutput(
            value=body,
            request=HttpRequest(
                method="GET",
                url=f"{dsp.base_url}/negotiations/{provider_pid}",
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_transfer_request")
class DspTransferRequestStep(BaseStep):
    """Send a DSP TransferRequestMessage directly to the provider.

    Params:
        service (str, optional): Named DSP_CONSUMER service to use.
        agreement_id (str, optional): Contract agreement ID. Falls back to ``contract_agreement_id``.
        format (str): Transfer type profile (e.g., ``HttpData-PULL``).
        consumer_pid (str, optional): Consumer process ID.
        callback_address (str, optional): Consumer DSP callback URL.
        data_address (dict, optional): Destination for PUSH transfers.

    Stores in context:
        dsp_transfer_provider_pid: Provider-assigned transfer process ID.
        dsp_transfer_consumer_pid: Consumer transfer process ID.
        dsp_transfer_state: Current transfer state.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        import uuid

        dsp = context.get_dsp_consumer_service(params.get("service"))
        agreement_id = params.get("agreement_id") or context.get_variable(
            DSP_CONTRACT_AGREEMENT_ID,
        )
        resp = dsp.request_transfer(
            agreement_id=agreement_id,
            transfer_format=params.get("format", "HttpData-PULL"),
            consumer_pid=params.get("consumer_pid", f"urn:uuid:{uuid.uuid4()}"),
            callback_address=params.get("callback_address"),
            data_address=params.get("data_address"),
        )

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        # Extract and store DSP transfer state for downstream steps
        if isinstance(body, dict):
            provider_pid = body.get(_DSPACE_PROVIDER_PID)
            if provider_pid:
                context.set_variable(DSP_TRANSFER_PROVIDER_PID, provider_pid)
            c_pid = body.get(_DSPACE_CONSUMER_PID)
            if c_pid:
                context.set_variable(DSP_TRANSFER_CONSUMER_PID, c_pid)
            state = body.get(_DSPACE_STATE)
            if state:
                context.set_variable(DSP_TRANSFER_STATE, state)

        return StepOutput(
            value=body,
            request=HttpRequest(
                method="POST",
                url=f"{dsp.base_url}/transfers/request",
                body=params,
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_get_transfer")
class DspGetTransferStep(BaseStep):
    """Poll a DSP transfer state by provider PID.

    Sends ``GET transfers/{provider_pid}`` to retrieve the current
    transfer process state. Used to wait for async transfer to
    reach a target state (e.g., ``STARTED``, ``COMPLETED``).

    Params:
        service (str, optional): Named DSP_CONSUMER service to use.
        provider_pid (str, optional): Provider PID. Falls back to ``dsp_transfer_provider_pid``.

    Stores in context:
        dsp_transfer_state: Current transfer state (``dspace:state``).
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        dsp = context.get_dsp_consumer_service(params.get("service"))
        provider_pid = params.get("provider_pid") or context.get_variable(
            DSP_TRANSFER_PROVIDER_PID,
        )

        resp = dsp.get_transfer(provider_pid=provider_pid)

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        if isinstance(body, dict):
            state = body.get(_DSPACE_STATE)
            if state:
                context.set_variable(DSP_TRANSFER_STATE, state)

        return StepOutput(
            value=body,
            request=HttpRequest(
                method="GET",
                url=f"{dsp.base_url}/transfers/{provider_pid}",
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_resolve_did")
class DspResolveDidStep(BaseStep):
    """Resolve a DID document via HTTP.

    Params:
        did_url (str): The DID URL to resolve.
        timeout (float, optional): Request timeout.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        from tractusx_sdk.dataspace.services.dsp import BaseDspConsumerService

        did_url = params["did_url"]
        resp = BaseDspConsumerService.resolve_did(
            did_url=did_url,
            timeout=params.get("timeout", 30.0),
        )

        try:
            body = resp.json()
        except Exception:
            body = resp.text

        return StepOutput(
            value=body,
            request=HttpRequest(method="GET", url=did_url),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )


@step("dsp_request")
class DspGenericRequestStep(BaseStep):
    """Generic DSP protocol request for custom testing.

    Allows sending any HTTP request through the DSP_CONSUMER service
    for protocol-level testing not covered by specialized steps.

    Params:
        service (str, optional): Named DSP_CONSUMER service to use.
        method (str): HTTP method. Default: GET.
        path (str): Path relative to the DSP base URL.
        body (any, optional): Request body.
        headers (dict, optional): Extra headers.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition,
    ) -> StepOutput:
        dsp = context.get_dsp_consumer_service(params.get("service"))
        method = params.get("method", "GET").upper()
        path = params["path"]
        body = params.get("body")
        headers = params.get("headers")

        resp = dsp.request(method, path, body=body, headers=headers)

        try:
            resp_body = resp.json()
        except Exception:
            resp_body = resp.text

        return StepOutput(
            value=resp_body,
            request=HttpRequest(
                method=method,
                url=f"{dsp.base_url}/{path.lstrip('/')}",
                headers=headers,
                body=body,
            ),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=resp_body,
            ),
        )
