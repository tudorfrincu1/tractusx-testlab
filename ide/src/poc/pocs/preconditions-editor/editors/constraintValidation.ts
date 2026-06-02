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

import type { RightOperandDef } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import { isVariableValue } from "./policyVariables";

const BPNL_PATTERN = /^BPNL[0-9A-Z]{12}$/;

/**
 * Validates a right-operand literal against its schema definition and returns
 * a human-readable warning, or `null` when the value is acceptable. Variables
 * are always accepted because they resolve at runtime.
 */
export function validateRightOperand(
  def: RightOperandDef | undefined,
  value: string,
): string | null {
  if (isVariableValue(value)) return null;
  if (!value.trim()) return "Value is required";
  if (!def) return null;

  if (def.type === "number" && Number.isNaN(Number(value))) {
    return "Must be a number";
  }
  if (def.type === "pattern" && expectsBpnl(def) && !BPNL_PATTERN.test(value)) {
    return "Expected a BPNL (e.g. BPNL000000000000)";
  }
  return null;
}

function expectsBpnl(def: RightOperandDef): boolean {
  return (def.placeholder ?? "").startsWith("BPNL");
}
