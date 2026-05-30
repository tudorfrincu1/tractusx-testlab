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

// Override Blockly's default maxDisplayLength (16 chars) to prevent text truncation on blocks.
Blockly.Field.prototype.maxDisplayLength = Infinity;

import { useEditorStore, useProjectStore } from "@/store";
import {
  registerBlocks,
  buildToolbox,
  loadBlockCatalog,
  collectWorkspaceVariables,
  collectCategorizedVariables,
} from "../config/blockDefinitions";
import { setKnownStepTypes } from "@/services/validation/validator";
import { createWorkspaceOptions } from "../config/workspaceConfig";
import { injectBubbleStyles } from "../fields/wrappedText";
import type { WorkspaceRefs } from "../blocklyWorkspace.types";
import { useWorkspaceFileSwitch } from "./useWorkspaceFileSwitch";
import {
  registerEmptyTrashMenu,
  applyRendererOverrides,
  restoreFromSavedState,
  buildFreshWorkspace,
  clearPendingTimers,
  saveAndDisposeWorkspace,
  registerWorkspaceListeners,
} from "./useWorkspaceInit.helpers";

interface WorkspaceInitResult extends WorkspaceRefs {
  containerRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
}

/** Extract all step type identifiers from the block catalog. */
function extractStepTypes(catalog: Awaited<ReturnType<typeof loadBlockCatalog>>): string[] {
  return catalog.flatMap((cat) => cat.blocks.map((b) => b.type));
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

  const modelKind = useEditorStore((s) => s.model.kind);
  const setModelFromBlocks = useEditorStore((s) => s.setModelFromBlocks);
  const selectStep = useEditorStore((s) => s.selectStep);

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

      setKnownStepTypes(extractStepTypes(catalog));
      registerBlocks(Blockly, catalog);
      const toolbox = buildToolbox(catalog, modelKind) as Blockly.utils.toolbox.ToolboxDefinition;

      const ws = Blockly.inject(containerRef.current!, createWorkspaceOptions(toolbox));

      workspaceRef.current = ws;

      // Inject SVG-internal <style> for dark-theme bubble styling
      const svgEl = ws.getParentSvg();
      if (svgEl) {
        injectBubbleStyles(svgEl);
      }

      registerEmptyTrashMenu();
      applyRendererOverrides(ws);

      // Suppress change events during initial block creation
      isUpdatingFromStore.current = true;

      // Restore workspace from saved canvas state or build from model
      const activeFile = useProjectStore.getState().activeFile;
      const canvasKey = activeFile?.name ?? "index";
      const savedState = useProjectStore.getState().getWorkspaceState(canvasKey);

      if (savedState && typeof savedState === "object" && Object.keys(savedState).length > 0) {
        restoreFromSavedState(ws, savedState as Record<string, unknown>, catalog, setModelFromBlocks);
      } else {
        buildFreshWorkspace(ws, catalog);
      }

      const initialVars = collectWorkspaceVariables(ws, catalog);
      if (initialVars.length > 0) {
        const refreshedToolbox = buildToolbox(
          catalog,
          modelKind,
          collectCategorizedVariables(ws),
        ) as Blockly.utils.toolbox.ToolboxDefinition;
        ws.updateToolbox(refreshedToolbox);
      }

      isUpdatingFromStore.current = false;

      registerWorkspaceListeners(ws, selectStep, onTrashChangeRef);

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
    })();

    return () => {
      disposed = true;
      setReady(false);
      clearPendingTimers(pendingUpdateRef, pendingToolboxRef, pendingCanvasSaveRef);
      if (workspaceRef.current) {
        saveAndDisposeWorkspace(workspaceRef, activeFileKeyRef, initGenerationRef);
      }
    };
  }, [setModelFromBlocks, modelKind, selectStep, onTrashChangeRef]);

  // Swap workspace content in-place when active file changes (no remount)
  useWorkspaceFileSwitch(
    { workspaceRef, catalogRef, isUpdatingFromStore, activeFileKeyRef },
    ready,
    modelKind,
  );

  // Resize observer
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
