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

"""mock_endpoint step — registers a canned HTTP response on the mock server."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from tractusx_testlab.models import StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.server.mock_registry import (
    MockResponse,
    get_callback_manager,
    register_mock,
)
from tractusx_testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext

logger = logging.getLogger(__name__)

_VARIABLE_PREFIX = "@"
_CALLBACKS_PATH_PREFIX = "/callbacks"


def _resolve_variables(obj: dict | list | str, context: "StepContext") -> dict | list | str:
    """Recursively replace ``@var`` references in response bodies."""
    if isinstance(obj, str):
        if obj.startswith(_VARIABLE_PREFIX):
            var_name = obj[len(_VARIABLE_PREFIX):]
            return context.get_variable(var_name, obj)
        return obj
    if isinstance(obj, dict):
        return {k: _resolve_variables(v, context) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_resolve_variables(item, context) for item in obj]
    return obj


@step("mock_endpoint")
class MockEndpointStep(BaseStep):
    """Register a mock HTTP endpoint that returns a canned response.

    Params:
        path (str): URL path to register (e.g. ``/companycertificate/request``).
        method (str): HTTP method (default ``POST``).
        response_status (int): HTTP status code to return (default ``200``).
        response_body (dict): JSON body to return, with ``@var`` variable resolution.

    Output:
        The full callback URL for the registered endpoint.
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        path: str = params["path"]
        method: str = params.get("method", "POST").upper()
        status_code: int = params.get("response_status", 200)
        raw_body: dict = params.get("response_body", {})

        resolved_body = _resolve_variables(raw_body, context)

        full_path = f"{_CALLBACKS_PATH_PREFIX}{path}"
        register_mock(full_path, method, MockResponse(status_code=status_code, body=resolved_body))

        # Pre-register a callback listener so wait_for_call can block on it
        callback_manager = get_callback_manager()
        if callback_manager is not None:
            callback_manager.register(full_path, method)

        port = context.config.server_port
        endpoint_url = f"http://localhost:{port}/testlab{full_path}"

        logger.info("Registered mock endpoint %s %s -> %d", method, full_path, status_code)
        return StepOutput(value=endpoint_url)
