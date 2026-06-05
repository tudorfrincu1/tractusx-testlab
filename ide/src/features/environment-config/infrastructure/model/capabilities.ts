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

import type { CapabilityKey, SideKey } from "./types";

/** Describes one capability row rendered in a side editor. */
export interface CapabilityDescriptor {
  key: CapabilityKey;
  label: string;
  description: string;
}

/** Describes one side (engine / sut) shown in the infrastructure form. */
export interface SideDescriptor {
  key: SideKey;
  label: string;
  description: string;
}

/**
 * The hardcoded v1 capability registry (ADR-0019 §1). The mock server is the
 * engine's own built-in component and is therefore NEVER a capability — it is
 * intentionally absent from every side.
 */
export const CAPABILITY_REGISTRY: Readonly<Record<SideKey, readonly CapabilityDescriptor[]>> = {
  engine: [
    { key: "connector", label: "EDC Connector", description: "Engine-operated dataspace connector." },
    { key: "dtr", label: "Digital Twin Registry", description: "Engine-operated twin registry." },
  ],
  sut: [
    { key: "connector", label: "EDC Connector", description: "Connector the SUT must expose." },
    { key: "dtr", label: "Digital Twin Registry", description: "Twin registry the SUT must expose." },
  ],
} as const;

/** Side metadata, ordered engine → sut (ADR-0019 §1). */
export const SIDE_REGISTRY: readonly SideDescriptor[] = [
  { key: "engine", label: "Engine", description: "Infrastructure the embedding host (TestLab) operates." },
  { key: "sut", label: "System Under Test", description: "Capabilities the operator must provide as preconditions." },
] as const;

/** The selectable ecosystem contexts for the dataspace fields. */
export const ECOSYSTEM_OPTIONS: readonly string[] = ["Catena-X"] as const;

/** The selectable dataspace versions (ADR-0019 ecosystem release names). */
export const DATASPACE_VERSION_OPTIONS: readonly string[] = ["jupiter", "saturn"] as const;
