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

"""Simplified DTR registration and lookup steps for frontend-facing YAML scripts."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


@step("register_shell")
class RegisterShellStep(BaseStep):
    """Register a new AAS shell descriptor in the Digital Twin Registry.

    Params:
        id_short (str): Short identifier for the shell.
        global_asset_id (str, optional): Global asset ID.
        specific_asset_ids (dict, optional): Key-value pairs of specific asset IDs.
        submodel_descriptors (list, optional): Pre-built submodel descriptors.
        bpn (str, optional): BPN for authentication routing.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        from tractusx_sdk.industry.models.aas.v3.base import ShellDescriptor, SpecificAssetId

        aas = context.get_aas_service()
        specific_asset_ids = [
            SpecificAssetId(name=k, value=v)
            for k, v in (params.get("specific_asset_ids") or {}).items()
        ]
        descriptor = ShellDescriptor(
            idShort=params["id_short"],
            globalAssetId=params.get("global_asset_id"),
            specificAssetIds=specific_asset_ids or None,
            submodelDescriptors=params.get("submodel_descriptors"),
        )
        bpn = params.get("bpn")
        result = aas.create_asset_administration_shell_descriptor(descriptor, bpn=bpn)
        url = f"{aas.aas_url}/shell-descriptors"
        body = result.to_dict() if hasattr(result, "to_dict") else result
        if isinstance(body, dict):
            shell_id = body.get("id") or body.get("identification", {}).get("id")
            if shell_id:
                context.set_variable("shell_id", shell_id)
        return StepOutput(
            value=body,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=201, body=body),
        )


@step("lookup_shell")
class LookupShellStep(BaseStep):
    """Look up AAS shells by specific asset IDs.

    Params:
        asset_ids (dict): Key-value pairs of specific asset IDs to filter by.
        bpn (str, optional): BPN for authentication routing.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        from tractusx_sdk.industry.models.aas.v3.base import SpecificAssetId

        aas = context.get_aas_service()
        bpn = params.get("bpn")
        asset_ids = [
            SpecificAssetId(name=k, value=v)
            for k, v in (params.get("asset_ids") or {}).items()
        ]
        result = aas.get_all_asset_administration_shell_descriptors(
            asset_administration_shell_ids=None,
            specific_asset_ids=asset_ids or None,
            bpn=bpn,
        )
        url = f"{aas.aas_url}/shell-descriptors"
        body = result if isinstance(result, list) else [result] if result else []
        shell_ids = [
            item.get("id") or item.get("identification", {}).get("id")
            for item in body
            if isinstance(item, dict)
        ]
        return StepOutput(
            value={"shell_ids": shell_ids, "shell_descriptors": body},
            request=HttpRequest(method="GET", url=url),
            response=HttpResponse(status_code=200, body=body),
        )


@step("add_submodel")
class AddSubmodelStep(BaseStep):
    """Add a submodel descriptor to an existing AAS shell.

    Params:
        shell_id (str, optional): AAS shell ID; falls back to context variable 'shell_id'.
        id_short (str): Short identifier for the submodel.
        semantic_id (str): Semantic ID (URN) of the submodel.
        endpoint_url (str): Data service endpoint URL.
        bpn (str, optional): BPN for authentication routing.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        from tractusx_sdk.industry.models.aas.v3.base import (
            Endpoint,
            ProtocolInformation,
            SubModelDescriptor,
        )

        aas = context.get_aas_service()
        aas_id = params.get("shell_id") or context.get_variable("shell_id")
        bpn = params.get("bpn")
        endpoint_url = params["endpoint_url"]
        semantic_id = params["semantic_id"]

        descriptor = SubModelDescriptor(
            idShort=params["id_short"],
            semanticId={
                "type": "ExternalReference",
                "keys": [{"type": "Submodel", "value": semantic_id}],
            },
            endpoints=[
                Endpoint(
                    interface="SUBMODEL-3.0",
                    protocolInformation=ProtocolInformation(href=endpoint_url),
                )
            ],
        )
        result = aas.create_submodel_descriptor(aas_id, descriptor, bpn=bpn)
        url = f"{aas.aas_url}/shell-descriptors/{aas_id}/submodel-descriptors"
        body = result.to_dict() if hasattr(result, "to_dict") else result
        if isinstance(body, dict):
            submodel_id = body.get("id") or body.get("identification", {}).get("id")
            if submodel_id:
                context.set_variable("submodel_id", submodel_id)
        return StepOutput(
            value=body,
            request=HttpRequest(method="POST", url=url, body=params),
            response=HttpResponse(status_code=201, body=body),
        )
