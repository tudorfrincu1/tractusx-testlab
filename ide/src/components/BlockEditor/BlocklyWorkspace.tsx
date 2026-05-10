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

import { useRef, useEffect, useState } from "react";
import * as Blockly from "blockly";
import { useTestLabStore } from "../../store/useTestLabStore";
import { useProjectStore } from "../../store/useProjectStore";
import { useServiceStore } from "../../store/useServiceStore";
import {
  registerBlocks,
  buildToolbox,
  loadBlockCatalog,
  workspaceToModel,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
  cleanupOrphanBlocks,
} from "./blockDefinitions";
import { resolveStepName } from "./blockSelection";
import { setKnownStepTypes } from "../../models/validator";
import type { ScriptDefinition, TestLabDocument, TestCaseDefinition } from "../../models/schema";
import { isTest, isTestCase } from "../../models/schema";

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

interface BlocklyWorkspaceProps {
  onTrashChange?: (hasItems: boolean) => void;
}

export function BlocklyWorkspace({ onTrashChange }: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const catalogRef = useRef<Awaited<ReturnType<typeof loadBlockCatalog>> | null>(null);
  const isUpdatingFromStore = useRef(false);
  const pendingUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingToolboxRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCanvasSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTrashChangeRef = useRef(onTrashChange);
  onTrashChangeRef.current = onTrashChange;
  const [ready, setReady] = useState(false);

  const model = useTestLabStore((s) => s.model);
  const modelKind = model.kind;
  const lastEditSource = useTestLabStore((s) => s.lastEditSource);
  const setModelFromBlocks = useTestLabStore((s) => s.setModelFromBlocks);
  const selectStep = useTestLabStore((s) => s.selectStep);
  const activeFile = useProjectStore((s) => s.activeFile);
  const activeFileKeyRef = useRef<string>(activeFile?.name ?? "index");
  const initGenerationRef = useRef<number>(useProjectStore.getState().projectGeneration);

  // Reset trash indicator when this workspace mounts (new key = new workspace)
  useEffect(() => {
    onTrashChangeRef.current?.(false);
  }, []);

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

      const ws = Blockly.inject(containerRef.current!, {
        toolbox,
        trashcan: true,
        grid: { spacing: 20, length: 1, colour: "#2a2a2a", snap: true },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.85,
          maxScale: 2.5,
          minScale: 0.15,
        },
        move: { scrollbars: true, drag: true, wheel: true },
        renderer: "zelos",
        theme: Blockly.Theme.defineTheme("tractusXDark", {
          name: "tractusXDark",
          base: Blockly.Themes.Classic,
          blockStyles: {
            logic_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
            loop_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
            math_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
            text_blocks: { colourPrimary: "#334155", colourSecondary: "#475569", colourTertiary: "#1E293B" },
            list_blocks: { colourPrimary: "#2D3748", colourSecondary: "#374151", colourTertiary: "#1F2937" },
            variable_blocks: { colourPrimary: "#4338CA", colourSecondary: "#4F46E5", colourTertiary: "#3730A3" },
            procedure_blocks: { colourPrimary: "#1E40AF", colourSecondary: "#2563EB", colourTertiary: "#1E3A8A" },
          },
          categoryStyles: {
            logic_category: { colour: "#2D3748" },
            loop_category: { colour: "#2D3748" },
            math_category: { colour: "#2D3748" },
            text_category: { colour: "#334155" },
            list_category: { colour: "#2D3748" },
            variable_category: { colour: "#4338CA" },
            procedure_category: { colour: "#1E40AF" },
          },
          fontStyle: {
            family: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            weight: "500",
            size: 11,
          },
          componentStyles: {
            workspaceBackgroundColour: "#141414",
            toolboxBackgroundColour: "#1a1a1a",
            toolboxForegroundColour: "#9CA3AF",
            flyoutBackgroundColour: "#111111",
            flyoutForegroundColour: "#9CA3AF",
            flyoutOpacity: 0.98,
            scrollbarColour: "#333333",
            scrollbarOpacity: 0.3,
            insertionMarkerColour: "#FFD700",
            insertionMarkerOpacity: 0.35,
            cursorColour: "#FFD700",
          },
          startHats: true,
        }),
        sounds: false,
      });

      workspaceRef.current = ws;

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

      // Override field rect colours — Blockly applies these as inline SVG attributes
      const renderer = ws.getRenderer();
      const constants = renderer.getConstants();
      constants.FIELD_BORDER_RECT_COLOUR = "transparent";
      constants.FIELD_TEXT_FONTFAMILY = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

      // Suppress change events during initial block creation
      isUpdatingFromStore.current = true;

      // Try to restore workspace from saved canvas state
      const activeFile = useProjectStore.getState().activeFile;
      const canvasKey = activeFile?.name ?? "index";
      const savedState = useProjectStore.getState().getWorkspaceState(canvasKey);

      if (savedState && typeof savedState === "object" && Object.keys(savedState).length > 0) {
        // Restore full workspace state (includes positions, detached blocks)
        Blockly.serialization.workspaces.load(savedState, ws, { recordUndo: false });

        // Sync model FROM canvas so the model matches the restored state.
        // This sets lastEditSource to "blocks", preventing the model sync
        // effect from overwriting the canvas with stale model data.
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
        // No saved state — build from model
        const rootType = modelKind === "test-case" ? "test_case_root" : "test_root";
        const rootBlock = ws.newBlock(rootType);
        rootBlock.initSvg();
        rootBlock.render();
        rootBlock.moveBy(30, 30);

        const currentModel = useTestLabStore.getState().model;
        if (isTest(currentModel)) {
          rootBlock.setFieldValue(currentModel.name || "my_test", "NAME");
          rootBlock.setFieldValue(currentModel.version || "1.0", "VERSION");
          rootBlock.setFieldValue(currentModel.description || "", "DESCRIPTION");
        } else if (isTestCase(currentModel)) {
          rootBlock.setFieldValue(currentModel.name || "my-test-case", "NAME");
          rootBlock.setFieldValue(currentModel.version || "1.0", "VERSION");
          rootBlock.setFieldValue(currentModel.description || "", "DESCRIPTION");
        }
        populateWorkspaceFromModel(ws, rootBlock, currentModel, catalog);
        cleanupOrphanBlocks(ws, rootBlock);
      }

      const initialVars = collectWorkspaceVariables(ws);
      if (initialVars.length > 0) {
        const refreshedToolbox = buildToolbox(
          catalog,
          modelKind,
          initialVars
        ) as Blockly.utils.toolbox.ToolboxDefinition;
        ws.updateToolbox(refreshedToolbox);
      }

      isUpdatingFromStore.current = false;

      /** Flush the workspace→model sync immediately. */
      const flushModelUpdate = () => {
        if (!workspaceRef.current) return;
        // Don't overwrite a model that was just loaded (prevents race with debounced updates)
        if (useTestLabStore.getState().lastEditSource === "load") return;
        try {
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
        } catch {
          // Block tree may be in transient state during drag/deletion
        }
      };
      // Store ref so unmount can call it
      (workspaceRef as unknown as Record<string, unknown>)._flushModel = flushModelUpdate;

      let lastVarSnapshot = "";
      ws.addChangeListener((event: Blockly.Events.Abstract) => {
        if (isUpdatingFromStore.current) return;
        const isStructural =
          event.type === Blockly.Events.BLOCK_DELETE ||
          event.type === Blockly.Events.BLOCK_CREATE;
        if (
          event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_MOVE ||
          isStructural
        ) {
          if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
          pendingUpdateRef.current = setTimeout(() => {
            pendingUpdateRef.current = null;
            flushModelUpdate();
          }, 150);

          // Save canvas state (block positions + detached blocks) with debounce
          if (pendingCanvasSaveRef.current) clearTimeout(pendingCanvasSaveRef.current);
          pendingCanvasSaveRef.current = setTimeout(() => {
            pendingCanvasSaveRef.current = null;
            if (!workspaceRef.current) return;
            try {
              const key = activeFileKeyRef.current;
              const state = Blockly.serialization.workspaces.save(ws);
              // Strip trashcan data so emptied trash stays empty
              const { blocks, variables } = state as Record<string, unknown>;
              useProjectStore.getState().setWorkspaceState(key, { blocks, variables });
            } catch {
              // Serialization can fail during transient states
            }
          }, 500);

          // Only refresh the toolbox on structural changes (create/delete),
          // deferred further to avoid corrupting Blockly's connectionDB
          // while it is still processing internal connection moves.
          if (isStructural) {
            if (pendingToolboxRef.current) clearTimeout(pendingToolboxRef.current);
            pendingToolboxRef.current = setTimeout(() => {
              pendingToolboxRef.current = null;
              if (!workspaceRef.current) return;
              try {
                const currentVars = collectWorkspaceVariables(ws);
                const varSnapshot = JSON.stringify(currentVars);
                if (varSnapshot !== lastVarSnapshot) {
                  lastVarSnapshot = varSnapshot;
                  const newToolbox = buildToolbox(
                    catalog,
                    modelKind,
                    currentVars
                  ) as Blockly.utils.toolbox.ToolboxDefinition;
                  ws.updateToolbox(newToolbox);
                }
              } catch {
                // Toolbox refresh can fail during workspace dispose
              }
            }, 300);
          }
        }
      });

      // Close toolbox flyout when trashcan flyout opens (and vice-versa)
      // to prevent overlapping flyouts.
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

      ws.addChangeListener((event: Blockly.Events.Abstract) => {
        if (event.type !== Blockly.Events.SELECTED) return;
        const selected = event as Blockly.Events.Selected;
        if (!selected.newElementId) {
          selectStep(null);
          return;
        }
        const block = ws.getBlockById(selected.newElementId);
        selectStep(block ? resolveStepName(block) : null);
      });

      setReady(true);
    })();

    return () => {
      disposed = true;
      setReady(false);
      // Cancel pending timers — do NOT flush model update, as the active file
      // may have already changed and flushing would corrupt the new file's data
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
      // Save canvas state under the file name captured at init time,
      // but only if the project hasn't been replaced (e.g., by loading an example)
      if (workspaceRef.current) {
        const currentGen = useProjectStore.getState().projectGeneration;
        if (currentGen === initGenerationRef.current) {
          try {
            const key = activeFileKeyRef.current;
            const state = Blockly.serialization.workspaces.save(workspaceRef.current);
            // Strip trashcan data so emptied trash stays empty
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
  }, [setModelFromBlocks, modelKind]);

  // Handle file switches: save old workspace state before the sync effect updates blocks
  useEffect(() => {
    const newKey = activeFile?.name ?? "index";
    if (activeFileKeyRef.current === newKey) return;

    // Cancel pending timers to prevent stale writes under wrong file name
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }
    if (pendingCanvasSaveRef.current) {
      clearTimeout(pendingCanvasSaveRef.current);
      pendingCanvasSaveRef.current = null;
    }
    if (pendingToolboxRef.current) {
      clearTimeout(pendingToolboxRef.current);
      pendingToolboxRef.current = null;
    }

    // Save current workspace state under the OLD file key,
    // but only if the project hasn't been replaced
    if (workspaceRef.current && ready) {
      const currentGen = useProjectStore.getState().projectGeneration;
      if (currentGen === initGenerationRef.current) {
        try {
          const state = Blockly.serialization.workspaces.save(workspaceRef.current);
          const { blocks, variables } = state as Record<string, unknown>;
          useProjectStore.getState().setWorkspaceState(activeFileKeyRef.current, { blocks, variables });
        } catch {
          // ignore serialization errors during file switch
        }
      }
    }

    activeFileKeyRef.current = newKey;
  }, [activeFile, ready]);

  useEffect(() => {
    if (!ready) return;
    if (lastEditSource !== "yaml" && lastEditSource !== "load") return;
    if (!workspaceRef.current || !catalogRef.current) return;

    // Cancel any pending Blockly→Model update to prevent stale overwrites
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }

    const ws = workspaceRef.current;
    const catalog = catalogRef.current;
    isUpdatingFromStore.current = true;

    try {
      if (isTest(model)) {
        const script = model as ScriptDefinition;
        const rootBlock = ws.getBlocksByType("test_root", false)[0];
        if (rootBlock) {
          rootBlock.setFieldValue(script.name || "my_test", "NAME");
          rootBlock.setFieldValue(script.version || "1.0", "VERSION");
          rootBlock.setFieldValue(script.description || "", "DESCRIPTION");

          for (const input of ["SETUP", "STEPS", "TEARDOWN"]) {
            disposeStatementChain(rootBlock, input);
          }
          populateWorkspaceFromModel(ws, rootBlock, model, catalog);
        }
      } else if (isTestCase(model)) {
        const tc = model as TestCaseDefinition;
        const rootBlock = ws.getBlocksByType("test_case_root", false)[0];
        if (rootBlock) {
          rootBlock.setFieldValue(tc.name || "my-test-case", "NAME");
          rootBlock.setFieldValue(tc.version || "1.0", "VERSION");
          rootBlock.setFieldValue(tc.description || "", "DESCRIPTION");

          for (const input of ["VARIABLES", "PRECONDITIONS", "TESTS"]) {
            disposeStatementChain(rootBlock, input);
          }
          populateWorkspaceFromModel(ws, rootBlock, model, catalog);
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug("[BlocklyWorkspace] sync from model failed:", err);
      }
    }

    isUpdatingFromStore.current = false;
  }, [model, lastEditSource, ready]);

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

  // Refresh toolbox when configured services change
  useEffect(() => {
    if (!ready) return;
    const unsubscribe = useServiceStore.subscribe((state, prev) => {
      if (state.services === prev.services) return;
      const ws = workspaceRef.current;
      const catalog = catalogRef.current;
      if (!ws || !catalog) return;
      // Defer to next frame to ensure store state is fully committed
      requestAnimationFrame(() => {
        if (!workspaceRef.current) return;
        try {
          const currentVars = collectWorkspaceVariables(ws);
          const newToolbox = buildToolbox(
            catalog,
            modelKind,
            currentVars
          ) as Blockly.utils.toolbox.ToolboxDefinition;
          ws.updateToolbox(newToolbox);
        } catch {
          // Toolbox refresh can fail during workspace dispose
        }
      });
    });
    return unsubscribe;
  }, [ready, modelKind]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#141414",
      }}
    />
  );
}
