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

import type { ComplexType, Variable } from "./types";

/**
 * The single source of truth for the variable category taxonomy. Both the
 * "+ Add variable" dropdown and the variables overview list group their
 * entries through these labels, so the two surfaces never drift apart.
 */
export const VARIABLE_GROUP = {
  simple: "Simple Variables",
  policies: "Policies",
  assets: "Assets",
  digitalTwins: "Digital Twins",
} as const;

/** A category heading drawn from {@link VARIABLE_GROUP}. */
export type VariableGroupLabel = (typeof VARIABLE_GROUP)[keyof typeof VARIABLE_GROUP];

/** Canonical render order of the category headings. */
export const VARIABLE_GROUP_ORDER: readonly VariableGroupLabel[] = [
  VARIABLE_GROUP.simple,
  VARIABLE_GROUP.policies,
  VARIABLE_GROUP.assets,
  VARIABLE_GROUP.digitalTwins,
] as const;

/**
 * Maps each complex-variable {@link ComplexType} to the category it belongs to.
 * This is the one place that decides a complex variable's group; the builder
 * choices read their `group` from here so the dropdown stays in lock-step.
 *
 * `connector_contract` and `json` are not creatable from the dropdown today;
 * they are grouped with the closest connector category so the mapping stays
 * total over the union.
 */
export const COMPLEX_TYPE_GROUP: Record<ComplexType, VariableGroupLabel> = {
  connector_policy: VARIABLE_GROUP.policies,
  connector_contract: VARIABLE_GROUP.policies,
  connector_asset: VARIABLE_GROUP.assets,
  digital_twin: VARIABLE_GROUP.digitalTwins,
  json: VARIABLE_GROUP.assets,
} as const;

/** The category a single variable belongs to, derived from its kind/type. */
export function variableGroupOf(variable: Variable): VariableGroupLabel {
  return variable.kind === "simple" ? VARIABLE_GROUP.simple : COMPLEX_TYPE_GROUP[variable.type];
}

/** A category heading paired with the variables that fall under it. */
export interface VariableGroup {
  group: VariableGroupLabel;
  variables: readonly Variable[];
}

/**
 * Buckets variables into categories in canonical order, preserving each
 * variable's original order within its group and omitting empty groups.
 */
export function groupVariables(variables: readonly Variable[]): readonly VariableGroup[] {
  return VARIABLE_GROUP_ORDER.map((group) => ({
    group,
    variables: variables.filter((variable) => variableGroupOf(variable) === group),
  })).filter((bucket) => bucket.variables.length > 0);
}
