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

import type {
  AdditionalServiceConfig,
  AuthConfig,
  EnvironmentConfig,
  EnvironmentVariable,
  ExternalServiceConfig,
  InternalServiceConfig,
} from "../../models/environment";

function indent(level: number): string {
  return "  ".repeat(level);
}

function quoted(value: string): string {
  if (value.startsWith("${{") || value.startsWith("@") || value.includes(" ") || value.includes(":")) {
    return `"${value}"`;
  }
  return value;
}

function renderAuth(auth: AuthConfig): string {
  const lines: string[] = [];
  lines.push(`${indent(3)}type: ${auth.type}`);

  if (auth.type === "oauth2") {
    lines.push(`${indent(3)}token_url: ${quoted(auth.token_url)}`);
    lines.push(`${indent(3)}client_id: ${auth.client_id}`);
  } else {
    lines.push(`${indent(3)}header: ${auth.auth_header || "X-Api-Key"}`);
    lines.push(`${indent(3)}key: "***"`);
  }

  return lines.join("\n");
}

function renderInternalService(svc: InternalServiceConfig): string {
  const type = `edc_connector_${svc.version}`;

  if (!svc.enabled) {
    return [
      `${indent(1)}# - name: ${svc.name}`,
      `${indent(1)}#   type: ${type}`,
    ].join("\n");
  }

  const lines: string[] = [];
  lines.push(`${indent(1)}- name: ${svc.name}`);
  lines.push(`${indent(2)}type: ${type}`);
  lines.push(`${indent(2)}base_url: ${quoted(svc.base_url)}`);
  lines.push(`${indent(2)}management_path: ${svc.management_path}`);
  lines.push(`${indent(2)}auth:`);
  lines.push(renderAuth(svc.auth));

  return lines.join("\n");
}

function renderExternalService(svc: ExternalServiceConfig): string {
  const type = `edc_connector_${svc.version}`;

  if (!svc.enabled) {
    return [
      `${indent(1)}# - name: ${svc.name}`,
      `${indent(1)}#   type: ${type}`,
    ].join("\n");
  }

  const lines: string[] = [];
  lines.push(`${indent(1)}- name: ${svc.name}`);
  lines.push(`${indent(2)}type: ${type}`);
  lines.push(`${indent(2)}base_url: ${quoted(svc.base_url)}`);
  lines.push(`${indent(2)}dsp_path: ${svc.dsp_path}`);

  return lines.join("\n");
}

function renderAdditionalService(svc: AdditionalServiceConfig): string {
  if (!svc.enabled) {
    return [
      `${indent(1)}# - name: ${svc.name}`,
      `${indent(1)}#   type: ${svc.type}`,
    ].join("\n");
  }

  const lines: string[] = [];
  lines.push(`${indent(1)}- name: ${svc.name}`);
  lines.push(`${indent(2)}type: ${svc.type}`);
  if (svc.role) {
    lines.push(`${indent(2)}role: ${svc.role}`);
  }
  lines.push(`${indent(2)}url: ${quoted(svc.url)}`);

  for (const [key, value] of Object.entries(svc.config)) {
    if (value) {
      lines.push(`${indent(2)}${key}: ${quoted(value)}`);
    }
  }

  return lines.join("\n");
}

function renderVariable(variable: EnvironmentVariable): string {
  if (!variable.enabled) {
    return `${indent(1)}# ${variable.name}: { type: ${variable.type} }`;
  }

  const lines: string[] = [];
  lines.push(`${indent(1)}${variable.name}:`);
  lines.push(`${indent(2)}type: ${variable.type}`);

  if (variable.value) {
    lines.push(`${indent(2)}default: ${quoted(variable.value)}`);
  }

  if (variable.secret) {
    lines.push(`${indent(2)}secret: true`);
  }

  if (variable.description) {
    lines.push(`${indent(2)}description: ${quoted(variable.description)}`);
  }

  return lines.join("\n");
}

/**
 * Pure function that converts an EnvironmentConfig into a formatted YAML string.
 */
export function generateEnvironmentYaml(config: EnvironmentConfig): string {
  const sections: string[] = [];

  sections.push("# Environment Configuration");
  sections.push("");

  // Services section
  sections.push("services:");

  // Internal
  if (config.internal.length > 0) {
    sections.push(`${indent(1)}# Internal`);
    for (const svc of config.internal) {
      sections.push(renderInternalService(svc));
    }
  }

  // External
  if (config.external.length > 0) {
    sections.push(`${indent(1)}# External`);
    for (const svc of config.external) {
      sections.push(renderExternalService(svc));
    }
  }

  // Additional
  if (config.additional.length > 0) {
    sections.push(`${indent(1)}# Additional`);
    for (const svc of config.additional) {
      sections.push(renderAdditionalService(svc));
    }
  }

  sections.push("");

  // Variables section
  sections.push("variables:");
  for (const variable of config.variables) {
    sections.push(renderVariable(variable));
  }

  return sections.join("\n");
}
