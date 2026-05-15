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
import type { Step, StepDefinition, ScriptDefinition } from "../../../../models/schema";
import { isTemplateStep } from "../../../../models/schema";
import { useServiceStore } from "../../../../store/slices/useServiceStore";
import { findCatalogEntry, type BlockCatalog } from "../../blocks";
import { toCatalogStepType } from "../stepTypeAliases";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
  toBlockValueString,
  createArrayItemBlocks,
} from "../helpers";
import { populateAssertions } from "./populateAssertions";
import { deserializePreconditionPolicyBlock } from "../serialize/preconditionSerializers";
import { truncateJsonPreview } from "../../blocks";

export function populateTest(ws: Workspace, root: Block, script: ScriptDefinition, catalog: BlockCatalog) {
  const createUnsupportedStepBlock = (
    stepDescription: string | undefined,
    originalType: string,
    params: Record<string, unknown> | undefined
  ): Block => {
    const block = makeBlock(ws, "unsupported_step");
    block.setFieldValue(stepDescription || "", "STEP_DESCRIPTION");
    block.setFieldValue(originalType, "ORIGINAL_TYPE");
    block.setFieldValue(JSON.stringify(params ?? {}), "PARAMS_JSON");
    return block;
  };

  const buildStepBlocks = (steps: Step[]): Block[] => {
    const blocks: Block[] = [];

    for (const step of steps) {
      try {
        if (isTemplateStep(step)) {
          blocks.push(createUnsupportedStepBlock(step.description, step.template, step.params));
          continue;
        }

        if (step.type === "import_variable" && step.params?.file) {
          const ib = makeBlock(ws, "import_variable");
          setDropdownValue(ib, "FILE", String(step.params.file));
          if (step.params.export) {
            setDropdownValue(ib, "EXPORT_VAR", String(step.params.export));
          } else if (Array.isArray(step.params.outputs) && step.params.outputs.length > 0) {
            setDropdownValue(ib, "EXPORT_VAR", String(step.params.outputs[0]));
          }
          const varName = step.params.variable || step.params.export || "imported_var";
          ib.setFieldValue(String(varName), "OUTPUT_VAR");
          blocks.push(ib);
          continue;
        }

        if (step.type === "export_variable" && step.params?.name) {
          const eb = makeBlock(ws, "export_variable");
          setDropdownValue(eb, "VAR_NAME", String(step.params.name));
          blocks.push(eb);
          continue;
        }

        if (step.type === "load_schema" && step.params?.source === "file" && step.params?.path) {
          const sb = makeBlock(ws, "schema_import");
          setDropdownValue(sb, "SCHEMA_PATH", String(step.params.path));
          sb.setFieldValue(String(step.params.name || "schema_var"), "OUTPUT_SCHEMA");
          blocks.push(sb);
          continue;
        }

        if (step.type === "precondition_policy_config") {
          blocks.push(deserializePreconditionPolicyBlock(ws, step));
          continue;
        }

        const catalogStepType = toCatalogStepType(step.type);
        const entry = findCatalogEntry(catalogStepType, catalog);
        if (!entry) {
          blocks.push(createUnsupportedStepBlock(step.description, step.type, step.params));
          continue;
        }

        const effectiveParams = step.params ?? {};

        const blockType = `step_${catalogStepType}`;
        const sb = makeBlock(ws, blockType);
        sb.setFieldValue(step.description || "", "DESCRIPTION");

        for (const p of entry.params) {
          const paramVal = effectiveParams[p.name];
          if (paramVal === undefined || paramVal === null) continue;
          const fieldKey = `PARAM_${p.name.toUpperCase()}`;

          switch (p.type) {
            case "dropdown":
            case "endpoint_ref":
            case "service_ref":
            case "schema_path":
              setDropdownValue(sb, fieldKey, String(paramVal));
              break;
            case "variable": {
              let val = String(paramVal);
              if (val.startsWith("@")) val = val.slice(1);
              setDropdownValue(sb, fieldKey, val);
              break;
            }
            case "number":
              sb.setFieldValue(Number(paramVal), fieldKey);
              break;
            case "json":
              if (typeof paramVal === "object") {
                const entries = Object.entries(paramVal as Record<string, unknown>);
                const hasNested = entries.some(([, v]) =>
                  typeof v === "object" && v !== null,
                );
                if (entries.length > 3 || hasNested) {
                  const vjb = makeBlock(ws, "value_json");
                  const jsonStr = JSON.stringify(paramVal, null, 2);
                  vjb.setFieldValue(jsonStr, "JSON_VALUE");
                  vjb.setFieldValue(truncateJsonPreview(jsonStr), "JSON_PREVIEW");
                  attachChain(sb, fieldKey, [vjb]);
                } else {
                  const kvBlocks: Block[] = [];
                  for (const [key, value] of entries) {
                    const kvb = makeBlock(ws, "key_value_pair");
                    kvb.setFieldValue(key, "KEY");
                    connectValue(kvb, "VALUE", createValueBlockFromString(ws, toBlockValueString(value)));
                    kvBlocks.push(kvb);
                  }
                  attachChain(sb, fieldKey, kvBlocks);
                }
              }
              break;
            case "array":
              if (Array.isArray(paramVal)) {
                const itemBlocks = createArrayItemBlocks(ws, paramVal, p.item_type ?? "");
                attachChain(sb, fieldKey, itemBlocks);
              }
              break;
            case "steps":
              if (Array.isArray(paramVal)) {
                const nestedBlocks = buildStepBlocks(paramVal as StepDefinition[]);
                attachChain(sb, fieldKey, nestedBlocks);
              }
              break;
            case "json_path": {
              const jpb = makeBlock(ws, "value_json_path");
              jpb.setFieldValue(String(paramVal), "VALUE");
              connectValue(sb, fieldKey, jpb);
              break;
            }
            default:
              connectValue(sb, fieldKey, createValueBlockFromString(ws, toBlockValueString(paramVal)));
              break;
          }
        }

        if (step.expect && step.expect.length > 0) {
          populateAssertions(ws, sb, step.expect);
        }

        blocks.push(sb);
      } catch (err) {
        const stepType = isTemplateStep(step) ? step.template : step.type;
        const stepDesc = step.description ?? "";
        // eslint-disable-next-line no-console
        console.warn(
          `[populateTest] Skipping step "${stepDesc}" (type: ${stepType}):`,
          err,
        );
        try {
          blocks.push(
            createUnsupportedStepBlock(
              stepDesc,
              stepType ?? "unknown",
              isTemplateStep(step) ? step.params : step.params,
            ),
          );
        } catch {
          // Last-resort: skip the step entirely if even the fallback fails
        }
      }
    }

    return blocks;
  };

  if (script.services && script.services.length > 0) {
    useServiceStore.getState().setServices(script.services);
  }

  if (script.setup && script.setup.length > 0) {
    attachChain(root, "SETUP", buildStepBlocks(script.setup));
  }
  if (script.steps && script.steps.length > 0) {
    attachChain(root, "STEPS", buildStepBlocks(script.steps));
  }
  if (script.teardown && script.teardown.length > 0) {
    attachChain(root, "TEARDOWN", buildStepBlocks(script.teardown));
  }
}
