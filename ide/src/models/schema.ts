/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
 * TypeScript types mirroring the Python Pydantic models from
 * tractusx_testlab.models.test_models.
 */

export const ScriptKind = {
  TEST: "test",
  TEST_CASE: "test-case",
} as const;
export type ScriptKind = (typeof ScriptKind)[keyof typeof ScriptKind];

export const AssertionType = {
  EXACT: "EXACT",
  SCHEMA: "SCHEMA",
  CONTAINS: "CONTAINS",
  REGEX: "REGEX",
  NOT_CONTAINS: "NOT_CONTAINS",
  STATUS_CODE: "STATUS_CODE",
} as const;
export type AssertionType = (typeof AssertionType)[keyof typeof AssertionType];

export const AssertionSeverity = {
  HARD: "HARD",
  SOFT: "SOFT",
} as const;
export type AssertionSeverity = (typeof AssertionSeverity)[keyof typeof AssertionSeverity];

export const FailurePolicy = {
  ABORT: "ABORT",
  CONTINUE: "CONTINUE",
  SKIP_REST: "SKIP_REST",
} as const;
export type FailurePolicy = (typeof FailurePolicy)[keyof typeof FailurePolicy];

export const ValueSource = {
  INLINE: "INLINE",
  FILE: "FILE",
  VARIABLE: "VARIABLE",
} as const;
export type ValueSource = (typeof ValueSource)[keyof typeof ValueSource];

export const SdkCallMode = {
  ALLOWLIST: "ALLOWLIST",
  OPEN: "OPEN",
} as const;
export type SdkCallMode = (typeof SdkCallMode)[keyof typeof SdkCallMode];

export const ServiceType = {
  CONNECTOR_CONSUMER: "CONNECTOR_CONSUMER",
  CONNECTOR_PROVIDER: "CONNECTOR_PROVIDER",
  DSP_CONSUMER: "DSP_CONSUMER",
  DSP_PROVIDER: "DSP_PROVIDER",
  DTR: "DTR",
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export interface DependencyRef {
  file: string;
  outputs: string[];
}

export interface VariableDefinition {
  type: string;
  default?: unknown;
  runtime?: boolean;
  description?: string;
}

export interface Assertion {
  type: AssertionType;
  severity?: AssertionSeverity;
  source?: ValueSource;
  value?: unknown;
  path?: string;
  description?: string;
}

export interface StepDefinition {
  type: string;
  name: string;
  params: Record<string, unknown>;
  on_failure?: FailurePolicy;
  timeout_s?: number;
  expect?: Assertion[];
  store_in_memory?: Record<string, string>;
  if?: string;
}

export interface ListenerDefinition {
  name: string;
  path: string;
  method?: string;
  timeout_s?: number;
}

export interface ServiceDefinition {
  name: string;
  type: ServiceType;
  base_url: string;
  auth?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface PreconditionDefinition {
  id: string;
  description: string;
}

export interface ScriptDefinition {
  kind: typeof ScriptKind.TEST;
  name: string;
  version?: string;
  dataspace_version?: string;
  description?: string;
  import_from?: string;
  allow_sdk_calls?: SdkCallMode;
  depends_on?: (string | DependencyRef)[];
  outputs?: Record<string, string>;
  preconditions?: PreconditionDefinition[];
  variables?: Record<string, VariableDefinition>;
  services?: ServiceDefinition[];
  listen?: ListenerDefinition[];
  setup?: StepDefinition[];
  steps: StepDefinition[];
  cleanup?: StepDefinition[];
}

export interface ImportDefinition {
  import_ref: string;
  override?: Record<string, unknown>;
}

export interface TestRef {
  test: string;
  with?: Record<string, unknown>;
  description?: string;
}

export interface StandardRef {
  id: string;
  version?: string;
}

export interface TestCaseDefinition {
  kind: typeof ScriptKind.TEST_CASE;
  name: string;
  version?: string;
  dataspace_version?: string;
  description?: string;
  author?: string;
  standards?: StandardRef[];
  tags?: string[];
  preconditions?: PreconditionDefinition[];
  variables?: Record<string, VariableDefinition>;
  tests: (ScriptDefinition | string | TestRef)[];
  imports?: ImportDefinition[];
}

export type TestLabDocument = ScriptDefinition | TestCaseDefinition;

export function isTestCase(doc: TestLabDocument): doc is TestCaseDefinition {
  return doc.kind === ScriptKind.TEST_CASE;
}

export function isTest(doc: TestLabDocument): doc is ScriptDefinition {
  return doc.kind === ScriptKind.TEST;
}

export function isTestRef(entry: unknown): entry is TestRef {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "test" in entry &&
    typeof (entry as TestRef).test === "string" &&
    !("kind" in entry)
  );
}

export function createEmptyTest(): ScriptDefinition {
  return {
    kind: ScriptKind.TEST,
    name: "new-test",
    version: "1.0",
    dataspace_version: "saturn",
    steps: [],
  };
}

export function createEmptyTestCase(): TestCaseDefinition {
  return {
    kind: ScriptKind.TEST_CASE,
    name: "new-test-case",
    version: "1.0",
    dataspace_version: "saturn",
    tests: [],
  };
}
