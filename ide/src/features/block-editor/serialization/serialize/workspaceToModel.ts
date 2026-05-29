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
import type * as BlocklyType from "blockly";
import type {
  StepDefinition,
  Step,
  ScriptDefinition,
  TestLabDocument,
  InlineValidation,
} from "@/models/schema";
import { useServiceStore } from "@/store/environment/useServiceStore";
import { findCatalogEntry, type BlockCatalog } from "../../blocks";
import { readValueBlockAsString, readValueBlockAsUnknown, readAssertionChain, serializeStructuralBlock } from "../helpers";

import { parseJsonWithVarRefs } from "../../blocks/json/modal/jsonVarRefs";
import { emitVarRef } from "../varSyntax";
import { serializePreconditionPolicyBlock } from "./preconditionSerializers";
import { toInlineValidation, readFilterExpressionChain } from "./validationHelpers";
import {
  serializeExportVariable,
  serializeImportVariable,
  serializeSchemaImport,
  serializeUnsupportedStep,
  serializeOperationOrTemplate,
} from "./utilityStepSerializers";

export function workspaceToModel(
  _Blockly: typeof BlocklyType,
  workspace: Workspace,
  catalog: BlockCatalog
): Partial<TestLabDocument> {
  const rootBlock = workspace.getBlocksByType("test_root", false)[0];
  if (!rootBlock) return {};

  const name = rootBlock.getFieldValue("NAME") || "my_test";
  const version = rootBlock.getFieldValue("VERSION") || "1.0";
  const description = rootBlock.getFieldValue("DESCRIPTION") || "";

  const setup = readStepChain(rootBlock.getInputTargetBlock("SETUP"), catalog);
  const steps = readStepChain(rootBlock.getInputTargetBlock("STEPS"), catalog);
  const teardown = readStepChain(rootBlock.getInputTargetBlock("TEARDOWN"), catalog);

  const { services } = useServiceStore.getState();

  return {
    kind: "test",
    name,
    version,
    description,
    services: services.length > 0 ? services : undefined,
    setup: setup.length > 0 ? setup : undefined,
    steps,
    teardown: teardown.length > 0 ? teardown : undefined,
  } as Partial<ScriptDefinition>;
}

export function readStepChain(block: Block | null, catalog: BlockCatalog): Step[] {
  const steps: Step[] = [];
  const knownOutputs: Set<string> = new Set();
  let current = block;

  while (current) {
    if (current.type === "export_variable") {
      const step = serializeExportVariable(current);
      if (step) steps.push(step);
      current = current.getNextBlock();
      continue;
    }
    if (current.type === "import_variable") {
      const step = serializeImportVariable(current);
      if (step) steps.push(step);
      current = current.getNextBlock();
      continue;
    }
    if (current.type === "schema_import") {
      const step = serializeSchemaImport(current);
      if (step) steps.push(step);
    } else if (current.type === "unsupported_step") {
      steps.push(serializeUnsupportedStep(current, knownOutputs));
    } else if (current.type === "step_operation" || current.type === "step_template") {
      steps.push(serializeOperationOrTemplate(current, knownOutputs));
    } else if (current.type === "step_precondition_policy_config") {
      const step = serializePreconditionPolicyBlock(current);
      if (step) steps.push(step);
    } else {
      const step = blockToStep(current, catalog, knownOutputs);
      if (step) {
        // Flatten inline validate assertions into top-level steps for v2 YAML format
        const flattenedAssertions = flattenValidateToSteps(step as unknown as Record<string, unknown>);
        steps.push(step);
        steps.push(...flattenedAssertions as unknown as Step[]);
        if (step.returns) {
          for (const key of Object.keys(step.returns as Record<string, unknown>)) {
            knownOutputs.add(key);
          }
        }
      }
    }
    current = current.getNextBlock();
  }
  return steps;
}

/** Extract inline validate assertions from a step and emit them as standalone v2 assertion steps. */
function flattenValidateToSteps(step: Record<string, unknown>): Record<string, unknown>[] {
  const validate = step.validate as InlineValidation[] | undefined;
  if (!validate || validate.length === 0) return [];
  const stepId = String(step.id ?? "");
  const result: Record<string, unknown>[] = [];
  let counter = 1;
  for (const iv of validate) {
    const w = (iv as { with?: Record<string, unknown> }).with;
    if (!w) continue;
    const outputName = String(w.input ?? "");
    const operator = String(w.operator ?? "");
    const assertId = `assert_${outputName || "check"}_${counter++}`;
    const withBlock: Record<string, unknown> = {
      input: `\${{ steps.${stepId}.${outputName} }}`,
      operator,
    };
    if (w.value !== undefined) withBlock.value = w.value;
    if (w.schema !== undefined) withBlock.schema = w.schema;
    if (w.min !== undefined) withBlock.min = w.min;
    if (w.max !== undefined) withBlock.max = w.max;
    if (w.path !== undefined) withBlock.path = w.path;
    if (w.json_path !== undefined) withBlock.json_path = w.json_path;
    if (w.store_in_variable !== undefined) withBlock.store_in_variable = w.store_in_variable;
    result.push({
      id: assertId,
      uses: "validate/assert",
      name: `Assert ${operator}: ${outputName}`,
      with: withBlock,
    });
  }
  // Remove inline validate from the parent step since we've flattened them
  step.validate = undefined;
  return result;
}

function blockToStep(block: Block, catalog: BlockCatalog, knownOutputs: ReadonlySet<string>): StepDefinition | null {
  if (!block.type.startsWith("step_")) return null;

  const stepType = block.type.replace("step_", "");
  const description = block.getFieldValue("DESCRIPTION") || "";
  const catalogEntry = findCatalogEntry(stepType, catalog);

  const params: Record<string, unknown> = {};
  if (catalogEntry) {
    for (const p of catalogEntry.params) {
      const fieldKey = `PARAM_${p.name.toUpperCase()}`;

      switch (p.type) {
        case "dropdown":
        case "endpoint_ref":
        case "schema_path": {
          const val = block.getFieldValue(fieldKey);
          if (val && val !== "__NONE__") params[p.name] = val;
          break;
        }
        case "variable": {
          const val = block.getFieldValue(fieldKey);
          if (val && val !== "__NONE__") {
            params[p.name] = knownOutputs.has(val) ? emitVarRef("steps", val) : emitVarRef("env", val);
          }
          break;
        }
        case "text": {
          const val = block.getFieldValue(fieldKey);
          if (val) params[p.name] = String(val);
          break;
        }
        case "number": {
          const val = block.getFieldValue(fieldKey);
          if (val !== undefined && val !== null) params[p.name] = Number(val);
          break;
        }
        case "json": {
          const connected = block.getInputTargetBlock(fieldKey);
          if (connected) {
            const varStr = readValueBlockAsString(connected);
            if (varStr) {
              params[p.name] = varStr;
            } else if (connected.type === "value_json") {
              const raw = connected.getFieldValue("JSON_VALUE") || "{}";
              try {
                const parsed: unknown = parseJsonWithVarRefs(raw, knownOutputs);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                  params[p.name] = parsed;
                }
              } catch {
                // Invalid JSON stored — skip
              }
            } else {
              const structured = readValueBlockAsUnknown(connected);
              if (structured !== undefined) {
                params[p.name] = structured;
              }
            }
          }
          break;
        }
        case "steps": {
          const nested = readStepChain(block.getInputTargetBlock(fieldKey), catalog);
          if (nested.length > 0) params[p.name] = nested;
          break;
        }
        case "filter_expression_list": {
          const filters = readFilterExpressionChain(block.getInputTargetBlock(fieldKey));
          if (filters.length > 0) {
            params[p.name] = filters;
          }
          break;
        }
        case "array": {
          const items: unknown[] = [];
          let itemBlock = block.getInputTargetBlock(fieldKey);
          while (itemBlock) {
            const serialized = serializeStructuralBlock(itemBlock);
            if (serialized !== undefined) items.push(serialized);
            itemBlock = itemBlock.getNextBlock();
          }
          if (items.length > 0) params[p.name] = items;
          break;
        }
        default: {
          const connectedBlock = block.getInputTargetBlock(fieldKey);
          if (connectedBlock) {
            const val = readValueBlockAsString(connectedBlock);
            if (val) params[p.name] = val;
          }
          break;
        }
      }
    }
  }

  let storeInMemory: Record<string, string> | undefined;

  // First try to read custom returns from block.data (roundtrip fidelity)
  if (block.data) {
    try {
      const blockData: unknown = JSON.parse(block.data);
      if (blockData && typeof blockData === "object" && "returns" in blockData) {
        const custom = (blockData as { returns: unknown }).returns;
        if (custom && typeof custom === "object") {
          storeInMemory = custom as Record<string, string>;
        }
      }
    } catch {
      // Invalid JSON in block.data — fall through to default
    }
  }

  // Fallback: generate default returns from catalog outputs
  if (!storeInMemory && catalogEntry?.outputs && catalogEntry.outputs.length > 0) {
    storeInMemory = {};
    for (const output of catalogEntry.outputs) {
      storeInMemory[output.name] = "$";
    }
  }

  const rawValidate = readAssertionChain(block.getInputTargetBlock("EXPECT"));
  const validate: InlineValidation[] = rawValidate.map((a) => toInlineValidation(a as unknown as Record<string, unknown>));

  // Post-process params for specific step type

  const stepId = block.getFieldValue("STEP_ID") || "";

  return {
    id: stepId,
    uses: catalogEntry?.uses
      ? (Array.isArray(catalogEntry.uses) ? catalogEntry.uses[0] : catalogEntry.uses)
      : stepType,
    name: description || undefined,
    with: params,
    validate: validate.length > 0 ? validate : undefined,
    returns: storeInMemory,
  };
}
