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

// Catalog-as-data for the template-first policy flow. This file is the SINGLE
// source of truth for the policy templates an operator can pick — it mirrors
// the block-catalog principle: ready-made policies live as DATA here, not as
// hardcoded UI logic. `applyTemplate` projects a chosen template plus its
// variable values onto the SAME logical PolicyPayload the form and codec
// already consume, so picking a template stays a lens over one object.
import { VERSION_SCHEMAS } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import type { PolicyConstraint } from "@/models/schema";
import type { PolicyPayload, PolicyType, PolicyVersion } from "../../../model";

/** A single constraint a template contributes to the generated permission. */
export interface TemplateConstraint {
  leftOperand: string;
  operator: string;
  /** A literal value, a list of literals, or a single `@token` placeholder. */
  rightOperand: string | string[];
}

/** A value the operator fills in; bound into a constraint by its `@token`. */
export interface TemplateVariable {
  token: string;
  label: string;
  fieldType: "text" | "select";
  /** Known choices for a `select` field. Ignored for `text`. */
  options?: readonly string[];
  /** When true, a `select` field also lets the operator type a custom value. */
  allowCustom?: boolean;
  default?: string;
}

// The standardized Catena-X usage purposes, taken verbatim from the enumerated
// `const` definitions in the Saturn usage-purpose-constraint schema
// (src/tractusx_testlab/schemas/policies/saturn/usage-purpose-constraint-schema.json).
// The schema also allows free-form individual purposes, hence `allowCustom`.
export const USAGE_PURPOSE_OPTIONS: readonly string[] = [
  "cx.core.legalRequirementForThirdparty:1",
  "cx.core.industrycore:1",
  "cx.core.qualityNotifications:1",
  "cx.core.digitalTwinRegistry:1",
  "cx.pcf.base:1",
  "cx.quality.base:1",
  "cx.dcm.base:1",
  "cx.puris.base:1",
  "cx.circular.dpp:1",
  "cx.circular.smc:1",
  "cx.circular.marketplace:1",
  "cx.circular.materialaccounting:1",
  "cx.bpdm.gate.upload:1",
  "cx.bpdm.gate.download:1",
  "cx.bpdm.pool:1",
  "cx.bpdm.vas.dataquality.upload:1",
  "cx.bpdm.vas.dataquality.download:1",
  "cx.bpdm.vas.countryrisk:1",
  "cx.bpdm.vas.bdv.upload:1",
  "cx.bpdm.vas.fpd.upload:1",
  "cx.bpdm.vas.fpd.download:1",
  "cx.bpdm.vas.swd.upload:1",
  "cx.bpdm.vas.swd.download:1",
  "cx.bpdm.vas.nps.upload:1",
  "cx.bpdm.vas.nps.download:1",
  "cx.ccm.base:1",
  "cx.bpdm.poolAll:1",
  "cx.logistics.base:1",
] as const;

/** The shared usage-purpose dropdown variable used by the default templates. */
function usagePurposeVariable(): TemplateVariable {
  return {
    token: "@usage_purpose",
    label: "Usage purpose",
    fieldType: "select",
    options: USAGE_PURPOSE_OPTIONS,
    allowCustom: true,
    default: "cx.ccm.base:1",
  };
}

/** A ready-made policy the operator can adopt instead of hand-building one. */
export interface PolicyTemplate {
  id: string;
  label: string;
  description: string;
  kind: PolicyType;
  constraints: TemplateConstraint[];
  variables: TemplateVariable[];
}

/** Operators whose right operand is a list rather than a single value. */
const LIST_OPERATORS: ReadonlySet<string> = new Set(["isAnyOf", "isNoneOf", "isAllOf"]);

/** The catalog. Add entries here — never branch on template ids in the UI. */
export const POLICY_TEMPLATES: readonly PolicyTemplate[] = [
  {
    id: "testlab_access",
    label: "Enable access for TestLab",
    description: "Allows TestLab's connector to access this asset.",
    kind: "access",
    constraints: [{ leftOperand: "BusinessPartnerNumber", operator: "eq", rightOperand: "@testbed_bpn" }],
    variables: [
      {
        token: "@testbed_bpn",
        label: "TestLab BPN",
        fieldType: "text",
        default: "",
      },
    ],
  },
  {
    id: "jupiter_default_usage",
    label: "Jupiter Default Usage Policy",
    description: "Standard Jupiter (expanded ODRL) usage policy; choose the allowed usage purpose.",
    kind: "usage",
    constraints: [
      { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
      { leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "DataExchangeGovernance:1.0" },
      { leftOperand: "UsagePurpose", operator: "eq", rightOperand: "@usage_purpose" },
    ],
    variables: [usagePurposeVariable()],
  },
  {
    id: "saturn_default_usage",
    label: "Saturn Default Usage Policy",
    description: "Standard Saturn (compact ODRL) usage policy; choose the allowed usage purpose.",
    kind: "usage",
    constraints: [
      { leftOperand: "Membership", operator: "eq", rightOperand: "active" },
      { leftOperand: "FrameworkAgreement", operator: "eq", rightOperand: "DataExchangeGovernance:1.0" },
      { leftOperand: "UsagePurpose", operator: "isAnyOf", rightOperand: "@usage_purpose" },
    ],
    variables: [usagePurposeVariable()],
  },
] as const;

/** All templates whose kind matches the locked policy type of an item. */
export function templatesForKind(kind: PolicyType): PolicyTemplate[] {
  return POLICY_TEMPLATES.filter((template) => template.kind === kind);
}

/** Look up a template by id; `undefined` when the id is unknown. */
export function findTemplate(id: string): PolicyTemplate | undefined {
  return POLICY_TEMPLATES.find((template) => template.id === id);
}

/** Seed a variable-values map from each variable's authored default. */
export function defaultVariableValues(template: PolicyTemplate): Record<string, string> {
  return Object.fromEntries(template.variables.map((variable) => [variable.token, variable.default ?? ""]));
}

/**
 * Project a template plus operator-supplied variable values onto a logical
 * {@link PolicyPayload}. Tokens in right operands are resolved to their bound
 * value, so the produced object is exactly what the existing form and codec
 * already serialize.
 */
export function applyTemplate(
  template: PolicyTemplate,
  variableValues: Record<string, string>,
  version: PolicyVersion = "jupiter",
): PolicyPayload {
  const action = VERSION_SCHEMAS[version].allowedActions[template.kind][0];
  const constraints: PolicyConstraint[] = template.constraints.map((constraint) => ({
    leftOperand: constraint.leftOperand,
    operator: constraint.operator,
    rightOperand: resolveRightOperand(constraint, variableValues),
  }));
  return {
    version,
    policyType: template.kind,
    permissions: [{ action, constraints }],
    authoringMode: "template",
    templateId: template.id,
    templateVariables: variableValues,
  };
}

function resolveRightOperand(
  constraint: TemplateConstraint,
  variableValues: Record<string, string>,
): string | string[] {
  const resolved = Array.isArray(constraint.rightOperand)
    ? constraint.rightOperand.map((value) => resolveToken(value, variableValues))
    : resolveToken(constraint.rightOperand, variableValues);
  if (LIST_OPERATORS.has(constraint.operator)) {
    return Array.isArray(resolved) ? resolved : [resolved];
  }
  return Array.isArray(resolved) ? resolved[0] ?? "" : resolved;
}

function resolveToken(value: string, variableValues: Record<string, string>): string {
  if (value.startsWith("@")) {
    return variableValues[value] ?? value;
  }
  return value;
}
