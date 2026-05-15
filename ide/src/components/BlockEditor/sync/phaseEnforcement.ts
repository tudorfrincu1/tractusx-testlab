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

import * as Blockly from "blockly";
import type { BlockCatalog } from "../blocks/catalogLoader";
import { PHASE_DEFINITIONS } from "../toolbox/phaseConfig";

/** Phase names matching the root block statement input names. */
type PhaseName = "SETUP" | "STEPS" | "TEARDOWN";

/** Maps phase display names to root block statement input names. */
const PHASE_NAME_TO_INPUT: Record<string, PhaseName> = {
  Setup: "SETUP",
  Steps: "STEPS",
  Teardown: "TEARDOWN",
};

/** Block types that are never phase-restricted (structural/utility placeholders). */
const UNRESTRICTED_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "unsupported_step",
  "schema_import",
]);

/** Prefix used when registering catalog blocks. */
const STEP_PREFIX = "step_";

/**
 * Build a mapping from block type to the set of allowed phase input names.
 * Uses PHASE_DEFINITIONS (categories + blockGroups) and the loaded catalog.
 */
function buildPhaseAllowMap(
  catalog: BlockCatalog,
): Map<string, Set<PhaseName>> {
  const allowMap = new Map<string, Set<PhaseName>>();

  const categoryToBlockTypes = new Map<string, string[]>();
  for (const category of catalog) {
    const types = category.blocks.map((b) => `${STEP_PREFIX}${b.type}`);
    categoryToBlockTypes.set(category.name, types);
  }

  for (const phase of PHASE_DEFINITIONS) {
    const phaseInput = PHASE_NAME_TO_INPUT[phase.name];
    if (!phaseInput) continue;

    for (const categoryName of phase.categories) {
      const blockTypes = categoryToBlockTypes.get(categoryName);
      if (!blockTypes) continue;
      for (const blockType of blockTypes) {
        let phases = allowMap.get(blockType);
        if (!phases) {
          phases = new Set();
          allowMap.set(blockType, phases);
        }
        phases.add(phaseInput);
      }
    }

    if (phase.blockGroups) {
      for (const group of phase.blockGroups) {
        for (const blockType of group.blocks) {
          let phases = allowMap.get(blockType);
          if (!phases) {
            phases = new Set();
            allowMap.set(blockType, phases);
          }
          phases.add(phaseInput);
        }
      }
    }
  }

  return allowMap;
}

/**
 * Walk up the block's parent chain to find which root phase input it belongs to.
 * Returns the statement input name (SETUP/STEPS/TEARDOWN) or null if not inside the root block.
 */
function resolvePhaseInput(block: Blockly.Block): PhaseName | null {
  let current: Blockly.Block | null = block;

  while (current) {
    const parent = current.getParent();
    if (!parent) return null;

    if (parent.type === "test_root") {
      for (const inputName of ["SETUP", "STEPS", "TEARDOWN"] as const) {
        const input = parent.getInput(inputName);
        if (!input?.connection) continue;
        if (isBlockInChain(input.connection.targetBlock(), current)) {
          return inputName;
        }
      }
      return null;
    }

    current = parent;
  }

  return null;
}

/** Check if `target` is in the statement chain starting from `chainStart`. */
function isBlockInChain(
  chainStart: Blockly.Block | null,
  target: Blockly.Block,
): boolean {
  let node = chainStart;
  while (node) {
    if (node === target) return true;
    if (hasDescendant(node, target)) return true;
    node = node.getNextBlock();
  }
  return false;
}

/** Check if `target` is a descendant (child input) of `parent`. */
function hasDescendant(
  parent: Blockly.Block,
  target: Blockly.Block,
): boolean {
  for (const input of parent.inputList) {
    if (!input.connection) continue;
    let child = input.connection.targetBlock() ?? null;
    while (child) {
      if (child === target) return true;
      if (hasDescendant(child, target)) return true;
      child = child.getNextBlock();
    }
  }
  return false;
}

/**
 * Attach a workspace listener that enforces phase restrictions.
 * When a block is moved into an invalid phase, it is disconnected and
 * a warning is displayed on the block.
 */
export function attachPhaseEnforcementListener(
  ws: Blockly.WorkspaceSvg,
  catalog: BlockCatalog,
): void {
  const phaseAllowMap = buildPhaseAllowMap(catalog);

  ws.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.type !== Blockly.Events.BLOCK_MOVE) return;

    const moveEvent = event as Blockly.Events.BlockMove;
    const blockId = moveEvent.blockId;
    if (!blockId) return;

    const block = ws.getBlockById(blockId);
    if (!block) return;

    if (UNRESTRICTED_BLOCK_TYPES.has(block.type)) return;

    const allowedPhases = phaseAllowMap.get(block.type);
    if (!allowedPhases) return;

    const currentPhase = resolvePhaseInput(block);
    if (!currentPhase) return;

    if (allowedPhases.has(currentPhase)) {
      block.setWarningText(null);
      return;
    }

    const phaseLabelMap: Record<PhaseName, string> = {
      SETUP: "Setup",
      STEPS: "Steps",
      TEARDOWN: "Teardown",
    };

    const allowedLabels = [...allowedPhases]
      .map((p) => phaseLabelMap[p])
      .join(", ");

    block.setWarningText(
      `This block belongs in: ${allowedLabels}. ` +
        `It cannot be placed in ${phaseLabelMap[currentPhase]}.`,
    );

    setTimeout(() => {
      if (!block.workspace) return;
      block.unplug(true);
      block.dispose(true);
    }, 0);
  });
}
