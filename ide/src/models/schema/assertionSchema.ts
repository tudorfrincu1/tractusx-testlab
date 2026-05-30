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

/**
 * Assertion-related schema types: operators, failure policies, and assertion structures.
 */

export const AssertionOperator = {
  EQUALS: "EQUALS",
  NOT_EQUALS: "NOT_EQUALS",
  CONTAINS: "CONTAINS",
  NOT_CONTAINS: "NOT_CONTAINS",
  MATCHES: "REGEX",
  SCHEMA: "SCHEMA",
  VALIDATES_AGAINST_SCHEMA: "SCHEMA_VALIDATION",
  NOT_NULL: "NOT_NULL",
  NOT_EMPTY: "NOT_EMPTY",
  GREATER_THAN: "GREATER_THAN",
  LESS_THAN: "LESS_THAN",
  GREATER_OR_EQUAL: "GREATER_OR_EQUAL",
  LESS_OR_EQUAL: "LESS_OR_EQUAL",
  BETWEEN: "BETWEEN",
  ASSERT_FIELD: "ASSERT_FIELD",
  JSON_PATH_EXTRACT: "json_path_extract",
} as const;
export type AssertionOperator = (typeof AssertionOperator)[keyof typeof AssertionOperator];

export const FailurePolicy = {
  ABORT: "ABORT",
  CONTINUE: "CONTINUE",
  SKIP_REST: "SKIP_REST",
} as const;
export type FailurePolicy = (typeof FailurePolicy)[keyof typeof FailurePolicy];

export interface Assertion {
  type: AssertionOperator;
  output: string;
  value?: unknown;
  schema?: string;
  min?: unknown;
  max?: unknown;
  path?: string;
  operator?: string;
  expected?: unknown;
  json_path?: string;
  validate?: Assertion[];
}

export interface InlineValidation {
  uses: string;
  with: Record<string, unknown>;
}
