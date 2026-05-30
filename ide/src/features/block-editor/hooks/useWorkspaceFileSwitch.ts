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

import { useEffect } from "react";
import * as Blockly from "blockly";
import { useProjectStore } from "@/store";
import { isTest } from "@/models/schema";
import {
  buildToolbox,
  populateWorkspaceFromModel,
  collectWorkspaceVariables,
  collectCategorizedVariables,
  cleanupOrphanBlocks,
} from "../config/blockDefinitions";
import { populateOutputVariableBlocks } from "../blocks/common/outputDispenser";
import type { WorkspaceRefs } from "../blocklyWorkspace.types";

/**
 * Subscribes to activeFile changes and swaps the Blockly workspace content
 * in-place (clear + repopulate) instead of destroying and re-creating the workspace.
 */
export function useWorkspaceFileSwitch(
  refs: Pick<WorkspaceRefs, "workspaceRef" | "catalogRef" | "isUpdatingFromStore" | "activeFileKeyRef">,
  ready: boolean,
  modelKind: string,
): void {
  const { workspaceRef, catalogRef, isUpdatingFromStore, activeFileKeyRef } = refs;

  useEffect(() => {
    if (!ready) return;

    const unsubscribe = useProjectStore.subscribe((state, prev) => {
      const newFile = state.activeFile;
      const oldFile = prev.activeFile;
      if (!newFile || (newFile.name === oldFile?.name && newFile.type === oldFile?.type)) return;

      const ws = workspaceRef.current;
      const catalog = catalogRef.current;
      if (!ws || !catalog) return;

      // Save current workspace state under the OLD file key
      const oldKey = activeFileKeyRef.current;
      try {
        const saved = Blockly.serialization.workspaces.save(ws);
        const { blocks, variables } = saved as Record<string, unknown>;
        useProjectStore.getState().setWorkspaceState(oldKey, { blocks, variables });
      } catch {
        // ignore serialization errors
      }

      // Update the tracked file key
      const newKey = newFile.name ?? "index";
      activeFileKeyRef.current = newKey;

      // Suppress change events during the swap
      isUpdatingFromStore.current = true;
      Blockly.Events.disable();
      try {
        ws.clear();

        const savedState = useProjectStore.getState().getWorkspaceState(newKey);
        if (savedState && typeof savedState === "object" && Object.keys(savedState).length > 0) {
          Blockly.serialization.workspaces.load(savedState, ws, { recordUndo: false });
        } else {
          // No saved canvas — build from model using the project store (already reflects new file)
          const activeModel = useProjectStore.getState().getActiveModel();
          const rootBlock = ws.newBlock("test_root");
          rootBlock.initSvg();
          rootBlock.render();
          rootBlock.moveBy(30, 30);

          if (activeModel && isTest(activeModel)) {
            rootBlock.setFieldValue(activeModel.name || "my_test", "NAME");
            rootBlock.setFieldValue(activeModel.version || "1.0", "VERSION");
            rootBlock.setFieldValue(activeModel.description || "", "DESCRIPTION");
          }
          try {
            if (activeModel) {
              populateWorkspaceFromModel(ws, rootBlock, activeModel, catalog);
              cleanupOrphanBlocks(ws, rootBlock);
            }
          } catch {
            // ignore population errors during file switch
          }
        }

        // Re-dispense output variable blocks after population with events disabled
        populateOutputVariableBlocks(Blockly, ws);

        // Refresh toolbox with new workspace's variables
        const vars = collectWorkspaceVariables(ws, catalog);
        const toolbox = buildToolbox(catalog, modelKind, vars.length > 0 ? collectCategorizedVariables(ws) : undefined) as Blockly.utils.toolbox.ToolboxDefinition;
        ws.updateToolbox(toolbox);
      } finally {
        Blockly.Events.enable();
        isUpdatingFromStore.current = false;
      }
    });

    return unsubscribe;
  }, [ready, modelKind, workspaceRef, catalogRef, isUpdatingFromStore, activeFileKeyRef]);
}
