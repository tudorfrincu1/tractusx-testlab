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

from tractusx_sdk.extensions.testlab.models import StepDefinition
from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_sdk.extensions.testlab.scripting.registry import step
from tractusx_sdk.extensions.testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_sdk.extensions.testlab.player.execution.context import StepContext

_logger = logging.getLogger(__name__)


def _build_jupiter_policy(
    policy_type: str,
    permissions: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build a policy body following Jupiter (EDC v0.8–v0.10) conventions.

    Jupiter forces ``odrl:use`` as the action, adds ``tx:``/``cx-policy:``
    prefixes to constraint operand left-hand sides, and omits
    prohibition/obligation.
    """
    processed_permissions: list[dict[str, Any]] = []
    for perm in permissions:
        constraints = []
        for c in perm.get("constraints", []):
            constraints.append({
                "leftOperand": f"tx:{c['leftOperand']}",
                "operator": c.get("operator", "eq"),
                "rightOperand": f"cx-policy:{c['rightOperand']}",
            })
        processed_permissions.append({
            "action": "odrl:use",
            "constraints": constraints,
        })

    return {
        "policy_type": policy_type,
        "version": "jupiter",
        "permissions": processed_permissions,
    }


def _build_saturn_policy(
    policy_type: str,
    permissions: list[dict[str, Any]],
    prohibitions: list[dict[str, Any]],
    obligations: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build a policy body following Saturn (EDC v0.11+, DSP 2025-1) conventions.

    Saturn uses the action as-is (use/access), does not add prefixes,
    and includes prohibition/obligation when provided.
    """
    return {
        "policy_type": policy_type,
        "version": "saturn",
        "permissions": permissions,
        "prohibitions": prohibitions,
        "obligations": obligations,
    }


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
