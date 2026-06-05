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

// Reads a real EDC ODRL `PolicyDefinition` (either dialect) BACK into the
// version-agnostic logical policy the form, templates and serializers share.
// Both dialects use a bare `policy.permission[]`; they differ only in how each
// constraint is written — Saturn uses bare keys, Jupiter wraps left operand and
// operator in prefixed `{ "@id": ... }` objects. We normalize both to the same
// `{ leftOperand, operator, rightOperand }` logical constraint with bare names.
import type { PolicyConstraint, PolicyRule } from "@/models/schema";
import type { PolicyType } from "../../types";

/** The logical policy recovered from an operator-edited ODRL document. */
export interface LogicalPolicy {
  policyType: PolicyType;
  permissions: PolicyRule[];
}

/** Map an ODRL root object back to the logical policy, or `null` when it does
 * not look like a parseable `PolicyDefinition`. `fallbackType` resolves the
 * access/usage ambiguity of the Jupiter dialect, whose action is always `use`. */
export function parseOdrlPolicy(root: unknown, fallbackType: PolicyType): LogicalPolicy | null {
  if (!isRecord(root) || !isRecord(root.policy)) {
    return null;
  }
  const rawPermissions = root.policy.permission ?? root.policy["odrl:permission"];
  if (!Array.isArray(rawPermissions) || rawPermissions.length === 0) {
    return null;
  }
  const permissions: PolicyRule[] = [];
  for (const entry of rawPermissions) {
    const rule = parsePermissionEntry(entry);
    if (rule === null) {
      return null;
    }
    permissions.push(rule);
  }
  const action = permissions[0]?.action ?? "";
  return { policyType: actionToType(action) ?? fallbackType, permissions };
}

function parsePermissionEntry(entry: unknown): PolicyRule | null {
  if (!isRecord(entry)) {
    return null;
  }
  const action = resolveAction(entry["odrl:action"] ?? entry.action);
  const constraints = parseConstraintNode(entry.constraint ?? entry["odrl:constraint"]);
  if (constraints === null) {
    return null;
  }
  return { action, constraints };
}

/** Resolve the bare action name from either a Saturn bare string (`"use"`) or a
 * Jupiter expanded object (`{ "odrl:type": "http://.../use" }`). Defaults to
 * `use`, the only action the Jupiter dialect emits. */
function resolveAction(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }
  if (isRecord(node)) {
    const type = node["odrl:type"] ?? node["@id"];
    if (typeof type === "string") {
      return stripPrefix(type.split("/").pop() ?? type);
    }
  }
  return "use";
}

/** A constraint node is an array (Saturn, or Jupiter multi via `odrl:and`) or a
 * single object (Jupiter `Constraint` / `LogicalConstraint`). */
function parseConstraintNode(node: unknown): PolicyConstraint[] | null {
  if (node === undefined || node === null) {
    return [];
  }
  if (Array.isArray(node)) {
    return flattenElements(node);
  }
  return parseConstraintElement(node);
}

function flattenElements(elements: readonly unknown[]): PolicyConstraint[] | null {
  const collected: PolicyConstraint[] = [];
  for (const element of elements) {
    const parsed = parseConstraintElement(element);
    if (parsed === null) {
      return null;
    }
    collected.push(...parsed);
  }
  return collected;
}

/** One element may be a logical wrapper (`and` / `odrl:and`) or an atomic. */
function parseConstraintElement(element: unknown): PolicyConstraint[] | null {
  if (!isRecord(element)) {
    return null;
  }
  const logicalGroup = element.and ?? element["odrl:and"];
  if (Array.isArray(logicalGroup)) {
    return flattenElements(logicalGroup);
  }
  const atomic = parseAtomic(element);
  return atomic === null ? null : [atomic];
}

function parseAtomic(element: Record<string, unknown>): PolicyConstraint | null {
  if (typeof element.leftOperand === "string") {
    return saturnAtomic(element);
  }
  if (isRecord(element["odrl:leftOperand"])) {
    return jupiterAtomic(element);
  }
  return null;
}

function saturnAtomic(element: Record<string, unknown>): PolicyConstraint | null {
  if (typeof element.operator !== "string") {
    return null;
  }
  const rightOperand = parseRightOperand(element.rightOperand);
  if (rightOperand === null) {
    return null;
  }
  return { leftOperand: element.leftOperand as string, operator: element.operator, rightOperand };
}

function jupiterAtomic(element: Record<string, unknown>): PolicyConstraint | null {
  const leftOperand = idValue(element["odrl:leftOperand"]);
  const operator = idValue(element["odrl:operator"]);
  const rightOperand = parseRightOperand(element["odrl:rightOperand"]);
  if (leftOperand === null || operator === null || rightOperand === null) {
    return null;
  }
  return { leftOperand: stripPrefix(leftOperand), operator: stripPrefix(operator), rightOperand };
}

/** Pull the bare value out of an `{ "@id": "prefix:Name" }` operand wrapper. */
function idValue(node: unknown): string | null {
  if (isRecord(node) && typeof node["@id"] === "string") {
    return node["@id"];
  }
  return null;
}

function parseRightOperand(value: unknown): string | string[] | null {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.every((item): item is string => typeof item === "string")) {
    return value;
  }
  return null;
}

/** Drop a single `prefix:` qualifier (e.g. `cx-policy:Membership` → `Membership`). */
function stripPrefix(value: string): string {
  const separator = value.indexOf(":");
  return separator >= 0 ? value.slice(separator + 1) : value;
}

function actionToType(action: string): PolicyType | null {
  if (action === "access") {
    return "access";
  }
  if (action === "use") {
    return "usage";
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
