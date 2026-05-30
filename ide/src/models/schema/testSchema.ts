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
 * Top-level test document schema types: ScriptDefinition, TckDefinition,
 * TestLabDocument, and document-level type guards and factories.
 */

import type { ServiceDefinition, Step, PreconditionDefinition } from "./phaseSchema";

export const ScriptKind = {
  TEST: "test",
  TCK: "tck",
} as const;
export type ScriptKind = (typeof ScriptKind)[keyof typeof ScriptKind];

export const SdkCallMode = {
  ALLOWLIST: "ALLOWLIST",
  OPEN: "OPEN",
} as const;
export type SdkCallMode = (typeof SdkCallMode)[keyof typeof SdkCallMode];

export interface VariableDefinition {
  type: string;
  default?: unknown;
  runtime?: boolean;
  description?: string;
}

export interface ScriptDefinition {
  kind: typeof ScriptKind.TEST;
  name: string;
  version?: string;
  dataspace_version?: string;
  description?: string;
  allow_sdk_calls?: SdkCallMode;
  outputs?: Record<string, string>;
  preconditions?: PreconditionDefinition[];
  variables?: Record<string, VariableDefinition>;
  services?: ServiceDefinition[];
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

export interface TckEnv {
  variables?: Record<string, VariableDefinition>;
  services?: ServiceDefinition[];
  schemas?: Record<string, unknown>;
  testdata?: Record<string, { file: string; type: string }>;
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
  env?: TckEnv;
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
