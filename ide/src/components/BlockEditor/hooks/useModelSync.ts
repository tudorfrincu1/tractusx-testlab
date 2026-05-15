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

import { useEffect } from "react";
import * as Blockly from "blockly";
import { useTestLabStore } from "../../../store/useTestLabStore";
import {
  workspaceToModel,
  populateWorkspaceFromModel,
} from "../config/blockDefinitions";
import type { TestLabDocument, ScriptDefinition, TckDefinition } from "../../../models/schema";
import { isTest, isTck } from "../../../models/schema";
import type { WorkspaceRefs } from "../workspaceTypes";

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

/**
 * Workspace → model sync (onChange) and model → workspace sync (useEffect).
 * Registers a Blockly change listener that debounces `workspaceToModel` calls,
 * and watches for model changes from YAML edits to update blocks.
 */
export function useModelSync(refs: WorkspaceRefs, ready: boolean): void {
  const {
    workspaceRef,
    catalogRef,
    isUpdatingFromStore,
    pendingUpdateRef,
  } = refs;

  const model = useTestLabStore((s) => s.model);
  const lastEditSource = useTestLabStore((s) => s.lastEditSource);
  const setModelFromBlocks = useTestLabStore((s) => s.setModelFromBlocks);

  // Workspace → model change listener
  useEffect(() => {
    if (!ready) return;
    const ws = workspaceRef.current;
    const catalog = catalogRef.current;
    if (!ws || !catalog) return;

    const flushModelUpdate = () => {
      if (!workspaceRef.current) return;
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

    const listener = (event: Blockly.Events.Abstract) => {
      if (isUpdatingFromStore.current) return;
      if (
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_CREATE
      ) {
        if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
        pendingUpdateRef.current = setTimeout(() => {
          pendingUpdateRef.current = null;
          flushModelUpdate();
        }, 150);
      }
    };

    ws.addChangeListener(listener);
    return () => ws.removeChangeListener(listener);
  }, [ready, workspaceRef, catalogRef, isUpdatingFromStore, pendingUpdateRef, setModelFromBlocks]);

  // Model → workspace sync (when YAML or load changes model)
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

          for (const input of ["PRECONDITIONS", "TESTS"]) {
            disposeStatementChain(rootBlock, input);
          }
          populateWorkspaceFromModel(ws, rootBlock, model, catalog);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[useModelSync] Failed to sync model to workspace:", err);
    }

    isUpdatingFromStore.current = false;
  }, [model, lastEditSource, ready, workspaceRef, catalogRef, isUpdatingFromStore, pendingUpdateRef]);
}
