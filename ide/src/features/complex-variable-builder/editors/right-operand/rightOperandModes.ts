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

import type { RightOperandDef } from "@/shared/ui/policy-constraints/constraintSchemas";
import { isVariableValue } from "../yaml/policyVariables";
import { envReference } from "../templates/ui/envVariables";

export type RightOperandMode = "select" | "custom" | "text" | "number" | "date" | "variable";

export interface RightOperandModeOption {
  value: RightOperandMode;
  label: string;
}

const VARIABLE_OPTION: RightOperandModeOption = { value: "variable", label: "Variable" };

/** Lists the mode toggles a right operand exposes, given its schema type. */
export function getModeOptions(def: RightOperandDef | undefined): RightOperandModeOption[] {
  switch (def?.type) {
    case "select":
      return [{ value: "select", label: "Select value…" }, VARIABLE_OPTION];
    case "selectOrCustom":
      return [
        { value: "select", label: "Select value…" },
        { value: "custom", label: "Custom" },
        VARIABLE_OPTION,
      ];
    case "number":
      return [{ value: "number", label: "Number" }, VARIABLE_OPTION];
    case "date":
      return [{ value: "date", label: "Date" }, VARIABLE_OPTION];
    case "pattern":
    case "custom":
      return [{ value: "text", label: "Text" }, VARIABLE_OPTION];
    default:
      return [];
  }
}

/** Derives the active mode from the stored value and the schema definition. */
export function resolveCurrentMode(
  def: RightOperandDef | undefined,
  value: string,
): RightOperandMode {
  if (isVariableValue(value)) return "variable";
  switch (def?.type) {
    case "select":
      return "select";
    case "selectOrCustom":
      return def.values?.includes(value) ? "select" : "custom";
    case "number":
      return "number";
    case "date":
      return "date";
    default:
      return "text";
  }
}

/** Picks a sensible starting value when the operator switches modes. */
export function defaultValueForMode(
  def: RightOperandDef | undefined,
  mode: RightOperandMode,
  availableVariableNames: readonly string[],
): string {
  if (mode === "variable") {
    const firstVariableName = availableVariableNames[0];
    return firstVariableName ? envReference(firstVariableName) : "";
  }
  if (mode === "select") return def?.values?.[0] ?? "";
  return "";
}
