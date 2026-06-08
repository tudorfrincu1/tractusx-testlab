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

/** Maps a JSON Schema constraint definition into the IDE registry shape. */

import { deref, type SchemaNode } from "./resolver.ts";

/** Right-operand input kinds the editor understands (mirrors RightOperandDef). */
export type RightOperandType =
  | "fixed"
  | "select"
  | "selectOrCustom"
  | "pattern"
  | "custom"
  | "number"
  | "date";

/** Generated facts for a single right operand (placeholder is added later). */
export interface RightOperandData {
  type: RightOperandType;
  values?: string[];
}

/** Generated facts for a single constraint (operators + right operand). */
export interface ConstraintData {
  operators: string[];
  rightOperand: RightOperandData;
}

/** A constraint keyed by its left-operand value. */
export interface MappedConstraint {
  key: string;
  data: ConstraintData;
}

const DATE_PATTERN_MARKER = String.raw`\d{4}-\d{2}-\d{2}`;

function isDatePattern(pattern: string): boolean {
  return pattern.includes(DATE_PATTERN_MARKER);
}

/** Pick a property by its camelCase (Saturn) or snake_case (Jupiter) name. */
function pickProperty(
  properties: Record<string, SchemaNode>,
  camelCase: string,
  snakeCase: string,
): SchemaNode | undefined {
  return properties[camelCase] ?? properties[snakeCase];
}

function mapEnumOfRefs(doc: SchemaNode, entries: SchemaNode[]): RightOperandData {
  const values: string[] = [];
  let allowsCustom = false;
  for (const entry of entries) {
    const resolved = deref(doc, entry);
    if (resolved.const !== undefined) {
      values.push(String(resolved.const));
    } else if (resolved.type === "string") {
      allowsCustom = true;
    }
  }
  return { type: allowsCustom ? "selectOrCustom" : "select", values };
}

function mapArrayItems(doc: SchemaNode, items: SchemaNode): RightOperandData {
  if (Array.isArray(items.anyOf)) {
    return mapEnumOfRefs(doc, items.anyOf);
  }
  if (Array.isArray(items.oneOf)) {
    return mapEnumOfRefs(doc, items.oneOf);
  }
  const resolved = deref(doc, items);
  if (resolved.const !== undefined) {
    return { type: "select", values: [String(resolved.const)] };
  }
  if (resolved.type === "string" && typeof resolved.pattern === "string") {
    return { type: "pattern" };
  }
  if (resolved.type === "integer" || resolved.type === "number") {
    return { type: "number" };
  }
  return { type: "custom" };
}

/** Map any right-operand node (scalar, array, or enum-of-refs) to registry facts. */
export function mapRightOperand(doc: SchemaNode, node: SchemaNode): RightOperandData {
  const resolved = deref(doc, node);
  if (resolved.type === "array" && resolved.items) {
    return mapArrayItems(doc, resolved.items);
  }
  if (Array.isArray(resolved.anyOf)) {
    return mapEnumOfRefs(doc, resolved.anyOf);
  }
  if (Array.isArray(resolved.oneOf)) {
    return mapEnumOfRefs(doc, resolved.oneOf);
  }
  if (resolved.const !== undefined) {
    return { type: "fixed", values: [String(resolved.const)] };
  }
  if (Array.isArray(resolved.examples)) {
    return { type: "selectOrCustom", values: resolved.examples.map(String) };
  }
  if (resolved.type === "integer" || resolved.type === "number") {
    return { type: "number" };
  }
  if (resolved.type === "string" && typeof resolved.pattern === "string") {
    return isDatePattern(resolved.pattern) ? { type: "date" } : { type: "pattern" };
  }
  return { type: "custom" };
}

function mapOperators(operator: SchemaNode | undefined): string[] {
  if (!operator) {
    return [];
  }
  if (operator.const !== undefined) {
    return [String(operator.const)];
  }
  if (Array.isArray(operator.enum)) {
    return operator.enum.map(String);
  }
  return [];
}

/** Map a resolved constraint definition into a keyed registry entry. */
export function mapConstraint(doc: SchemaNode, constraintDef: SchemaNode): MappedConstraint {
  const properties = constraintDef.properties ?? {};
  const leftOperand = pickProperty(properties, "leftOperand", "left_operand");
  const operator = pickProperty(properties, "operator", "operator");
  const rightOperand = pickProperty(properties, "rightOperand", "right_operand");
  if (leftOperand?.const === undefined) {
    throw new Error("Constraint definition is missing a left-operand const");
  }
  if (!rightOperand) {
    throw new Error(`Constraint "${leftOperand.const}" is missing a right operand`);
  }
  return {
    key: String(leftOperand.const),
    data: {
      operators: mapOperators(operator),
      rightOperand: mapRightOperand(doc, rightOperand),
    },
  };
}
