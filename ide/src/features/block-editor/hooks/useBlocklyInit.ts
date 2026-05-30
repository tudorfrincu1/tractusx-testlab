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

import { useEffect, type Dispatch, type SetStateAction } from "react";
import * as Blockly from "blockly";
// Override Blockly's default maxDisplayLength (16 chars) to fit the flyout width.
// Using Infinity or large values (60+) breaks the flyout — blocks become wider than
// the flyout container, causing rendering failures and clipping.
Blockly.Field.prototype.maxDisplayLength = 30;

import { useEditorStore } from "@/store";
import {
  registerBlocks,
  buildToolbox,
  loadBlockCatalog,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
  collectCategorizedVariables,
  cleanupOrphanBlocks,
} from "../config/blockDefinitions";
import { registerSpawnOutputsContextMenu } from "../blocks/common/contextMenu/spawnOutputsMenu";
import { attachOutputVariableBlocks } from "../blocks/common/outputDispenser";
import { createWorkspaceOptions } from "../config/workspaceConfig";
import { attachModelSyncListener, attachFlyoutListener, attachSelectionListener } from "../sync/workspaceListeners";
import { attachPhaseEnforcementListener } from "../sync/phaseEnforcement";
import { isTest } from "@/models/schema";
import type { BlocklyWorkspaceRefs } from "./blocklyWorkspaceRefs";

interface UseBlocklyInitParams {
  refs: BlocklyWorkspaceRefs;
  modelKind: string;
  setModelFromBlocks: ReturnType<typeof useEditorStore.getState>["setModelFromBlocks"];
  selectStep: ReturnType<typeof useEditorStore.getState>["selectStep"];
  setReady: Dispatch<SetStateAction<boolean>>;
}

/**
 * Bootstraps the Blockly workspace: loads the block catalog, registers blocks,
 * injects the workspace, populates it from the current model, attaches all
 * listeners, and flips `ready` to true. Disposes the workspace on cleanup.
 *
 * Re-runs when the model kind or the store's `setModelFromBlocks` changes,
 * matching the original single-hook behavior exactly.
 */
export function useBlocklyInit({
  refs,
  modelKind,
  setModelFromBlocks,
  selectStep,
  setReady,
}: UseBlocklyInitParams) {
  const {
    containerRef,
    workspaceRef,
    catalogRef,
    isUpdatingFromStore,
    pendingUpdateRef,
    pendingToolboxRef,
  } = refs;

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    (async () => {
      try {
      const catalog = await loadBlockCatalog();
      if (disposed) return;
      catalogRef.current = catalog;

      registerBlocks(Blockly, catalog);
      const toolbox = buildToolbox(catalog, modelKind) as Blockly.utils.toolbox.ToolboxDefinition;

      const ws = Blockly.inject(
        containerRef.current!,
        createWorkspaceOptions(toolbox),
      );

      workspaceRef.current = ws;
      // DEBUG: expose workspace for connection testing
      (window as unknown as Record<string, unknown>).__debugWs = ws;

      // Register "Empty Trash" context menu item
      const EMPTY_TRASH_ID = "emptyTrash";
      if (!Blockly.ContextMenuRegistry.registry.getItem(EMPTY_TRASH_ID)) {
        Blockly.ContextMenuRegistry.registry.register({
          id: EMPTY_TRASH_ID,
          scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
          displayText: "Empty Trash",
          weight: 200,
          preconditionFn: () => {
            return "enabled";
          },
          callback: (scope) => {
            scope.workspace?.trashcan?.emptyContents();
          },
        });
      }

      registerSpawnOutputsContextMenu(Blockly, catalog);

      // Override field rect colours — Blockly applies these as inline SVG attributes
      const renderer = ws.getRenderer();
      const constants = renderer.getConstants();
      constants.FIELD_BORDER_RECT_COLOUR = "transparent";
      constants.FIELD_TEXT_FONTFAMILY = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

      // Suppress change events during initial block creation
      isUpdatingFromStore.current = true;

      const rootType = "test_root";
      const rootBlock = ws.newBlock(rootType);
      rootBlock.initSvg();
      rootBlock.render();
      rootBlock.moveBy(30, 30);

      const currentModel = useEditorStore.getState().model;
      if (isTest(currentModel)) {
        rootBlock.setFieldValue(currentModel.name || "my_test", "NAME");
        rootBlock.setFieldValue(currentModel.version || "1.0", "VERSION");
        rootBlock.setFieldValue(currentModel.description || "", "DESCRIPTION");
      }
      populateWorkspaceFromModel(ws, rootBlock, currentModel, catalog);
      cleanupOrphanBlocks(ws, rootBlock);

      const initialVars = collectWorkspaceVariables(ws);
      if (initialVars.length > 0) {
        const refreshedToolbox = buildToolbox(
          catalog,
          modelKind,
          collectCategorizedVariables(ws)
        ) as Blockly.utils.toolbox.ToolboxDefinition;
        ws.updateToolbox(refreshedToolbox);
      }

      isUpdatingFromStore.current = false;

      attachOutputVariableBlocks(Blockly, ws);

      attachModelSyncListener(ws, catalog, modelKind, setModelFromBlocks, {
        isUpdatingFromStore,
        workspaceRef,
        pendingUpdateRef,
        pendingToolboxRef,
      });
      attachFlyoutListener(ws);
      attachSelectionListener(ws, selectStep);
      attachPhaseEnforcementListener(ws, catalog);

      // Force Blockly to recalculate dimensions after inject.
      // The async catalog load means the container may have settled its layout
      // before inject ran, so Blockly's initial metrics can be stale.
      Blockly.svgResize(ws);
      requestAnimationFrame(() => {
        if (!disposed && workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      });
      setReady(true);
      } catch (err: unknown) {
        if (import.meta.env.DEV) console.error("[BlocklyWorkspace] Initialization failed:", err);
        setReady(false);
      }
    })();

    return () => {
      disposed = true;
      setReady(false);
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
      if (pendingToolboxRef.current) {
        clearTimeout(pendingToolboxRef.current);
        pendingToolboxRef.current = null;
      }
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setModelFromBlocks, modelKind]);
}
