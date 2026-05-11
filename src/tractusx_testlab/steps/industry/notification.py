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

from tractusx_sdk.extensions.testlab.models import HttpRequest, HttpResponse, StepDefinition
from tractusx_sdk.extensions.testlab.scripting.registry import step
from tractusx_sdk.extensions.testlab.steps.base import BaseStep, StepOutput

if TYPE_CHECKING:
    from tractusx_sdk.extensions.testlab.player.execution.context import StepContext


@step("send_notification")
class SendNotificationStep(BaseStep):
    """Send a notification through the dataspace using the SDK NotificationConsumerService."""

    async def execute(self, params: dict, context: "StepContext", definition: StepDefinition) -> StepOutput:
        notif_service = context.get_notification_service()
        from tractusx_sdk.industry.models.notifications.notification import Notification

        notification = Notification(**params["notification"])
        provider_bpn = params["provider_bpn"]
        provider_dsp = params["provider_dsp_url"]
        endpoint_path = params.get("endpoint_path", "")

        result = notif_service.send_notification(
            provider_bpn=provider_bpn,
            provider_dsp_url=provider_dsp,
            notification=notification,
            endpoint_path=endpoint_path,
            timeout=params.get("timeout", 30),
        )

        return StepOutput(
            value=result,
            request=HttpRequest(method="POST", url=provider_dsp, body=notification.to_data()),
            response=HttpResponse(status_code=200 if result else 500, body=result),
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
