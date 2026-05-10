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
import { useProjectStore } from "../../store/useProjectStore";
import type { WorkspaceRefs } from "./workspaceTypes";

/**
 * Saves canvas state (block positions + detached blocks) on workspace changes,
 * and handles save/restore during file switches.
 */
export function useCanvasState(refs: WorkspaceRefs, ready: boolean): void {
  const {
    workspaceRef,
    isUpdatingFromStore,
    pendingUpdateRef,
    pendingCanvasSaveRef,
    pendingToolboxRef,
    activeFileKeyRef,
    initGenerationRef,
  } = refs;

  const activeFile = useProjectStore((s) => s.activeFile);

  // Debounced canvas save on workspace changes
  useEffect(() => {
    if (!ready) return;
    const ws = workspaceRef.current;
    if (!ws) return;

    const listener = (event: Blockly.Events.Abstract) => {
      if (isUpdatingFromStore.current) return;
      if (
        event.type !== Blockly.Events.BLOCK_CHANGE &&
        event.type !== Blockly.Events.BLOCK_MOVE &&
        event.type !== Blockly.Events.BLOCK_DELETE &&
        event.type !== Blockly.Events.BLOCK_CREATE
      ) {
        return;
      }

      if (pendingCanvasSaveRef.current) clearTimeout(pendingCanvasSaveRef.current);
      pendingCanvasSaveRef.current = setTimeout(() => {
        pendingCanvasSaveRef.current = null;
        if (!workspaceRef.current) return;
        try {
          const key = activeFileKeyRef.current;
          const state = Blockly.serialization.workspaces.save(ws);
          const { blocks, variables } = state as Record<string, unknown>;
          useProjectStore.getState().setWorkspaceState(key, { blocks, variables });
        } catch {
          // Serialization can fail during transient states
        }
      }, 500);
    };

    ws.addChangeListener(listener);
    return () => ws.removeChangeListener(listener);
  }, [ready, workspaceRef, isUpdatingFromStore, pendingCanvasSaveRef, activeFileKeyRef]);

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

    // Save current workspace state under the OLD file key
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
  }, [activeFile, ready, workspaceRef, activeFileKeyRef, initGenerationRef,
    pendingUpdateRef, pendingCanvasSaveRef, pendingToolboxRef]);
}
