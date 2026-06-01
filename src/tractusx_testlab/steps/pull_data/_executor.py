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

"""Pull data executor — delegates to SDK's do_dsp() for the full DSP flow."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.steps.base import BaseStep, StepOutput
from tractusx_testlab.steps.pull_data._constants import (
    DEFAULT_MAX_WAIT,
    DEFAULT_POLL_INTERVAL,
    STEP_PULL_DATA_FILTERED,
    STEP_PULL_DATA_FILTERED_BY_POLICY,
    STEP_PULL_DATA_FILTERED_FROM_PRECONDITION,
)
from tractusx_testlab.syntax.context_vars import DATAPLANE_ENDPOINT, EDR_TOKEN

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext

logger = logging.getLogger(__name__)


class PullDataFiltered(BaseStep):
    """Pull data with filter expression — SDK picks first matching policy."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        filter_expression = _build_filter_expression(params)
        return await _do_dsp_flow(context, params, filter_expression, policies=None)


class PullDataFilteredByPolicy(BaseStep):
    """Pull data with filter expression and explicit policy constraints."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        filter_expression = _build_filter_expression(params)
        policies = params.get("policies") or params.get("policy_constraints")
        return await _do_dsp_flow(context, params, filter_expression, policies=policies)


class PullDataFilteredFromPrecondition(BaseStep):
    """Pull data with filter expression and policy from a precondition variable."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        filter_expression = _build_filter_expression(params)
        precondition_var = params.get("precondition_policy_var", "")
        policies = context.get_variable(precondition_var) if precondition_var else None
        if isinstance(policies, dict):
            policies = [policies]
        return await _do_dsp_flow(context, params, filter_expression, policies=policies)


# -- Shared helpers -----------------------------------------------------------


def _build_filter_expression(params: dict) -> list[dict]:
    """Build SDK-compatible filter expression from step params."""
    filters = params.get("filters", params.get("filter_expression", []))
    if isinstance(filters, dict):
        filters = [filters]
    return [
        {
            "operandLeft": f.get("operand_left", f.get("operandLeft", "")),
            "operator": f.get("operator", "="),
            "operandRight": f.get("operand_right", f.get("operandRight", "")),
        }
        for f in filters
        if isinstance(f, dict)
    ]


async def _do_dsp_flow(
    context: "StepContext",
    params: dict,
    filter_expression: list[dict],
    policies: list[dict] | dict | None,
) -> StepOutput:
    """Execute the full DSP flow via the SDK's do_dsp()."""
    consumer = context.get_consumer_service()
    counter_party_address = params.get("counter_party_address", "")
    max_wait = params.get("max_wait", DEFAULT_MAX_WAIT)
    poll_interval = params.get("poll_interval", DEFAULT_POLL_INTERVAL)

    # Yield to event loop before blocking SDK call
    await asyncio.sleep(0)

    endpoint, token = consumer.do_dsp(
        counter_party_id=params.get("counter_party_id", ""),
        counter_party_address=counter_party_address,
        filter_expression=filter_expression,
        policies=policies,
        max_wait=max_wait,
        poll_interval=poll_interval,
    )

    context.set_variable(DATAPLANE_ENDPOINT, endpoint)
    context.set_variable(EDR_TOKEN, token)

    return StepOutput(
        value={"endpoint": endpoint, "token_prefix": token[:10] + "..." if token else None},
        request=HttpRequest(method="POST", url=counter_party_address),
        response=HttpResponse(status_code=200, body={"endpoint": endpoint}),
    )
