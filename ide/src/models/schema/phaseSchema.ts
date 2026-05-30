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
 * Phase-constituent schema types: steps, services, preconditions, and policies
 * that make up test phases (setup, steps, teardown).
 */

import type { Assertion, FailurePolicy, InlineValidation } from "./assertionSchema";

export const ValueSource = {
  INLINE: "INLINE",
  FILE: "FILE",
  VARIABLE: "VARIABLE",
} as const;
export type ValueSource = (typeof ValueSource)[keyof typeof ValueSource];

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

export interface StepDefinition {
  id: string;
  uses: string;
  name?: string;
  with: Record<string, unknown>;
  returns?: Record<string, unknown>;
  on_failure?: FailurePolicy;
  timeout_s?: number;
  validate?: Assertion[];
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

export interface ServiceAuthDefinition {
  type: string;
  [key: string]: unknown;
}

export interface ServiceReturnField {
  type: string;
  class?: string;
}

export interface ServiceDefinition {
  name: string;
  uses: string;
  with?: Record<string, unknown> & { auth?: ServiceAuthDefinition };
  returns?: Record<string, ServiceReturnField>;
}

export interface AuthDefinition {
  name: string;
  type: AuthType;
  config: Record<string, unknown>;
}

export interface PolicyConstraint {
  leftOperand: string;
  operator: string;
  rightOperand: string | string[];
}

export interface PolicyRule {
  action: string;
  constraints: PolicyConstraint[];
}

export interface PreconditionReturnField {
  type: string;
  class?: string;
  generator?: string;
  label?: string;
  placeholder?: string;
}

export interface PreconditionDefinition {
  id: string;
  uses: string;
  name: string;
  with?: Record<string, unknown>;
  returns?: Record<string, PreconditionReturnField>;
  validate?: InlineValidation[];
}
