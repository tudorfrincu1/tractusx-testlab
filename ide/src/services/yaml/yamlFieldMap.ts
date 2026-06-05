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
 * https://www.apache.org/licenses/LICENSE-2.0
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

/**
 * Single source of truth for YAML v2 field names and their canonical output order.
 * Both modelToYaml and yamlToModel consume these constants — adding or reordering
 * a field means updating ONE file, not two.
 */

/** Step fields in canonical YAML output order. */
export const STEP_FIELDS = ["id", "uses", "name", "with", "returns", "validate", "on_failure", "timeout_s", "if"] as const;
export type StepFieldKey = (typeof STEP_FIELDS)[number];

/** Precondition fields in canonical YAML output order. */
export const PRECONDITION_FIELDS = ["id", "uses", "name", "with", "returns", "validate"] as const;
export type PreconditionFieldKey = (typeof PRECONDITION_FIELDS)[number];

/** Test (script) root-level fields in canonical YAML output order. */
export const TEST_ROOT_FIELDS = ["kind", "testlab", "id", "namespace", "metadata", "env", "preconditions", "setup", "steps", "teardown"] as const;
export type TestRootFieldKey = (typeof TEST_ROOT_FIELDS)[number];

/** TCK root-level fields in canonical YAML output order. */
export const TCK_ROOT_FIELDS = ["kind", "testlab", "id", "namespace", "metadata", "dataspace", "infrastructure", "env", "tests"] as const;
export type TckRootFieldKey = (typeof TCK_ROOT_FIELDS)[number];

/** Inline validation fields in canonical YAML output order. */
export const VALIDATION_FIELDS = ["uses", "with"] as const;
export type ValidationFieldKey = (typeof VALIDATION_FIELDS)[number];

/**
 * Builds an object with keys in the given canonical field order, omitting entries
 * whose value is `undefined`. Guarantees the YAML serializer emits keys in the
 * frozen contract order regardless of how the source object was constructed.
 */
export function buildOrderedRecord(
  fieldOrder: readonly string[],
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of fieldOrder) {
    if (key in source && source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}
