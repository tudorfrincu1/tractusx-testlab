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

import type { Block, Workspace } from "blockly";
import type {
  TestLabDocument,
} from "../../../../models/schema";
import { isTest } from "../../../../models/schema";
import { type BlockCatalog } from "../../blocks";
import * as deferredDropdowns from "../deferredDropdowns";
import { populateTest } from "./populateTest";

export function populateWorkspaceFromModel(
  ws: Workspace,
  root: Block,
  model: TestLabDocument,
  catalog: BlockCatalog
) {
  // Clear any stale deferred values from a previous import
  deferredDropdowns.clear();

  if (isTest(model)) {
    populateTest(ws, root, model, catalog);
  }

  // Pass 1: Render all blocks. This triggers Blockly's built-in field
  // validation which may revert dropdown values that aren't yet in
  // getOptions() (e.g. variable dropdowns before all step blocks exist).
  for (const block of ws.getAllBlocks(false)) {
    (block as unknown as { render: () => void }).render();
  }

  // Pass 2: Re-apply all dropdown values that were queued during block
  // creation. Now that every block exists and is rendered, getOptions()
  // returns the full list and the values will stick.
  deferredDropdowns.flush(ws);
}

export function cleanupOrphanBlocks(ws: Workspace, root: Block) {
  const connectedIds = new Set<string>();
  const collectConnected = (block: Block | null) => {
    while (block) {
      if (connectedIds.has(block.id)) break;
      connectedIds.add(block.id);
      for (const input of block.inputList) {
        if (input.connection) {
          collectConnected(input.connection.targetBlock());
        }
      }
      block = block.getNextBlock();
    }
  };
  collectConnected(root);

  for (const block of ws.getAllBlocks(false)) {
    if (!connectedIds.has(block.id)) {
      block.dispose(true);
    }
  }
}
