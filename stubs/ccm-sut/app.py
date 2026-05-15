"""Disposable stub SUT simulating an EDC connector for CCM TCK tests."""

import asyncio
import uuid
from datetime import datetime

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="CCM SUT Stub", version="0.1.0")

PROVIDER_BPN = "BPNL000000000001"
TESTLAB_CALLBACK_URL = "http://localhost:8080"
CALLBACK_DELAY_SECONDS = 2

CERTIFICATE_PAYLOAD = {
    "businessPartnerNumber": PROVIDER_BPN,
    "type": "iso9001",
    "registrationNumber": "CERT-2024-001",
    "areaOfApplication": "Quality Management",
    "validFrom": "2024-01-01",
    "validTo": "2027-01-01",
    "issuer": "TÜV SÜD",
    "trustLevel": "High",
    "documentId": "doc-cert-001",
}

OFFER_ID = "ccm-offer-001"
AGREEMENT_ID = f"agreement-{uuid.uuid4()}"
TRANSFER_ID = f"transfer-{uuid.uuid4()}"
EDR_TOKEN = f"edr-token-{uuid.uuid4()}"


# ---------------------------------------------------------------------------
# DSP Catalog
# ---------------------------------------------------------------------------

@app.post("/api/v1/dsp/catalog/request")
async def catalog_request(request: Request) -> JSONResponse:
    """Return a catalog containing a single CCMAPI dataset offer."""
    return JSONResponse({
        "@context": {"dcat": "http://www.w3.org/ns/dcat#", "odrl": "http://www.w3.org/ns/odrl/2/"},
        "@type": "dcat:Catalog",
        "dcat:dataset": [
            {
                "@id": OFFER_ID,
                "@type": "dcat:Dataset",
                "dct:type": {"@id": "https://w3id.org/catenax/taxonomy#CCMAPI"},
                "odrl:hasPolicy": {
                    "@id": f"policy-{OFFER_ID}",
                    "@type": "odrl:Offer",
                    "odrl:permission": [{"odrl:action": {"@id": "odrl:use"}}],
                },
            }
        ],
    })


# ---------------------------------------------------------------------------
# DSP Negotiation
# ---------------------------------------------------------------------------

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
        "endpoint": f"http://localhost:8090/companycertificate/{CERTIFICATE_PAYLOAD['documentId']}",
        "authType": "bearer",
        "authCode": EDR_TOKEN,
        "authorization": EDR_TOKEN,
    })


# ---------------------------------------------------------------------------
# Certificate Data
# ---------------------------------------------------------------------------

@app.get("/companycertificate/{document_id}")
async def get_certificate(document_id: str) -> JSONResponse:
    """Return a hardcoded BusinessPartnerCertificate payload."""
    payload = {**CERTIFICATE_PAYLOAD, "documentId": document_id}
    return JSONResponse(payload)


# ---------------------------------------------------------------------------
# Certificate Request + Delayed Callback
# ---------------------------------------------------------------------------

async def _send_callback(request_id: str) -> None:
    """Wait, then POST feedback callback to the TestLab server."""
    await asyncio.sleep(CALLBACK_DELAY_SECONDS)
    callback_url = f"{TESTLAB_CALLBACK_URL}/companycertificate/status"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(callback_url, json={
                "requestId": request_id,
                "feedbackStatus": "APPROVED",
            })
    except httpx.HTTPError:
        pass  # Best-effort callback for a disposable stub


@app.post("/companycertificate/request")
async def certificate_request(request: Request) -> JSONResponse:
    """Accept a certificate request and schedule a delayed callback."""
    body = await request.json()
    request_id = body.get("requestId", str(uuid.uuid4()))
    asyncio.create_task(_send_callback(request_id))
    return JSONResponse({"requestId": request_id, "status": "RECEIVED"})


# ---------------------------------------------------------------------------
# Notification Receive
# ---------------------------------------------------------------------------

@app.post("/companycertificate/notification/receive")
async def notification_receive(request: Request) -> JSONResponse:
    """Accept any notification and return 200."""
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
