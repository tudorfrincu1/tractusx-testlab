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
 * Environment Editor types — services, variables, and configuration
 * for test execution environments.
 */

export type ConnectorVersion = "saturn" | "jupiter";

export type VariableResolutionType = "input" | "manual" | string;
// "input" = user provides before run
// "manual" = prompted mid-execution
// any other string = generator function name (e.g., "uuid_v4")

export interface GeneratorFunction {
  readonly value: string;
  readonly label: string;
  readonly description: string;
}

export const GENERATOR_FUNCTIONS: readonly GeneratorFunction[] = [
  { value: "uuid_v4", label: "uuid_v4", description: "Generate UUID v4" },
  { value: "get_participant_bpn", label: "get_participant_bpn", description: "Get TestLab participant BPN" },
  { value: "timestamp_iso", label: "timestamp_iso", description: "Current ISO timestamp" },
  { value: "random_string", label: "random_string", description: "Random alphanumeric string" },
] as const;

export const DSP_PATHS: Record<ConnectorVersion, string> = {
  saturn: "/api/v1/dsp/2025-1",
  jupiter: "/api/v1/dsp",
} as const;

export type AuthType = "oauth2" | "api_key";

export interface OAuth2Config {
  readonly type: "oauth2";
  token_url: string;
  client_id: string;
  client_secret: string;
}

export interface ApiKeyConfig {
  readonly type: "api_key";
  auth_header: string;
  api_key: string;
}

export type AuthConfig = OAuth2Config | ApiKeyConfig;

export interface InternalServiceConfig {
  readonly name: "testlab_connector";
  enabled: boolean;
  version: ConnectorVersion;
  base_url: string;
  management_path: string;
  auth: AuthConfig;
}

export interface ExternalServiceConfig {
  readonly name: "counter_party_connector";
  enabled: boolean;
  version: ConnectorVersion;
  base_url: string;
  dsp_path: string;
}

export interface AdditionalServiceConfig {
  id: string;
  name: string;
  type: string;
  role?: "provider" | "consumer";
  url: string;
  config: Record<string, string>;
  enabled: boolean;
}

export interface EnvironmentVariable {
  name: string;
  type: VariableResolutionType;
  value: string;
  description: string;
  enabled: boolean;
  secret: boolean;
}

export interface EnvironmentConfig {
  internal: InternalServiceConfig[];
  external: ExternalServiceConfig[];
  additional: AdditionalServiceConfig[];
  variables: EnvironmentVariable[];
}

// Factory functions

export function createDefaultInternalService(): InternalServiceConfig {
  return {
    name: "testlab_connector",
    enabled: true,
    version: "saturn",
    base_url: "",
    management_path: "/management",
    auth: { type: "oauth2", token_url: "", client_id: "", client_secret: "" },
  };
}

export function createDefaultExternalService(): ExternalServiceConfig {
  return {
    name: "counter_party_connector",
    enabled: true,
    version: "saturn",
    base_url: "",
    dsp_path: DSP_PATHS.saturn,
  };
}

export function createDefaultVariable(): EnvironmentVariable {
  return {
    name: "",
    type: "input",
    value: "",
    description: "",
    enabled: true,
    secret: false,
  };
}

export function createEmptyEnvironment(): EnvironmentConfig {
  return {
    internal: [createDefaultInternalService()],
    external: [createDefaultExternalService()],
    additional: [],
    variables: [],
  };
}

// Type guards

export function isGeneratorType(type: VariableResolutionType): boolean {
  return type !== "input" && type !== "manual";
}

export function isValueEditable(type: VariableResolutionType): boolean {
  return type === "input";
}

export function getTypeCategory(type: VariableResolutionType): "input" | "manual" | "function" {
  if (type === "input") return "input";
  if (type === "manual") return "manual";
  return "function";
}
