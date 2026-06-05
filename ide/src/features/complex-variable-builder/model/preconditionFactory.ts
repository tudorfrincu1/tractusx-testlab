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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import { SUBTYPE_META } from "./subtypeCategories";
import { findInputTemplate } from "./inputTemplates";
import type { AddAction } from "./targetSystems";
import type { PocPrecondition, PreconditionSubType, SystemId } from "./preconditionTypes";

/** Auto-generates a short, unique, sub-type-prefixed id (no operator input). */
function newId(subType: PreconditionSubType): string {
  return `${subType}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Builds the payload-specific body for a freshly added precondition. */
type BodyFactory = (id: string) => PocPrecondition;

/**
 * Default payloads per sub-type. Each entry mirrors the smallest valid shape
 * the matching editor expects, so a newly added item opens ready to edit
 * rather than empty. Names default to the singular sub-type label.
 */
const BODY_FACTORIES: Record<PreconditionSubType, BodyFactory> = {
  access_policy: (id) => ({
    id,
    name: "Access Policy",
    description: "BPN-based access control",
    category: "register",
    subType: "access_policy",
    policy: {
      version: "saturn",
      policyType: "access",
      permissions: [
        {
          action: "access",
          constraints: [{ leftOperand: "Membership", operator: "eq", rightOperand: "active" }],
        },
      ],
    },
  }),
  usage_policy: (id) => ({
    id,
    name: "Usage Policy",
    description: "Usage purpose + framework agreement",
    category: "register",
    subType: "usage_policy",
    policy: {
      version: "saturn",
      policyType: "usage",
      permissions: [
        {
          action: "use",
          constraints: [
            { leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "DataExchangeGovernance:1.0" },
          ],
        },
      ],
    },
  }),
  asset_template: (id) => ({
    id,
    name: "Asset Template",
    description: "Asset definition to register in the provider connector",
    category: "register",
    subType: "asset_template",
    provide: {
      template: '{\n  "@type": "Asset",\n  "properties": {\n    "dct:type": "cx-taxo:Example"\n  }\n}',
    },
  }),
  aas_descriptor: (id) => ({
    id,
    name: "AAS Descriptor",
    description: "Digital twin shell descriptor to register in your DTR",
    category: "register",
    subType: "aas_descriptor",
    provide: {
      template:
        '{\n  "id": "urn:uuid:<shell-id>",\n  "idShort": "ExampleShell",\n  "specificAssetIds": [],\n  "submodelDescriptors": []\n}',
    },
  }),
  generated_value: (id) => ({
    id,
    name: "Generated Value",
    description: "A value TestLab generates and shows to the operator",
    category: "generate",
    subType: "generated_value",
    generate: {
      generator: "testlab_value",
      fieldType: "url",
      preview: "https://testlab.example.org/value",
    },
  }),
  operator_input: (id) => ({
    id,
    name: "Operator Input",
    description: "A value the operator must supply before execution",
    category: "input",
    subType: "operator_input",
    input: {
      label: "Operator Input",
      fieldType: "text",
      placeholder: "Enter a value",
    },
  }),
  readiness_check: (id) => ({
    id,
    name: "Readiness Check",
    description: "Automated verification that a service is ready before tests run",
    category: "check",
    subType: "readiness_check",
    check: {
      target: "@sut_url",
      expression: "status == 200",
    },
  }),
};

/**
 * Creates a new precondition of the given sub-type with sensible defaults, an
 * auto-generated id and the system it belongs to stamped on it. The `name`
 * defaults to the singular sub-type label.
 */
export function createPrecondition(subType: PreconditionSubType): PocPrecondition {
  const body = BODY_FACTORIES[subType](newId(subType));
  const target: SystemId = SUBTYPE_META[subType].target ?? "sut_other";
  return { ...body, name: SUBTYPE_META[subType].addLabel, target };
}

/**
 * Builds an operator-input instance from a catalog template, stamping the
 * template id and target system so the detail view can reuse the template form
 * preview.
 */
function createFromInputTemplate(templateId: string): PocPrecondition {
  const template = findInputTemplate(templateId);
  const target: SystemId = template?.target ?? "sut_other";
  const firstField = template?.fields[0];
  return {
    id: newId("operator_input"),
    name: template ? `${template.label} input` : "Operator Input",
    description: template?.description ?? "A value the operator must supply before execution",
    category: "input",
    subType: "operator_input",
    target,
    input: {
      label: template?.label ?? "Operator Input",
      fieldType: firstField?.fieldClass ?? "text",
      placeholder: firstField?.placeholder ?? "Enter a value",
      templateId,
    },
  };
}

/**
 * Single entry point for the system view's Add menu: turns any action — a
 * register sub-type or an input template — into a ready-to-edit instance
 * stamped with its target system.
 */
export function createFromAddAction(action: AddAction): PocPrecondition {
  switch (action.kind) {
    case "subtype":
      return createPrecondition(action.subType);
    case "input":
      return createFromInputTemplate(action.templateId);
  }
}
