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

import type { EnvVariable } from "@/features/complex-variable-builder";
import type { Variable } from "./types";

/**
 * The configured literal value of a variable, when one is known at authoring
 * time. Only a value-source simple variable carries a fixed literal; input and
 * generated variables are resolved at run start, and a complex variable's value
 * is a canonical document, so neither contributes a scalar preview.
 */
function configuredValue(variable: Variable): string {
  if (variable.kind === "simple" && variable.source === "value") {
    return variable.value;
  }
  return "";
}

/**
 * Projects the operator's authored variables onto the env-reference catalog the
 * policy builder reads. Every variable becomes selectable by name with its
 * `${{ env.<name> }}` reference; the configured value is surfaced only when it
 * is a known literal, matching the picker's read-only preview. This is the live
 * bridge between the Environment Configuration variable list and the policy
 * variable picker — there is no separate, hardcoded catalog.
 */
export function toEnvVariables(variables: readonly Variable[]): EnvVariable[] {
  return variables.map((variable) => ({
    name: variable.name,
    value: configuredValue(variable),
    description: variable.description,
  }));
}
