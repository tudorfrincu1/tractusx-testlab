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

import type * as BlocklyType from "blockly";
import type { BlockCatalog, BlockCatalogEntry } from "../catalog/catalogLoader";

const SPAWN_OUTPUTS_ID = "spawnOutputVariables";

export function registerSpawnOutputsContextMenu(
  Blockly: typeof BlocklyType,
  catalog: BlockCatalog,
): void {
  if (Blockly.ContextMenuRegistry.registry.getItem(SPAWN_OUTPUTS_ID)) return;

  Blockly.ContextMenuRegistry.registry.register({
    id: SPAWN_OUTPUTS_ID,
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    displayText(scope) {
      const entry = findCatalogEntryForBlock(scope.block, catalog);
      if (!entry?.outputs?.length) return "Spawn Outputs";
      const names = entry.outputs.map(o => `@${o.name}`).join(", ");
      return `Spawn Outputs: ${names}`;
    },
    weight: 100,
    preconditionFn(scope) {
      const entry = findCatalogEntryForBlock(scope.block, catalog);
      if (!entry?.outputs?.length) return "hidden";
      return "enabled";
    },
    callback(scope) {
      const block = scope.block;
      if (!block) return;
      const entry = findCatalogEntryForBlock(block, catalog);
      if (!entry?.outputs?.length) return;

      const ws = block.workspace;
      const blockXY = block.getRelativeToSurfaceXY();
      const blockHeight = block.getHeightWidth().height;

      let offsetX = 300;
      for (const output of entry.outputs) {
        const stepId = block.getFieldValue("STEP_ID") || "step";
        const newBlock = ws.newBlock("var_steps");
        newBlock.setFieldValue(`${stepId}.${output.name}`, "VAR_NAME");
        newBlock.initSvg();
        newBlock.render();
        newBlock.moveBy(blockXY.x + offsetX, blockXY.y + blockHeight + 20);
        offsetX += 180;
      }
    },
  });
}

function findCatalogEntryForBlock(
  block: BlocklyType.Block | null,
  catalog: BlockCatalog,
): BlockCatalogEntry | undefined {
  if (!block) return undefined;
  const type = block.type.startsWith("step_") ? block.type.slice(5) : block.type;
  return findEntryByType(catalog, type);
}

function findEntryByType(catalog: BlockCatalog, type: string): BlockCatalogEntry | undefined {
  for (const category of catalog) {
    const found = category.blocks.find(e => e.type === type);
    if (found) return found;
    const shortcutEntry = findInShortcuts(category.shortcuts, type);
    if (shortcutEntry) return shortcutEntry;
  }
  return undefined;
}

function findInShortcuts(
  shortcuts: BlockCatalog[number]["shortcuts"],
  type: string,
): BlockCatalogEntry | undefined {
  if (!shortcuts) return undefined;
  for (const group of shortcuts) {
    const found = group.blocks.find(e => e.type === type);
    if (found) return found;
  }
  return undefined;
}
