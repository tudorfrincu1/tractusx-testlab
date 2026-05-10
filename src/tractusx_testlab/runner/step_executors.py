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

"""Built-in step executors for common Tractus-X operations."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.models.test_models import Step
from tractusx_testlab.runner.base_step import ExecutionContext, StepResult

logger = logging.getLogger(__name__)


async def execute_http_request(step: Step, context: ExecutionContext) -> StepResult:
    """Execute a generic HTTP request step."""
    inputs = context.resolve_inputs(step.inputs)
    method = inputs.get("method", "GET")
    url = inputs.get("url", "")
    headers = inputs.get("headers", {})
    body = inputs.get("body")

    if not url:
        raise ExecutionError("Missing 'url' input", step_name=step.name, step_type=step.type)

    async with httpx.AsyncClient(timeout=step.timeout) as client:
        response = await client.request(
            method=method,
            url=url,
            headers=headers,
            json=body if body else None,
        )

    response_body = _parse_response(response)
    return StepResult(
        response_status=response.status_code,
        response_body=response_body,
        response_headers=dict(response.headers),
    )


async def execute_create_asset(step: Step, context: ExecutionContext) -> StepResult:
    """Execute a create_asset step via the provider connector."""
    inputs = context.resolve_inputs(step.inputs)
    connector_url = context.variables.get("provider_url", "")
    api_key = context.variables.get("provider_api_key", "")
    asset_id = context.generate_id()

    payload = {
        "@context": {"edc": "https://w3id.org/edc/v0.0.1/ns/"},
        "@id": asset_id,
        "properties": {
            "edc:name": inputs.get("name", "Test Asset"),
            "edc:description": inputs.get("description", ""),
        },
        "dataAddress": {
            "@type": "DataAddress",
            "type": "HttpData",
            "baseUrl": inputs.get("base_url", "https://example.com/data"),
        },
    }

    async with httpx.AsyncClient(timeout=step.timeout) as client:
        response = await client.post(
            f"{connector_url}/management/v3/assets",
            headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            json=payload,
        )

    context.created_resources.append({"type": "asset", "id": asset_id, "url": connector_url})
    return StepResult(
        outputs={"asset_id": asset_id},
        response_status=response.status_code,
        response_body=_parse_response(response),
        response_headers=dict(response.headers),
    )


async def execute_query_catalog(step: Step, context: ExecutionContext) -> StepResult:
    """Execute a query_catalog step against a connector."""
    inputs = context.resolve_inputs(step.inputs)
    connector_url = context.variables.get("consumer_url", "")
    api_key = context.variables.get("consumer_api_key", "")
    counter_party = inputs.get("counter_party_url", context.variables.get("provider_url", ""))

    payload = {
        "@context": {"edc": "https://w3id.org/edc/v0.0.1/ns/"},
        "counterPartyAddress": f"{counter_party}/api/v1/dsp",
        "protocol": "dataspace-protocol-http",
    }

    async with httpx.AsyncClient(timeout=step.timeout) as client:
        response = await client.post(
            f"{connector_url}/management/v3/catalog/request",
            headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            json=payload,
        )

    body = _parse_response(response)
    return StepResult(
        outputs={"catalog": body},
        response_status=response.status_code,
        response_body=body,
        response_headers=dict(response.headers),
    )


async def execute_negotiate_access(step: Step, context: ExecutionContext) -> StepResult:
    """Execute a contract negotiation step."""
    inputs = context.resolve_inputs(step.inputs)
    connector_url = context.variables.get("consumer_url", "")
    api_key = context.variables.get("consumer_api_key", "")
    offer_id = inputs.get("offer_id", "")
    asset_id = inputs.get("asset_id", context.variables.get("asset_id", ""))
    counter_party = inputs.get("counter_party_url", context.variables.get("provider_url", ""))

    payload = {
        "@context": {"edc": "https://w3id.org/edc/v0.0.1/ns/"},
        "counterPartyAddress": f"{counter_party}/api/v1/dsp",
        "protocol": "dataspace-protocol-http",
        "policy": {
            "@type": "Offer",
            "@id": offer_id,
            "assigner": counter_party,
            "target": asset_id,
        },
    }

    async with httpx.AsyncClient(timeout=step.timeout) as client:
        response = await client.post(
            f"{connector_url}/management/v3/contractnegotiations",
            headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            json=payload,
        )

    body = _parse_response(response)
    negotiation_id = body.get("@id", "") if isinstance(body, dict) else ""
    return StepResult(
        outputs={"negotiation_id": negotiation_id},
        response_status=response.status_code,
        response_body=body,
        response_headers=dict(response.headers),
    )


async def execute_fetch_data(step: Step, context: ExecutionContext) -> StepResult:
    """Execute a data transfer fetch step."""
    inputs = context.resolve_inputs(step.inputs)
    connector_url = context.variables.get("consumer_url", "")
    api_key = context.variables.get("consumer_api_key", "")
    contract_id = inputs.get("contract_id", "")
    asset_id = inputs.get("asset_id", context.variables.get("asset_id", ""))

    payload = {
        "@context": {"edc": "https://w3id.org/edc/v0.0.1/ns/"},
        "assetId": asset_id,
        "contractId": contract_id,
        "dataDestination": {"type": "HttpProxy"},
        "protocol": "dataspace-protocol-http",
        "counterPartyAddress": context.variables.get("provider_url", "") + "/api/v1/dsp",
    }

    async with httpx.AsyncClient(timeout=step.timeout) as client:
        response = await client.post(
            f"{connector_url}/management/v3/transferprocesses",
            headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            json=payload,
        )

    body = _parse_response(response)
    transfer_id = body.get("@id", "") if isinstance(body, dict) else ""
    return StepResult(
        outputs={"transfer_id": transfer_id, "payload": body},
        response_status=response.status_code,
        response_body=body,
        response_headers=dict(response.headers),
    )


async def execute_noop(step: Step, context: ExecutionContext) -> StepResult:
    """No-op executor for steps not yet implemented."""
    logger.warning("Step type '%s' is not yet implemented — executing as no-op", step.type)
    return StepResult(
        outputs={},
        response_status=200,
        response_body={"status": "noop", "step": step.name},
    )


# ── Step executor registry ────────────────────────────────────────────────────

STEP_EXECUTORS: dict[str, Any] = {
    "http_request": execute_http_request,
    "create_asset": execute_create_asset,
    "query_catalog": execute_query_catalog,
    "negotiate_access": execute_negotiate_access,
    "fetch_data": execute_fetch_data,
}


def get_executor(step_type: str) -> Any:
    """Look up the executor for a step type, falling back to no-op."""
    return STEP_EXECUTORS.get(step_type, execute_noop)


def _parse_response(response: httpx.Response) -> Any:
    """Parse an HTTP response body as JSON, falling back to text."""
    try:
        return response.json()
    except Exception:
        return response.text
