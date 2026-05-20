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

"""DSP flow helpers: negotiate, transfer, and EDR extraction for pull_data steps."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING

from tractusx_testlab.steps.pull_data._constants import DEFAULT_TRANSFER_TYPE

if TYPE_CHECKING:
    from tractusx_sdk.dataspace.services.dsp.consumer import DspConsumerService

logger = logging.getLogger(__name__)


class NegotiationError(Exception):
    """Contract negotiation failed or timed out."""

    def __init__(self, reason: str, negotiation_id: str | None = None):
        self.negotiation_id = negotiation_id
        super().__init__(f"Negotiation failed: {reason}")


class TransferError(Exception):
    """Transfer process failed or timed out."""

    def __init__(self, reason: str, transfer_id: str | None = None):
        self.transfer_id = transfer_id
        super().__init__(f"Transfer failed: {reason}")


class EdrExtractionError(Exception):
    """Could not extract EDR token from transfer result."""

    def __init__(self, reason: str, transfer_id: str | None = None):
        self.transfer_id = transfer_id
        super().__init__(f"EDR extraction failed: {reason}")


async def negotiate_contract(
    dsp_consumer: "DspConsumerService",
    offer: dict | str,
    callback_address: str | None,
    max_wait: int,
    poll_interval: int,
) -> str:
    """Initiate and poll contract negotiation until FINALIZED.

    Returns:
        The agreement ID.

    Raises:
        NegotiationError: If negotiation fails or times out.
    """
    resp = dsp_consumer.initiate_negotiation(
        offer=offer,
        callback_address=callback_address,
    )

    try:
        body = resp.json()
    except (ValueError, AttributeError) as exc:
        raise NegotiationError(reason="invalid response from negotiation initiation") from exc

    negotiation_id = body.get("@id") or body.get("dspace:providerPid", "")
    if not negotiation_id:
        raise NegotiationError(reason="no negotiation ID in response")

    deadline = time.monotonic() + max_wait
    while time.monotonic() < deadline:
        state_resp = dsp_consumer.get_negotiation(negotiation_id)
        try:
            state_body = state_resp.json()
        except (ValueError, AttributeError):
            state_body = {}

        state = state_body.get("dspace:state", state_body.get("state", ""))
        if state.upper() in ("FINALIZED", "AGREED"):
            logger.info("Negotiation %s finalized", negotiation_id)
            return state_body.get("dspace:agreementId", negotiation_id)
        if state.upper() in ("TERMINATED", "ERROR"):
            raise NegotiationError(
                reason=f"negotiation entered {state} state",
                negotiation_id=negotiation_id,
            )

        await asyncio.sleep(poll_interval)

    raise NegotiationError(
        reason=f"timed out after {max_wait}s waiting for FINALIZED",
        negotiation_id=negotiation_id,
    )


async def initiate_transfer(
    dsp_consumer: "DspConsumerService",
    agreement_id: str,
    transfer_type: str | None,
    callback_address: str | None,
    max_wait: int,
    poll_interval: int,
) -> str:
    """Initiate and poll transfer process until STARTED.

    Returns:
        The transfer process ID.

    Raises:
        TransferError: If the transfer fails or times out.
    """
    actual_transfer_type = transfer_type or DEFAULT_TRANSFER_TYPE

    resp = dsp_consumer.initiate_transfer(
        agreement_id=agreement_id,
        transfer_type=actual_transfer_type,
        callback_address=callback_address,
    )

    try:
        body = resp.json()
    except (ValueError, AttributeError) as exc:
        raise TransferError(reason="invalid response from transfer initiation") from exc

    transfer_id = body.get("@id") or body.get("dspace:providerPid", "")
    if not transfer_id:
        raise TransferError(reason="no transfer ID in response")

    deadline = time.monotonic() + max_wait
    while time.monotonic() < deadline:
        state_resp = dsp_consumer.get_transfer(transfer_id)
        try:
            state_body = state_resp.json()
        except (ValueError, AttributeError):
            state_body = {}

        state = state_body.get("dspace:state", state_body.get("state", ""))
        if state.upper() in ("STARTED", "COMPLETED"):
            logger.info("Transfer %s started", transfer_id)
            return transfer_id
        if state.upper() in ("TERMINATED", "ERROR"):
            raise TransferError(
                reason=f"transfer entered {state} state",
                transfer_id=transfer_id,
            )

        await asyncio.sleep(poll_interval)

    raise TransferError(
        reason=f"timed out after {max_wait}s waiting for STARTED",
        transfer_id=transfer_id,
    )


async def extract_edr(
    dsp_consumer: "DspConsumerService",
    transfer_id: str,
    max_wait: int,
    poll_interval: int,
) -> tuple[str, str]:
    """Extract EDR token and dataplane URL from the transfer.

    Returns:
        Tuple of (edr_token, dataplane_url).

    Raises:
        EdrExtractionError: If EDR cannot be extracted within max_wait.
    """
    deadline = time.monotonic() + max_wait

    while time.monotonic() < deadline:
        try:
            edr_resp = dsp_consumer.get_edr(transfer_id)
            try:
                edr_body = edr_resp.json()
            except (ValueError, AttributeError):
                edr_body = {}

            token = edr_body.get("authorization") or edr_body.get("tx:auth:token", "")
            endpoint = edr_body.get("endpoint") or edr_body.get("tx:auth:endpoint", "")

            if token and endpoint:
                logger.info("EDR extracted for transfer %s", transfer_id)
                return token, endpoint
        except (AttributeError, TypeError):
            pass

        await asyncio.sleep(poll_interval)

    raise EdrExtractionError(
        reason=f"timed out after {max_wait}s waiting for EDR",
        transfer_id=transfer_id,
    )
