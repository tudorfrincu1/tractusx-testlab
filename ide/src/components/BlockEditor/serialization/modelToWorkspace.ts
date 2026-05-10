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
  TestCaseDefinition,
} from "../../../models/schema";
import { isTestCase, isTest, isTestRef } from "../../../models/schema";
import { findCatalogEntry, type BlockCatalog } from "../blocks/catalogLoader";
import { deriveTestLabel } from "../blocks/icons";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
} from "./helpers";
import { populateTest } from "./populateTest";

export function populateWorkspaceFromModel(
  ws: Workspace,
  root: Block,
  model: TestLabDocument,
  catalog: BlockCatalog
) {
  if (isTestCase(model)) {
    populateTestCase(ws, root, model);
  } else if (isTest(model)) {
    populateTest(ws, root, model, catalog);
  }

  for (const block of ws.getAllBlocks(false)) {
    (block as unknown as { render: () => void }).render();
  }

  for (const block of ws.getAllBlocks(false)) {
    for (const input of block.inputList) {
      for (const field of input.fieldRow) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = field as any;
        if (typeof f.getOptions !== "function") continue;
        const value = typeof f.getValue === "function" ? f.getValue() : undefined;
        f.getOptions(true);
        if (value && value !== "__NONE__") {
          const opts = f.getOptions(false) as Array<[string, string]>;
          const match = opts.find(([, v]: [string, string]) => v === value);
          if (match) f.selectedOption_ = match;
        }
      }
    }
  }
}

function populateTestCase(ws: Workspace, root: Block, tc: TestCaseDefinition) {
  if (tc.preconditions) {
    const preBlocks: Block[] = [];
    for (const pre of tc.preconditions) {
      const pb = makeBlock(ws, "precondition");
      pb.setFieldValue(pre.id || "", "PRE_ID");
      pb.setFieldValue(pre.description || "", "PRE_DESCRIPTION");
      preBlocks.push(pb);
    }
    attachChain(root, "PRECONDITIONS", preBlocks);
  }

  if (tc.tests) {
    const testBlocks: Block[] = [];
    for (const t of tc.tests) {
      if (isTestRef(t)) {
        const tb = makeBlock(ws, "test_ref");
        tb.setFieldValue(t.test, "TEST_NAME");
        tb.setFieldValue(t.description || "", "DESCRIPTION");
        if (t.with && Object.keys(t.with).length > 0) {
          const kvBlocks: Block[] = [];
          for (const [key, value] of Object.entries(t.with)) {
            const kvb = makeBlock(ws, "key_value_pair");
            kvb.setFieldValue(key, "KEY");
            connectValue(kvb, "VALUE", createValueBlockFromString(ws, String(value)));
            kvBlocks.push(kvb);
          }
          attachChain(tb, "WITH", kvBlocks);
        }
        testBlocks.push(tb);
      } else if (typeof t === "string") {
        const tb = makeBlock(ws, "test_ref");
        const path = t.replace(/^!include\s+/, "");
        tb.setFieldValue(deriveTestLabel(path), "TEST_NAME");
        tb.setFieldValue("", "DESCRIPTION");
        testBlocks.push(tb);
      }
    }
    attachChain(root, "TESTS", testBlocks);
  }
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
