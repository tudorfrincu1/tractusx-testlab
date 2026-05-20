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
import type { Step } from "../../../../models/schema";
import { isTemplateStep } from "../../../../models/schema";
import { findCatalogEntry, type BlockCatalog } from "../../blocks";
import { toCatalogStepType } from "../stepTypeAliases";
import { makeBlock, setDropdownValue, createValueBlockFromString } from "../helpers";

/** Regex for a pure variable reference: exactly `@identifier` with no extra content. */
const PURE_VAR_REF = /^@[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Tracks step output variable names as steps are built, mapping
 * `varName` → `stepId.varName` for resolving `@variable` references.
 */
export type StepOutputMap = Map<string, string>;

/**
 * After a step block is created, collect its output variable names into the map.
 */
export function trackStepOutputs(
  stepBlock: Block,
  step: Step,
  catalog: BlockCatalog,
  outputs: StepOutputMap,
): void {
  const stepId = stepBlock.getFieldValue("STEP_ID") as string | undefined;
  if (!stepId) return;

  // From store_in_memory keys
  const storeInMemory = (step as Record<string, unknown>).store_in_memory;
  if (storeInMemory && typeof storeInMemory === "object") {
    for (const key of Object.keys(storeInMemory as Record<string, unknown>)) {
      outputs.set(key, `${stepId}.${key}`);
    }
  }

  if (isTemplateStep(step)) return;

  // From store_in_variable param (generate_uuid pattern)
  const storeInVariable = step.params?.store_in_variable;
  if (typeof storeInVariable === "string" && storeInVariable) {
    outputs.set(storeInVariable, `${stepId}.${storeInVariable}`);
  }

  // From catalog outputs
  const catalogStepType = toCatalogStepType(step.type);
  const entry = findCatalogEntry(catalogStepType, catalog);
  if (entry?.outputs) {
    for (const output of entry.outputs) {
      outputs.set(output.name, `${stepId}.${output.name}`);
    }
  }
}

/**
 * Creates a value block for a param value string, resolving `@variable`
 * references to `output_variable` blocks when the variable is a known step output.
 * Falls back to `variable_get` for environment/TCK variables.
 */
export function createValueBlockWithOutputResolution(
  ws: Workspace,
  strVal: string,
  stepOutputs: StepOutputMap,
): Block {
  if (PURE_VAR_REF.test(strVal)) {
    const varName = strVal.slice(1);
    const outputRef = stepOutputs.get(varName);
    if (outputRef) {
      const block = makeBlock(ws, "output_variable");
      block.setFieldValue(outputRef, "VAR_NAME");
      return block;
    }
    // Not a known step output → environment variable
    const vb = makeBlock(ws, "variable_get");
    setDropdownValue(vb, "VAR_NAME", varName);
    return vb;
  }
  return createValueBlockFromString(ws, strVal);
}
