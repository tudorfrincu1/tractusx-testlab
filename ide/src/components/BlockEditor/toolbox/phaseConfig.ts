/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
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

/** A small inline block group shown as a sub-category within a phase. */
export interface PhaseBlockGroup {
  /** Display name for the sub-category */
  readonly name: string;
  /** Blockly colour for the sub-category */
  readonly colour: string;
  /** Block type names to include */
  readonly blocks: readonly string[];
}

/** Definition of a toolbox phase group. */
export interface PhaseDefinition {
  /** Display name shown as the phase header in the toolbox */
  readonly name: string;
  /** Blockly colour for the phase header category */
  readonly colour: string;
  /** Catalog category names to include, in display order */
  readonly categories: readonly string[];
  /** Optional inline block groups (non-catalog blocks) */
  readonly blockGroups?: readonly PhaseBlockGroup[];
}

/** Neutral colour for phase group headers */
const PHASE_COLOUR = "#334155";

/** Colour for variable-related block groups */
const VARIABLE_COLOUR = "#5B21B6";

/**
 * Ordered phase definitions for the step-editor toolbox.
 * Categories are grouped under these phases as nested categories.
 * A category may appear in multiple phases (e.g., HTTP in Steps and Teardown).
 */
export const PHASE_DEFINITIONS: readonly PhaseDefinition[] = [
  {
    name: "Setup",
    colour: PHASE_COLOUR,
    categories: ["Precondition", "Mock"],
    blockGroups: [
      { name: "Import", colour: VARIABLE_COLOUR, blocks: ["import_variable"] },
    ],
  },
  {
    name: "Steps",
    colour: PHASE_COLOUR,
    categories: [
      "Function",
      "EDC Connector",
      "Digital Twin Registry",
      "Discovery Finder",
      "HTTP",
      "Notification",
      "Validation",
      "Flow",
      "Wait",
    ],
  },
  {
    name: "Teardown",
    colour: PHASE_COLOUR,
    categories: ["Cleanup", "HTTP"],
    blockGroups: [
      { name: "Export", colour: VARIABLE_COLOUR, blocks: ["export_variable"] },
    ],
  },
];
