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

import { CATEGORY_META, type PreconditionCategory, type RegisterTarget } from "./categories";
import { TARGET_META } from "./registerTargets";
import { findGenerator } from "./generators";
import { findInputTemplate } from "./inputTemplates";
import type { PocPrecondition } from "./types";

/**
 * Uniform-depth navigation across all three categories:
 * Landing (L1) → sub-card grid (L2) → detail/list (L3, plus the register
 * editor as a leaf). Every node knows its parent, so back navigation is a
 * single pure function rather than per-category special-casing.
 */
export type PocView =
  | { level: "landing" }
  | { level: "register-targets" }
  | { level: "register-list"; target: RegisterTarget }
  | { level: "register-detail"; target: RegisterTarget; id: string }
  | { level: "generate-catalog" }
  | { level: "generate-detail"; generatorId: string }
  | { level: "input-templates" }
  | { level: "input-preview"; templateId: string };

const LANDING: PocView = { level: "landing" };

/** The L2 entry point a landing tile's CTA opens for its category. */
export function landingEntryView(category: PreconditionCategory): PocView {
  switch (category) {
    case "register":
      return { level: "register-targets" };
    case "generate":
      return { level: "generate-catalog" };
    case "input":
      return { level: "input-templates" };
    default:
      return LANDING;
  }
}

/** The parent (one level up) of a given view — drives the back button. */
export function parentView(view: PocView): PocView {
  switch (view.level) {
    case "landing":
      return LANDING;
    case "register-targets":
    case "generate-catalog":
    case "input-templates":
      return LANDING;
    case "register-list":
      return { level: "register-targets" };
    case "register-detail":
      return { level: "register-list", target: view.target };
    case "generate-detail":
      return { level: "generate-catalog" };
    case "input-preview":
      return { level: "input-templates" };
  }
}

export interface ViewLabels {
  title: string;
  backLabel: string;
}

/** Topbar title + back-affordance label for the current view. */
export function describeView(view: PocView, active: PocPrecondition | null): ViewLabels {
  switch (view.level) {
    case "landing":
      return {
        title: "Preconditions — certificate-management v0.0.1",
        backLabel: "Back to Test Suite",
      };
    case "register-targets":
      return { title: CATEGORY_META.register.tileLabel, backLabel: "All categories" };
    case "register-list":
      return { title: TARGET_META[view.target].label, backLabel: "Target systems" };
    case "register-detail":
      return {
        title: active?.name ?? "Precondition",
        backLabel: TARGET_META[view.target].label,
      };
    case "generate-catalog":
      return { title: CATEGORY_META.generate.tileLabel, backLabel: "All categories" };
    case "generate-detail":
      return {
        title: findGenerator(view.generatorId)?.label ?? "Generator",
        backLabel: "Generators",
      };
    case "input-templates":
      return { title: CATEGORY_META.input.tileLabel, backLabel: "All categories" };
    case "input-preview":
      return {
        title: findInputTemplate(view.templateId)?.label ?? "Form",
        backLabel: "Form templates",
      };
  }
}
