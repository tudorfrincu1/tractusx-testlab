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
 * Single source of truth for the LOCKED variable verb grammar v1
 * (`uses` / `with` / `returns`). Every emitter — the live YAML preview AND the
 * real `index.yaml` export — routes its variables through these pure functions
 * so the emitted shape never drifts and round-trips with the backend parser.
 *
 * Grammar (canonical type tokens: `string` | `integer` | `boolean` | `float`):
 *   provide-now:  uses: variable/type/<type> + with: { value: <lit> }
 *   ask-operator: uses: variable/type/<type> + with: { source: input, placeholder? }
 *   generated:    uses: generate/<gen>        + with: { <params> }
 *   returns is always { value: { type: <token>, format? } }.
 * There is NO top-level `type:` key — type lives only under returns.value.type.
 */

import type { JsonValue } from "@/models/environment";
import type { VariableDefinition } from "@/models/schema";
import type { SimpleVariable, SimpleVarType } from "../model";
import { FORMAT_MANIFEST } from "../catalog/formatCatalog";
import { GENERATOR_MANIFEST } from "../catalog/generatorCatalog";

type JsonObject = Record<string, JsonValue>;

/** Maps the model's internal primitive type to its canonical YAML type token. */
export const TYPE_TOKEN = {
  str: "string",
  int: "integer",
  bool: "boolean",
  float: "float",
} as const satisfies Record<SimpleVarType, string>;

/** The closed set of canonical tokens (used to detect already-canonical input). */
const CANONICAL_TOKENS: ReadonlySet<string> = new Set(Object.values(TYPE_TOKEN));

/** Format ids known to the catalog — the semantic refinements of a token. */
const FORMAT_IDS: ReadonlySet<string> = new Set(FORMAT_MANIFEST.formats.map((f) => f.id));

/** A generator id → the variable type/format it produces (per ADR-0018 OQ-2). */
const GENERATOR_OUTPUT: ReadonlyMap<string, string> = new Map(
  GENERATOR_MANIFEST.generators.map((g) => [g.id, g.output_type]),
);

/** Maps any incoming type label to a canonical token, passing through unknowns. */
export function toTypeToken(raw: string): string {
  if (raw in TYPE_TOKEN) return TYPE_TOKEN[raw as SimpleVarType];
  return raw;
}

/** Builds the fixed `returns: { value: { type, format? } }` block. */
function buildReturns(type: string, format?: string): JsonObject {
  const value: JsonObject = { type };
  if (format) value.format = format;
  return { value };
}

/** Splits a generator output type into a canonical token plus optional format. */
function splitGeneratorOutput(output: string, fallbackFormat?: string): { type: string; format?: string } {
  if (FORMAT_IDS.has(output)) return { type: "string", format: output };
  return { type: toTypeToken(output), format: fallbackFormat };
}

/** Coerces a string literal into its typed JSON form for `with.value`. */
function coerceLiteral(raw: string, token: string): JsonValue {
  if (token === "integer") {
    return raw.trim() !== "" && Number.isInteger(Number(raw)) ? Number(raw) : raw;
  }
  if (token === "float") {
    return raw.trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
  }
  if (token === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
  }
  return raw;
}

/** Keeps only JSON-primitive entries of an advanced-config record. */
function toJsonParams(record: Record<string, unknown> | undefined): JsonObject {
  const params: JsonObject = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      params[key] = value as JsonValue;
    }
  }
  return params;
}

/**
 * Serializes a rich {@link SimpleVariable} (preview source) into the verb
 * grammar object. The variable NAME is the addressable `id`.
 */
export function simpleVariableToYamlObject(variable: SimpleVariable): JsonObject {
  const token = toTypeToken(variable.type);
  if (variable.source === "value") {
    return {
      id: variable.name,
      uses: `variable/type/${token}`,
      with: { value: coerceLiteral(variable.value, token) },
      returns: buildReturns(token, variable.format),
    };
  }
  if (variable.source === "input") {
    const params: JsonObject = { source: "input" };
    if (variable.placeholder) params.placeholder = variable.placeholder;
    return {
      id: variable.name,
      uses: `variable/type/${token}`,
      with: params,
      returns: buildReturns(token, variable.format),
    };
  }
  const output = GENERATOR_OUTPUT.get(variable.generator) ?? token;
  const refined = splitGeneratorOutput(output, variable.format);
  return {
    id: variable.name,
    uses: `generate/${variable.generator}`,
    with: toJsonParams(variable.advanced_config),
    returns: buildReturns(refined.type, refined.format),
  };
}

/** Coerces an unknown default into a JSON-primitive literal. */
function defaultToJson(value: unknown): JsonValue {
  if (value === null) return null;
  if (["string", "number", "boolean"].includes(typeof value)) return value as JsonValue;
  return String(value);
}

/**
 * Serializes a flat schema {@link VariableDefinition} (real export source) into
 * the same verb grammar. A `runtime` or default-less variable is ask-operator;
 * otherwise it is provide-now. Generators are not expressible in the flat shape.
 */
export function variableDefinitionToYamlObject(name: string, def: VariableDefinition): JsonObject {
  const token = CANONICAL_TOKENS.has(def.type) ? def.type : toTypeToken(def.type);
  if (def.runtime || def.default === undefined) {
    return {
      id: name,
      uses: `variable/type/${token}`,
      with: { source: "input" },
      returns: buildReturns(token),
    };
  }
  return {
    id: name,
    uses: `variable/type/${token}`,
    with: { value: defaultToJson(def.default) },
    returns: buildReturns(token),
  };
}

/** Maps an `env.variables` record into the verb-grammar list for export. */
export function envVariablesToYamlList(variables: Record<string, VariableDefinition>): JsonObject[] {
  return Object.entries(variables).map(([name, def]) => variableDefinitionToYamlObject(name, def));
}
