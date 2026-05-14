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
  TCK: "tck",
} as const;
export type ScriptKind = (typeof ScriptKind)[keyof typeof ScriptKind];

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
} as const;
export type AssertionOperator = (typeof AssertionOperator)[keyof typeof AssertionOperator];

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
  EDC_CONNECTOR_SATURN: "edc_connector_saturn",
  EDC_CONNECTOR_JUPITER: "edc_connector_jupiter",
  AAS: "aas",
  DISCOVERY_FINDER: "discovery_finder",
  EDC_DISCOVERY: "edc_discovery",
  BPN_DISCOVERY: "bpn_discovery",
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const AuthType = {
  OAUTH2: "oauth2",
  API_KEY: "api_key",
} as const;
export type AuthType = (typeof AuthType)[keyof typeof AuthType];

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
  type: AssertionOperator;
  output: string;
  value?: unknown;
  schema?: string;
  min?: unknown;
  max?: unknown;
}

export interface TestInputDefinition {
  name: string;
  type?: string;
  source?: string;
  description?: string;
  values?: unknown[];
}

export interface TestOutputDefinition {
  name: string;
  type?: string;
  description?: string;
  values?: unknown[];
}

export interface TestPrerequisite {
  test: string;
  strict_order?: boolean;
  exports_required?: string[];
}

export interface StepDefinition {
  type: string;
  description?: string;
  params: Record<string, unknown>;
  on_failure?: FailurePolicy;
  timeout_s?: number;
  expect?: Assertion[];
  store_in_memory?: Record<string, string>;
  if?: string;
}

export interface TemplateStepDefinition {
  template: string;
  params?: Record<string, unknown>;
  description?: string;
}

export type Step = StepDefinition | TemplateStepDefinition;

export function isTemplateStep(step: Step): step is TemplateStepDefinition {
  return "template" in step;
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
  config: Record<string, unknown>;
  auth?: string;
}

export interface AuthDefinition {
  name: string;
  type: AuthType;
  config: Record<string, unknown>;
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
  allow_sdk_calls?: SdkCallMode;
  depends_on?: (string | DependencyRef)[];
  inputs?: TestInputDefinition[];
  outputs?: Record<string, string>;
  output_definitions?: TestOutputDefinition[];
  prerequisites?: TestPrerequisite[];
  preconditions?: PreconditionDefinition[];
  variables?: Record<string, VariableDefinition>;
  services?: ServiceDefinition[];
  listen?: ListenerDefinition[];
  setup?: Step[];
  steps: Step[];
  teardown?: Step[];
  cleanup?: Step[];
}

export interface TestRef {
  test: string;
  order?: number;
  prerequisite_tests?: string[];
  with?: Record<string, unknown>;
  description?: string;
}

export interface StandardRef {
  id: string;
  version?: string;
}

export interface TckDefinition {
  kind: typeof ScriptKind.TCK;
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
}

export type TestLabDocument = ScriptDefinition | TckDefinition;

export function isTck(doc: TestLabDocument): doc is TckDefinition {
  return doc.kind === ScriptKind.TCK;
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
    steps: [],
  };
}

export function createEmptyTck(): TckDefinition {
  return {
    kind: ScriptKind.TCK,
    name: "new-tck",
    version: "1.0",
    tests: [],
  };
}
