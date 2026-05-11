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
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
  toBlockValueString,
} from "./helpers";

/**
 * Reconstruct assertion blocks from a step's `expect` array and attach them
 * to the step block's EXPECT input.
 */
export function populateAssertions(
  ws: Workspace,
  sb: Block,
  assertions: Assertion[]
): void {
  const assertBlocks: Block[] = [];
  for (const a of assertions) {
    const output = a.output || "";
    const operators = Object.keys(a).filter((k) => k !== "output");
    if (operators.length === 0) continue;

    const op = operators[0];
    const val = a[op];

    let ab: Block;
    switch (op) {
      case "equals":
        ab = makeBlock(ws, "assert_equals");
        setDropdownValue(ab, "OUTPUT", output);
        connectValue(ab, "EXPECTED", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "not_equals":
        ab = makeBlock(ws, "assert_not_equals");
        setDropdownValue(ab, "OUTPUT", output);
        connectValue(ab, "EXPECTED", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "contains":
        ab = makeBlock(ws, "assert_contains");
        setDropdownValue(ab, "OUTPUT", output);
        connectValue(ab, "SUBSTRING", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "not_contains":
        ab = makeBlock(ws, "assert_not_contains");
        setDropdownValue(ab, "OUTPUT", output);
        connectValue(ab, "SUBSTRING", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "matches":
        ab = makeBlock(ws, "assert_matches");
        setDropdownValue(ab, "OUTPUT", output);
        connectValue(ab, "PATTERN", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "schema":
        ab = makeBlock(ws, "assert_schema");
        setDropdownValue(ab, "OUTPUT", output);
        connectValue(ab, "SCHEMA", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "greater_than":
      case "less_than":
      case "greater_or_equal":
      case "less_or_equal":
        ab = makeBlock(ws, "assert_compare");
        setDropdownValue(ab, "OUTPUT", output);
        setDropdownValue(ab, "OPERATOR", op);
        connectValue(ab, "VALUE", createValueBlockFromString(ws, toBlockValueString(val)));
        break;
      case "between": {
        ab = makeBlock(ws, "assert_between");
        setDropdownValue(ab, "OUTPUT", output);
        const arr = Array.isArray(val) ? val : [];
        connectValue(ab, "MIN", createValueBlockFromString(ws, toBlockValueString(arr[0])));
        connectValue(ab, "MAX", createValueBlockFromString(ws, toBlockValueString(arr[1])));
        break;
      }
      case "not_null":
        ab = makeBlock(ws, "assert_not_null");
        setDropdownValue(ab, "OUTPUT", output);
        break;
      case "not_empty":
        ab = makeBlock(ws, "assert_not_empty");
        setDropdownValue(ab, "OUTPUT", output);
        break;
      default:
        continue;
    }
    assertBlocks.push(ab);
  }
  attachChain(sb, "EXPECT", assertBlocks);
}
