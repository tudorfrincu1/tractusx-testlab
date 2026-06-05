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

import type { PolicyRule } from "@/models/schema";

/**
 * The target system an operator preconfigures. This is the POC's PRIMARY
 * organizing axis: the landing groups everything by system, and each system
 * aggregates items of every action type. POC-local — never part of YAML.
 */
export type SystemId = "connector" | "dtr" | "sut_other";

/**
 * The four user-facing precondition categories. (`PROVIDE` is renamed to
 * `REGISTER` at the POC layer; the hidden `inject` plumbing category is not
 * modelled here because it is never shown to the operator.)
 */
export type PreconditionCategory = "generate" | "register" | "input" | "check";

/**
 * The concrete shape of a precondition within its category. Sub-type is a
 * first-class, data-driven field so the category view can group items under
 * sub-headers without branching on payload internals.
 */
export type PreconditionSubType =
  | "generated_value"
  | "access_policy"
  | "usage_policy"
  | "asset_template"
  | "aas_descriptor"
  | "operator_input"
  | "readiness_check";

export type PolicyVersion = "jupiter" | "saturn";
export type PolicyType = "access" | "usage";

/**
 * An optional UsagePurpose constraint (CX-0152). Unlike the required
 * permission constraints, these are advisory: the consumer may match any of
 * them. `custom` distinguishes a free-text value from a known catalog purpose.
 */
export interface OptionalUsagePurpose {
  id: string;
  value: string;
  custom: boolean;
}

/** How the operator is authoring this policy. Template-first by default. */
export type PolicyAuthoringMode = "template" | "advanced";

/** Policy payload edited by the schema-aware card editor. */
export interface PolicyPayload {
  version: PolicyVersion;
  policyType: PolicyType;
  permissions: PolicyRule[];
  prohibitions?: PolicyRule[];
  obligations?: PolicyRule[];
  optionalUsagePurposes?: OptionalUsagePurpose[];
  /**
   * POC-local authoring metadata for the template-first flow. These fields
   * drive the UI only — they are stripped before the policy is serialized to
   * the operator-facing JSON, so they never leak into the deliverable.
   */
  authoringMode?: PolicyAuthoringMode;
  templateId?: string;
  templateVariables?: Record<string, string>;
  /**
   * Raw ODRL JSON the operator hand-edited into a shape the parser could not
   * map back to the logical model. Advanced mode renders this verbatim so the
   * operator's text is never lost; any structured form edit clears it and
   * resumes live serialization from the logical fields.
   */
  rawOdrlJson?: string;
}

/** A value TestLab generates and shows to the operator. */
export interface GeneratePayload {
  generator: string;
  fieldType: string;
  preview: string;
}

/** A static template the operator copies into their SUT. */
export interface ProvidePayload {
  template: string;
}

/** The kinds of values an operator-input field can hold. */
export type InputFieldType = "text" | "number" | "url" | "did" | "bpn" | "uuid";

/** A value the operator must supply before execution. */
export interface InputPayload {
  label: string;
  fieldType: InputFieldType;
  placeholder: string;
  /** Catalog template this input was seeded from (routes the L3 form preview). */
  templateId?: string;
}

/** An automated readiness check executed against a service. */
export interface CheckPayload {
  target: string;
  expression: string;
}

interface BasePrecondition {
  id: string;
  name: string;
  description: string;
  /** Explicit sub-type so the list groups items without inspecting payloads. */
  subType: PreconditionSubType;
  /** POC-local target system this item preconfigures (the primary axis). */
  target?: SystemId;
}

export type PocPrecondition = BasePrecondition &
  (
    | { category: "register"; policy?: PolicyPayload; provide?: ProvidePayload }
    | { category: "generate"; generate: GeneratePayload }
    | { category: "input"; input: InputPayload }
    | { category: "check"; check: CheckPayload }
  );
