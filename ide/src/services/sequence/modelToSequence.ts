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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type {
  TestLabDocument,
  Step,
  StepDefinition,
  ServiceDefinition,
} from "@/models/schema";
import { isTck, isTest, isTemplateStep } from "@/models/schema";

const ORCHESTRATOR = "TestLab";
const TESTED_CONNECTOR = "tested_connector";
const TESTED_APPLICATION = "tested_application";

interface SequenceClassification {
  type: "outbound" | "inbound" | "internal";
  has_response: boolean;
}

/** Classify a step by its `uses` category prefix. */
function classifyByCategory(uses: string): SequenceClassification {
  const category = uses.split("/")[0];
  switch (category) {
    case "connector":
      return { type: "outbound", has_response: true };
    case "http":
      return { type: "outbound", has_response: true };
    case "mock":
      if (uses.includes("wait")) return { type: "inbound", has_response: true };
      return { type: "inbound", has_response: false };
    default:
      return { type: "internal", has_response: false };
  }
}

/** Extract service name from template expressions in `with` fields. */
function extractServiceFromWith(
  withObj: Record<string, unknown> | undefined
): string | undefined {
  if (!withObj) return undefined;
  for (const value of Object.values(withObj)) {
    if (typeof value !== "string") continue;
    const match = value.match(/env\.services\.(\w+)/);
    if (match) return match[1];
  }
  return undefined;
}

function sanitizeLabel(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/[:"]/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeParticipantId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

function renderStepLines(
  step: StepDefinition,
  serviceNames: string[]
): string[] {
  const lines: string[] = [];
  const raw = step as unknown as Record<string, unknown>;
  const stepName = raw.name as string | undefined;
  const stepUses = raw.uses as string | undefined;
  const withObj = raw.with as Record<string, unknown> | undefined;
  const label = sanitizeLabel(stepName ?? stepUses ?? step.type ?? "unknown");

  if (!stepUses) {
    lines.push(`    Note over ${ORCHESTRATOR}: ${label}`);
    return lines;
  }

  const classification = classifyByCategory(stepUses);

  if (classification.type === "internal") {
    lines.push(`    ${ORCHESTRATOR}->>${ORCHESTRATOR}: ${label}`);
    return lines;
  }

  // Determine target participant
  let target: string | undefined;
  const matchedService = extractServiceFromWith(withObj);
  if (matchedService && serviceNames.includes(matchedService)) {
    target = sanitizeParticipantId(matchedService);
  } else if (serviceNames.length > 0) {
    target = sanitizeParticipantId(serviceNames[0]);
  }

  if (classification.type === "outbound") {
    const isConnectorCategory = stepUses?.startsWith("connector") ?? false;
    const isHttpCategory = stepUses?.startsWith("http") ?? false;

    if (isConnectorCategory && target) {
      lines.push(`    ${ORCHESTRATOR}->>${target}: ${label}`);
      lines.push(`    ${target}->>${TESTED_CONNECTOR}: DSP HTTP request`);
      if (classification.has_response) {
        lines.push(`    ${TESTED_CONNECTOR}-->>${target}: DSP HTTP response`);
        lines.push(`    ${target}-->>${ORCHESTRATOR}: response`);
      }
    } else if (isHttpCategory) {
      lines.push(`    ${ORCHESTRATOR}->>${TESTED_CONNECTOR}: ${label}`);
      lines.push(`    ${TESTED_CONNECTOR}->>${TESTED_APPLICATION}: forward`);
      if (classification.has_response) {
        lines.push(`    ${TESTED_APPLICATION}-->>${TESTED_CONNECTOR}: response`);
        lines.push(`    ${TESTED_CONNECTOR}-->>${ORCHESTRATOR}: response`);
      }
    } else {
      const dest = target ?? TESTED_CONNECTOR;
      lines.push(`    ${ORCHESTRATOR}->>${dest}: ${label}`);
      if (classification.has_response) {
        lines.push(`    ${dest}-->>${ORCHESTRATOR}: response`);
      }
    }
  } else {
    // inbound (mock steps)
    const isWait = stepUses?.includes("wait") ?? false;
    if (isWait) {
      // Wait steps: SUT calls TestLab mock endpoint → TestLab returns mocked response
      lines.push(`    ${TESTED_APPLICATION}->>${ORCHESTRATOR}: ${label}`);
      lines.push(`    ${ORCHESTRATOR}-->>${TESTED_APPLICATION}: mocked response`);
    } else {
      // Expose/register steps: just a local setup (reflexive only)
      lines.push(`    ${ORCHESTRATOR}->>${ORCHESTRATOR}: ${label}`);
    }
  }

  if (step.validate && step.validate.length > 0) {
    lines.push(`    Note right of ${ORCHESTRATOR}: PASS Assertion`);
  }

  return lines;
}

function renderPhase(
  phaseName: string,
  steps: Step[],
  serviceNames: string[],
  lastParticipant: string
): string[] {
  if (steps.length === 0) return [];
  const lines: string[] = [];
  lines.push(`    rect rgba(50, 50, 80, 0.3)`);
  lines.push(
    `    Note over ${ORCHESTRATOR},${lastParticipant}: ${phaseName}`
  );
  for (const step of steps) {
    if (isTemplateStep(step)) {
      lines.push(
        `    Note over ${ORCHESTRATOR}: template ${sanitizeLabel(step.template)}`
      );
      continue;
    }
    lines.push(...renderStepLines(step, serviceNames));
  }
  lines.push(`    end`);
  return lines;
}

export function modelToSequence(model: TestLabDocument): string {
  if (isTck(model)) {
    return "sequenceDiagram\n    Note over TestLab: TCK Suite - expand individual tests to view sequences";
  }

  if (!isTest(model)) {
    return "sequenceDiagram\n    Note over TestLab: No sequence data available";
  }

  const hasSteps =
    (model.setup?.length ?? 0) > 0 ||
    model.steps.length > 0 ||
    (model.teardown?.length ?? 0) > 0;

  if (!hasSteps) {
    return "sequenceDiagram\n    Note over TestLab: No steps defined yet";
  }

  const services: ServiceDefinition[] = model.services ?? [];
  const serviceNames = services.map((s) => s.name);

  const lines: string[] = [];
  lines.push("sequenceDiagram");
  lines.push(`    participant ${ORCHESTRATOR}`);

  for (const name of serviceNames) {
    lines.push(`    participant ${sanitizeParticipantId(name)}`);
  }

  lines.push(`    participant ${TESTED_CONNECTOR}`);
  lines.push(`    participant ${TESTED_APPLICATION}`);

  const lastParticipant = TESTED_APPLICATION;

  if (model.setup && model.setup.length > 0) {
    lines.push(...renderPhase("Setup", model.setup, serviceNames, lastParticipant));
  }

  if (model.steps.length > 0) {
    lines.push(...renderPhase("Execution", model.steps, serviceNames, lastParticipant));
  }

  if (model.teardown && model.teardown.length > 0) {
    lines.push(...renderPhase("Teardown", model.teardown, serviceNames, lastParticipant));
  }

  return lines.join("\n");
}
