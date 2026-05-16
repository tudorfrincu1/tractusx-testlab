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

import * as Blockly from "blockly";
import { useTestLabStore } from "../../../store/slices/useTestLabStore";
import {
  buildToolbox,
  workspaceToModel,
  collectWorkspaceVariables,
} from "../config/blockDefinitions";
import { resolveStepIdentifier } from "./blockSelection";
import type { TestLabDocument } from "../../../models/schema";
import type { BlockCatalog } from "../config/blockDefinitions";

interface ListenerRefs {
  isUpdatingFromStore: { current: boolean };
  workspaceRef: { current: Blockly.WorkspaceSvg | null };
  pendingUpdateRef: { current: ReturnType<typeof setTimeout> | null };
  pendingToolboxRef: { current: ReturnType<typeof setTimeout> | null };
}

export function attachModelSyncListener(
  ws: Blockly.WorkspaceSvg,
  catalog: BlockCatalog,
  modelKind: string,
  setModelFromBlocks: (doc: TestLabDocument) => void,
  refs: ListenerRefs,
) {
  let lastVarSnapshot = "";

  ws.addChangeListener((event: Blockly.Events.Abstract) => {
    if (refs.isUpdatingFromStore.current) return;
    const isStructural =
      event.type === Blockly.Events.BLOCK_DELETE ||
      event.type === Blockly.Events.BLOCK_CREATE;
    if (
      event.type === Blockly.Events.BLOCK_CHANGE ||
      event.type === Blockly.Events.BLOCK_MOVE ||
      isStructural
    ) {
      if (refs.pendingUpdateRef.current) clearTimeout(refs.pendingUpdateRef.current);
      refs.pendingUpdateRef.current = setTimeout(() => {
        refs.pendingUpdateRef.current = null;
        if (!refs.workspaceRef.current) return;
        try {
          const partial = workspaceToModel(Blockly, ws, catalog);
          if (partial && Object.keys(partial).length > 0) {
            const current = useTestLabStore.getState().model;
            const merged = { ...current } as Record<string, unknown>;
            for (const [key, value] of Object.entries(partial)) {
              if (Array.isArray(value) && value.length === 0) continue;
              if (value === undefined) continue;
              merged[key] = value;
            }
            setModelFromBlocks(merged as unknown as TestLabDocument);
          }
        } catch {
          // Block tree may be in transient state during drag/deletion
        }
      }, 150);

      if (isStructural) {
        if (refs.pendingToolboxRef.current) clearTimeout(refs.pendingToolboxRef.current);
        refs.pendingToolboxRef.current = setTimeout(() => {
          refs.pendingToolboxRef.current = null;
          if (!refs.workspaceRef.current) return;
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
}

export function attachFlyoutListener(ws: Blockly.WorkspaceSvg) {
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
}

export function attachSelectionListener(
  ws: Blockly.WorkspaceSvg,
  selectStep: (name: string | null) => void,
) {
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
}
