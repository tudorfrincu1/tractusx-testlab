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
 * Inverse of {@link variableSerialize}: parses an `env.variables` block back
 * into the canonical `Record<string, VariableDefinition>` model. It accepts the
 * LOCKED verb-grammar list (`- id: … uses: … with: … returns: …`) AND the legacy
 * mapping forms (`name: { type, default }` or bare `name: value`) so imports of
 * older documents keep round-tripping.
 */

import type { VariableDefinition } from "@/models/schema";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Reads `returns.value.type`, falling back to a generic string token. */
function readReturnType(returns: unknown): string {
  if (isRecord(returns) && isRecord(returns.value) && typeof returns.value.type === "string") {
    return returns.value.type;
  }
  return "string";
}

/** Maps one verb-grammar entry to a flat {@link VariableDefinition}. */
function fromVerbEntry(entry: UnknownRecord): { name: string; def: VariableDefinition } | null {
  const name = typeof entry.id === "string" ? entry.id : undefined;
  if (!name) return null;
  const withBlock = isRecord(entry.with) ? entry.with : {};
  const def: VariableDefinition = { type: readReturnType(entry.returns) };
  if (withBlock.source === "input") {
    def.runtime = true;
  } else if ("value" in withBlock) {
    def.default = withBlock.value;
  }
  return { name, def };
}

/** Maps one legacy mapping entry to a flat {@link VariableDefinition}. */
function fromLegacyEntry(value: unknown): VariableDefinition {
  if (isRecord(value)) {
    return {
      type: typeof value.type === "string" ? value.type : "string",
      default: "default" in value ? value.default : undefined,
      runtime: typeof value.runtime === "boolean" ? value.runtime : undefined,
      description: typeof value.description === "string" ? value.description : undefined,
    };
  }
  return { type: "string", default: value };
}

/**
 * Parses any `env.variables` shape into the canonical record, or `undefined`
 * when the block is absent.
 */
export function parseEnvVariables(raw: unknown): Record<string, VariableDefinition> | undefined {
  if (raw === undefined || raw === null) return undefined;
  const result: Record<string, VariableDefinition> = {};
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!isRecord(item)) continue;
      const parsed = fromVerbEntry(item);
      if (parsed) result[parsed.name] = parsed.def;
    }
    return result;
  }
  if (isRecord(raw)) {
    for (const [name, value] of Object.entries(raw)) {
      result[name] = fromLegacyEntry(value);
    }
    return result;
  }
  return undefined;
}
