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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

export interface RightOperandDef {
  type: "fixed" | "select" | "selectOrCustom" | "pattern" | "custom" | "number" | "date";
  values?: string[];
  placeholder?: string;
}

export interface ConstraintDef {
  operators: string[];
  rightOperand: RightOperandDef;
}

export type ConstraintRegistry = Record<string, ConstraintDef>;

export interface VersionSchema {
  label: string;
  description: string;
  allowedActions: Record<string, string[]>;
  supportsProhibitions: boolean;
  supportsObligations: boolean;
}

export const VERSION_SCHEMAS: Record<string, VersionSchema> = {
  jupiter: {
    label: "Jupiter (cx-odrl-profile)",
    description: "EDC v0.8-v0.10. Only 'use' action, 'eq' operator, logical 'and' constraints.",
    allowedActions: { access: ["use"], usage: ["use"] },
    supportsProhibitions: false,
    supportsObligations: false,
  },
  saturn: {
    label: "Saturn (CX-0152)",
    description: "EDC v0.11+, DSP 2025-1. Supports access/use actions, multiple operators, prohibitions and obligations.",
    allowedActions: { access: ["access"], usage: ["use"] },
    supportsProhibitions: true,
    supportsObligations: true,
  },
};

export const SATURN_CONSTRAINTS: Record<string, ConstraintRegistry> = {
  access_permission: {
    FrameworkAgreement: { operators: ["eq"], rightOperand: { type: "fixed", values: ["DataExchangeGovernance:1.0"] } },
    Membership: { operators: ["eq"], rightOperand: { type: "fixed", values: ["active"] } },
    BusinessPartnerNumber: { operators: ["isAnyOf", "isNoneOf"], rightOperand: { type: "pattern", placeholder: "BPNL000000000000" } },
    BusinessPartnerGroup: { operators: ["isAnyOf", "isNoneOf"], rightOperand: { type: "custom", placeholder: "Group name..." } },
  },
  usage_permission: {
    FrameworkAgreement: { operators: ["eq"], rightOperand: { type: "fixed", values: ["DataExchangeGovernance:1.0"] } },
    Membership: { operators: ["eq"], rightOperand: { type: "fixed", values: ["active"] } },
    BusinessPartnerNumber: { operators: ["isAnyOf", "isNoneOf"], rightOperand: { type: "pattern", placeholder: "BPNL000000000000" } },
    BusinessPartnerGroup: { operators: ["isAnyOf", "isNoneOf"], rightOperand: { type: "custom", placeholder: "Group name..." } },
    UsagePurpose: {
      operators: ["isAnyOf"],
      rightOperand: {
        type: "selectOrCustom",
        values: [
          "cx.ccm.base:1", "cx.core.industrycore:1", "cx.core.qualityNotifications:1",
          "cx.core.digitalTwinRegistry:1", "cx.pcf.base:1", "cx.quality.base:1",
          "cx.dcm.base:1", "cx.puris.base:1", "cx.circular.dpp:1", "cx.circular.smc:1",
          "cx.circular.marketplace:1", "cx.circular.materialaccounting:1",
          "cx.bpdm.gate.upload:1", "cx.bpdm.gate.download:1", "cx.bpdm.pool:1",
          "cx.bpdm.poolAll:1", "cx.bpdm.vas.countryrisk:1", "cx.logistics.base:1",
          "cx.core.legalRequirementForThirdparty:1",
        ],
        placeholder: "Custom purpose...",
      },
    },
    ContractReference: { operators: ["isAllOf"], rightOperand: { type: "custom", placeholder: "Contract reference..." } },
    AffiliatesRegion: {
      operators: ["isAnyOf"],
      rightOperand: {
        type: "select",
        values: [
          "cx.region.all:1", "cx.region.europe:1", "cx.region.northAmerica:1",
          "cx.region.southAmerica:1", "cx.region.africa:1", "cx.region.asia:1",
          "cx.region.oceania:1", "cx.region.antarctica:1",
        ],
      },
    },
    AffiliatesBpnl: { operators: ["isAnyOf"], rightOperand: { type: "pattern", placeholder: "BPNL000000000000" } },
  },
  usage_prohibition: {
    AffiliatesRegion: {
      operators: ["isAnyOf"],
      rightOperand: {
        type: "select",
        values: [
          "cx.region.all:1", "cx.region.europe:1", "cx.region.northAmerica:1",
          "cx.region.southAmerica:1", "cx.region.africa:1", "cx.region.asia:1",
          "cx.region.oceania:1", "cx.region.antarctica:1",
        ],
      },
    },
    AffiliatesBpnl: { operators: ["isAnyOf"], rightOperand: { type: "pattern", placeholder: "BPNL000000000000" } },
    UsageRestriction: {
      operators: ["isAllOf"],
      rightOperand: {
        type: "select",
        values: [
          "cx.thirdParty.forbidden:1", "cx.manipulation.forbidden:1",
          "cx.derivations.forbidden:1", "cx.extraordinaryAnalytics.forbidden:1",
          "cx.dataProviderRemoval.forbidden:1",
        ],
      },
    },
  },
  usage_obligation: {
    DataProvisioningEndDurationDays: { operators: ["eq"], rightOperand: { type: "number", placeholder: "365" } },
    DataProvisioningEndDate: { operators: ["eq"], rightOperand: { type: "date", placeholder: "2027-01-01T00:00:00Z" } },
  },
};

export const JUPITER_CONSTRAINTS: Record<string, ConstraintRegistry> = {
  all: {
    FrameworkAgreement: { operators: ["eq"], rightOperand: { type: "fixed", values: ["DataExchangeGovernance:1.0"] } },
    Membership: { operators: ["eq"], rightOperand: { type: "fixed", values: ["active"] } },
    ContractReference: { operators: ["eq"], rightOperand: { type: "custom", placeholder: "Contract ref..." } },
    UsagePurpose: {
      operators: ["eq"],
      rightOperand: {
        type: "selectOrCustom",
        values: [
          "cx.ccm.base:1", "cx.core.industrycore:1", "cx.core.qualityNotifications:1",
          "cx.core.digitalTwinRegistry:1", "cx.pcf.base:1", "cx.quality.base:1",
          "cx.dcm.base:1", "cx.puris.base:1", "cx.circular.dpp:1", "cx.circular.smc:1",
          "cx.circular.marketplace:1", "cx.circular.materialaccounting:1",
          "cx.bpdm.gate.upload:1", "cx.bpdm.gate.download:1", "cx.bpdm.pool:1",
          "cx.bpdm.vas.dataquality.upload:1", "cx.bpdm.vas.dataquality.download:1",
          "cx.bpdm.vas.countryrisk:1", "cx.bpdm.vas.bdv.upload:1",
          "cx.bpdm.vas.bdv.download:1", "cx.bpdm.vas.fpd.upload:1",
          "cx.bpdm.vas.fpd.download:1", "cx.bpdm.vas.swd.upload:1",
          "cx.bpdm.vas.swd.download:1", "cx.bpdm.vas.nps.upload:1",
          "cx.bpdm.vas.nps.download:1",
        ],
        placeholder: "Custom purpose...",
      },
    },
    BusinessPartnerNumber: { operators: ["eq"], rightOperand: { type: "pattern", placeholder: "BPNL000000000000" } },
  },
};

/** Get the constraint registry for a given context. */
export function getConstraintsForContext(
  version: "jupiter" | "saturn",
  policyType: "access" | "usage",
  ruleType: "permission" | "prohibition" | "obligation"
): ConstraintRegistry {
  if (version === "jupiter") return JUPITER_CONSTRAINTS.all;
  const key = `${policyType}_${ruleType}`;
  return SATURN_CONSTRAINTS[key] || {};
}
