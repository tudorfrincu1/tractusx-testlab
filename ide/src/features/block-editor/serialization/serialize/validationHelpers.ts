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
import type { InlineValidation } from "@/models/schema";
import { readValueBlockAsString } from "../helpers";

/** Convert an internal Assertion (type/output/value) to v2 InlineValidation format. */
export function toInlineValidation(a: Record<string, unknown>): InlineValidation {
  const operator = String(a.type ?? "");
  const input = String(a.output ?? "");
  const w: Record<string, unknown> = { input, operator };
  if (a.value !== undefined) w.value = a.value;
  if (a.schema !== undefined) w.schema = a.schema;
  if (a.min !== undefined) w.min = a.min;
  if (a.max !== undefined) w.max = a.max;
  if (a.path !== undefined) w.path = a.path;
  if (a.json_path !== undefined) w.json_path = a.json_path;
  if (a.store_in_variable !== undefined) w.store_in_variable = a.store_in_variable;
  if (a.validate !== undefined) w.assertions = a.validate;
  return { uses: "validate/assert", with: w };
}

export interface FilterExpressionData {
  operand_left: string;
  operator: string;
  operand_right: string;
}

export function readFilterExpressionChain(block: Block | null): FilterExpressionData[] {
  const expressions: FilterExpressionData[] = [];
  let current = block;
  while (current) {
    if (current.type === "filter_expression") {
      let operandLeft = current.getFieldValue("OPERAND_LEFT") || "";
      if (operandLeft === "custom") {
        operandLeft = current.getFieldValue("OPERAND_LEFT_CUSTOM") || "";
      }
      const operator = current.getFieldValue("OPERATOR") || "=";
      const operandRight = readValueBlockAsString(current.getInputTargetBlock("OPERAND_RIGHT")) || "";
      if (operandLeft && operandRight) {
        expressions.push({
          operand_left: operandLeft,
          operator,
          operand_right: operandRight,
        });
      }
    }
    current = current.getNextBlock();
  }
  return expressions;
}
