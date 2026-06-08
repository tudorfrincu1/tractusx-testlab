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

import type { ComplexVariableItem } from "@/features/complex-variable-builder";

/**
 * The frontend mirror of the ADR-0018 `Variable` discriminated union. A
 * variable is everything a test needs to know before/around a run. It is
 * discriminated first on {@link Variable.kind} (`simple` vs `complex`), and a
 * simple variable is discriminated again on its {@link SimpleSource.source}.
 *
 * The backend Pydantic model is the source of truth for shape and validation;
 * this type tracks it 1:1 so the POC exercises the same contract.
 */

/**
 * The primitive programming type a simple variable carries — exactly the four
 * scalar types a value can be, like a language primitive. Semantic refinements
 * such as `uuid`/`url`/`bpn` are NOT types; they live on {@link SimpleVarBase.format}.
 */
export type SimpleVarType = "str" | "int" | "bool" | "float";

/** The three run-start dispositions a simple variable can take. */
export type SourceMode = "value" | "input" | "generated";

/** Fields shared by every simple-variable source mode. */
interface SimpleVarBase {
  kind: "simple";
  id: string;
  name: string;
  type: SimpleVarType;
  description?: string;
  /**
   * Optional semantic refinement of the primitive {@link type} (Option D). It
   * is a closed-catalog id (`uuid`, `url`, `bpn`, `did`…) sourced from the
   * format catalog, and it drives BOTH validation (the catalog-owned regex)
   * AND generator matching (`outputKey = format ?? type`).
   */
  format?: FormatId;
  /**
   * ADVANCED validation-only escape hatch (Option D): a raw regular expression
   * that NEVER participates in generator matching. Effective validation is
   * `pattern ?? formatCatalog[format].validation_regex`.
   */
  pattern?: string;
}

/** A closed-catalog format id. Kept as a string alias so the catalog (not a
 * hardcoded enum) remains the single source of selectable formats. */
export type FormatId = string;

/** KNOWN: a fixed value provided now. */
export interface ValueSource {
  source: "value";
  value: string;
}

/** REQUEST: a value the operator supplies at run start, with an optional hint. */
export interface InputSource {
  source: "input";
  /** Optional hint shown to the operator at run start (replaces required/default). */
  placeholder?: string;
}

/** GENERATE: a value produced by a backend generator at run start. */
export interface GeneratedSource {
  source: "generated";
  generator: string;
  advanced_config?: Record<string, unknown>;
}

/** The discriminated union of simple-variable source modes. */
export type SimpleSource = ValueSource | InputSource | GeneratedSource;

/** A simple variable: a typed scalar with a single run-start source mode. */
export type SimpleVariable = SimpleVarBase & SimpleSource;

/** The complex-variable family (ADR-0018 v2 vocabulary). */
export type ComplexType =
  | "connector_policy"
  | "connector_asset"
  | "connector_contract"
  | "digital_twin"
  | "json";

/** Cardinality of a complex variable's canonical value. */
export type ComplexContainer = "atomic" | "several";

/**
 * A complex variable: an artifact authored with the existing complex-variable
 * builder (left logical formula / right canonical JSON). The builder state is
 * the reused {@link ComplexVariableItem}; its canonical JSON is the {@link
 * ComplexVariable.value} bound to `@name`.
 */
export interface ComplexVariable {
  kind: "complex";
  id: string;
  name: string;
  description?: string;
  type: ComplexType;
  /** Cardinality of the canonical value (single artifact vs a collection). */
  container: ComplexContainer;
  /** KNOWN (provide now) or REQUEST (ask the operator). */
  source: "value" | "input";
  /** Reused variable-editor builder state (the canonical value). */
  value: ComplexVariableItem;
}

/** The unified variable union consumed across the manager and run views. */
export type Variable = SimpleVariable | ComplexVariable;
