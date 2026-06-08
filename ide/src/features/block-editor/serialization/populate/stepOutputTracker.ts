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
import type { Step } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";
import { findCatalogEntry, type BlockCatalog } from "../../blocks";

import { makeBlock, createValueBlockFromString, setDropdownValue } from "../serializationParts";
import { parseVarRef, SCOPE_TO_BLOCK_TYPE } from "../varSyntax";

/** Regex for a pure variable reference: `${{ scope.path }}` v2 syntax. */
const PURE_VAR_REF = /^\$\{\{\s*(?:env|steps|metadata|setup)\.[^\s}]+\s*\}\}$/;

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

  // From returns keys
  const returns = isTemplateStep(step) ? undefined : step.returns;
  if (returns && typeof returns === "object") {
    for (const key of Object.keys(returns)) {
      outputs.set(key, `${stepId}.${key}`);
    }
  }

  if (isTemplateStep(step)) return;

  // From store_in_variable param (generate_uuid pattern)
  const storeInVariable = step.with?.store_in_variable;
  if (typeof storeInVariable === "string" && storeInVariable) {
    outputs.set(storeInVariable, `${stepId}.${storeInVariable}`);
  }

  // From catalog outputs
  const catalogStepType = step.uses;
  const entry = findCatalogEntry(catalogStepType, catalog);
  if (entry?.outputs) {
    for (const output of entry.outputs) {
      outputs.set(output.name, `${stepId}.${output.name}`);
    }
  }
}

/**
 * Creates a value block for a param value string, resolving variable
 * references to the appropriate scoped block type.
 */
export function createValueBlockWithOutputResolution(
  ws: Workspace,
  strVal: string,
  _stepOutputs: StepOutputMap,
): Block {
  if (PURE_VAR_REF.test(strVal)) {
    // Try v2 scoped refs first (steps, metadata, setup, services, env)
    const parsed = parseVarRef(strVal);
    if (parsed) {
      // steps scope → use var_steps block with fixed label
      if (parsed.scope === "steps") {
        const vb = makeBlock(ws, "var_steps");
        vb.setFieldValue(parsed.path, "VAR_NAME");
        return vb;
      }
      const blockType = SCOPE_TO_BLOCK_TYPE[parsed.scope];
      if (blockType) {
        const vb = makeBlock(ws, blockType);
        setDropdownValue(vb, "VAR_NAME", parsed.path);
        return vb;
      }
    }
  }
  return createValueBlockFromString(ws, strVal);
}
