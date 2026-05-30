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

import type { ServiceDefinition, ServiceAuthDefinition, ServiceReturnField } from "@/models/schema";
import type { EnvironmentVariable } from "@/models/environment";

function indent(level: number): string {
  return "  ".repeat(level);
}

function quoted(value: string): string {
  if (
    value.startsWith("${{") ||
    value.startsWith("@") ||
    value.includes(" ") ||
    value.includes(":")
  ) {
    return `"${value}"`;
  }
  return value;
}

function renderServiceAuth(auth: ServiceAuthDefinition, level: number): string[] {
  const lines: string[] = [];
  lines.push(`${indent(level)}auth:`);
  for (const [key, value] of Object.entries(auth)) {
    lines.push(`${indent(level + 1)}${key}: ${quoted(String(value ?? ""))}`);
  }
  return lines;
}

function renderServiceReturns(
  returns: Record<string, ServiceReturnField>,
  level: number,
): string[] {
  const lines: string[] = [];
  lines.push(`${indent(level)}returns:`);
  for (const [name, field] of Object.entries(returns)) {
    lines.push(`${indent(level + 1)}${name}:`);
    lines.push(`${indent(level + 2)}type: ${field.type}`);
    if (field.class) {
      lines.push(`${indent(level + 2)}class: ${field.class}`);
    }
  }
  return lines;
}

function renderService(service: ServiceDefinition): string[] {
  const lines: string[] = [];
  lines.push(`${indent(1)}- name: ${service.name}`);
  lines.push(`${indent(2)}uses: ${service.uses}`);

  const withObj = service.with;
  if (withObj && Object.keys(withObj).length > 0) {
    lines.push(`${indent(2)}with:`);

    for (const [key, value] of Object.entries(withObj)) {
      if (key === "auth") continue;
      lines.push(`${indent(3)}${key}: ${quoted(String(value ?? ""))}`);
    }

    if (withObj.auth) {
      lines.push(...renderServiceAuth(withObj.auth, 3));
    }
  }

  if (service.returns && Object.keys(service.returns).length > 0) {
    lines.push(...renderServiceReturns(service.returns, 2));
  }

  return lines;
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

export interface EnvironmentYamlInput {
  services: ServiceDefinition[];
  variables: EnvironmentVariable[];
}

/**
 * Pure function that converts services (v2 format) and variables into YAML.
 */
export function generateEnvironmentYaml(config: EnvironmentYamlInput): string {
  const sections: string[] = [];

  sections.push("# Environment Configuration");
  sections.push("");

  // Services section (v2 format)
  sections.push("services:");
  if (config.services.length === 0) {
    sections.push(`${indent(1)}# No services configured`);
  }
  for (const svc of config.services) {
    sections.push(...renderService(svc));
  }

  sections.push("");

  // Variables section
  sections.push("variables:");
  if (config.variables.length === 0) {
    sections.push(`${indent(1)}# No variables configured`);
  }
  for (const variable of config.variables) {
    sections.push(renderVariable(variable));
  }

  return sections.join("\n");
}
