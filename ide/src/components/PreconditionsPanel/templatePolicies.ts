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
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { PreconditionDefinition } from "../../models/schema";

export interface PreconditionTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  iconClass: string;
  create: () => PreconditionDefinition;
}

export const POLICY_TEMPLATES: PreconditionTemplate[] = [
  {
    id: "access_policy",
    label: "Access Policy (BPN)",
    description: "Restrict access by Business Partner Number",
    icon: "AP",
    iconClass: "access",
    create: () => ({
      type: "precondition_policy_config",
      description: "Access control policy",
      params: {
        version: "saturn",
        policy_type: "access",
        permissions: [{
          action: "access",
          constraints: [
            { leftOperand: "BusinessPartnerNumber", operator: "isAnyOf", rightOperand: "@consumer_bpn" },
          ],
        }],
      },
    }),
  },
  {
    id: "usage_policy",
    label: "Usage Policy (Framework)",
    description: "Require usage purpose and framework agreement",
    icon: "UP",
    iconClass: "usage",
    create: () => ({
      type: "precondition_policy_config",
      description: "Usage purpose policy",
      params: {
        version: "saturn",
        policy_type: "usage",
        permissions: [{
          action: "use",
          constraints: [
            { leftOperand: "UsagePurpose", operator: "isAnyOf", rightOperand: "cx.ccm.base:1" },
            { leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "DataExchangeGovernance:1.0" },
          ],
        }],
      },
    }),
  },
  {
    id: "membership_policy",
    label: "Membership Policy",
    description: "Require active Catena-X membership credential",
    icon: "MP",
    iconClass: "policy",
    create: () => ({
      type: "precondition_policy_config",
      description: "Membership policy",
      params: {
        version: "saturn",
        policy_type: "usage",
        permissions: [{
          action: "use",
          constraints: [
            { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
          ],
        }],
      },
    }),
  },
  {
    id: "asset",
    label: "Asset",
    description: "Create an EDC asset with data address on the provider",
    icon: "A",
    iconClass: "asset",
    create: () => ({
      type: "precondition_asset_config",
      description: "Provider asset",
      params: {
        version: "saturn",
        asset_id: "@asset_id",
        properties: {
          "dct:type": '{"@id": "cx-taxo:CertificateManagement"}',
        },
        data_address: {
          type: "HttpData",
          baseUrl: "@provider_backend_url",
        },
      },
    }),
  },
  {
    id: "contract_def",
    label: "Contract Definition",
    description: "Link an asset to access and usage policies",
    icon: "CD",
    iconClass: "contract",
    create: () => ({
      type: "precondition_contract_def_config",
      description: "Contract definition",
      params: {
        version: "saturn",
        contract_def_id: "@contract_def_id",
        access_policy_id: "@access_policy_id",
        contract_policy_id: "@usage_policy_id",
        asset_selector: [{ operandLeft: "https://w3id.org/edc/v0.0.1/ns/id", operator: "=", operandRight: "@asset_id" }],
      },
    }),
  },
  {
    id: "blank_policy",
    label: "Blank Policy",
    description: "Start from scratch with no constraints",
    icon: "+",
    iconClass: "blank",
    create: () => ({
      type: "precondition_policy_config",
      description: "Custom policy",
      params: {
        version: "saturn",
        policy_type: "access",
        permissions: [],
      },
    }),
  },
];
