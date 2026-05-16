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

"""Management API routes at DSP base path for SDK compatibility."""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from responses import PROVIDER_BPN, build_catalog

STUB_BASE_URL = os.environ.get("STUB_BASE_URL", "http://localhost:8090")

OFFER_ID = "ccm-offer-001"
AGREEMENT_ID = f"agreement-{uuid.uuid4()}"
TRANSFER_ID = f"transfer-{uuid.uuid4()}"
EDR_TOKEN = f"edr-token-{uuid.uuid4()}"

router = APIRouter(prefix="/api/v1/dsp/management/v3")


def _id_response(oid: str) -> dict:
    return {"@type": "IdResponse", "@id": oid, "createdAt": int(datetime.now().timestamp() * 1000)}


@router.post("/catalog/request")
async def mgmt_catalog(request: Request) -> JSONResponse:
    """Return catalog via management path."""
    return JSONResponse(build_catalog(OFFER_ID))


@router.post("/contractnegotiations")
async def mgmt_negotiate(request: Request) -> JSONResponse:
    """Accept negotiation via management path."""
    body = await request.json()
    negotiation_id = str(uuid.uuid4())
    return JSONResponse({
        "@context": {"dspace": "https://w3id.org/dspace/2024/1/"},
        "@type": "dspace:ContractNegotiation",
        "@id": negotiation_id,
        "dspace:state": "FINALIZED",
        "dspace:agreement": {"@id": AGREEMENT_ID, "@type": "dspace:Agreement"},
    })


@router.post("/transferprocesses")
async def mgmt_transfer(request: Request) -> JSONResponse:
    """Initiate transfer via management path."""
    return JSONResponse({"@type": "TransferProcess", "@id": TRANSFER_ID, "state": "STARTED"})


@router.post("/edrs")
async def mgmt_edr_negotiate(request: Request) -> JSONResponse:
    """Start EDR negotiation — returns negotiation ID."""
    body = await request.json()
    return JSONResponse(_id_response(str(uuid.uuid4())))


@router.post("/edrs/request")
async def mgmt_edr_query(request: Request) -> JSONResponse:
    """Query EDR entries by negotiation filter."""
    return JSONResponse([{
        "@id": TRANSFER_ID,
        "@type": "EndpointDataReferenceEntry",
        "providerId": PROVIDER_BPN,
        "assetId": OFFER_ID,
        "agreementId": AGREEMENT_ID,
        "transferProcessId": TRANSFER_ID,
        "createdAt": int(datetime.now().timestamp() * 1000),
        "contractNegotiationId": "any",
        "@context": {
            "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
            "edc": "https://w3id.org/edc/v0.0.1/ns/",
        },
    }])


@router.get("/edrs/{transfer_id}/dataaddress")
async def mgmt_edr(transfer_id: str) -> JSONResponse:
    """Return EDR data address via management path."""
    return JSONResponse({
        "@type": "DataAddress",
        "type": "HttpData",
        "endpoint": STUB_BASE_URL,
        "authType": "bearer",
        "authCode": EDR_TOKEN,
        "authorization": EDR_TOKEN,
    })


@router.post("/assets")
async def mgmt_create_asset(request: Request) -> JSONResponse:
    body = await request.json()
    return JSONResponse(_id_response(body.get("@id", str(uuid.uuid4()))))


@router.post("/policydefinitions")
async def mgmt_create_policy(request: Request) -> JSONResponse:
    body = await request.json()
    return JSONResponse(_id_response(body.get("@id", str(uuid.uuid4()))))


@router.post("/contractdefinitions")
async def mgmt_create_contract_def(request: Request) -> JSONResponse:
    body = await request.json()
    return JSONResponse(_id_response(body.get("@id", str(uuid.uuid4()))))


@router.delete("/assets/{asset_id}")
@router.delete("/policydefinitions/{policy_id}")
@router.delete("/contractdefinitions/{contract_id}")
async def mgmt_delete_resource(request: Request) -> JSONResponse:
    return JSONResponse(status_code=204, content=None)
