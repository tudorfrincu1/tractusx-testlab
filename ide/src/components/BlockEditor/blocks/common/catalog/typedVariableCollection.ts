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
import type { BlockCatalog } from "./catalogLoader";
import { findCatalogEntry } from "./catalogLoader";

export interface TypedVariable {
  name: string;
  class: string;
  sourceBlockType: string;
  sourceBlockLabel: string;
}

const DEFAULT_CLASS = "string";

/**
 * Collects typed variables from all blocks upstream of the given block.
 * Walks the block chain via getPreviousBlock() and collects outputs with class metadata.
 */
export function collectTypedUpstreamVariables(
  block: Block,
  catalog: BlockCatalog,
): TypedVariable[] {
  const variables: TypedVariable[] = [];
  const seen = new Set<string>();

  const addVariable = (name: string, cls: string, blockType: string, label: string) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    variables.push({ name, class: cls, sourceBlockType: blockType, sourceBlockLabel: label });
  };

  let current: Block | null = block.getPreviousBlock();
  while (current) {
    collectFromBlock(current, catalog, addVariable);
    current = current.getPreviousBlock();
  }

  return variables;
}

/**
 * Collects typed variables from ALL blocks in the workspace (fallback for when
 * block-chain walking is not sufficient, e.g. workspace-level dropdowns).
 */
export function collectTypedWorkspaceVariables(
  workspace: Workspace,
  catalog: BlockCatalog,
): TypedVariable[] {
  const variables: TypedVariable[] = [];
  const seen = new Set<string>();

  const addVariable = (name: string, cls: string, blockType: string, label: string) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    variables.push({ name, class: cls, sourceBlockType: blockType, sourceBlockLabel: label });
  };

  for (const wsBlock of workspace.getAllBlocks(false)) {
    collectFromBlock(wsBlock, catalog, addVariable);
  }

  return variables;
}

type AddVariableFn = (name: string, cls: string, blockType: string, label: string) => void;

function collectFromBlock(
  current: Block,
  catalog: BlockCatalog,
  addVariable: AddVariableFn,
): void {
  if (current.type.startsWith("step_")) {
    const stepType = current.type.slice(5);
    const entry = findCatalogEntry(stepType, catalog);
    if (entry?.outputs) {
      for (const output of entry.outputs) {
        addVariable(
          output.name,
          output.class ?? DEFAULT_CLASS,
          current.type,
          entry.label,
        );
      }
    }

    // Collect store_in_memory field values
    const memoryField = current.getFieldValue("STORE_IN_MEMORY");
    if (typeof memoryField === "string" && memoryField) {
      addVariable(memoryField, DEFAULT_CLASS, current.type, entry?.label ?? stepType);
    }
  }

  if (current.type === "variable_def") {
    const varName = current.getFieldValue("VAR_NAME");
    if (typeof varName === "string" && varName) {
      addVariable(varName, DEFAULT_CLASS, "variable_def", "Variable Definition");
    }
  }
}
