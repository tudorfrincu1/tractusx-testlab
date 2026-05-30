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

import type { Block } from "blockly";
import { AssertionOperator } from "@/models/schema";
import { readValueBlockAsString, readValueBlockAsUnknown } from "./serializationParts/valueBlockBuilders";

/** Workspace-level assertion shape built by readAssertionChain from Blockly blocks. */
export interface WorkspaceAssertion {
  type: AssertionOperator;
  output: string;
  value?: unknown;
  path?: string;
  operator?: string;
  schema?: string;
  json_path?: string;
  validate?: WorkspaceAssertion[];
  min?: string;
  max?: string;
}

/** Maps the assert_compare block dropdown values to typed YAML assertion types. */
const COMPARE_OP_TO_TYPE: Record<string, AssertionOperator> = {
  greater_than: AssertionOperator.GREATER_THAN,
  less_than: AssertionOperator.LESS_THAN,
  greater_or_equal: AssertionOperator.GREATER_OR_EQUAL,
  less_or_equal: AssertionOperator.LESS_OR_EQUAL,
};

export function readAssertionChain(block: Block | null): WorkspaceAssertion[] {
  const assertions: WorkspaceAssertion[] = [];
  let current = block;
  while (current) {
    const assertion = readSingleAssertion(current);
    if (assertion) assertions.push(assertion);
    current = current.getNextBlock();
  }
  return assertions;
}

function readSingleAssertion(current: Block): WorkspaceAssertion | null {
  if (current.type === "assert_field") {
    return handleAssertField(current);
  }

  if (current.type === "step_json_path_extract") {
    return handleJsonPathExtract(current);
  }

  const output = current.getFieldValue("OUTPUT") || "";
  if (!output || output === "__NONE__") return null;

  return handleComparisonBlock(current, output);
}

function handleAssertField(current: Block): WorkspaceAssertion {
  const path = current.getFieldValue("PATH") || "";
  const operator = current.getFieldValue("OPERATOR") || "equals";
  const expectedRaw = readValueBlockAsUnknown(current.getInputTargetBlock("EXPECTED"));
  const expected = expectedRaw ?? "";
  return {
    type: AssertionOperator.ASSERT_FIELD,
    output: "",
    path,
    operator,
    value: expected,
  };
}

function handleJsonPathExtract(current: Block): WorkspaceAssertion {
  const variable = current.getFieldValue("PARAM_VARIABLE") || "";
  const pathBlock = current.getInputTargetBlock("PARAM_PATH");
  const jsonPath = pathBlock ? (pathBlock.getFieldValue("VALUE") || "") : "";
  const nestedAssertions = readAssertionChain(current.getInputTargetBlock("EXPECT"));
  const entry: WorkspaceAssertion = {
    type: AssertionOperator.JSON_PATH_EXTRACT,
    output: variable,
    json_path: jsonPath
  };
  if (nestedAssertions.length > 0) entry.validate = nestedAssertions;
  return entry;
}

function handleComparisonBlock(current: Block, output: string): WorkspaceAssertion | null {
  switch (current.type) {
    case "assert_equals": {
      const val = readValueBlockAsString(current.getInputTargetBlock("EXPECTED")) || "";
      return { type: AssertionOperator.EQUALS, output, value: val };
    }
    case "assert_not_equals": {
      const val = readValueBlockAsString(current.getInputTargetBlock("EXPECTED")) || "";
      return { type: AssertionOperator.NOT_EQUALS, output, value: val };
    }
    case "assert_contains": {
      const val = readValueBlockAsString(current.getInputTargetBlock("SUBSTRING")) || "";
      return { type: AssertionOperator.CONTAINS, output, value: val };
    }
    case "assert_not_contains": {
      const val = readValueBlockAsString(current.getInputTargetBlock("SUBSTRING")) || "";
      return { type: AssertionOperator.NOT_CONTAINS, output, value: val };
    }
    case "assert_matches": {
      const val = readValueBlockAsString(current.getInputTargetBlock("PATTERN")) || "";
      return { type: AssertionOperator.MATCHES, output, value: val };
    }
    case "assert_schema": {
      const val = readValueBlockAsString(current.getInputTargetBlock("SCHEMA")) || "";
      return { type: AssertionOperator.SCHEMA, output, value: val };
    }
    case "assert_validates_schema": {
      const schemaRef = current.getFieldValue("SCHEMA_REF") || "";
      const schema = schemaRef && schemaRef !== "__NONE__" ? `@${schemaRef}` : "";
      return { type: AssertionOperator.VALIDATES_AGAINST_SCHEMA, output, schema };
    }
    case "assert_compare": {
      const operator = current.getFieldValue("OPERATOR") || "greater_than";
      const val = readValueBlockAsString(current.getInputTargetBlock("VALUE")) || "";
      const assertType = COMPARE_OP_TO_TYPE[operator];
      return assertType ? { type: assertType, output, value: val } : null;
    }
    case "assert_between": {
      const min = readValueBlockAsString(current.getInputTargetBlock("MIN")) || "";
      const max = readValueBlockAsString(current.getInputTargetBlock("MAX")) || "";
      return { type: AssertionOperator.BETWEEN, output, min, max };
    }
    case "assert_not_null":
      return { type: AssertionOperator.NOT_NULL, output };
    case "assert_not_empty":
      return { type: AssertionOperator.NOT_EMPTY, output };
    default:
      return null;
  }
}
