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

import { useRef, useEffect, useState, type RefObject } from "react";
import * as Blockly from "blockly";
// Override Blockly's default maxDisplayLength (16 chars) to fit the flyout width.
// Using Infinity or large values (60+) breaks the flyout — blocks become wider than
// the flyout container, causing rendering failures and clipping.
Blockly.Field.prototype.maxDisplayLength = 30;

import { useEditorStore } from "@/store/editor/useEditorStore";
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
import { useUiStore } from "@/store";

/** Dispose every block chained to a statement input on `root`. */
function disposeStatementChain(root: Blockly.Block, inputName: string) {
  const conn = root.getInput(inputName)?.connection;
  if (!conn) return;
  let child = conn.targetBlock();
  while (child) {
    const next = child.getNextBlock();
    child.dispose(true);
    child = next;
  }
}

export function useBlocklyWorkspace(containerRef: RefObject<HTMLDivElement | null>) {
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const catalogRef = useRef<Awaited<ReturnType<typeof loadBlockCatalog>> | null>(null);
  const isUpdatingFromStore = useRef(false);
  const pendingUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingToolboxRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);

  const modelKind = useEditorStore((s) => s.model.kind);
  const setModelFromBlocks = useEditorStore((s) => s.setModelFromBlocks);
  const selectStep = useEditorStore((s) => s.selectStep);

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
        console.error("[BlocklyWorkspace] Initialization failed:", err);
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
  }, [setModelFromBlocks, modelKind]);

  // Model→workspace sync: subscribe directly to store changes (synchronous)
  // This prevents debounced workspace listeners from overwriting lastEditSource
  useEffect(() => {
    if (!ready) return;

    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      const ws = workspaceRef.current;
      const catalog = catalogRef.current;
      if (!ws || !catalog) return;

      const sourceChanged = state.lastEditSource !== prevState.lastEditSource;
      const modelChanged = state.model !== prevState.model;

      const isLoad = state.lastEditSource === "load" && (sourceChanged || modelChanged);
      const isYaml = state.lastEditSource === "yaml" && modelChanged;
      const loadingTokenForSync = isLoad
        ? useUiStore.getState().shiftHydrationCompletionToken()
        : null;
      if (!isLoad && !isYaml) return;

      // Cancel pending debounced timers FIRST to prevent interference
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
      if (pendingToolboxRef.current) {
        clearTimeout(pendingToolboxRef.current);
        pendingToolboxRef.current = null;
      }

      isUpdatingFromStore.current = true;
      Blockly.Events.disable();

      try {
        if (isLoad) {
          // Full rebuild: clear everything and recreate from model (file switch)
          ws.clear();
          const rootBlock = ws.newBlock("test_root");
          rootBlock.initSvg();
          rootBlock.render();
          rootBlock.moveBy(30, 30);

          if (isTest(state.model)) {
            rootBlock.setFieldValue(state.model.name || "my_test", "NAME");
            rootBlock.setFieldValue(state.model.version || "1.0", "VERSION");
            rootBlock.setFieldValue(state.model.description || "", "DESCRIPTION");
          }
          populateWorkspaceFromModel(ws, rootBlock, state.model, catalog);
          cleanupOrphanBlocks(ws, rootBlock);

          // Refresh toolbox with new file's variables
          const vars = collectWorkspaceVariables(ws);
          if (vars.length > 0) {
            const refreshedToolbox = buildToolbox(catalog, modelKind, collectCategorizedVariables(ws)) as Blockly.utils.toolbox.ToolboxDefinition;
            ws.updateToolbox(refreshedToolbox);
          }
        } else if (isTest(state.model)) {
          // Incremental update: replace step chains in-place (YAML edit)
          const rootBlock = ws.getBlocksByType("test_root", false)[0];
          if (rootBlock) {
            rootBlock.setFieldValue(state.model.name || "my_test", "NAME");
            rootBlock.setFieldValue(state.model.version || "1.0", "VERSION");
            rootBlock.setFieldValue(state.model.description || "", "DESCRIPTION");
            for (const input of ["SETUP", "STEPS", "TEARDOWN"]) {
              disposeStatementChain(rootBlock, input);
            }
            populateWorkspaceFromModel(ws, rootBlock, state.model, catalog);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[useBlocklyWorkspace] Failed to sync model to workspace:", err);
      } finally {
        Blockly.Events.enable();
        isUpdatingFromStore.current = false;

        if (loadingTokenForSync) {
          requestAnimationFrame(() => {
            useUiStore.getState().finishGlobalLoading(loadingTokenForSync);
          });
        }
      }
    });

    return unsubscribe;
  }, [ready, modelKind]);

  useEffect(() => {
    const ws = workspaceRef.current;
    const container = containerRef.current;
    if (!ws || !container) return;

    // Immediate resize to catch cases where the container already has its
    // final dimensions (ResizeObserver only fires on subsequent changes).
    Blockly.svgResize(ws);

    const observer = new ResizeObserver(() => {
      Blockly.svgResize(ws);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready]);

  return { workspace: ready ? workspaceRef.current : null, catalog: catalogRef.current, ready };
}
