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
import { useTestLabStore } from "../../../store/useTestLabStore";
import {
  registerBlocks,
  buildToolbox,
  loadBlockCatalog,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
  cleanupOrphanBlocks,
} from "../config/blockDefinitions";
import { createWorkspaceOptions } from "../config/workspaceConfig";
import { attachModelSyncListener, attachFlyoutListener, attachSelectionListener } from "../sync/workspaceListeners";
import { attachServiceAutoDeclareListener } from "../sync/serviceAutoDeclare";
import { attachPhaseEnforcementListener } from "../sync/phaseEnforcement";
import type { ScriptDefinition, TckDefinition } from "../../../models/schema";
import { isTest, isTck } from "../../../models/schema";

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

  const model = useTestLabStore((s) => s.model);
  const modelKind = model.kind;
  const lastEditSource = useTestLabStore((s) => s.lastEditSource);
  const setModelFromBlocks = useTestLabStore((s) => s.setModelFromBlocks);
  const selectStep = useTestLabStore((s) => s.selectStep);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    (async () => {
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
      populateWorkspaceFromModel(ws, rootBlock, currentModel, catalog);
      cleanupOrphanBlocks(ws, rootBlock);

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

      attachModelSyncListener(ws, catalog, modelKind, setModelFromBlocks, {
        isUpdatingFromStore,
        workspaceRef,
        pendingUpdateRef,
        pendingToolboxRef,
      });
      attachFlyoutListener(ws);
      attachSelectionListener(ws, selectStep);
      attachServiceAutoDeclareListener(ws, catalog);
      attachPhaseEnforcementListener(ws, catalog);

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
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [setModelFromBlocks, modelKind]);

  useEffect(() => {
    if (!ready) return;
    if (lastEditSource !== "yaml" && lastEditSource !== "load") return;
    if (!workspaceRef.current || !catalogRef.current) return;

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
      } else if (isTck(model)) {
        const tc = model as TckDefinition;
        const rootBlock = ws.getBlocksByType("tck_root", false)[0];
        if (rootBlock) {
          rootBlock.setFieldValue(tc.name || "my-tck", "NAME");
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

  return { workspace: ready ? workspaceRef.current : null, catalog: catalogRef.current };
}
