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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

export interface RightOperandDef {
  type: "fixed" | "select" | "selectOrCustom" | "pattern" | "custom" | "number" | "date";
  values?: string[];
  placeholder?: string;
}

export interface ConstraintDef {
  operators: string[];
  rightOperand: RightOperandDef;
}

export type ConstraintRegistry = Record<string, ConstraintDef>;

export interface VersionSchema {
  label: string;
  description: string;
  allowedActions: Record<string, string[]>;
  supportsProhibitions: boolean;
  supportsObligations: boolean;
}

/**
 * The constraint data is GENERATED from the official Catena-X policy JSON
 * Schemas (see `constraintRegistry.generated.ts`, produced by
 * `npm run generate:registry`). The generated keyed exports are the single
 * source of truth: every version's schema, bucketing and constraints are keyed
 * by `PolicyVersion`, which is itself generated from the schema manifest. We
 * re-export them here so consumers keep importing from this stable module.
 *
 * No runtime import cycle: `constraintRegistry.generated.ts` imports only TYPES
 * from this file via `import type`, which is erased at runtime.
 */
import {
  VERSION_BUCKETING,
  CONSTRAINTS_BY_VERSION,
  type PolicyVersion,
} from "./constraintRegistry.generated";

export {
  VERSION_SCHEMAS,
  VERSION_BUCKETING,
  CONSTRAINTS_BY_VERSION,
  POLICY_VERSIONS,
} from "./constraintRegistry.generated";
export type { PolicyVersion } from "./constraintRegistry.generated";

/** Get the constraint registry for a given context. */
export function getConstraintsForContext(
  version: PolicyVersion,
  policyType: "access" | "usage",
  ruleType: "permission" | "prohibition" | "obligation"
): ConstraintRegistry {
  if (VERSION_BUCKETING[version] === "single") {
    return CONSTRAINTS_BY_VERSION[version].all;
  }
  return CONSTRAINTS_BY_VERSION[version][`${policyType}_${ruleType}`] ?? {};
}
