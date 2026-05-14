/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

import type { Block, Workspace } from "blockly";
import type { Assertion } from "../../../models/schema";
import { AssertionOperator } from "../../../models/schema";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
  toBlockValueString,
} from "./helpers";

/** Raw assertion object from YAML — may be new typed format or legacy compact format. */
type RawAssertion = Record<string, unknown>;

/** Assertion input — accepts both typed Assertion objects and raw YAML objects. */
type AssertionInput = Assertion | RawAssertion;

/** Maps YAML type strings to compare-block dropdown values. */
const TYPE_TO_COMPARE_OP: Record<string, string> = {
  [AssertionOperator.GREATER_THAN]: "greater_than",
  [AssertionOperator.LESS_THAN]: "less_than",
  [AssertionOperator.GREATER_OR_EQUAL]: "greater_or_equal",
  [AssertionOperator.LESS_OR_EQUAL]: "less_or_equal",
};

/** Maps legacy compact keys to the new typed assertion operator. */
const LEGACY_KEY_TO_TYPE: Record<string, string> = {
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
};

/** Normalize a legacy compact assertion to the new typed format. */
function normalizeLegacy(raw: RawAssertion): RawAssertion {
  const output = String(raw.output ?? "");
  const opKey = Object.keys(raw).find((k) => k !== "output" && k in LEGACY_KEY_TO_TYPE);
  if (!opKey) return raw;
  const typedType = LEGACY_KEY_TO_TYPE[opKey];
  const val = raw[opKey];

  if (typedType === AssertionOperator.BETWEEN) {
    const arr = Array.isArray(val) ? val : [];
    return { type: typedType, output, min: arr[0], max: arr[1] };
  }
  if (typedType === AssertionOperator.VALIDATES_AGAINST_SCHEMA) {
    return { type: typedType, output, schema: val };
  }
  if (typedType === AssertionOperator.NOT_NULL || typedType === AssertionOperator.NOT_EMPTY) {
    return { type: typedType, output };
  }
  return { type: typedType, output, value: val };
}

/**
 * Reconstruct assertion blocks from a step's `expect` array and attach them
 * to the step block's EXPECT input.
 * Supports both the new typed format ({ type, output, value/schema/min/max })
 * and the legacy compact format ({ output, operator_key: value }).
 */
export function populateAssertions(
  ws: Workspace,
  sb: Block,
  assertions: readonly AssertionInput[]
): void {
  const assertBlocks: Block[] = [];
  for (const raw of assertions) {
    try {
      const a: RawAssertion = raw as RawAssertion;
      const normalized = typeof a.type === "string" ? a : normalizeLegacy(a);
      const output = String(normalized.output ?? "");
      const assertType = String(normalized.type ?? "");
      if (!output || !assertType) continue;

      const ab = createAssertionBlock(ws, assertType, output, normalized);
      if (ab) assertBlocks.push(ab);
    } catch (err) {
      const r = raw as RawAssertion;
      // eslint-disable-next-line no-console
      console.warn(
        `[populateAssertions] Skipping assertion (output: ${r.output ?? "?"}):`,
        err,
      );
    }
  }
  attachChain(sb, "EXPECT", assertBlocks);
}

function createAssertionBlock(
  ws: Workspace,
  assertType: string,
  output: string,
  a: RawAssertion,
): Block | null {
  switch (assertType) {
    case AssertionOperator.EQUALS:
      return makeValueAssertion(ws, "assert_equals", output, "EXPECTED", a.value);
    case AssertionOperator.NOT_EQUALS:
      return makeValueAssertion(ws, "assert_not_equals", output, "EXPECTED", a.value);
    case AssertionOperator.CONTAINS:
      return makeValueAssertion(ws, "assert_contains", output, "SUBSTRING", a.value);
    case AssertionOperator.NOT_CONTAINS:
      return makeValueAssertion(ws, "assert_not_contains", output, "SUBSTRING", a.value);
    case AssertionOperator.MATCHES:
      return makeValueAssertion(ws, "assert_matches", output, "PATTERN", a.value);
    case AssertionOperator.SCHEMA:
      return makeValueAssertion(ws, "assert_schema", output, "SCHEMA", a.value);
    case AssertionOperator.VALIDATES_AGAINST_SCHEMA:
      return makeValueAssertion(ws, "assert_validates_schema", output, "SEMANTIC_ID", a.schema);
    case AssertionOperator.GREATER_THAN:
    case AssertionOperator.LESS_THAN:
    case AssertionOperator.GREATER_OR_EQUAL:
    case AssertionOperator.LESS_OR_EQUAL: {
      const ab = makeBlock(ws, "assert_compare");
      setDropdownValue(ab, "OUTPUT", output);
      setDropdownValue(ab, "OPERATOR", TYPE_TO_COMPARE_OP[assertType] ?? "greater_than");
      connectValue(ab, "VALUE", createValueBlockFromString(ws, toBlockValueString(a.value)));
      return ab;
    }
    case AssertionOperator.BETWEEN: {
      const ab = makeBlock(ws, "assert_between");
      setDropdownValue(ab, "OUTPUT", output);
      connectValue(ab, "MIN", createValueBlockFromString(ws, toBlockValueString(a.min)));
      connectValue(ab, "MAX", createValueBlockFromString(ws, toBlockValueString(a.max)));
      return ab;
    }
    case AssertionOperator.NOT_NULL: {
      const ab = makeBlock(ws, "assert_not_null");
      setDropdownValue(ab, "OUTPUT", output);
      return ab;
    }
    case AssertionOperator.NOT_EMPTY: {
      const ab = makeBlock(ws, "assert_not_empty");
      setDropdownValue(ab, "OUTPUT", output);
      return ab;
    }
    default:
      return null;
  }
}

function makeValueAssertion(
  ws: Workspace,
  blockType: string,
  output: string,
  inputName: string,
  value: unknown,
): Block {
  const ab = makeBlock(ws, blockType);
  setDropdownValue(ab, "OUTPUT", output);
  connectValue(ab, inputName, createValueBlockFromString(ws, toBlockValueString(value)));
  return ab;
}
