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

"""Resource cleanup steps — delete assets, policies, and contract definitions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


@step("delete_asset")
class DeleteAssetStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        provider = context.get_provider_service()
        asset_id = params.get("asset_id") or context.get_variable("asset_id")
        url = f"{context.get_provider_base_url()}/v3/assets/{asset_id}"

        result = provider.delete_asset(asset_id=asset_id)

        return StepOutput(
            value=result,
            request=HttpRequest(method="DELETE", url=url),
            response=HttpResponse(status_code=204 if result is None else 200, body=result),
        )


@step("delete_policy")
class DeletePolicyStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        provider = context.get_provider_service()
        policy_id = params.get("policy_id") or context.get_variable("policy_id")
        url = f"{context.get_provider_base_url()}/v3/policydefinitions/{policy_id}"

        result = provider.delete_policy(policy_id=policy_id)

        return StepOutput(
            value=result,
            request=HttpRequest(method="DELETE", url=url),
            response=HttpResponse(status_code=204 if result is None else 200, body=result),
        )


@step("delete_contract_definition")
class DeleteContractDefinitionStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        provider = context.get_provider_service()
        contract_id = params.get("contract_definition_id") or context.get_variable("contract_definition_id")
        url = f"{context.get_provider_base_url()}/v3/contractdefinitions/{contract_id}"

        result = provider.delete_contract(contract_id=contract_id)

        return StepOutput(
            value=result,
            request=HttpRequest(method="DELETE", url=url),
            response=HttpResponse(status_code=204 if result is None else 200, body=result),
        )

    async def cleanup(self, context: "StepContext") -> None:
        pass
