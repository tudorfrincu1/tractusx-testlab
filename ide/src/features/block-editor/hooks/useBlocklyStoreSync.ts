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

import { useEffect } from "react";
import * as Blockly from "blockly";

import { useEditorStore } from "@/store";
import { useUiStore } from "@/store";
import {
  buildToolbox,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
  collectCategorizedVariables,
  cleanupOrphanBlocks,
} from "../config/blockDefinitions";
import { populateOutputVariableBlocks } from "../blocks/common/outputDispenser";
import { isTest } from "@/models/schema";
import type { BlocklyWorkspaceRefs } from "./blocklyWorkspaceRefs";

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

interface UseBlocklyStoreSyncParams {
  refs: BlocklyWorkspaceRefs;
  ready: boolean;
  modelKind: string;
}

/**
 * Model→workspace sync: subscribes directly to store changes (synchronous) so
 * debounced workspace listeners cannot overwrite `lastEditSource`.
 *
 * On a `load` edit it rebuilds the whole workspace; on a `yaml` edit it replaces
 * the step chains in place. Cancels any pending debounced timers first, then
 * mutates Blockly with events disabled. Behavior is identical to the original
 * single-hook effect.
 */
export function useBlocklyStoreSync({ refs, ready, modelKind }: UseBlocklyStoreSyncParams) {
  const { workspaceRef, catalogRef, isUpdatingFromStore, pendingUpdateRef, pendingToolboxRef } = refs;

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
        populateOutputVariableBlocks(Blockly, ws);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, modelKind]);
}
