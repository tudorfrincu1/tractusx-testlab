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

"""Precondition step — generates EDC asset configuration logs."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.models import StepDefinition
from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


@step("precondition_asset_config")
class AssetConfigStep(BaseStep):
    """Generate a CONFIG log describing the EDC asset the SUT must create.

    Params:
        dct_type (str): The ``dct:type`` value for the asset (e.g. ``cx-taxo:CertificateManagement``).
        properties (dict, optional): Additional asset properties to include.
        variable (str, optional): Variable name to store the log under for downstream use.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        dct_type: str = params["dct_type"]
        properties: dict = params.get("properties", {})
        variable: str | None = params.get("variable")

        data = {
            "dct_type": dct_type,
            "properties": properties,
        }

        log = PreconditionLog(
            category=PreconditionLogCategory.EDC_ASSET,
            log_type=PreconditionLogType.CONFIG,
            message=f"Asset with dct:type '{dct_type}' is required",
            data=data,
            variable=variable,
        )

        if variable:
            context.set_variable(variable, log)

        return StepOutput(value=[log])
