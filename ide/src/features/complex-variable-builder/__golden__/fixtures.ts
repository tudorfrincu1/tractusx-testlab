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

// Representative PolicyPayload matrix for the emitter golden guard. Each
// fixture targets specific branches of the JSON / ODRL / YAML emitters so the
// committed snapshots prove, byte-for-byte, that output did not regress.
import type { PolicyPayload } from "../model";

/** A named policy input plus the stable id the ODRL/YAML emitters embed. */
export interface PolicyFixture {
  /** Stable, filesystem-safe name used as the snapshot key. */
  name: string;
  /** Deterministic policy id the ODRL/YAML emitters render verbatim. */
  id: string;
  /** What emitter branches this fixture is here to pin. */
  covers: string;
  policy: PolicyPayload;
}

/**
 * The full fixture matrix. Ordered roughly saturn-first then jupiter-first so
 * the snapshot file reads as two dialect blocks.
 */
export const POLICY_FIXTURES: readonly PolicyFixture[] = [
  {
    name: "saturn-usage-membership-atomic",
    id: "policy-fixture-0001",
    covers: "saturn, usage->use action, single atomic constraint (scalar)",
    policy: {
      version: "saturn",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
          ],
        },
      ],
    },
  },
  {
    name: "saturn-access-bpn-list",
    id: "policy-fixture-0002",
    covers: "saturn, access token, list operator (isAnyOf -> array right operand)",
    policy: {
      version: "saturn",
      policyType: "access",
      permissions: [
        {
          action: "access",
          constraints: [
            {
              leftOperand: "BusinessPartnerNumber",
              operator: "isAnyOf",
              rightOperand: ["BPNL000000000001", "BPNL000000000002"],
            },
          ],
        },
      ],
    },
  },
  {
    name: "saturn-usage-logical-and",
    id: "policy-fixture-0003",
    covers: "saturn, multi-constraint -> `and` wrapper (ODRL + YAML and:)",
    policy: {
      version: "saturn",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
            {
              leftOperand: "FrameworkAgreement",
              operator: "eq",
              rightOperand: "DataExchangeGovernance:1.0",
            },
          ],
        },
      ],
    },
  },
  {
    name: "saturn-usage-purpose-number-date-optional",
    id: "policy-fixture-0004",
    covers:
      "saturn, UsagePurpose constraint, numeric right operand, date right operand, optionalUsagePurposes (JSON only)",
    policy: {
      version: "saturn",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "UsagePurpose", operator: "eq", rightOperand: "cx.core.qualityNotifications:1" },
            { leftOperand: "ContractReference", operator: "eq", rightOperand: "5" },
            { leftOperand: "ContractExpiry", operator: "lteq", rightOperand: "2026-12-31" },
          ],
        },
      ],
      optionalUsagePurposes: [
        { id: "purpose-1", value: "cx.core.qualityNotifications:1", custom: false },
        { id: "purpose-2", value: "my.custom.purpose", custom: true },
      ],
    },
  },
  {
    name: "saturn-full-permission-prohibition-obligation",
    id: "policy-fixture-0005",
    covers: "saturn, all three rule sections populated",
    policy: {
      version: "saturn",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [{ leftOperand: "Membership", operator: "eq", rightOperand: "active" }],
        },
      ],
      prohibitions: [
        {
          action: "use",
          constraints: [{ leftOperand: "BusinessPartnerNumber", operator: "eq", rightOperand: "BPNL000000000099" }],
        },
      ],
      obligations: [
        {
          action: "use",
          constraints: [{ leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "Traceability:1.0" }],
        },
      ],
    },
  },
  {
    name: "jupiter-usage-bpn-atomic",
    id: "policy-fixture-0006",
    covers: "jupiter, tx: namespace for BPN, single atomic constraint",
    policy: {
      version: "jupiter",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "BusinessPartnerNumber", operator: "eq", rightOperand: "BPNL000000000001" },
          ],
        },
      ],
    },
  },
  {
    name: "jupiter-access-logical-and",
    id: "policy-fixture-0007",
    covers: "jupiter, access modelled as use, multi-constraint LogicalConstraint odrl:and",
    policy: {
      version: "jupiter",
      policyType: "access",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
            { leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "DataExchangeGovernance:1.0" },
          ],
        },
      ],
    },
  },
  {
    name: "jupiter-empty-constraints",
    id: "policy-fixture-0008",
    covers: "jupiter, permission with zero constraints (odrl:constraint omitted)",
    policy: {
      version: "jupiter",
      policyType: "usage",
      permissions: [{ action: "use", constraints: [] }],
    },
  },
  {
    name: "jupiter-full-permission-prohibition-obligation",
    id: "policy-fixture-0009",
    covers: "jupiter, all three rule sections populated, list operator scalar collapse",
    policy: {
      version: "jupiter",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            {
              leftOperand: "BusinessPartnerNumber",
              operator: "isAnyOf",
              rightOperand: ["BPNL000000000001", "BPNL000000000002"],
            },
          ],
        },
      ],
      prohibitions: [
        {
          action: "use",
          constraints: [{ leftOperand: "Membership", operator: "eq", rightOperand: "active" }],
        },
      ],
      obligations: [
        {
          action: "use",
          constraints: [{ leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "Traceability:1.0" }],
        },
      ],
    },
  },
] as const;
