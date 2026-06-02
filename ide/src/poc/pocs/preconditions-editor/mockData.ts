/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 Catena-X Automotive Network e.V.
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import type { PocPrecondition } from "./types";

/** Throwaway sample data used to demonstrate the editor's UX direction. */
export const MOCK_PRECONDITIONS: PocPrecondition[] = [
  {
    id: "ccmapi_access_policy",
    name: "Access Policy",
    description: "BPN-based access control",
    category: "register",
    subType: "access_policy",
    policy: {
      version: "saturn",
      policyType: "access",
      permissions: [
        {
          action: "access",
          constraints: [
            { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
          ],
        },
      ],
    },
  },
  {
    id: "ccmapi_usage_policy",
    name: "Usage Policy",
    description: "Usage purpose + framework agreement",
    category: "register",
    subType: "usage_policy",
    policy: {
      version: "saturn",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "DataExchangeGovernance:1.0" },
            { leftOperand: "UsagePurpose", operator: "isAnyOf", rightOperand: "cx.core.industrycore:1" },
          ],
        },
      ],
      optionalUsagePurposes: [
        { id: "purpose_quality", value: "cx.core.qualityNotifications:1", custom: false },
        { id: "purpose_dtr", value: "cx.core.digitalTwinRegistry:1", custom: false },
      ],
      prohibitions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "UsageRestriction", operator: "isAllOf", rightOperand: "cx.thirdParty.forbidden:1" },
          ],
        },
      ],
      obligations: [
        {
          action: "use",
          constraints: [
            { leftOperand: "DataProvisioningEndDurationDays", operator: "eq", rightOperand: "365" },
          ],
        },
      ],
    },
  },
  {
    id: "asset_template",
    name: "Data Asset Template",
    description: "Asset definition to register in the provider connector",
    category: "register",
    subType: "asset_template",
    provide: {
      template: '{\n  "@type": "Asset",\n  "properties": {\n    "dct:type": "cx-taxo:CertificateManagement"\n  }\n}',
    },
  },
  {
    id: "aas_shell_descriptor",
    name: "AAS Shell Descriptor",
    description: "Digital twin shell descriptor to register in your DTR",
    category: "register",
    subType: "aas_descriptor",
    provide: {
      template:
        '{\n  "id": "urn:uuid:<shell-id>",\n  "idShort": "CertificateShell",\n  "specificAssetIds": [\n    { "name": "manufacturerPartId", "value": "<part-id>" }\n  ],\n  "submodelDescriptors": []\n}',
    },
  },
  {
    id: "testlab_connector",
    name: "TestLab Connector DSP URL",
    description: "Generated endpoint exposed to the SUT",
    category: "generate",
    subType: "generated_value",
    generate: {
      generator: "testlab_dsp_url",
      fieldType: "url",
      preview: "https://testlab.example.org/api/dsp",
    },
  },
  {
    id: "sut_identity",
    name: "SUT Identity (BPN or DID)",
    description: "Operator-supplied identity of the system under test",
    category: "input",
    subType: "operator_input",
    input: {
      label: "SUT Identity (BPN or DID)",
      fieldType: "bpn",
      placeholder: "BPNL000000000000",
    },
  },
  {
    id: "dtr_reachable",
    name: "DTR Reachability",
    description: "Verify the Digital Twin Registry responds before tests run",
    category: "check",
    subType: "readiness_check",
    check: {
      target: "@sut_dtr_url",
      expression: "status == 200",
    },
  },
];
