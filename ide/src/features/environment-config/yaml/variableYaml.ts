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

import { complexPayloadText } from "../run/valuePreview";
import { policyToOdrlJson } from "@/features/complex-variable-builder";
import type { ComplexType, ComplexVariable, SimpleVariable, Variable } from "../model";
import type { JsonValue } from "@/models/environment";
import { jsonValueToYamlLines } from "./jsonToYaml";
import { simpleVariableToYamlObject } from "./variableSerialize";

/** Maps a complex-variable type to its canonical TCK `uses:` step name. */
const USES_BY_TYPE: Record<ComplexType, string> = {
  connector_policy: "config/connector/policy",
  connector_asset: "config/connector/asset",
  connector_contract: "config/connector/contract",
  digital_twin: "config/digital-twin-registry/twin",
  json: "config/value/json",
};

/** Maps a complex-variable type to the artifact it returns for `@name` binding. */
const RETURNS_BY_TYPE: Record<ComplexType, { key: string; class: string }> = {
  connector_policy: { key: "policy", class: "Policy" },
  connector_asset: { key: "asset", class: "Asset" },
  connector_contract: { key: "contract", class: "Contract" },
  digital_twin: { key: "twin", class: "Twin" },
  json: { key: "value", class: "Json" },
};

/**
 * Serializes a {@link Variable} for the run YAML using the LOCKED verb grammar
 * (`uses` / `with` / `returns`). Simple variables route through the shared
 * {@link simpleVariableToYamlObject} serializer — the SAME function the real
 * `index.yaml` export uses — so preview and export never drift. Complex
 * variables serialize as the canonical TCK `uses:` step (id / uses / name /
 * with / returns); the full EDC ODRL `PolicyDefinition` is embedded under
 * `with.value` as a YAML block scalar holding pretty-printed JSON.
 */
export function buildVariableYaml(variable: Variable): string {
  const lines =
    variable.kind === "simple" ? simpleLines(variable) : complexLines(variable);
  return lines.join("\n");
}

/** Renders a simple variable's verb-grammar object as a YAML list item. */
function simpleLines(variable: SimpleVariable): string[] {
  return objectAsListItem(simpleVariableToYamlObject(variable));
}

/** Prefixes the first line with `- ` and indents the rest into a list item. */
function objectAsListItem(object: Record<string, JsonValue>): string[] {
  const lines = jsonValueToYamlLines(object, 0);
  return lines.map((line, index) => (index === 0 ? `- ${line}` : `  ${line}`));
}

function complexLines(variable: ComplexVariable): string[] {
  const returns = RETURNS_BY_TYPE[variable.type];
  return [
    `- id: ${variable.name || variable.id}`,
    `  uses: ${USES_BY_TYPE[variable.type]}`,
    `  name: ${variable.name}`,
    `  with:`,
    ...jsonBlockScalarLines("value", canonicalJsonText(variable), 2),
    `  returns:`,
    `    ${returns.key}: { type: object, class: ${returns.class} }`,
  ];
}

/**
 * Emits a `key: |` YAML block literal whose body is the given multi-line text,
 * each line indented one level deeper than the key. Block literals quote
 * nothing, so the embedded JSON (which already quotes every key) stays verbatim.
 */
function jsonBlockScalarLines(key: string, jsonText: string, keyIndent: number): string[] {
  const head = `${indentOf(keyIndent)}${key}: |`;
  const body = jsonText.split("\n").map((line) => `${indentOf(keyIndent + 1)}${line}`);
  return [head, ...body];
}

/**
 * Resolves the complex variable's canonical value as pretty-printed JSON text.
 * For a connector policy this is the FULL EDC ODRL `PolicyDefinition` (built by
 * the shared {@link policyToOdrlJson}, or the operator's hand-edited ODRL),
 * never the trimmed logical shape.
 */
function canonicalJsonText(variable: ComplexVariable): string {
  const item = variable.value;
  if (item.category === "register" && item.policy) {
    return item.policy.rawOdrlJson ?? policyToOdrlJson(item.policy, variable.id);
  }
  return complexPayloadText(variable);
}

function indentOf(level: number): string {
  return "  ".repeat(level);
}
