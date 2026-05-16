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

"""CX-0135 compliant response builders for the CCM SUT stub."""

import os
import uuid
from datetime import datetime, timezone


PROVIDER_BPN = os.environ.get("PROVIDER_BPN", "BPNL000000000001")
CONSUMER_BPN = os.environ.get("CONSUMER_BPN", "BPNL000000000002")
DSP_FEEDBACK_URL = os.environ.get("DSP_FEEDBACK_URL", "http://localhost:8090/api/v1/dsp")


def build_header(
    context: str,
    receiver_bpn: str = "",
    related_message_id: str = "",
) -> dict:
    """Build a CX-0135 message header."""
    return {
        "messageId": f"urn:uuid:{uuid.uuid4()}",
        "context": context,
        "sentDateTime": datetime.now(timezone.utc).isoformat(),
        "senderBpn": PROVIDER_BPN,
        "receiverBpn": receiver_bpn or CONSUMER_BPN,
        "relatedMessageId": related_message_id,
        "version": "3.1.0",
        "senderFeedbackUrl": DSP_FEEDBACK_URL,
    }


def build_certificate_request_response(body: dict, document_id: str) -> dict:
    """Build CX-0135 /companycertificate/request response."""
    return {
        "header": build_header(
            context="CompanyCertificateManagement-CCMAPI-Request:1.0.0",
            receiver_bpn=body.get("header", {}).get("senderBpn", "BPNL000000000002"),
            related_message_id=body.get("header", {}).get("messageId", ""),
        ),
        "content": {
            "requestStatus": "COMPLETED",
            "documentId": document_id,
        },
    }


def build_certificate_rejected_response(body: dict, document_id: str) -> dict:
    """Build CX-0135 /companycertificate/request REJECTED response."""
    return {
        "header": build_header(
            context="CompanyCertificateManagement-CCMAPI-Request:1.0.0",
            receiver_bpn=body.get("header", {}).get("senderBpn", "BPNL000000000002"),
            related_message_id=body.get("header", {}).get("messageId", ""),
        ),
        "content": {
            "requestStatus": "REJECTED",
            "documentId": document_id,
        },
    }


def build_callback_payload(request_id: str) -> dict:
    """Build CX-0135 /companycertificate/status callback payload."""
    return {
        "header": build_header(
            context="CompanyCertificateManagement-CCMAPI-Status:1.0.0",
            related_message_id=f"urn:uuid:{request_id}",
        ),
        "content": {
            "documentId": f"doc-{request_id[:8]}",
            "certificateStatus": "RECEIVED",
            "locationBpns": ["BPNS000000000001"],
        },
    }


def build_notification_ack(notification_body: dict) -> dict:
    """Build CX-0135 notification acknowledgment payload."""
    return {
        "header": build_header(
            context="CompanyCertificateManagement-CCMAPI-Status:1.0.0",
            related_message_id=notification_body.get("header", {}).get("messageId", ""),
        ),
        "content": {
            "certificateStatus": "RECEIVED",
        },
    }


CERTIFICATE_PAYLOAD = {
    "businessPartnerNumber": PROVIDER_BPN,
    "certificateType": "iso9001",
    "registrationNumber": "CERT-2024-001",
    "areaOfApplication": "Quality Management",
    "enclosedSites": [{"enclosedSiteBpn": "BPNS000000000001"}],
    "validFrom": "2024-01-01",
    "validTo": "2027-01-01",
    "issuer": {"issuerName": "TÜV SÜD", "issuerBpn": "BPNL133631123120"},
    "trustLevel": "none",
    "uploader": PROVIDER_BPN,
    "validator": {"validatorName": "TÜV SÜD", "validatorBpn": "BPNL133631123120"},
    "document": {
        "documentID": "UUID--123456789",
        "creationDate": "2024-08-23T13:19:00.280+02:00",
        "contentType": "application/pdf",
        "contentBase64": "iVBORw0KGgoAAAANSUhEUgA=",
    },
    "type": {"certificateVersion": "2015", "certificateType": "iso9001"},
}


def build_catalog(offer_id: str) -> dict:
    """Build CX-0135 compliant DSP catalog response."""
    usage_policy = {
        "odrl:permission": [{
            "odrl:action": {"@id": "odrl:use"},
            "odrl:constraint": {
                "odrl:and": [
                    {
                        "odrl:leftOperand": "FrameworkAgreement",
                        "odrl:operator": {"@id": "odrl:eq"},
                        "odrl:rightOperand": "DataExchangeGovernance:1.0",
                    },
                    {
                        "odrl:leftOperand": "UsagePurpose",
                        "odrl:operator": {"@id": "odrl:isAnyOf"},
                        "odrl:rightOperand": "cx.ccm.base:1",
                    },
                ],
            },
        }],
    }
    return {
        "@context": {
            "dcat": "http://www.w3.org/ns/dcat#",
            "odrl": "http://www.w3.org/ns/odrl/2/",
        },
        "@type": "dcat:Catalog",
        "dcat:dataset": [
            {
                "@id": offer_id,
                "@type": "dcat:Dataset",
                "dct:type": {"@id": "https://w3id.org/catenax/taxonomy#CCMAPI"},
                "dct:subject": {"@id": "https://w3id.org/catenax/taxonomy#CompanyCertificateManagementNotificationApi"},
                "cx-common:version": "3.0",
                "odrl:hasPolicy": {
                    "@id": f"policy-{offer_id}",
                    "@type": "odrl:Offer",
                    **usage_policy,
                },
            },
            {
                "@id": "cert-asset-001",
                "@type": "dcat:Dataset",
                "dct:type": {"@id": "https://w3id.org/catenax/taxonomy#Submodel"},
                "aas:semanticId": {"@id": "urn:samm:io.catenax.business_partner_certificate:3.1.0#BusinessPartnerCertificate"},
                "dct:certificateType": {"@id": "https://w3id.org/catenax/taxonomy#iso9001"},
                "dct:subject": {"@id": "https://w3id.org/catenax/taxonomy#CompanyCertificate"},
                "dct:enclosedSites": [{"@id": "https://w3id.org/catenax/taxonomy#BPNS000000000001"}],
                "cx-common:version": "3.0",
                "odrl:hasPolicy": {
                    "@id": "policy-cert-asset-001",
                    "@type": "odrl:Offer",
                    **usage_policy,
                },
            },
        ],
    }
