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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4).
## It was reviewed and tested by a human committer.

"""wait_for_call step — blocks until a mock endpoint receives an inbound request."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from tractusx_testlab.models import ListenerDefinition, StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.server.mock_registry import get_callback_manager
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext

logger = logging.getLogger(__name__)

_CALLBACKS_PATH_PREFIX = "/callbacks"
_DEFAULT_TIMEOUT_S = 60.0


@step("wait_for_call")
class WaitForCallStep(BaseStep):
    """Wait for an inbound HTTP request on a previously-registered path.

    Params:
        path (str): URL path to listen on (e.g. ``/companycertificate/status``).
        method (str): HTTP method to match (default ``POST``).
        timeout (float): Seconds to wait before failing (default ``60``).

    Output:
        The request body received from the inbound call.

    Raises:
        RuntimeError: If no ``CallbackManager`` is available or the wait times out.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        path: str = params["path"]
        method: str = params.get("method", "POST").upper()
        timeout: float = params.get("timeout", _DEFAULT_TIMEOUT_S)

        manager = get_callback_manager()
        if manager is None:
            raise RuntimeError(
                "No CallbackManager available — wait_for_call requires the TestLab server"
            )

        full_path = f"{_CALLBACKS_PATH_PREFIX}{path}"
        listener = ListenerDefinition(
            name=definition.type,
            path=full_path,
            method=method,
            timeout_s=timeout,
        )

        manager.register(listener)
        logger.info("Waiting up to %.0fs for %s %s", timeout, method, full_path)

        result = await manager.wait(listener)

        if result.timed_out:
            raise RuntimeError(
                f"Timed out after {timeout}s waiting for {method} {full_path}"
            )

        logger.info("Received callback on %s %s", method, full_path)
        return StepOutput(value=result.payload)
