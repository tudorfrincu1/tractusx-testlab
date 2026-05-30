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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import type { Block, Workspace } from "blockly";

/** Create a fully rendered Blockly block on the workspace. */
export function makeBlock(ws: Workspace, type: string): Block {
  const b = ws.newBlock(type);
  (b as unknown as { initSvg: () => void }).initSvg();
  (b as unknown as { render: () => void }).render();
  return b;
}

/** Connect a chain of statement blocks into a parent's statement input. */
export function attachChain(parent: Block, inputName: string, blocks: Block[]) {
  if (blocks.length === 0) return;
  const input = parent.getInput(inputName);
  if (!input?.connection) return;
  input.connection.connect(blocks[0].previousConnection!);
  for (let i = 1; i < blocks.length; i++) {
    blocks[i - 1].nextConnection!.connect(blocks[i].previousConnection!);
  }
}

/** Connect a value block into a parent's value input. */
export function connectValue(parent: Block, inputName: string, child: Block) {
  const input = parent.getInput(inputName);
  if (input?.connection && child.outputConnection) {
    input.connection.connect(child.outputConnection);
  }
}
