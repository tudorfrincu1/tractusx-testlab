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

import type { RefObject } from "react";
import * as Blockly from "blockly";
import type { BlocklyTrashcanInternal } from "@/shared/types/blockly-internals";

import { useEditorStore, useProjectStore } from "@/store";
import {
  loadBlockCatalog,
  workspaceToModel,
  populateWorkspaceFromModel,
  cleanupOrphanBlocks,
} from "../config/blockDefinitions";
import { resolveStepIdentifier } from "../sync/blockSelection";
import type { TestLabDocument } from "@/models/schema";
import { isTest } from "@/models/schema";

export type BlockCatalogLoaded = Awaited<ReturnType<typeof loadBlockCatalog>>;

/** Register the "Empty Trash" context menu item (idempotent). */
export function registerEmptyTrashMenu() {
  const EMPTY_TRASH_ID = "emptyTrash";
  if (Blockly.ContextMenuRegistry.registry.getItem(EMPTY_TRASH_ID)) return;
  Blockly.ContextMenuRegistry.registry.register({
    id: EMPTY_TRASH_ID,
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    displayText: "Empty Trash",
    weight: 200,
    preconditionFn: () => "enabled",
    callback: (scope) => {
      scope.workspace?.trashcan?.emptyContents();
    },
  });
}

/** Customize renderer constants for the workspace. */
export function applyRendererOverrides(ws: Blockly.WorkspaceSvg) {
  const renderer = ws.getRenderer();
  const constants = renderer.getConstants();
  constants.FIELD_BORDER_RECT_COLOUR = "transparent";
  constants.FIELD_TEXT_FONTFAMILY = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
}

/** Restore workspace from a serialized canvas state. */
export function restoreFromSavedState(
  ws: Blockly.WorkspaceSvg,
  savedState: Record<string, unknown>,
  catalog: BlockCatalogLoaded,
  setModelFromBlocks: (model: TestLabDocument) => void,
) {
  Blockly.serialization.workspaces.load(savedState, ws, { recordUndo: false });
  const partial = workspaceToModel(Blockly, ws, catalog);
  if (!partial || Object.keys(partial).length === 0) return;
  const current = useEditorStore.getState().model;
  const merged = { ...current } as Record<string, unknown>;
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) merged[key] = value;
  }
  setModelFromBlocks(merged as unknown as TestLabDocument);
}

/** Build a fresh workspace from the current model. */
export function buildFreshWorkspace(
  ws: Blockly.WorkspaceSvg,
  catalog: BlockCatalogLoaded,
) {
  const rootBlock = ws.newBlock("test_root");
  rootBlock.initSvg();
  rootBlock.render();
  rootBlock.moveBy(30, 30);
  const currentModel = useEditorStore.getState().model;
  if (isTest(currentModel)) {
    rootBlock.setFieldValue(currentModel.name || "my_test", "NAME");
    rootBlock.setFieldValue(currentModel.version || "1.0", "VERSION");
    rootBlock.setFieldValue(currentModel.description || "", "DESCRIPTION");
  }
  try {
    populateWorkspaceFromModel(ws, rootBlock, currentModel, catalog);
    cleanupOrphanBlocks(ws, rootBlock);
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[useWorkspaceInit] Failed to populate workspace from model:", err);
  }
}

/** Clear all pending debounce timers. */
export function clearPendingTimers(
  ...refs: RefObject<ReturnType<typeof setTimeout> | null>[]
) {
  for (const ref of refs) {
    if (ref.current) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  }
}

/** Save workspace state and dispose it. */
export function saveAndDisposeWorkspace(
  workspaceRef: RefObject<Blockly.WorkspaceSvg | null>,
  activeFileKeyRef: RefObject<string>,
  initGenerationRef: RefObject<number>,
) {
  const ws = workspaceRef.current;
  if (!ws) return;
  const currentGen = useProjectStore.getState().projectGeneration;
  if (currentGen === initGenerationRef.current) {
    try {
      const key = activeFileKeyRef.current;
      const state = Blockly.serialization.workspaces.save(ws);
      const { blocks, variables } = state as Record<string, unknown>;
      useProjectStore.getState().setWorkspaceState(key, { blocks, variables });
    } catch {
      // ignore serialization errors during dispose
    }
  }
  ws.dispose();
  workspaceRef.current = null;
}

/** Register workspace change listeners for flyout coordination and trash tracking. */
export function registerWorkspaceListeners(
  ws: Blockly.WorkspaceSvg,
  selectStep: (id: string | null) => void,
  onTrashChangeRef: RefObject<((hasItems: boolean) => void) | undefined>,
) {
  ws.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.type === Blockly.Events.TRASHCAN_OPEN) {
      const trashEvent = event as Blockly.Events.TrashcanOpen;
      if (trashEvent.isOpen) {
        const toolbox = ws.getToolbox() as Blockly.Toolbox | null;
        toolbox?.clearSelection();
      }
    }
    if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
      ws.trashcan?.closeFlyout();
    }
  });

  ws.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.type === Blockly.Events.BLOCK_DELETE || event.type === Blockly.Events.TRASHCAN_OPEN) {
      const trashContents = (ws.trashcan as unknown as BlocklyTrashcanInternal | undefined)?.contents;
      const hasItems = (trashContents?.length ?? 0) > 0;
      onTrashChangeRef.current?.(hasItems);
    }
  });

  ws.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.type !== Blockly.Events.SELECTED) return;
    const selected = event as Blockly.Events.Selected;
    if (!selected.newElementId) {
      selectStep(null);
      return;
    }
    const block = ws.getBlockById(selected.newElementId);
    selectStep(block ? resolveStepIdentifier(block) : null);
  });
}
