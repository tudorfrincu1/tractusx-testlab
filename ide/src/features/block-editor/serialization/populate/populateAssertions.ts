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

import type { Block, Workspace } from "blockly";
import type { InlineValidation } from "@/models/schema";
import { AssertionOperator } from "@/models/schema";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
  toBlockValueString,
  type WorkspaceAssertion,
} from "../helpers";
import {
  type RawAssertion,
  TYPE_TO_COMPARE_OP,
  isInlineValidation,
  normalizeInlineValidation,
} from "./assertionNormalization";

/** Assertion input — accepts InlineValidation (v2), typed WorkspaceAssertion objects, and raw YAML objects. */
type AssertionInput = WorkspaceAssertion | InlineValidation | RawAssertion;

/** Create a value_regex block for regex pattern values. */
function createRegexValueBlock(ws: Workspace, pattern: string): Block {
  const rb = makeBlock(ws, "value_regex");
  rb.setFieldValue(pattern, "VALUE");
  return rb;
}

/** Create the appropriate value block for an assert_field EXPECTED input. */
function createAssertFieldValueBlock(ws: Workspace, operator: string, value: unknown): Block {
  if (operator === "matches_regex") {
    return createRegexValueBlock(ws, toBlockValueString(value));
  }
  if (operator === "one_of" && Array.isArray(value)) {
    return createValueListBlock(ws, value);
  }
  return createValueBlockFromString(ws, toBlockValueString(value));
}

/** Create a value_list block populated with list_item blocks for each element. */
function createValueListBlock(ws: Workspace, items: unknown[]): Block {
  const listBlock = makeBlock(ws, "value_list");
  const itemBlocks: Block[] = items.map((item) => {
    const ib = makeBlock(ws, "list_item");
    const valBlock = createValueBlockFromString(ws, toBlockValueString(item));
    connectValue(ib, "VALUE", valBlock);
    return ib;
  });
  attachChain(listBlock, "ITEMS", itemBlocks);
  return listBlock;
}

/**
 * Reconstruct assertion blocks from a step's `validate` array and attach them
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
      let normalized: RawAssertion;
      if (isInlineValidation(raw)) {
        normalized = normalizeInlineValidation(raw);
      } else {
        normalized = raw as RawAssertion;
      }
      const output = String(normalized.output ?? "");
      const assertType = String(normalized.type ?? "");
      if (!assertType) continue;
      if (!output && assertType !== AssertionOperator.ASSERT_FIELD && assertType !== AssertionOperator.JSON_PATH_EXTRACT) continue;

      const ab = createAssertionBlock(ws, assertType, output, normalized);
      if (ab) assertBlocks.push(ab);
    } catch (err) {
      const r = raw as RawAssertion;
      if (import.meta.env.DEV) {
        console.warn(
          `[populateAssertions] Skipping assertion (output: ${r.output ?? "?"}):`,
          err,
        );
      }
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
    case AssertionOperator.VALIDATES_AGAINST_SCHEMA: {
      const ab = makeBlock(ws, "assert_validates_schema");
      setDropdownValue(ab, "OUTPUT", output);
      const rawSchema = typeof a.schema === "string" ? a.schema : "";
      let schemaVal = rawSchema;
      if (schemaVal.startsWith("@")) {
        schemaVal = schemaVal.slice(1);
      } else {
        const varsMatch = /^\$\{\{\s*vars\.(.+?)\s*\}\}$/.exec(schemaVal);
        if (varsMatch) schemaVal = varsMatch[1];
      }
      if (schemaVal) setDropdownValue(ab, "SCHEMA_REF", schemaVal);
      return ab;
    }
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
    case AssertionOperator.ASSERT_FIELD: {
      const ab = makeBlock(ws, "assert_field");
      const path = typeof a.path === "string" ? a.path : "";
      if (path) ab.setFieldValue(path, "PATH");
      const operator = typeof a.operator === "string" ? a.operator : "equals";
      setDropdownValue(ab, "OPERATOR", operator);
      const expectedVal = a.value ?? a.expected;
      if (expectedVal !== undefined && expectedVal !== "") {
        const valueBlock = createAssertFieldValueBlock(ws, operator, expectedVal);
        connectValue(ab, "EXPECTED", valueBlock);
      }
      return ab;
    }
    case AssertionOperator.JSON_PATH_EXTRACT: {
      const ab = makeBlock(ws, "step_json_path_extract");
      // Override connection types to allow use inside assertion chains
      ab.previousConnection?.setCheck("assertion");
      ab.nextConnection?.setCheck("assertion");
      setDropdownValue(ab, "PARAM_VARIABLE", output);
      const jsonPath = typeof a.json_path === "string" ? a.json_path : "";
      if (jsonPath) {
        const jpb = makeBlock(ws, "value_json_path");
        jpb.setFieldValue(jsonPath, "VALUE");
        connectValue(ab, "PARAM_PATH", jpb);
      }
      const storeVar = typeof a.store_in_variable === "string" ? a.store_in_variable : "";
      if (storeVar) {
        connectValue(ab, "PARAM_STORE_IN_VARIABLE", createValueBlockFromString(ws, storeVar));
      }
      // Recursively populate nested assertions
      const nested = a.validate;
      if (Array.isArray(nested) && nested.length > 0) {
        populateAssertions(ws, ab, nested as AssertionInput[]);
      }
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
