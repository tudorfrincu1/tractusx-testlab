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

"""Variable and service definition resolution for ${var} references."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from tractusx_testlab.models import ServiceDefinition
from tractusx_testlab.syntax import patterns

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


def resolve_str(value: str, context: "StepContext") -> str:
    """Replace ``${var}`` references in a single string."""
    return patterns.VAR_REF.sub(
        lambda m: str(context.get_variable(m.group(1), m.group(0))),
        value,
    )


def resolve_params(params: dict, context: "StepContext") -> dict:
    """Replace ``${var}`` references in param values with context variables."""
    resolved: dict[str, Any] = {}
    for key, value in params.items():
        if isinstance(value, str):
            resolved[key] = resolve_str(value, context)
        elif isinstance(value, dict):
            resolved[key] = resolve_params(value, context)
        else:
            resolved[key] = value
    return resolved


def resolve_service_def(svc_def: ServiceDefinition, context: "StepContext") -> ServiceDefinition:
    """Return a copy of *svc_def* with ``${var}`` references resolved."""
    resolved_auth = {
        auth_key: resolve_str(auth_value, context) if isinstance(auth_value, str) else auth_value
        for auth_key, auth_value in svc_def.auth.items()
    }
    resolved_params: dict | None = None
    if svc_def.params:
        resolved_params = {
            param_key: resolve_str(param_value, context) if isinstance(param_value, str) else param_value
            for param_key, param_value in svc_def.params.items()
        }
    return ServiceDefinition(
        name=svc_def.name,
        type=svc_def.type,
        base_url=resolve_str(svc_def.base_url, context),
        auth=resolved_auth,
        params=resolved_params,
    )
