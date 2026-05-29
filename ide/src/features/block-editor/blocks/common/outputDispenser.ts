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

import type * as BlocklyType from "blockly";

/**
 * Attaches pre-filled variable_get blocks to all OUT_* inputs on step blocks,
 * and replenishes them when dragged away (clone-on-detach pattern).
 */
export function attachOutputVariableBlocks(
  Blockly: typeof BlocklyType,
  ws: BlocklyType.WorkspaceSvg,
): void {
  populateAllOutputSlots(Blockly, ws);

  // Replenish when a variable block is detached from an OUT_ input
  ws.addChangeListener((event) => {
    if (!Blockly.Events.isEnabled()) return;
    if (event.type !== Blockly.Events.BLOCK_MOVE) return;

    const moveEvent = event as BlocklyType.Events.BlockMove;
    if (!moveEvent.oldParentId || !moveEvent.oldInputName) return;
    if (!moveEvent.oldInputName.startsWith("OUT_")) return;

    const parent = ws.getBlockById(moveEvent.oldParentId);
    if (!parent) return;

    const input = parent.getInput(moveEvent.oldInputName);
    if (!input?.connection || input.connection.targetBlock()) return;

    const stepId = parent.getFieldValue("STEP_ID") || "step";
    const varName = inputNameToVarName(moveEvent.oldInputName);
    const displayName = `${stepId}.${varName}`;

    Blockly.Events.setGroup(moveEvent.group);
    try {
      const newBlock = ws.newBlock("var_steps");
      newBlock.initSvg();
      newBlock.render();
      input.connection.connect(newBlock.outputConnection!);
      newBlock.setFieldValue(displayName, "VAR_NAME");
    } finally {
      Blockly.Events.setGroup(false);
    }
  });

  // Populate newly created step blocks
  ws.addChangeListener((event) => {
    if (!Blockly.Events.isEnabled()) return;
    if (event.type !== Blockly.Events.BLOCK_CREATE) return;

    const createEvent = event as BlocklyType.Events.BlockCreate;
    if (!createEvent.blockId) return;

    const block = ws.getBlockById(createEvent.blockId);
    if (!block || !block.type.startsWith("step_")) return;

    setTimeout(() => {
      if (block.disposed) return;
      populateBlockOutputSlots(Blockly, ws, block);
    }, 50);
  });
}

function populateAllOutputSlots(
  Blockly: typeof BlocklyType,
  ws: BlocklyType.WorkspaceSvg,
): void {
  for (const block of ws.getAllBlocks(false)) {
    if (!block.type.startsWith("step_")) continue;
    populateBlockOutputSlots(Blockly, ws, block);
  }
}

function populateBlockOutputSlots(
  Blockly: typeof BlocklyType,
  ws: BlocklyType.WorkspaceSvg,
  block: BlocklyType.Block,
): void {
  for (const input of block.inputList) {
    if (!input.name.startsWith("OUT_")) continue;
    if (input.connection?.targetBlock()) continue;

    const stepId = block.getFieldValue("STEP_ID") || "step";
    const varName = inputNameToVarName(input.name);
    const displayName = `${stepId}.${varName}`;

    Blockly.Events.disable();
    try {
      const varBlock = ws.newBlock("var_steps");
      varBlock.initSvg();
      varBlock.render();
      input.connection!.connect(varBlock.outputConnection!);
      varBlock.setFieldValue(displayName, "VAR_NAME");
    } finally {
      Blockly.Events.enable();
    }
  }
}

/** Convert OUT_EDR_TOKEN → edr_token */
function inputNameToVarName(inputName: string): string {
  return inputName.slice(4).toLowerCase();
}
