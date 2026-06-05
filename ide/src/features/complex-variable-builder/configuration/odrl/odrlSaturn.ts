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

// Saturn dialect (Catena-X 2025/9): compact ODRL with bare keys. Saturn has a
// real access token, so an access policy uses `action: access`; usage policies
// use `action: use`. The constraint is ALWAYS an array — a single atomic
// constraint for one, or one `and` object wrapping the atomics for many.
import type { PolicyConstraint, PolicyRule } from "@/models/schema";
import type { PolicyPayload, PolicyType } from "../../types";
import { LIST_OPERATORS, type JsonObject, type JsonValue, toArray, toScalar } from "./odrlTypes";

const ENVELOPE_CONTEXT: JsonValue[] = [
  "https://w3id.org/catenax/2025/9/policy/odrl.jsonld",
  "https://w3id.org/catenax/2025/9/policy/context.jsonld",
  { "@vocab": "https://w3id.org/edc/v0.0.1/ns/" },
];

/** Build the full Saturn `PolicyDefinition` for the operator deliverable. */
export function buildSaturnPolicy(policy: PolicyPayload, id: string): JsonObject {
  const permissionAction = actionFor(policy.policyType);
  return {
    "@context": ENVELOPE_CONTEXT,
    "@type": "PolicyDefinition",
    "@id": id,
    policy: {
      "@type": "Set",
      permission: rulesToEntries(policy.permissions, permissionAction),
      prohibition: rulesToEntries(policy.prohibitions ?? [], "use"),
      obligation: rulesToEntries(policy.obligations ?? [], "use"),
    },
  };
}

/** Saturn keeps the access token; usage maps to `use`. */
function actionFor(policyType: PolicyType): string {
  return policyType === "access" ? "access" : "use";
}

function rulesToEntries(rules: readonly PolicyRule[], action: string): JsonValue[] {
  return rules.map((rule) => {
    const entry: JsonObject = { action };
    const constraint = buildConstraint(rule.constraints);
    if (constraint !== null) {
      entry.constraint = constraint;
    }
    return entry;
  });
}

/** Always an array: `[ atomic ]` for one, `[ { and: [...] } ]` for many. */
function buildConstraint(constraints: readonly PolicyConstraint[]): JsonValue | null {
  if (constraints.length === 0) {
    return null;
  }
  if (constraints.length === 1) {
    return [atomicConstraint(constraints[0])];
  }
  return [{ and: constraints.map(atomicConstraint) }];
}

/** A bare atomic constraint; list operators carry an array right operand. */
function atomicConstraint(constraint: PolicyConstraint): JsonObject {
  const rightOperand: JsonValue = LIST_OPERATORS.has(constraint.operator)
    ? toArray(constraint.rightOperand)
    : toScalar(constraint.rightOperand);
  return {
    leftOperand: constraint.leftOperand,
    operator: constraint.operator,
    rightOperand,
  };
}
