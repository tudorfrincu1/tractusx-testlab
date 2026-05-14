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

"""Async step executor functions and the executor registry."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Callable

import httpx

from tractusx_testlab.exceptions import ExecutionError
from tractusx_testlab.runner.base_step import ExecutionContext, StepResult

if TYPE_CHECKING:
    from tractusx_testlab.models.test_models import Step

_log = logging.getLogger(__name__)


async def execute_noop(step: "Step", ctx: ExecutionContext) -> StepResult:
    """No-op executor — always succeeds with status 200."""
    return StepResult(
        response_status=200,
        response_body={"status": "noop"},
        outputs={},
    )


async def execute_http_request(step: "Step", ctx: ExecutionContext) -> StepResult:
    """Execute a generic HTTP request using resolved step inputs."""
    resolved = ctx.resolve_inputs(step.inputs)

    url: str | None = resolved.get("url")
    if not url:
        raise ExecutionError(
            f"Missing 'url' in step inputs for step '{step.name}'"
        )

    method: str = str(resolved.get("method", "GET")).upper()
    body: Any = resolved.get("body")  # Any: HTTP request body can be dict, list, str, None
    headers: dict[str, str] = resolved.get("headers") or {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                json=body if body is not None else None,
                headers=headers,
                timeout=step.timeout,
            )
    except httpx.RequestError as exc:
        raise ExecutionError(f"HTTP request failed: {exc}") from exc

    try:
        resp_body = response.json()
    except (ValueError, Exception):  # noqa: BLE001 — httpx decode errors are broad
        resp_body = response.text

    return StepResult(
        response_status=response.status_code,
        response_body=resp_body,
        outputs={},
    )


async def execute_create_asset(step: "Step", ctx: ExecutionContext) -> StepResult:
    """POST to the provider management API to create an asset."""
    provider_url: str = ctx.variables.get("provider_url", "")
    api_key: str = ctx.variables.get("provider_api_key", "")
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}
    url = f"{provider_url}/management/v3/assets"

    resolved = ctx.resolve_inputs(step.inputs)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=resolved, headers=headers, timeout=step.timeout
            )
    except httpx.RequestError as exc:
        raise ExecutionError(f"create_asset failed: {exc}") from exc

    try:
        body = response.json()
    except (ValueError, Exception):  # noqa: BLE001
        body = response.text

    asset_id: str = ""
    if isinstance(body, dict):
        asset_id = body.get("@id", "")

    ctx.created_resources.append({"type": "asset", "id": asset_id})

    return StepResult(
        response_status=response.status_code,
        response_body=body,
        outputs={"asset_id": asset_id},
    )


async def execute_query_catalog(step: "Step", ctx: ExecutionContext) -> StepResult:
    """POST to the consumer catalog request endpoint."""
    consumer_url: str = ctx.variables.get("consumer_url", "")
    api_key: str = ctx.variables.get("consumer_api_key", "")
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}
    url = f"{consumer_url}/management/v3/catalog/request"

    resolved = ctx.resolve_inputs(step.inputs)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=resolved, headers=headers, timeout=step.timeout
            )
    except httpx.RequestError as exc:
        raise ExecutionError(f"query_catalog failed: {exc}") from exc

    try:
        body = response.json()
    except (ValueError, Exception):  # noqa: BLE001
        body = response.text

    return StepResult(
        response_status=response.status_code,
        response_body=body,
        outputs={"catalog": body},
    )


async def execute_negotiate_access(step: "Step", ctx: ExecutionContext) -> StepResult:
    """POST to the consumer contract negotiations endpoint."""
    consumer_url: str = ctx.variables.get("consumer_url", "")
    api_key: str = ctx.variables.get("consumer_api_key", "")
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}
    url = f"{consumer_url}/management/v3/contractnegotiations"

    resolved = ctx.resolve_inputs(step.inputs)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=resolved, headers=headers, timeout=step.timeout
            )
    except httpx.RequestError as exc:
        raise ExecutionError(f"negotiate_access failed: {exc}") from exc

    try:
        body = response.json()
    except (ValueError, Exception):  # noqa: BLE001
        body = response.text

    negotiation_id: str = ""
    if isinstance(body, dict):
        negotiation_id = body.get("@id", "")

    return StepResult(
        response_status=response.status_code,
        response_body=body,
        outputs={"negotiation_id": negotiation_id},
    )


async def execute_fetch_data(step: "Step", ctx: ExecutionContext) -> StepResult:
    """POST to the consumer transfer processes endpoint."""
    consumer_url: str = ctx.variables.get("consumer_url", "")
    api_key: str = ctx.variables.get("consumer_api_key", "")
    headers = {"X-Api-Key": api_key, "Content-Type": "application/json"}
    url = f"{consumer_url}/management/v3/transferprocesses"

    resolved = ctx.resolve_inputs(step.inputs)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=resolved, headers=headers, timeout=step.timeout
            )
    except httpx.RequestError as exc:
        raise ExecutionError(f"fetch_data failed: {exc}") from exc

    try:
        body = response.json()
    except (ValueError, Exception):  # noqa: BLE001
        body = response.text

    transfer_id: str = ""
    if isinstance(body, dict):
        transfer_id = body.get("@id", "")

    return StepResult(
        response_status=response.status_code,
        response_body=body,
        outputs={"transfer_id": transfer_id},
    )


_EXECUTORS: dict[str, Callable] = {
    "http_request": execute_http_request,
    "create_asset": execute_create_asset,
    "query_catalog": execute_query_catalog,
    "negotiate_access": execute_negotiate_access,
    "fetch_data": execute_fetch_data,
}


def get_executor(step_type: str) -> Callable:
    """Return the executor for the given step type, or execute_noop for unknowns."""
    return _EXECUTORS.get(step_type, execute_noop)
