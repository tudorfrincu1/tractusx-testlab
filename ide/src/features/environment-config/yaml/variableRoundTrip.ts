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
 * The bridge between the project store's flat `env.variables` record (the
 * single source of truth, `Record<string, VariableDefinition>`) and the rich
 * {@link Variable} union the Environment Variable Explorer edits. It is the one
 * place that reconstructs a variable's editor state from what was loaded AND
 * folds edited variables back into the canonical record, so the Explorer never
 * drifts from the document it exports.
 *
 * Complex variables (`config/*`) and any entry the flat shape cannot reproduce
 * carry their original verb-grammar entry as a lossless `raw`/`rawEntry`
 * carrier, so an UNEDITED import re-exports byte-for-byte.
 */

import { createComplexVariableItem, type VariableSubType } from "@/features/complex-variable-builder";
import type { VariableDefinition } from "@/models/schema";
import type {
  ComplexType,
  ComplexVariable,
  FormatId,
  SimpleVariable,
  SimpleVarType,
  Variable,
} from "../model";
import { simpleVariableToYamlObject, TYPE_TOKEN } from "./variableSerialize";
import { complexVariableToEntry } from "./variableYaml";

type UnknownRecord = Record<string, unknown>;

/** Maps a complex `uses:` step name back to its {@link ComplexType}. */
const COMPLEX_USES_TYPE: Record<string, ComplexType> = {
  "config/connector/policy": "connector_policy",
  "config/connector/asset": "connector_asset",
  "config/connector/contract": "connector_contract",
  "config/digital-twin-registry/twin": "digital_twin",
  "config/value/json": "json",
};

/** The builder sub-type each complex type reconstructs its editor state from. */
const DEFAULT_SUBTYPE: Record<ComplexType, VariableSubType> = {
  connector_policy: "usage_policy",
  connector_asset: "asset_template",
  connector_contract: "asset_template",
  digital_twin: "aas_descriptor",
  json: "generated_value",
};

/** Inverse of {@link TYPE_TOKEN}: canonical token → the model's primitive type. */
const TOKEN_TYPE: Record<string, SimpleVarType> = {
  string: "str",
  integer: "int",
  boolean: "bool",
  float: "float",
};

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isComplexUses(uses: string | undefined): boolean {
  return uses !== undefined && uses in COMPLEX_USES_TYPE;
}

/** Reads `returns.value.type`, falling back to the generic string token. */
function readReturnToken(returns: unknown): string {
  if (isRecord(returns) && isRecord(returns.value) && typeof returns.value.type === "string") {
    return returns.value.type;
  }
  return "string";
}

/** Reads the optional semantic `returns.value.format` refinement. */
function readFormat(returns: unknown): FormatId | undefined {
  if (isRecord(returns) && isRecord(returns.value) && typeof returns.value.format === "string") {
    return returns.value.format;
  }
  return undefined;
}

function tokenType(token: string): SimpleVarType {
  return TOKEN_TYPE[token] ?? "str";
}

/** Renders any scalar `with.value` literal as the model's string-typed value. */
function literalToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value);
}

/** Keeps only scalar generator params (excluding the source/placeholder keys). */
function extractParams(withBlock: UnknownRecord): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(withBlock)) {
    if (key === "source" || key === "placeholder") continue;
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      params[key] = value;
    }
  }
  return params;
}

/** Reconstructs a complex variable's rich editor state from its raw entry. */
function entryToComplexVariable(entry: UnknownRecord, name: string): ComplexVariable {
  const type = COMPLEX_USES_TYPE[asString(entry.uses) ?? ""] ?? "json";
  const label = asString(entry.name) ?? name;
  const value = createComplexVariableItem(DEFAULT_SUBTYPE[type]);
  value.id = name;
  value.name = label;
  const description = asString(entry.description);
  if (description) value.description = description;
  const source = isRecord(entry.with) && entry.with.source === "input" ? "input" : "value";
  return {
    kind: "complex",
    id: name,
    name: label,
    description: description ?? value.description,
    type,
    container: "atomic",
    source,
    value,
    rawEntry: entry,
  };
}

/** Reconstructs a non-plain simple variable (generated/formatted) from raw. */
function entryToSimpleVariable(entry: UnknownRecord, name: string): SimpleVariable {
  const uses = asString(entry.uses) ?? "";
  const withBlock = isRecord(entry.with) ? entry.with : {};
  const type = tokenType(readReturnToken(entry.returns));
  const format = readFormat(entry.returns);
  const description = asString(entry.description);
  const base = { kind: "simple", id: name, name, type, description, format } as const;
  if (uses.startsWith("generate/")) {
    return { ...base, source: "generated", generator: uses.slice("generate/".length), advanced_config: extractParams(withBlock) };
  }
  if (withBlock.source === "input") {
    return { ...base, source: "input", placeholder: asString(withBlock.placeholder) };
  }
  return { ...base, source: "value", value: literalToString(withBlock.value) };
}

/** Reconstructs a PLAIN simple variable from its flat `{type, default, runtime}`. */
function defToSimpleVariable(name: string, def: VariableDefinition): SimpleVariable {
  const type = tokenType(def.type);
  const base = { kind: "simple", id: name, name, type, description: def.description } as const;
  if (def.runtime || def.default === undefined) {
    return { ...base, source: "input" };
  }
  return { ...base, source: "value", value: literalToString(def.default) };
}

/**
 * Expands the canonical `env.variables` record into the rich {@link Variable}
 * list the Explorer edits. Entries carrying a lossless `raw` carrier are
 * reconstructed from it (complex via `config/*`, generated/formatted simple);
 * everything else is rebuilt deterministically from its flat fields.
 */
export function envVariablesToVariables(record: Record<string, VariableDefinition>): Variable[] {
  return Object.entries(record).map(([name, def]) => {
    const raw = def.raw;
    if (raw && isComplexUses(asString(raw.uses))) return entryToComplexVariable(raw, name);
    if (raw) return entryToSimpleVariable(raw, name);
    return defToSimpleVariable(name, def);
  });
}

/** The `env.variables` record key (the YAML-addressable id) for a variable. */
function recordKeyOf(variable: Variable): string {
  if (variable.kind === "simple") return variable.name;
  return variable.rawEntry ? variable.id : variable.name || variable.id;
}

/**
 * Updates an imported entry's addressable id/name after an identity edit while
 * keeping every other field VERBATIM, so an unedited complex variable still
 * re-exports byte-for-byte. The builder cannot yet round-trip an imported
 * policy's internals, so its body is preserved rather than re-serialized.
 */
function syncIdentity(entry: UnknownRecord, variable: ComplexVariable): UnknownRecord {
  return { ...entry, id: variable.id, name: variable.name };
}

/** A simple variable is "plain" when the flat shape reproduces it exactly. */
function isPlainSimple(variable: SimpleVariable): boolean {
  if (variable.source === "generated" || variable.format) return false;
  return !(variable.source === "input" && variable.placeholder);
}

/** Folds one simple variable into its canonical {@link VariableDefinition}. */
function simpleToDef(variable: SimpleVariable): VariableDefinition {
  const entry = simpleVariableToYamlObject(variable);
  const def: VariableDefinition = { type: TYPE_TOKEN[variable.type] };
  if (variable.source === "input" || variable.source === "generated") {
    def.runtime = variable.source === "input";
  } else if (isRecord(entry.with) && "value" in entry.with) {
    def.default = entry.with.value;
  }
  if (variable.description) def.description = variable.description;
  if (!isPlainSimple(variable)) def.raw = entry;
  return def;
}

/** Folds one complex variable into its canonical {@link VariableDefinition}. */
function complexToDef(variable: ComplexVariable): VariableDefinition {
  const entry = variable.rawEntry ? syncIdentity(variable.rawEntry, variable) : complexVariableToEntry(variable);
  const def: VariableDefinition = { type: "object", raw: entry };
  if (isRecord(entry.with) && "value" in entry.with) def.default = entry.with.value;
  if (variable.description) def.description = variable.description;
  return def;
}

/**
 * Folds the rich {@link Variable} list the Explorer edits back into the
 * canonical `env.variables` record (the project store's source of truth), keyed
 * by each variable's YAML-addressable id. Complex and non-plain simple
 * variables keep a lossless `raw` carrier so the exporter emits them verbatim.
 */
export function variablesToEnvVariables(variables: readonly Variable[]): Record<string, VariableDefinition> {
  const record: Record<string, VariableDefinition> = {};
  for (const variable of variables) {
    record[recordKeyOf(variable)] = variable.kind === "simple" ? simpleToDef(variable) : complexToDef(variable);
  }
  return record;
}
