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

/* ============================================================================
 * PLACEHOLDER — pending authoritative standards data.
 * Replace with the real per-capability standard/version catalog. The entries
 * below minimally mirror the current factory defaults so the dependent Standard
 * ID / Version dropdowns have at least one valid option per capability.
 * ==========================================================================*/

import type { CapabilityKey } from "./types";

/** One selectable standard for a capability, with its available versions. */
export interface StandardCatalogEntry {
  /** The standard identifier serialized to `id:` (e.g. `CX-0018`). */
  id: string;
  /** Optional human label shown in the dropdown; falls back to {@link id}. */
  label?: string;
  /** The versions selectable once this standard is chosen. */
  versions: readonly string[];
}

/**
 * The per-capability standards catalog driving the Infrastructure dropdowns.
 * Option lists come ONLY from here — no standard/version literals live in the
 * components. PLACEHOLDER values mirror {@link createInfrastructureModel}.
 */
export const STANDARDS_CATALOG: Readonly<Record<CapabilityKey, readonly StandardCatalogEntry[]>> = {
  connector: [{ id: "CX-0018", versions: ["2.1.3"] }],
  dtr: [{ id: "CX-0002", versions: ["1.0.0"] }],
} as const;
