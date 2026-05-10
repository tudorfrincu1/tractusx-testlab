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
import { useTestLabStore } from "../../store/useTestLabStore";
import { useServiceStore } from "../../store/useServiceStore";
import {
  collectWorkspaceVariables,
  buildToolbox,
} from "./blockDefinitions";
import type { WorkspaceRefs } from "./workspaceTypes";

/**
 * Refreshes the Blockly toolbox when:
 * - A structural workspace change adds/removes variable-producing blocks
 * - The service store configuration changes
 */
export function useToolboxRefresh(refs: WorkspaceRefs, ready: boolean): void {
  const {
    workspaceRef,
    catalogRef,
    isUpdatingFromStore,
    pendingToolboxRef,
  } = refs;

  const modelKind = useTestLabStore((s) => s.model.kind);

  // Structural change listener — refresh toolbox variables on block create/delete
  useEffect(() => {
    if (!ready) return;
    const ws = workspaceRef.current;
    const catalog = catalogRef.current;
    if (!ws || !catalog) return;

    let lastVarSnapshot = "";

    const listener = (event: Blockly.Events.Abstract) => {
      if (isUpdatingFromStore.current) return;
      const isStructural =
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_CREATE;
      if (!isStructural) return;

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
              currentVars,
            ) as Blockly.utils.toolbox.ToolboxDefinition;
            ws.updateToolbox(newToolbox);
          }
        } catch {
          // Toolbox refresh can fail during workspace dispose
        }
      }, 300);
    };

    ws.addChangeListener(listener);
    return () => ws.removeChangeListener(listener);
  }, [ready, modelKind, workspaceRef, catalogRef, isUpdatingFromStore, pendingToolboxRef]);

  // Refresh toolbox when configured services change
  useEffect(() => {
    if (!ready) return;
    const unsubscribe = useServiceStore.subscribe((state, prev) => {
      if (state.services === prev.services) return;
      const ws = workspaceRef.current;
      const catalog = catalogRef.current;
      if (!ws || !catalog) return;
      requestAnimationFrame(() => {
        if (!workspaceRef.current) return;
        try {
          const currentVars = collectWorkspaceVariables(ws);
          const newToolbox = buildToolbox(
            catalog,
            modelKind,
            currentVars,
          ) as Blockly.utils.toolbox.ToolboxDefinition;
          ws.updateToolbox(newToolbox);
        } catch {
          // Toolbox refresh can fail during workspace dispose
        }
      });
    });
    return unsubscribe;
  }, [ready, modelKind, workspaceRef, catalogRef]);
}
