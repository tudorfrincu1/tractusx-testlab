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

import type { SimpleVarType, SimpleVariable, SourceMode } from "../../model";

/** The shared, source-agnostic fields of a simple variable. */
type SimpleCommon = Pick<
  SimpleVariable,
  "kind" | "id" | "name" | "type" | "description" | "format" | "pattern"
>;

function common(variable: SimpleVariable): SimpleCommon {
  const { kind, id, name, type, description, format, pattern } = variable;
  return { kind, id, name, type, description, format, pattern };
}

/**
 * Switches a simple variable to a new source mode, preserving the common fields
 * and seeding the new source body with safe defaults. Pure: returns a new value.
 */
export function withSourceMode(variable: SimpleVariable, mode: SourceMode): SimpleVariable {
  if (variable.source === mode) {
    return variable;
  }
  const base = common(variable);
  if (mode === "value") {
    return { ...base, source: "value", value: "" };
  }
  if (mode === "input") {
    return { ...base, source: "input" };
  }
  return { ...base, source: "generated", generator: "" };
}

/** Returns the type/format key used to filter compatible generators. */
export function outputKey(variable: SimpleVariable): string {
  return variable.format ?? variable.type;
}

/**
 * Switches the primitive type, clearing any stored value so a stale value
 * (e.g. a `bool` "true") never leaks into a number or text widget.
 */
export function withType(variable: SimpleVariable, type: SimpleVarType): SimpleVariable {
  if (variable.source === "value") {
    return { ...variable, type, value: "" };
  }
  return { ...variable, type };
}

/** The selectable primitive types, paired with their display label. */
export const SIMPLE_TYPE_OPTIONS: readonly { value: SimpleVarType; label: string }[] = [
  { value: "str", label: "Text (str)" },
  { value: "int", label: "Integer (int)" },
  { value: "float", label: "Decimal (float)" },
  { value: "bool", label: "Boolean (bool)" },
] as const;
