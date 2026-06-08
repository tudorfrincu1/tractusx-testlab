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

/**
 * GENERATED FILE - DO NOT EDIT BY HAND.
 *
 * Produced by `npm run generate:registry` from the vendored official Catena-X
 * policy JSON Schemas. To change the constraint data, edit the schemas under
 * `ide/schemas/policies/` (or the editorial overlay in
 * `ide/scripts/generate-constraint-registry/overlay.ts`) and regenerate.
 */

import type { ConstraintRegistry, VersionSchema } from "./constraintSchemas";

/** Stable identifier for the schema generation this data was derived from. */
export const SCHEMA_VERSION = "catenax-2025-9";

/** Provenance of the generated data, for traceability and regen checks. */
export const SCHEMA_PROVENANCE = {
  generator: "ide/scripts/generate-constraint-registry",
  schemasRoot: "ide/schemas/policies",
  schemaNamespace: "https://w3id.org/catenax/2025/9/policy/schema",
  jupiterSource: "ide/schemas/policies/jupiter",
  saturnSource: "ide/schemas/policies/saturn",
} as const;

/** Union of all policy version ids declared in the schema manifest. */
export type PolicyVersion = "jupiter" | "saturn";

/** Every known policy version, in manifest order. */
export const POLICY_VERSIONS: readonly PolicyVersion[] = [
  "jupiter",
  "saturn",
];

export const VERSION_SCHEMAS: Record<PolicyVersion, VersionSchema> = {
  jupiter: {
    label: "Jupiter (cx-odrl-profile)",
    description: "EDC v0.8-v0.10. Only 'use' action, 'eq' operator, logical 'and' constraints.",
    allowedActions: {
      access: [
        "use",
      ],
      usage: [
        "use",
      ],
    },
    supportsProhibitions: false,
    supportsObligations: false,
  },
  saturn: {
    label: "Saturn (CX-0152)",
    description: "EDC v0.11+, DSP 2025-1. Supports access/use actions, multiple operators, prohibitions and obligations.",
    allowedActions: {
      access: [
        "access",
      ],
      usage: [
        "use",
      ],
    },
    supportsProhibitions: true,
    supportsObligations: true,
  },
};

export const VERSION_BUCKETING: Record<PolicyVersion, "by-rule" | "single"> = {
  jupiter: "single",
  saturn: "by-rule",
};

export const CONSTRAINTS_BY_VERSION: Record<PolicyVersion, Record<string, ConstraintRegistry>> = {
  jupiter: {
    all: {
      FrameworkAgreement: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "DataExchangeGovernance:1.0",
          ],
        },
      },
      Membership: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "active",
          ],
        },
      },
      ContractReference: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "custom",
          placeholder: "Contract ref...",
        },
      },
      UsagePurpose: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "selectOrCustom",
          values: [
            "cx.core.legalRequirementForThirdparty:1",
            "cx.core.industrycore:1",
            "cx.core.qualityNotifications:1",
            "cx.core.digitalTwinRegistry:1",
            "cx.pcf.base:1",
            "cx.quality.base:1",
            "cx.dcm.base:1",
            "cx.puris.base:1",
            "cx.circular.dpp:1",
            "cx.circular.smc:1",
            "cx.circular.marketplace:1",
            "cx.circular.materialaccounting:1",
            "cx.bpdm.gate.upload:1",
            "cx.bpdm.gate.download:1",
            "cx.bpdm.pool:1",
            "cx.bpdm.vas.dataquality.upload:1",
            "cx.bpdm.vas.dataquality.download:1",
            "cx.bpdm.vas.countryrisk:1",
            "cx.bpdm.vas.bdv.upload:1",
            "cx.bpdm.vas.bdv.download:1",
            "cx.bpdm.vas.fpd.upload:1",
            "cx.bpdm.vas.fpd.download:1",
            "cx.bpdm.vas.swd.upload:1",
            "cx.bpdm.vas.swd.download:1",
            "cx.bpdm.vas.nps.upload:1",
            "cx.bpdm.vas.nps.download:1",
          ],
          placeholder: "Custom purpose...",
        },
      },
      BusinessPartnerNumber: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "pattern",
          placeholder: "BPNL000000000000",
        },
      },
    },
  },
  saturn: {
    access_permission: {
      FrameworkAgreement: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "DataExchangeGovernance:1.0",
          ],
        },
      },
      Membership: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "active",
          ],
        },
      },
      BusinessPartnerNumber: {
        operators: [
          "isAnyOf",
          "isNoneOf",
        ],
        rightOperand: {
          type: "pattern",
          placeholder: "BPNL000000000000",
        },
      },
      BusinessPartnerGroup: {
        operators: [
          "isAnyOf",
          "isNoneOf",
        ],
        rightOperand: {
          type: "custom",
          placeholder: "Group name...",
        },
      },
    },
    usage_permission: {
      FrameworkAgreement: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "DataExchangeGovernance:1.0",
          ],
        },
      },
      Membership: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "active",
          ],
        },
      },
      UsagePurpose: {
        operators: [
          "isAnyOf",
        ],
        rightOperand: {
          type: "selectOrCustom",
          values: [
            "cx.core.legalRequirementForThirdparty:1",
            "cx.core.industrycore:1",
            "cx.core.qualityNotifications:1",
            "cx.core.digitalTwinRegistry:1",
            "cx.pcf.base:1",
            "cx.quality.base:1",
            "cx.dcm.base:1",
            "cx.puris.base:1",
            "cx.circular.dpp:1",
            "cx.circular.smc:1",
            "cx.circular.marketplace:1",
            "cx.circular.materialaccounting:1",
            "cx.bpdm.gate.upload:1",
            "cx.bpdm.gate.download:1",
            "cx.bpdm.pool:1",
            "cx.bpdm.vas.dataquality.upload:1",
            "cx.bpdm.vas.dataquality.download:1",
            "cx.bpdm.vas.countryrisk:1",
            "cx.bpdm.vas.bdv.upload:1",
            "cx.bpdm.vas.fpd.upload:1",
            "cx.bpdm.vas.fpd.download:1",
            "cx.bpdm.vas.swd.upload:1",
            "cx.bpdm.vas.swd.download:1",
            "cx.bpdm.vas.nps.upload:1",
            "cx.bpdm.vas.nps.download:1",
            "cx.ccm.base:1",
            "cx.bpdm.poolAll:1",
            "cx.logistics.base:1",
          ],
          placeholder: "Custom purpose...",
        },
      },
      ContractReference: {
        operators: [
          "isAllOf",
        ],
        rightOperand: {
          type: "custom",
          placeholder: "Contract reference...",
        },
      },
      AffiliatesRegion: {
        operators: [
          "isAnyOf",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.region.all:1",
            "cx.region.europe:1",
            "cx.region.northAmerica:1",
            "cx.region.southAmerica:1",
            "cx.region.africa:1",
            "cx.region.asia:1",
            "cx.region.oceania:1",
            "cx.region.antarctica:1",
          ],
        },
      },
      AffiliatesBpnl: {
        operators: [
          "isAnyOf",
        ],
        rightOperand: {
          type: "pattern",
          placeholder: "BPNL000000000000",
        },
      },
      DataFrequency: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.dataFrequency.once:1",
            "cx.dataFrequency.unlimited:1",
          ],
        },
      },
      VersionChanges: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.versionChanges.minor:1",
            "cx.versionChanges.major:1",
          ],
        },
      },
      ContractTermination: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.data.deletion:1",
            "cx.data.keeping:1",
          ],
        },
      },
      ConfidentialInformationMeasures: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "cx.confidentiality.measures:1",
          ],
        },
      },
      ConfidentialInformationSharing: {
        operators: [
          "isAnyOf",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.sharing.affiliates:1",
            "cx.sharing.managedLegalEntity:1",
          ],
        },
      },
      ExclusiveUsage: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "cx.exclusiveUsage.dataConsumer:1",
          ],
        },
      },
      Warranty: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.warranty.none:1",
            "cx.warranty.contractReference:1",
            "cx.warranty.dataQualityIssues:1",
          ],
        },
      },
      WarrantyDurationMonths: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "number",
        },
      },
      WarrantyDefinition: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "cx.warranty.contractEndDate:1",
          ],
        },
      },
      Liability: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.grossNegligence:1",
            "cx.slightNegligence:1",
          ],
        },
      },
      JurisdictionLocation: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "custom",
        },
      },
      JurisdictionLocationReference: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.location.dataConsumer:1",
            "cx.location.contractReference:1",
          ],
        },
      },
      Precedence: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.precedence.contractReference:1",
            "cx.precedence.rcAgreement:1",
          ],
        },
      },
      DataUsageEndDurationDays: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "number",
        },
      },
      DataUsageEndDate: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "date",
        },
      },
      DataUsageEndDefinition: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "fixed",
          values: [
            "cx.dataUsageEnd.unlimited:1",
          ],
        },
      },
    },
    usage_prohibition: {
      AffiliatesRegion: {
        operators: [
          "isAnyOf",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.region.all:1",
            "cx.region.europe:1",
            "cx.region.northAmerica:1",
            "cx.region.southAmerica:1",
            "cx.region.africa:1",
            "cx.region.asia:1",
            "cx.region.oceania:1",
            "cx.region.antarctica:1",
          ],
        },
      },
      AffiliatesBpnl: {
        operators: [
          "isAnyOf",
        ],
        rightOperand: {
          type: "pattern",
          placeholder: "BPNL000000000000",
        },
      },
      UsageRestriction: {
        operators: [
          "isAllOf",
        ],
        rightOperand: {
          type: "select",
          values: [
            "cx.thirdParty.forbidden:1",
            "cx.manipulation.forbidden:1",
            "cx.derivations.forbidden:1",
            "cx.extraordinaryAnalytics.forbidden:1",
            "cx.dataProviderRemoval.forbidden:1",
          ],
        },
      },
    },
    usage_obligation: {
      DataProvisioningEndDurationDays: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "number",
          placeholder: "365",
        },
      },
      DataProvisioningEndDate: {
        operators: [
          "eq",
        ],
        rightOperand: {
          type: "date",
          placeholder: "2027-01-01T00:00:00Z",
        },
      },
    },
  },
};
