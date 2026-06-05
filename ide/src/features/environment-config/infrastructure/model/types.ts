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
 * The infrastructure model for ADR-0019 §1 (v1 scope: `dataspace` +
 * `infrastructure` only; `bindings` is deferred). The shape is intentionally
 * data-driven: sides and capabilities are keyed maps so the registry alone
 * decides which rows exist.
 */

/** Which side of the topology a capability belongs to (ADR-0019 §1). */
export type SideKey = "engine" | "sut";

/** A bindable capability key. Comes from the hardcoded v1 registry. */
export type CapabilityKey = "connector" | "dtr";

/** The ecosystem context the run targets — supplies the inherited version. */
export interface DataspaceContext {
  ecosystem: string;
  version: string;
}

/** The optional standard constraint on a capability (`standard.version`
 * inherits from {@link DataspaceContext.version} when omitted). */
export interface Standard {
  id: string;
  version?: string;
}

/** One capability requirement: an explicit `required` flag plus an optional
 * standard constraint. */
export interface CapabilityRequirement {
  required: boolean;
  standard?: Standard;
}

/** One side of the infrastructure, keyed by capability. */
export type Side = Partial<Record<CapabilityKey, CapabilityRequirement>>;

/** The two bindable sides of the topology. */
export interface InfrastructureConfig {
  engine: Side;
  sut: Side;
}

/** The complete infrastructure model serialized to the two top-level YAML
 * blocks `dataspace:` and `infrastructure:`. */
export interface InfrastructureModel {
  dataspace: DataspaceContext;
  infrastructure: InfrastructureConfig;
}
