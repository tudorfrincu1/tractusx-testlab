#  Eclipse Tractus-X - Tractus-X TestLab
#
#  Copyright (c) 2026 Contributors to the Eclipse Foundation
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
#  SPDX-License-Identifier: Apache-2.0

## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Disposable stub SUT simulating an EDC connector for CCM TCK tests."""

import asyncio
import uuid
from datetime import datetime

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from responses import (
    CERTIFICATE_PAYLOAD,
    PROVIDER_BPN,
    build_callback_payload,
    build_catalog,
    build_certificate_rejected_response,
    build_certificate_request_response,
    build_notification_ack,
)
from management import router as management_router

app = FastAPI(title="CCM SUT Stub", version="0.1.0")
app.include_router(management_router)

TESTLAB_CALLBACK_URL = "http://localhost:8100"
CALLBACK_DELAY_SECONDS = 10

OFFER_ID = "ccm-offer-001"
AGREEMENT_ID = f"agreement-{uuid.uuid4()}"
TRANSFER_ID = f"transfer-{uuid.uuid4()}"
EDR_TOKEN = f"edr-token-{uuid.uuid4()}"


# ---------------------------------------------------------------------------
# DSP Catalog
# ---------------------------------------------------------------------------

@app.post("/api/v1/dsp/catalog/request")
async def catalog_request(request: Request) -> JSONResponse:
    """Return a CX-0135 compliant catalog with CCMAPI and Submodel datasets."""
    return JSONResponse(build_catalog(OFFER_ID))


# ---------------------------------------------------------------------------
# DSP Negotiation
# ---------------------------------------------------------------------------

@app.post("/api/v1/dsp/negotiations/initial")
@app.post("/api/v1/dsp/negotiations/request")
async def negotiation_request(request: Request) -> JSONResponse:
    """Accept a negotiation request and return an immediate agreement."""
    body = await request.json()
    negotiation_id = str(uuid.uuid4())
    return JSONResponse({
        "@context": {"dspace": "https://w3id.org/dspace/2024/1/"},
        "@type": "dspace:ContractNegotiation",
        "@id": negotiation_id,
        "dspace:state": "FINALIZED",
        "dspace:agreement": {
            "@id": AGREEMENT_ID,
            "@type": "dspace:Agreement",
        },
    })


@app.get("/api/v1/dsp/negotiations/{negotiation_id}")
async def negotiation_status(negotiation_id: str) -> JSONResponse:
    """Return FINALIZED status for any negotiation ID."""
    return JSONResponse({
        "@context": {"dspace": "https://w3id.org/dspace/2024/1/"},
        "@type": "dspace:ContractNegotiation",
        "@id": negotiation_id,
        "dspace:state": "FINALIZED",
        "dspace:agreement": {"@id": AGREEMENT_ID},
    })


# ---------------------------------------------------------------------------
# Transfer / EDR
# ---------------------------------------------------------------------------

@app.post("/management/v3/transferprocesses")
async def transfer_process(request: Request) -> JSONResponse:
    """Initiate a transfer and return the transfer ID."""
    return JSONResponse({
        "@type": "TransferProcess",
        "@id": TRANSFER_ID,
        "state": "STARTED",
    })


@app.get("/management/v3/edrs/{transfer_id}/dataaddress")
async def edr_data_address(transfer_id: str) -> JSONResponse:
    """Return a data address with an EDR auth token."""
    return JSONResponse({
        "@type": "DataAddress",
        "type": "HttpData",
        "endpoint": "http://localhost:8090",
        "authType": "bearer",
        "authCode": EDR_TOKEN,
        "authorization": EDR_TOKEN,
    })


# ---------------------------------------------------------------------------
# Generic data-plane POST (notification via dataplane)
# ---------------------------------------------------------------------------

@app.post("/")
async def dataplane_root(request: Request) -> JSONResponse:
    """Accept a dataplane POST (used for notification sends via EDR)."""
    body = await request.json()
    asyncio.create_task(_send_notification_ack(body))
    return JSONResponse({"status": "OK"})


# ---------------------------------------------------------------------------
# Certificate Data
# ---------------------------------------------------------------------------

@app.get("/companycertificate/{document_id}")
async def get_certificate(document_id: str) -> JSONResponse:
    """Return a CX-0135 v3.1.0 BusinessPartnerCertificate payload."""
    payload = {**CERTIFICATE_PAYLOAD, "document": {**CERTIFICATE_PAYLOAD["document"], "documentID": document_id}}
    return JSONResponse(payload)


# ---------------------------------------------------------------------------
# Certificate Request + Delayed Callback
# ---------------------------------------------------------------------------

async def _send_callback(request_id: str) -> None:
    """Wait, then POST CX-0135 status callback to the TestLab server."""
    await asyncio.sleep(CALLBACK_DELAY_SECONDS)
    callback_url = f"{TESTLAB_CALLBACK_URL}/companycertificate/status"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(callback_url, json=build_callback_payload(request_id))
    except httpx.HTTPError:
        pass  # Best-effort callback for a disposable stub


@app.post("/companycertificate/request")
async def certificate_request(request: Request) -> JSONResponse:
    """Accept a certificate request and schedule a delayed callback.

    Query params:
        reject: If 'true', return a REJECTED response (for negative testing).
    """
    body = await request.json()
    request_id = body.get("header", {}).get("messageId", str(uuid.uuid4()))
    document_id = f"doc-{request_id[:8]}"
    is_reject = request.query_params.get("reject", "false").lower() == "true"
    if is_reject:
        return JSONResponse(build_certificate_rejected_response(body, document_id))
    asyncio.create_task(_send_callback(request_id))
    return JSONResponse(build_certificate_request_response(body, document_id))


# ---------------------------------------------------------------------------
# Notification Receive
# ---------------------------------------------------------------------------

@app.post("/companycertificate/notification/receive")
async def notification_receive(request: Request) -> JSONResponse:
    """Accept a notification and send acknowledgment callback to TestLab."""
    body = await request.json()
    asyncio.create_task(_send_notification_ack(body))
    return JSONResponse({"status": "OK"})


async def _consume_testlab_asset() -> None:
    """Simulate SUT consuming the TestLab's exposed CCMAPI asset."""
    await asyncio.sleep(20)  # Wait for TestLab to set up the asset
    asset_url = f"{TESTLAB_CALLBACK_URL}/api/v1/companycertificate"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.get(asset_url)
    except httpx.HTTPError:
        pass  # Best-effort for stub


@app.on_event("startup")
async def _start_sut_consumer() -> None:
    """Start background task to simulate SUT consuming TestLab assets."""
    asyncio.create_task(_consume_testlab_asset())


async def _send_notification_ack(notification_body: dict) -> None:
    """Send CX-0135 RECEIVE acknowledgment callback to TestLab mock server."""
    await asyncio.sleep(1)
    ack_url = f"{TESTLAB_CALLBACK_URL}/companycertificate/notification/receive"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(ack_url, json=build_notification_ack(notification_body))
    except httpx.HTTPError:
        pass


# ---------------------------------------------------------------------------
# Certificate Push & Available (CX-0135)
# ---------------------------------------------------------------------------

async def _send_push_feedback(body: dict) -> None:
    """Send feedback callback acknowledging a push receipt."""
    await asyncio.sleep(1)
    feedback_url = f"{TESTLAB_CALLBACK_URL}/companycertificate/status"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            message_id = body.get("header", {}).get("messageId", str(uuid.uuid4()))
            await client.post(feedback_url, json=build_callback_payload(message_id))
    except httpx.HTTPError:
        pass


@app.post("/companycertificate/push")
async def certificate_push(request: Request) -> JSONResponse:
    """Accept a certificate push and schedule a feedback callback."""
    body = await request.json()
    asyncio.create_task(_send_push_feedback(body))
    return JSONResponse({"status": "OK"})


@app.post("/companycertificate/available")
async def certificate_available(request: Request) -> JSONResponse:
    """Accept a certificate availability notification."""
    body = await request.json()
    return JSONResponse({"status": "OK"})


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "healthy", "timestamp": datetime.now().isoformat()})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8090)
