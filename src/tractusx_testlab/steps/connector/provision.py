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

"""Asset provisioning steps — reuses SDK ConnectorProviderService."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

from tractusx_sdk.dataspace.models.connector.model_factory import ModelFactory
from tractusx_sdk.extensions.testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_sdk.extensions.testlab.scripting.registry import step
from tractusx_sdk.extensions.testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_sdk.extensions.testlab.player.execution.context import StepContext


@step("create_asset")
class CreateAssetStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        provider = context.get_provider_service()
        url = f"{context.get_provider_base_url()}/v3/assets"
        result = provider.create_asset(
            asset_id=params["asset_id"],
            base_url=params.get("base_url", ""),
            dct_type=params.get("dct_type"),
            version=params.get("version", "3.0"),
            semantic_id=params.get("semantic_id"),
            proxy_params=params.get("proxy_params"),
            headers=params.get("headers"),
            private_properties=params.get("private_properties"),
            context=params.get("context"),
        )
        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(
                status_code=200 if result else 500,
                body=result,
            ),
        )


@step("create_policy")
class CreatePolicyStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        provider = context.get_provider_service()
        url = f"{context.get_provider_base_url()}/v3/policydefinitions"

        # Build the model to capture the serialized payload for debugging
        policy_model = ModelFactory.get_policy_model(
            dataspace_version=provider.dataspace_version,
            oid=params["policy_id"],
            context=params.get("context"),
            permissions=params.get("permissions", []),
            prohibitions=params.get("prohibitions", []),
            obligations=params.get("obligations", []),
        )
        request_body = json.loads(policy_model.to_data())

        result = provider.create_policy(
            policy_id=params["policy_id"],
            context=params.get("context"),
            permissions=params.get("permissions", []),
            prohibitions=params.get("prohibitions", []),
            obligations=params.get("obligations", []),
        )
        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=request_body),
            response=HttpResponse(status_code=200 if result else 500, body=result),
        )


@step("create_contract_definition")
class CreateContractDefinitionStep(BaseStep):
    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        provider = context.get_provider_service()
        url = f"{context.get_provider_base_url()}/v3/contractdefinitions"
        result = provider.create_contract(
            contract_id=params["contract_id"],
            usage_policy_id=params["usage_policy_id"],
            access_policy_id=params["access_policy_id"],
            asset_id=params["asset_id"],
        )
        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=200 if result else 500, body=result),
        )
