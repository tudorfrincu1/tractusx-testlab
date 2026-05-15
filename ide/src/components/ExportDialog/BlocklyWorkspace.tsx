/********************************************************************************
 * Eclipse Tractus-X — TestLab IDE
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 Catena-X Automotive Network e.V.
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0
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

import { useRef, useEffect, useState } from "react";
import * as Blockly from "blockly";
import { useTestLabStore } from "../../store/useTestLabStore";
import { theme } from "../../theme/tractusxTheme";
import {
  registerBlocks,
  buildToolbox,
  loadBlockCatalog,
  workspaceToModel,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
} from "../BlockEditor/config/blockDefinitions";
import type { ScriptDefinition, TestLabDocument, TckDefinition } from "../../models/schema";
import { isTest, isTck } from "../../models/schema";

export function BlocklyWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const catalogRef = useRef<Awaited<ReturnType<typeof loadBlockCatalog>> | null>(null);
  const isUpdatingFromStore = useRef(false);
  const [ready, setReady] = useState(false);

  const model = useTestLabStore((s) => s.model);
  const modelKind = model.kind;
  const lastEditSource = useTestLabStore((s) => s.lastEditSource);
  const setModelFromBlocks = useTestLabStore((s) => s.setModelFromBlocks);

  // Init Blockly workspace
  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    (async () => {
      const catalog = await loadBlockCatalog();
      if (disposed) return;
      catalogRef.current = catalog;

      registerBlocks(Blockly, catalog);
      const toolbox = buildToolbox(catalog, modelKind) as Blockly.utils.toolbox.ToolboxDefinition;

      const ws = Blockly.inject(containerRef.current!, {
        toolbox,
        grid: { spacing: 24, length: 2, colour: "#383838", snap: true },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.9,
          maxScale: 3,
          minScale: 0.2,
        },
        move: { scrollbars: true, drag: true, wheel: true },
        renderer: "zelos",
        theme: Blockly.Theme.defineTheme("tractusXDark", {
          name: "tractusXDark",
          base: Blockly.Themes.Classic,
          blockStyles: {
            logic_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
            loop_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
            math_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
            text_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
            list_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
            variable_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
            procedure_blocks: { colourPrimary: "#37474F", colourSecondary: "#455A64", colourTertiary: "#546E7A" },
          },
          categoryStyles: {
            logic_category: { colour: "#455A64" },
            loop_category: { colour: "#455A64" },
            math_category: { colour: "#455A64" },
            text_category: { colour: "#455A64" },
            list_category: { colour: "#455A64" },
            variable_category: { colour: "#455A64" },
            procedure_category: { colour: "#455A64" },
          },
          fontStyle: {
            family: "Inter, system-ui, -apple-system, sans-serif",
            weight: "500",
            size: 11,
          },
          componentStyles: {
            workspaceBackgroundColour: "#1e1e1e",
            toolboxBackgroundColour: "#252525",
            toolboxForegroundColour: "#b0b0b0",
            flyoutBackgroundColour: "#1a1a1a",
            flyoutForegroundColour: "#b0b0b0",
            flyoutOpacity: 0.95,
            scrollbarColour: "#3a3a3a",
            scrollbarOpacity: 0.4,
            insertionMarkerColour: "#FFD700",
            insertionMarkerOpacity: 0.4,
            cursorColour: "#FFD700",
          },
          startHats: true,
        }),
        sounds: false,
      });

      workspaceRef.current = ws;

      // Suppress change events during initial block creation
      isUpdatingFromStore.current = true;

      // Create root block based on kind
      const rootType = modelKind === "tck" ? "tck_root" : "test_root";
      const rootBlock = ws.newBlock(rootType);
      rootBlock.initSvg();
      rootBlock.render();
      rootBlock.moveBy(30, 30);

      // Sync initial values from store and populate child blocks
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

      // Initial toolbox refresh with defined variables
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

      // Listen for workspace changes
      let lastVarSnapshot = "";
      ws.addChangeListener((event: Blockly.Events.Abstract) => {
        if (isUpdatingFromStore.current) return;
        if (
          event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_MOVE ||
          event.type === Blockly.Events.BLOCK_DELETE ||
          event.type === Blockly.Events.BLOCK_CREATE
        ) {
          const partial = workspaceToModel(Blockly, ws, catalog);
          if (partial && Object.keys(partial).length > 0) {
            // Merge partial block output with the current store model,
            // preserving existing arrays if blocks didn't produce any
            const current = useTestLabStore.getState().model;
            const merged = { ...current } as Record<string, unknown>;
            for (const [key, value] of Object.entries(partial)) {
              // Only overwrite arrays if the partial has actual content
              if (Array.isArray(value) && value.length === 0) continue;
              if (value === undefined) continue;
              merged[key] = value;
            }
            setModelFromBlocks(merged as unknown as TestLabDocument);
          }

          // Dynamic toolbox refresh — Scratch-like: update Variables category
          // when store_output or variable_def blocks change
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
        }
      });

      setReady(true);
    })();

    return () => {
      disposed = true;
      setReady(false);
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [setModelFromBlocks, modelKind]);

  // Sync workspace from store when model is updated externally
  useEffect(() => {
    if (!ready) return;
    if (lastEditSource === "blocks") return;
    if (!workspaceRef.current || !catalogRef.current) return;

    const ws = workspaceRef.current;
    const catalog = catalogRef.current;
    isUpdatingFromStore.current = true;

    if (isTest(model)) {
      const script = model as ScriptDefinition;
      const rootBlock = ws.getBlocksByType("test_root", false)[0];
      if (rootBlock) {
        rootBlock.setFieldValue(script.name || "my_test", "NAME");
        rootBlock.setFieldValue(script.version || "1.0", "VERSION");
        rootBlock.setFieldValue(script.description || "", "DESCRIPTION");

        // Re-populate child blocks (steps in setup/steps/teardown)
        for (const input of ["SETUP", "STEPS", "TEARDOWN"]) {
          const conn = rootBlock.getInput(input)?.connection;
          if (conn) {
            // Dispose ALL blocks in the chain, not just the first
            let child = conn.targetBlock();
            while (child) {
              const next = child.getNextBlock();
              child.dispose(true); // true = dispose children (value/statement inputs too)
              child = next;
            }
          }
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

        // Re-populate child blocks (variables, preconditions, tests)
        for (const input of ["VARIABLES", "PRECONDITIONS", "TESTS"]) {
          const conn = rootBlock.getInput(input)?.connection;
          if (conn) {
            // Dispose ALL blocks in the chain, not just the first
            let child = conn.targetBlock();
            while (child) {
              const next = child.getNextBlock();
              child.dispose(true); // true = dispose children (value/statement inputs too)
              child = next;
            }
          }
        }
        populateWorkspaceFromModel(ws, rootBlock, model, catalog);
      }
    }

    isUpdatingFromStore.current = false;
  }, [model, lastEditSource, ready]);

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

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: theme.colors.bgLighter,
      }}
    />
  );
}
