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

"""Precondition step — generates EDC policy configuration logs."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from tractusx_testlab.models import StepDefinition
from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput
from tractusx_testlab.steps.precondition._policy_builders import (
    _build_jupiter_policy,
    _build_saturn_policy,
)

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext

_logger = logging.getLogger(__name__)


@step("precondition_policy_config")
class PolicyConfigStep(BaseStep):
    """Generate a CONFIG log describing the EDC policy the SUT must create.

    Params:
        version (str): Dataspace version — ``jupiter`` or ``saturn``.
        policy_type (str): ``access`` or ``usage``.
        permissions (list[dict]): ODRL permission entries.
        prohibitions (list[dict], optional): ODRL prohibition entries (saturn only).
        obligations (list[dict], optional): ODRL obligation entries (saturn only).
        variable (str, optional): Variable name to store the log under.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        version: str = params.get("version", "saturn")
        policy_type: str = params["policy_type"]
        permissions: list[dict[str, Any]] = params.get("permissions", [])
        variable: str | None = params.get("variable")

        if version == "jupiter":
            policy_data = _build_jupiter_policy(policy_type, permissions)
        else:
            prohibitions: list[dict[str, Any]] = params.get("prohibitions", [])
            obligations: list[dict[str, Any]] = params.get("obligations", [])
            policy_data = _build_saturn_policy(
                policy_type, permissions, prohibitions, obligations,
            )

        log = PreconditionLog(
            category=PreconditionLogCategory.EDC_POLICY,
            log_type=PreconditionLogType.CONFIG,
            message=f"{policy_type.capitalize()} policy ({version})",
            data=policy_data,
            variable=variable,
        )

        if variable:
            context.set_variable(variable, log)

        return StepOutput(value=[log])
