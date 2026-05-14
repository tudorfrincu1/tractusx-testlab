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

"""Notification steps — reuses SDK NotificationConsumerService."""

from __future__ import annotations

from typing import TYPE_CHECKING

import requests

from tractusx_testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_testlab.scripting.registry import step
from tractusx_testlab.steps.base import BaseStep, StepOutput
from tractusx_testlab.syntax.context_vars import DATAPLANE_ENDPOINT, EDR_TOKEN

if TYPE_CHECKING:
    from tractusx_testlab.player.execution.context import StepContext


@step("send_notification")
class SendNotificationStep(BaseStep):
    """Send a Catena-X notification via EDC Dataplane using EDR token.

    Params:
        dataplane_url (str): Dataplane endpoint URL; falls back to context variable.
        edr_token (str): EDR authorization token; falls back to context variable.
        notification (dict): Notification payload.
        notification_type (str, optional): Sets header.notificationType if provided.
        timeout (int, optional): Request timeout in seconds (default 30).
    """

    async def execute(
        self, params: dict, context: "StepContext", definition: StepDefinition
    ) -> StepOutput:
        dataplane_url = params.get("dataplane_url") or context.get_variable(
            DATAPLANE_ENDPOINT
        )
        edr_token = params.get("edr_token") or context.get_variable(EDR_TOKEN)
        notification = params.get("notification", {})
        notification_type = params.get("notification_type", "")

        if notification_type and "header" in notification:
            notification["header"]["notificationType"] = notification_type

        headers = {"Authorization": edr_token, "Content-Type": "application/json"}
        timeout = params.get("timeout", 30)

        req = HttpRequest(method="POST", url=dataplane_url, headers=headers, body=notification)
        resp = requests.post(
            dataplane_url, json=notification, headers=headers, timeout=timeout
        )
        try:
            resp_body = resp.json()
        except (ValueError, TypeError):
            resp_body = resp.text

        return StepOutput(
            value=resp_body,
            request=req,
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=resp_body,
            ),
        )


@step("discover_notification_assets")
class DiscoverNotificationAssetsStep(BaseStep):
    """Discover notification assets in a provider catalog."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        notif_service = context.get_notification_service()
        provider_bpn = params["provider_bpn"]
        provider_dsp = params["provider_dsp_url"]

        datasets = notif_service.discover_notification_assets(
            provider_bpn=provider_bpn,
            provider_dsp_url=provider_dsp,
            timeout=params.get("timeout", 60),
        )

        return StepOutput(
            value=datasets,
            request=HttpRequest(method="POST", url=provider_dsp),
            response=HttpResponse(status_code=200, body=datasets),
        )
