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
 * Hand-authored editorial overlay. These facts are NOT derivable from the JSON
 * Schemas (labels, action vocabulary, capability flags, input placeholders) and
 * are merged on top of the generated constraint facts. Keys with no overlay
 * entry intentionally omit the optional editorial field.
 */

/** Version-level editorial metadata (mirrors VersionSchema). */
export interface VersionMetadata {
  label: string;
  description: string;
  allowedActions: Record<string, string[]>;
  supportsProhibitions: boolean;
  supportsObligations: boolean;
}

/** Per-version editorial metadata keyed by dataspace version. */
export const VERSION_METADATA: Record<string, VersionMetadata> = {
  jupiter: {
    label: "Jupiter (cx-odrl-profile)",
    description: "EDC v0.8-v0.10. Only 'use' action, 'eq' operator, logical 'and' constraints.",
    allowedActions: { access: ["use"], usage: ["use"] },
    supportsProhibitions: false,
    supportsObligations: false,
  },
  saturn: {
    label: "Saturn (CX-0152)",
    description:
      "EDC v0.11+, DSP 2025-1. Supports access/use actions, multiple operators, prohibitions and obligations.",
    allowedActions: { access: ["access"], usage: ["use"] },
    supportsProhibitions: true,
    supportsObligations: true,
  },
};

/** Standard ODRL action vocabulary used when a version has no overlay entry. */
const DEFAULT_ALLOWED_ACTIONS: Record<string, string[]> = {
  access: ["access"],
  usage: ["use"],
};

/**
 * Resolve the editorial metadata for a version. Versions with no overlay entry
 * fall back to sane ODRL defaults so the manifest stays the only required edit.
 */
export function resolveVersionMetadata(id: string, label: string): VersionMetadata {
  return (
    VERSION_METADATA[id] ?? {
      label: label || id,
      description: "",
      allowedActions: DEFAULT_ALLOWED_ACTIONS,
      supportsProhibitions: true,
      supportsObligations: true,
    }
  );
}

/**
 * Input placeholder hints keyed by `version -> constraint key`. Only constraints
 * that benefit from a hint are listed; everything else renders without one.
 */
export const PLACEHOLDERS: Record<string, Record<string, string>> = {
  jupiter: {
    ContractReference: "Contract ref...",
    UsagePurpose: "Custom purpose...",
    BusinessPartnerNumber: "BPNL000000000000",
  },
  saturn: {
    BusinessPartnerNumber: "BPNL000000000000",
    BusinessPartnerGroup: "Group name...",
    UsagePurpose: "Custom purpose...",
    ContractReference: "Contract reference...",
    AffiliatesBpnl: "BPNL000000000000",
    DataProvisioningEndDurationDays: "365",
    DataProvisioningEndDate: "2027-01-01T00:00:00Z",
  },
};
