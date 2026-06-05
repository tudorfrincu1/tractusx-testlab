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

// Jupiter dialect: expanded ODRL with prefixed, object-wrapped operands. The
// access token does not exist in Jupiter, so an access policy is modelled the
// same way as a usage policy (action `use`) and differentiated only by its
// constraint set. Emits the backend-validated canonical shape — a standalone
// `PolicyDefinition` the operator pastes straight into their EDC connector.
import type { PolicyConstraint, PolicyRule } from "@/models/schema";
import type { PolicyPayload } from "../../types";
import { BPN_LEFT_OPERAND, type JsonObject, type JsonValue, toScalar } from "./odrlTypes";

const ENVELOPE_CONTEXT: JsonObject = {
  "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
  odrl: "http://www.w3.org/ns/odrl/2/",
  "cx-policy": "https://w3id.org/catenax/policy/",
};

const POLICY_CONTEXT = "http://www.w3.org/ns/odrl.jsonld";

/** Catena-X policy profile the Jupiter dialect declares inside `policy`. */
const CX_POLICY_PROFILE = "cx-policy:profile2405";

/** Jupiter expands the `use` action into the full ODRL action object form. */
const USE_ACTION_IRI = "http://www.w3.org/ns/odrl/2/use";

/** Build the full Jupiter `PolicyDefinition` for the operator deliverable. */
export function buildJupiterPolicy(policy: PolicyPayload, id: string): JsonObject {
  return {
    "@context": ENVELOPE_CONTEXT,
    "@type": "PolicyDefinition",
    "@id": id,
    policy: {
      "@context": POLICY_CONTEXT,
      profile: CX_POLICY_PROFILE,
      "@type": "odrl:Set",
      "odrl:permission": rulesToEntries(policy.permissions),
      "odrl:prohibition": rulesToEntries(policy.prohibitions ?? []),
      "odrl:obligation": rulesToEntries(policy.obligations ?? []),
    },
  };
}

/** Jupiter has no access token; every rule resolves to the `use` action. */
function rulesToEntries(rules: readonly PolicyRule[]): JsonValue[] {
  return rules.map((rule) => {
    const entry: JsonObject = { "odrl:action": { "odrl:type": USE_ACTION_IRI } };
    const constraint = buildConstraint(rule.constraints);
    if (constraint !== null) {
      entry["odrl:constraint"] = constraint;
    }
    return entry;
  });
}

/** Bare `Constraint` for one constraint, `LogicalConstraint`+`odrl:and` for many. */
function buildConstraint(constraints: readonly PolicyConstraint[]): JsonValue | null {
  if (constraints.length === 0) {
    return null;
  }
  if (constraints.length === 1) {
    return atomicConstraint(constraints[0]);
  }
  return {
    "@type": "LogicalConstraint",
    "odrl:and": constraints.map(atomicConstraint),
  };
}

/** A single prefixed, object-wrapped ODRL constraint with a scalar value. */
function atomicConstraint(constraint: PolicyConstraint): JsonObject {
  return {
    "@type": "Constraint",
    "odrl:leftOperand": { "@id": leftOperandId(constraint.leftOperand) },
    "odrl:operator": { "@id": `odrl:${constraint.operator}` },
    "odrl:rightOperand": toScalar(constraint.rightOperand),
  };
}

/** BPN lives in the `tx:` namespace; every other operand under `cx-policy:`. */
function leftOperandId(leftOperand: string): string {
  return leftOperand === BPN_LEFT_OPERAND ? `tx:${leftOperand}` : `cx-policy:${leftOperand}`;
}
