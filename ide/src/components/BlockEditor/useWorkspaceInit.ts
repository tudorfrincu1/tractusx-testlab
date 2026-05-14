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
import { useTestLabStore } from "../../store/useTestLabStore";
import { useProjectStore } from "../../store/useProjectStore";
import {
  registerBlocks,
  buildToolbox,
  loadBlockCatalog,
  workspaceToModel,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
  cleanupOrphanBlocks,
} from "./blockDefinitions";
import { resolveStepIdentifier } from "./blockSelection";
import { setKnownStepTypes } from "../../models/validator";
import { createWorkspaceOptions } from "./workspaceConfig";
import { injectBubbleStyles } from "./bubblePatch";
import type { TestLabDocument } from "../../models/schema";
import { isTest, isTck } from "../../models/schema";
import type { WorkspaceRefs } from "./workspaceTypes";

interface WorkspaceInitResult extends WorkspaceRefs {
  containerRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
}

export function useWorkspaceInit(
  onTrashChangeRef: RefObject<((hasItems: boolean) => void) | undefined>,
): WorkspaceInitResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const catalogRef = useRef<Awaited<ReturnType<typeof loadBlockCatalog>> | null>(null);
  const isUpdatingFromStore = useRef(false);
  const pendingUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingToolboxRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCanvasSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFileKeyRef = useRef<string>(useProjectStore.getState().activeFile?.name ?? "index");
  const initGenerationRef = useRef<number>(useProjectStore.getState().projectGeneration);
  const [ready, setReady] = useState(false);

  const modelKind = useTestLabStore((s) => s.model.kind);
  const setModelFromBlocks = useTestLabStore((s) => s.setModelFromBlocks);
  const selectStep = useTestLabStore((s) => s.selectStep);

  // Reset trash indicator on mount
  useEffect(() => {
    onTrashChangeRef.current?.(false);
  }, [onTrashChangeRef]);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    (async () => {
      const catalog = await loadBlockCatalog();
      if (disposed) return;
      catalogRef.current = catalog;

      setKnownStepTypes(catalog.flatMap((cat) => cat.blocks.map((b) => b.type)));
      registerBlocks(Blockly, catalog);
      const toolbox = buildToolbox(catalog, modelKind) as Blockly.utils.toolbox.ToolboxDefinition;

      const ws = Blockly.inject(containerRef.current!, createWorkspaceOptions(toolbox));

      workspaceRef.current = ws;

      // Inject SVG-internal <style> for dark-theme bubble styling
      const svgEl = ws.getParentSvg();
      if (svgEl) {
        injectBubbleStyles(svgEl);
      }

      // Register "Empty Trash" context menu item
      const EMPTY_TRASH_ID = "emptyTrash";
      if (!Blockly.ContextMenuRegistry.registry.getItem(EMPTY_TRASH_ID)) {
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

      // Override field rect colours
      const renderer = ws.getRenderer();
      const constants = renderer.getConstants();
      constants.FIELD_BORDER_RECT_COLOUR = "transparent";
      constants.FIELD_TEXT_FONTFAMILY = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

      // Suppress change events during initial block creation
      isUpdatingFromStore.current = true;

      // Restore workspace from saved canvas state or build from model
      const activeFile = useProjectStore.getState().activeFile;
      const canvasKey = activeFile?.name ?? "index";
      const savedState = useProjectStore.getState().getWorkspaceState(canvasKey);

      if (savedState && typeof savedState === "object" && Object.keys(savedState).length > 0) {
        Blockly.serialization.workspaces.load(savedState, ws, { recordUndo: false });

        const partial = workspaceToModel(Blockly, ws, catalog);
        if (partial && Object.keys(partial).length > 0) {
          const current = useTestLabStore.getState().model;
          const merged = { ...current } as Record<string, unknown>;
          for (const [key, value] of Object.entries(partial)) {
            if (value === undefined) continue;
            merged[key] = value;
          }
          setModelFromBlocks(merged as unknown as TestLabDocument);
        }
      } else {
        const rootType = modelKind === "tck" ? "tck_root" : "test_root";
        const rootBlock = ws.newBlock(rootType);
        rootBlock.initSvg();
        rootBlock.render();
        rootBlock.moveBy(30, 30);

        const currentModel = useTestLabStore.getState().model;
        if (isTest(currentModel)) {
          rootBlock.setFieldValue(currentModel.name || "my_test", "NAME");
          rootBlock.setFieldValue(currentModel.version || "1.0", "VERSION");
          rootBlock.setFieldValue(currentModel.description || "", "DESCRIPTION");
        } else if (isTck(currentModel)) {
          rootBlock.setFieldValue(currentModel.name || "my-tck", "NAME");
          rootBlock.setFieldValue(currentModel.version || "1.0", "VERSION");
          rootBlock.setFieldValue(currentModel.description || "", "DESCRIPTION");
        }
        try {
          populateWorkspaceFromModel(ws, rootBlock, currentModel, catalog);
          cleanupOrphanBlocks(ws, rootBlock);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[useWorkspaceInit] Failed to populate workspace from model:", err);
        }
      }

      const initialVars = collectWorkspaceVariables(ws, catalog);
      if (initialVars.length > 0) {
        const refreshedToolbox = buildToolbox(
          catalog,
          modelKind,
          initialVars,
        ) as Blockly.utils.toolbox.ToolboxDefinition;
        ws.updateToolbox(refreshedToolbox);
      }

      isUpdatingFromStore.current = false;

      // Close toolbox flyout when trashcan flyout opens (and vice-versa)
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

      // Track trashcan contents for parent UI
      ws.addChangeListener((event: Blockly.Events.Abstract) => {
        if (event.type === Blockly.Events.BLOCK_DELETE || event.type === Blockly.Events.TRASHCAN_OPEN) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const trashContents = (ws.trashcan as any)?.contents as unknown[] | undefined;
          const hasItems = (trashContents?.length ?? 0) > 0;
          onTrashChangeRef.current?.(hasItems);
        }
      });

      // Block selection tracking
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

      setReady(true);
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
      if (pendingCanvasSaveRef.current) {
        clearTimeout(pendingCanvasSaveRef.current);
        pendingCanvasSaveRef.current = null;
      }
      if (workspaceRef.current) {
        const currentGen = useProjectStore.getState().projectGeneration;
        if (currentGen === initGenerationRef.current) {
          try {
            const key = activeFileKeyRef.current;
            const state = Blockly.serialization.workspaces.save(workspaceRef.current);
            const { blocks, variables } = state as Record<string, unknown>;
            useProjectStore.getState().setWorkspaceState(key, { blocks, variables });
          } catch {
            // ignore serialization errors during dispose
          }
        }
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [setModelFromBlocks, modelKind, selectStep, onTrashChangeRef]);

  // Resize observer
  useEffect(() => {
    const ws = workspaceRef.current;
    const container = containerRef.current;
    if (!ws || !container) return;

    const observer = new ResizeObserver(() => {
      Blockly.svgResize(ws);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready]);

  return {
    containerRef,
    workspaceRef,
    catalogRef,
    isUpdatingFromStore,
    pendingUpdateRef,
    pendingToolboxRef,
    pendingCanvasSaveRef,
    activeFileKeyRef,
    initGenerationRef,
    ready,
  };
}
