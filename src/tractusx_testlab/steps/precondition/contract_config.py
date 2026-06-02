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

"""Precondition step — generates EDC contract definition configuration logs."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.models import StepDefinition
from tractusx_testlab.models.runtime.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext

_EDC_ID_NS = "https://w3id.org/edc/v0.0.1/ns/id"


@step("precondition_contract_config")
class ContractConfigStep(BaseStep):
    """Generate a CONFIG log describing the EDC contract definition the SUT must create.

    Params:
        asset_id (str): ID of the asset this contract covers.
        access_policy_id (str): ID of the access policy to bind.
        usage_policy_id (str): ID of the usage policy to bind.
        variable (str, optional): Variable name to store the log under.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        asset_id: str = params["asset_id"]
        access_policy_id: str = params["access_policy_id"]
        usage_policy_id: str = params["usage_policy_id"]
        variable: str | None = params.get("variable")

        data = {
            "asset_id": asset_id,
            "access_policy_id": access_policy_id,
            "usage_policy_id": usage_policy_id,
            "asset_selector": {_EDC_ID_NS: asset_id},
        }

        log = PreconditionLog(
            category=PreconditionLogCategory.EDC_CONTRACT,
            log_type=PreconditionLogType.CONFIG,
            message=f"Contract definition binding asset '{asset_id}'",
            data=data,
            variable=variable,
        )

        if variable:
            context.set_variable(variable, log)

        return StepOutput(value=[log])
