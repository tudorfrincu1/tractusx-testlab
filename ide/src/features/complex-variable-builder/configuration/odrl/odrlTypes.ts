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

// Shared primitives for the real EDC ODRL serializers. The two dialect modules
// (Jupiter expanded, Saturn compact) build plain JSON objects from the SAME
// version-agnostic logical PolicyPayload; only the serialization differs.

/** A JSON value we assemble by hand for the operator-facing PolicyDefinition. */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** A plain JSON object node in the assembled PolicyDefinition. */
export interface JsonObject {
  [key: string]: JsonValue;
}

/** Operators whose right operand is a list of literals, not a single value. */
export const LIST_OPERATORS: ReadonlySet<string> = new Set(["isAnyOf", "isNoneOf", "isAllOf"]);

/** The one left operand that uses the `tx:` namespace instead of `cx-policy:`. */
export const BPN_LEFT_OPERAND = "BusinessPartnerNumber";

/** Collapse a possibly-list right operand to a single scalar literal. */
export function toScalar(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

/** Widen a possibly-scalar right operand to a list of literals. */
export function toArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}
