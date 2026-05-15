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

"""Script initialization helpers — seed defaults and register services."""

from __future__ import annotations

from tractusx_testlab.player.execution.context import StepContext
from tractusx_testlab.player.loading.resolver import resolve_service_def
from tractusx_testlab.scripting.script import TestScript


def seed_script_defaults(script: TestScript, context: StepContext) -> None:
    """Seed script-level variable defaults (lowest priority)."""
    for var_name, var_def in script.definition.variables.items():
        if var_def.default is not None and not context.has_variable(var_name):
            context.set_variable(var_name, var_def.default)


def register_script_services(script: TestScript, context: StepContext) -> None:
    """Register services declared in the script, resolving ${var} references."""
    for svc_def in script.definition.services:
        resolved = resolve_service_def(svc_def, context)
        context.services.register(resolved)
