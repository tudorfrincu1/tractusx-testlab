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
import type { BlocklyFieldDropdownInternal } from "../../../../types/blockly-internals.d";
import * as deferredDropdowns from "../deferredDropdowns";

export { deferredDropdowns };

export function makeBlock(ws: Workspace, type: string): Block {
  const b = ws.newBlock(type);
  (b as unknown as { initSvg: () => void }).initSvg();
  (b as unknown as { render: () => void }).render();
  return b;
}

export function setDropdownValue(block: Block, fieldName: string, value: string) {
  const field = block.getField(fieldName);
  if (!field) return;
  const f = field as unknown as BlocklyFieldDropdownInternal;
  const original = f.doClassValidation_;
  f.doClassValidation_ = (v: string) => v;
  try {
    field.setValue(value);
  } finally {
    f.doClassValidation_ = original;
  }
  if (typeof f.getOptions === "function") {
    f.getOptions(true);
    const opts = f.getOptions(false) as Array<[string, string]>;
    const match = opts.find(([, v]: [string, string]) => v === value);
    // Blockly 12 uses `selectedOption` (no trailing underscore)
    f.selectedOption = match ?? [value, value];
  }
  // Queue the value for re-application after the render pass
  deferredDropdowns.enqueue(block.id, fieldName, value);
}

export function attachChain(parent: Block, inputName: string, blocks: Block[]) {
  if (blocks.length === 0) return;
  const input = parent.getInput(inputName);
  if (!input?.connection) return;
  input.connection.connect(blocks[0].previousConnection!);
  for (let i = 1; i < blocks.length; i++) {
    blocks[i - 1].nextConnection!.connect(blocks[i].previousConnection!);
  }
}

export function connectValue(parent: Block, inputName: string, child: Block) {
  const input = parent.getInput(inputName);
  if (input?.connection && child.outputConnection) {
    input.connection.connect(child.outputConnection);
  }
}
