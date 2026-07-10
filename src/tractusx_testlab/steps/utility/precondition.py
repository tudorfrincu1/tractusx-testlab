################################################################################
# Eclipse Tractus-X - Tractus-X TestLab
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
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""precondition/provide — stores a constant value for downstream steps."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tractusx_testlab.models import StepDefinitionV2
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


@step("precondition/provide")
class PreconditionProvideStep(BaseStep):
    """Store a constant value as a step output for downstream steps to reference.

    The ``with.value`` is returned under the field name declared in ``returns:``.
    When exactly one return field is declared, the value is wrapped under that
    key so that ``${{ setup.<id>.<field> }}`` resolves correctly.

    Params:
        value: The constant value to expose as a step output.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinitionV2,
    ) -> StepOutput:
        value = params.get("value")
        returns = definition.returns or {}
        if len(returns) == 1:
            field = next(iter(returns))
            return StepOutput(value={field: value})
        return StepOutput(value=value)
