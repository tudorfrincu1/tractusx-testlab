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

"""Abstract base class for all steps and the @step auto-registration decorator."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any, Optional

from tractusx_testlab.models import (
    HttpRequest,
    HttpResponse,
    StepDefinition,
)

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


class StepOutput:
    """Structured output of a step execution."""

    __slots__ = ("value", "request", "response")

    def __init__(
        self,
        value: Any = None,
        request: Optional[HttpRequest] = None,
        response: Optional[HttpResponse] = None,
    ):
        self.value = value
        self.request = request
        self.response = response


class BaseStep(ABC):
    """Abstract base class for all testlab steps.

    Subclasses implement ``execute`` and are registered via the ``@step`` decorator
    from ``scripting.registry``.
    """

    @abstractmethod
    async def execute(
        self,
        params: dict,
        context: "StepContext",
        definition: StepDefinition,
    ) -> StepOutput:
        """Run the step logic.

        Args:
            params: Resolved step parameters from YAML (variables substituted).
            context: Runtime context providing services, variables, job memory.
            definition: The raw step definition.

        Returns:
            StepOutput with optional value, request, and response.
        """
        raise NotImplementedError

    async def cleanup(self, context: "StepContext") -> None:
        """Optional cleanup hook executed after the step's script finishes."""
