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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { InlineValidation } from "@/models/schema";
import { AssertionOperator } from "@/models/schema";

/** Raw assertion object from YAML — may be new typed format or legacy compact format. */
export type RawAssertion = Record<string, unknown>;

/** Maps YAML type strings to compare-block dropdown values. */
export const TYPE_TO_COMPARE_OP: Record<string, string> = {
  [AssertionOperator.GREATER_THAN]: "greater_than",
  [AssertionOperator.LESS_THAN]: "less_than",
  [AssertionOperator.GREATER_OR_EQUAL]: "greater_or_equal",
  [AssertionOperator.LESS_OR_EQUAL]: "less_or_equal",
};

/** Maps lowercase operator strings to their canonical enum value. */
const OPERATOR_ALIASES: Record<string, string> = {
  not_null: AssertionOperator.NOT_NULL,
  not_empty: AssertionOperator.NOT_EMPTY,
  equals: AssertionOperator.EQUALS,
  not_equals: AssertionOperator.NOT_EQUALS,
  contains: AssertionOperator.CONTAINS,
  not_contains: AssertionOperator.NOT_CONTAINS,
  matches: AssertionOperator.MATCHES,
  schema: AssertionOperator.SCHEMA,
  validates_against_schema: AssertionOperator.VALIDATES_AGAINST_SCHEMA,
  greater_than: AssertionOperator.GREATER_THAN,
  less_than: AssertionOperator.LESS_THAN,
  greater_or_equal: AssertionOperator.GREATER_OR_EQUAL,
  less_or_equal: AssertionOperator.LESS_OR_EQUAL,
  between: AssertionOperator.BETWEEN,
  assert_field: AssertionOperator.ASSERT_FIELD,
  json_path_extract: AssertionOperator.JSON_PATH_EXTRACT,
};

/** Check if an object is an InlineValidation (v2 format with uses/with). */
export function isInlineValidation(obj: unknown): obj is InlineValidation {
  return !!obj && typeof obj === "object" && "uses" in obj && "with" in obj;
}

/** Normalize a v2 InlineValidation ({ uses, with }) into a RawAssertion for internal processing. */
export function normalizeInlineValidation(iv: InlineValidation): RawAssertion {
  const w = iv.with;
  const rawOperator = String(w.operator ?? w.type ?? "");
  const operator = OPERATOR_ALIASES[rawOperator] ?? rawOperator;
  const output = String(w.input ?? w.output ?? "");
  const result: RawAssertion = { type: operator, output };
  if (w.value !== undefined) result.value = w.value;
  if (w.schema !== undefined) result.schema = w.schema;
  if (w.min !== undefined) result.min = w.min;
  if (w.max !== undefined) result.max = w.max;
  if (w.path !== undefined) result.path = w.path;
  if (w.expected !== undefined) result.expected = w.expected;
  if (w.json_path !== undefined) result.json_path = w.json_path;
  if (w.store_in_variable !== undefined) result.store_in_variable = w.store_in_variable;
  if (w.assertions !== undefined) result.assertions = w.assertions;
  return result;
}


