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
} from "../../../models/schema";
import { useServiceStore } from "../../../store/slices/useServiceStore";
import { findCatalogEntry, type BlockCatalog } from "../blocks";
import { readValueBlockAsString, readAssertionChain, readValueBlockAsUnknown, serializeStructuralBlock } from "./helpers";
import { toRuntimeStepType } from "./stepTypeAliases";
import { parseUnsupportedParams } from "./unsupportedStepPayload";
import { serializePreconditionPolicyBlock } from "./preconditionSerializers";

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
  let current = block;

  while (current) {
    if (current.type === "export_variable") {
      const varName = current.getFieldValue("VAR_NAME");
      if (varName && varName !== "__NONE__") {
        steps.push({
          type: "export_variable",
          description: `Export ${varName}`,
          params: { name: varName, value: `@${varName}` },
        } as StepDefinition);
      }
      current = current.getNextBlock();
      continue;
    }
    if (current.type === "import_variable") {
      const file = current.getFieldValue("FILE") || "";
      const exportVar = current.getFieldValue("EXPORT_VAR") || "";
      const outputVar = current.getFieldValue("OUTPUT_VAR") || exportVar;
      if (file && file !== "__NONE__" && exportVar && exportVar !== "__NONE__") {
        steps.push({
          type: "import_variable",
          description: `Import ${exportVar}`,
          params: { file, export: exportVar, variable: outputVar },
        } as StepDefinition);
      }
      current = current.getNextBlock();
      continue;
    }
    if (current.type === "schema_import") {
      const schemaPath = current.getFieldValue("SCHEMA_PATH") || "";
      const varName = current.getFieldValue("OUTPUT_SCHEMA") || "schema_var";
      if (schemaPath && schemaPath !== "__NONE__") {
        steps.push({
          type: "load_schema",
          description: `Load ${varName}`,
          params: { name: varName, source: "file", path: schemaPath },
          store_in_memory: { [varName]: "$" },
        });
      }
    } else if (current.type === "unsupported_step") {
      const originalType = current.getFieldValue("ORIGINAL_TYPE") || "unsupported_step";
      const stepDescription = current.getFieldValue("STEP_DESCRIPTION") || "";
      const paramsJson = current.getFieldValue("PARAMS_JSON") || "{}";
      const params = parseUnsupportedParams(paramsJson);
      steps.push({
        type: originalType,
        description: stepDescription || undefined,
        params,
      } as StepDefinition);
    } else if (current.type === "step_operation" || current.type === "step_template") {
      const originalType = current.getFieldValue("ORIGINAL_TYPE") || current.getFieldValue("OPERATION") || current.getFieldValue("PARAM_TEMPLATE") || "unsupported_step";
      const stepDescription = current.getFieldValue("STEP_DESCRIPTION") || current.getFieldValue("DESCRIPTION") || "";
      const params: Record<string, unknown> = {};
      let kvBlock = current.getInputTargetBlock("PARAMS");
      while (kvBlock) {
        if (kvBlock.type === "key_value_pair") {
          const key = kvBlock.getFieldValue("KEY") || "";
          const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
          if (key) params[key] = value;
        }
        kvBlock = kvBlock.getNextBlock();
      }
      steps.push({
        type: originalType,
        description: stepDescription || undefined,
        params,
      } as StepDefinition);
    } else if (current.type === "step_precondition_policy_config") {
      const step = serializePreconditionPolicyBlock(current);
      if (step) steps.push(step);
    } else {
      const step = blockToStep(current, catalog);
      if (step) steps.push(step);
    }
    current = current.getNextBlock();
  }
  return steps;
}

function blockToStep(block: Block, catalog: BlockCatalog): StepDefinition | null {
  if (!block.type.startsWith("step_")) return null;

  const stepType = block.type.replace("step_", "");
  const runtimeStepType = toRuntimeStepType(stepType);
  const description = block.getFieldValue("DESCRIPTION") || "";
  const catalogEntry = findCatalogEntry(stepType, catalog);

  const params: Record<string, unknown> = {};
  if (catalogEntry) {
    for (const p of catalogEntry.params) {
      const fieldKey = `PARAM_${p.name.toUpperCase()}`;

      switch (p.type) {
        case "dropdown":
        case "endpoint_ref":
        case "service_ref":
        case "schema_path": {
          const val = block.getFieldValue(fieldKey);
          if (val && val !== "__NONE__") params[p.name] = val;
          break;
        }
        case "variable": {
          const val = block.getFieldValue(fieldKey);
          if (val && val !== "__NONE__") params[p.name] = `@${val}`;
          break;
        }
        case "number": {
          const val = block.getFieldValue(fieldKey);
          if (val !== undefined && val !== null) params[p.name] = Number(val);
          break;
        }
        case "json": {
          const jsonObj: Record<string, unknown> = {};
          let kvBlock = block.getInputTargetBlock(fieldKey);
          while (kvBlock) {
            if (kvBlock.type === "key_value_pair") {
              const key = kvBlock.getFieldValue("KEY") || "";
              const value = readValueBlockAsUnknown(kvBlock.getInputTargetBlock("VALUE"));
              if (key && value !== undefined) jsonObj[key] = value;
            }
            kvBlock = kvBlock.getNextBlock();
          }
          if (Object.keys(jsonObj).length > 0) params[p.name] = jsonObj;
          break;
        }
        case "steps": {
          const nested = readStepChain(block.getInputTargetBlock(fieldKey), catalog);
          if (nested.length > 0) params[p.name] = nested;
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
  if (catalogEntry?.outputs && catalogEntry.outputs.length > 0) {
    storeInMemory = {};
    for (const output of catalogEntry.outputs) {
      storeInMemory[output.name] = "$";
    }
  }

  const expect = readAssertionChain(block.getInputTargetBlock("EXPECT"));

  return {
    type: runtimeStepType,
    description: description || undefined,
    params,
    expect: expect.length > 0 ? expect : undefined,
    store_in_memory: storeInMemory,
  };
}
