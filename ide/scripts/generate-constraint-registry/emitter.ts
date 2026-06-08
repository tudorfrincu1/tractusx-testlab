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

/** Renders the deterministic, type-safe `constraintRegistry.generated.ts` file. */

import type { VersionMetadata } from "./overlay.ts";

/** Emitter-side view of a fully assembled right operand (placeholder merged). */
export interface EmittedRightOperand {
  type: string;
  values?: string[];
  placeholder?: string;
}

/** Emitter-side view of a fully assembled constraint. */
export interface EmittedConstraint {
  operators: string[];
  rightOperand: EmittedRightOperand;
}

/** A constraint registry keyed by left-operand value. */
export type EmittedRegistry = Record<string, EmittedConstraint>;

/** Everything the emitter needs to render the generated module. */
export interface RegistryArtifact {
  schemaVersion: string;
  provenance: Record<string, string>;
  policyVersions: string[];
  versionSchemas: Record<string, VersionMetadata>;
  versionBucketing: Record<string, string>;
  constraintsByVersion: Record<string, Record<string, EmittedRegistry>>;
}

const INDENT_UNIT = "  ";
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const FILE_HEADER = `/********************************************************************************
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
 * Produced by \`npm run generate:registry\` from the vendored official Catena-X
 * policy JSON Schemas. To change the constraint data, edit the schemas under
 * \`ide/schemas/policies/\` (or the editorial overlay in
 * \`ide/scripts/generate-constraint-registry/overlay.ts\`) and regenerate.
 */`;

function renderKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

/** Serialize a plain JSON-like value into deterministic, indented TS source. */
function serialize(value: unknown, depth: number): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const inner = INDENT_UNIT.repeat(depth + 1);
    const items = value.map((item) => `${inner}${serialize(item, depth + 1)},`);
    return `[\n${items.join("\n")}\n${INDENT_UNIT.repeat(depth)}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return "{}";
    }
    const inner = INDENT_UNIT.repeat(depth + 1);
    const lines = entries.map(
      ([key, item]) => `${inner}${renderKey(key)}: ${serialize(item, depth + 1)},`,
    );
    return `{\n${lines.join("\n")}\n${INDENT_UNIT.repeat(depth)}}`;
  }
  throw new Error(`Cannot serialize value of type ${typeof value}`);
}

/** Render the full generated module as a single deterministic string. */
export function renderRegistryModule(artifact: RegistryArtifact): string {
  const union = artifact.policyVersions.map((id) => JSON.stringify(id)).join(" | ");
  const sections = [
    FILE_HEADER,
    `import type { ConstraintRegistry, VersionSchema } from "./constraintSchemas";`,
    `/** Stable identifier for the schema generation this data was derived from. */\nexport const SCHEMA_VERSION = ${JSON.stringify(artifact.schemaVersion)};`,
    `/** Provenance of the generated data, for traceability and regen checks. */\nexport const SCHEMA_PROVENANCE = ${serialize(artifact.provenance, 0)} as const;`,
    `/** Union of all policy version ids declared in the schema manifest. */\nexport type PolicyVersion = ${union};`,
    `/** Every known policy version, in manifest order. */\nexport const POLICY_VERSIONS: readonly PolicyVersion[] = ${serialize(artifact.policyVersions, 0)};`,
    `export const VERSION_SCHEMAS: Record<PolicyVersion, VersionSchema> = ${serialize(artifact.versionSchemas, 0)};`,
    `export const VERSION_BUCKETING: Record<PolicyVersion, "by-rule" | "single"> = ${serialize(artifact.versionBucketing, 0)};`,
    `export const CONSTRAINTS_BY_VERSION: Record<PolicyVersion, Record<string, ConstraintRegistry>> = ${serialize(artifact.constraintsByVersion, 0)};`,
  ];
  return `${sections.join("\n\n")}\n`;
}
