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
import type { Step, StepDefinition, ScriptDefinition } from "@/models/schema";
import { isTemplateStep } from "@/models/schema";
import { useServiceStore } from "@/store/environment/useServiceStore";
import { findCatalogEntry, type BlockCatalog } from "../../blocks";

import { normalizeStepParams } from "../paramNormalizers";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  toBlockValueString,
  createArrayItemBlocks,
  createValueBlockFromString,
} from "../helpers";
import { populateAssertions } from "./populateAssertions";
import { groupStepsWithAssertions, assertionStepToInlineValidation } from "./assertionGrouping";
import { populateFilterExpressions } from "./populateFilterExpressions";
import { deserializePreconditionPolicyBlock } from "../serialize/preconditionSerializers";
import { truncateJsonPreview } from "../../blocks";
import { trackStepOutputs, createValueBlockWithOutputResolution, type StepOutputMap } from "./stepOutputTracker";

export function populateTest(ws: Workspace, root: Block, script: ScriptDefinition, catalog: BlockCatalog) {
  const createUnsupportedStepBlock = (
    stepId: string | undefined,
    stepDescription: string | undefined,
    originalType: string,
    params: Record<string, unknown> | undefined
  ): Block => {
    const block = makeBlock(ws, "unsupported_step");
    block.setFieldValue(stepId || "", "STEP_ID");
    block.data = JSON.stringify({
      originalType: originalType,
      paramsJson: JSON.stringify(params ?? {}),
      stepDescription: stepDescription || "",
    });
    return block;
  };

  const stepOutputs: StepOutputMap = new Map();

  const buildStepBlocks = (steps: Step[]): Block[] => {
    const blocks: Block[] = [];
    const groups = groupStepsWithAssertions(steps);

    for (const { step, assertions } of groups) {
      try {
        if (isTemplateStep(step)) {
          blocks.push(createUnsupportedStepBlock(step.id, step.description, step.template, step.params));
          continue;
        }

        if ((step.uses === "util/import_variable" || step.uses === "import_variable") && (step.with?.file || step.with?.test)) {
          const ib = makeBlock(ws, "import_variable");
          const fileValue = step.with.file
            ? String(step.with.file)
            : `tests/${String(step.with.test)}.yaml`;
          setDropdownValue(ib, "FILE", fileValue);
          const exportVar = step.with.export || step.with.select;
          if (exportVar) {
            setDropdownValue(ib, "EXPORT_VAR", String(exportVar));
          } else if (Array.isArray(step.with.outputs) && step.with.outputs.length > 0) {
            setDropdownValue(ib, "EXPORT_VAR", String(step.with.outputs[0]));
          }
          const varName = step.with.store_in_variable || step.with.variable || exportVar || "imported_var";
          ib.setFieldValue(String(varName), "OUTPUT_VAR");
          blocks.push(ib);
          continue;
        }

        if ((step.uses === "util/export_env" || step.uses === "export_variable") && step.with?.name) {
          const eb = makeBlock(ws, "export_variable");
          setDropdownValue(eb, "VAR_NAME", String(step.with.name));
          blocks.push(eb);
          continue;
        }

        if (step.uses === "load_schema" && step.with?.source === "file" && step.with?.path) {
          const sb = makeBlock(ws, "schema_import");
          setDropdownValue(sb, "SCHEMA_PATH", String(step.with.path));
          sb.setFieldValue(String(step.with.name || "schema_var"), "OUTPUT_SCHEMA");
          blocks.push(sb);
          continue;
        }

        if (step.uses === "precondition_policy_config") {
          blocks.push(deserializePreconditionPolicyBlock(ws, step));
          continue;
        }

        let catalogStepType = step.uses;

        // Auto-upgrade: query_catalog with 2+ filter expressions → query_catalog_with_filters
        if (catalogStepType === "query_catalog" || catalogStepType === "connector/consumer/query_catalog") {
          const filterExpr = (step.with?.filter as Record<string, unknown> | undefined)?.filter_expression;
          if (Array.isArray(filterExpr) && filterExpr.length >= 2) {
            catalogStepType = "connector/consumer/query_catalog_with_filters";
          }
        }

        const entry = findCatalogEntry(catalogStepType, catalog);
        if (!entry) {
          blocks.push(createUnsupportedStepBlock(step.id, step.name, step.uses, step.with));
          continue;
        }

        const effectiveParams = normalizeStepParams(entry.type, step.with ?? {});

        const blockType = `step_${entry.type}`;
        const sb = makeBlock(ws, blockType);
        if (step.id) {
          sb.setFieldValue(step.id, "STEP_ID");
        }
        sb.setFieldValue(step.name || "", "DESCRIPTION");

        // Store custom returns as data on the block for roundtrip fidelity
        const returns = step.returns;
        if (returns && typeof returns === "object") {
          sb.data = JSON.stringify({ returns: returns });
        }

        for (const p of entry.params) {
          const paramVal = effectiveParams[p.name];
          if (paramVal === undefined || paramVal === null) continue;
          const fieldKey = `PARAM_${p.name.toUpperCase()}`;

          switch (p.type) {
            case "dropdown":
            case "endpoint_ref":
            case "schema_path":
            case "precondition_ref":
              setDropdownValue(sb, fieldKey, String(paramVal));
              break;
            case "variable": {
              let val = String(paramVal);
              if (val.startsWith("@")) val = val.slice(1);
              else {
                const varsMatch = /^\$\{\{\s*vars\.(.+?)\s*\}\}$/.exec(val);
                if (varsMatch) val = varsMatch[1];
              }
              setDropdownValue(sb, fieldKey, val);
              break;
            }
            case "text":
              sb.setFieldValue(String(paramVal), fieldKey);
              break;
            case "number":
              sb.setFieldValue(Number(paramVal), fieldKey);
              break;
            case "json":
              if (typeof paramVal === "string" && /^\$\{\{\s*.+?\s*\}\}$/.test(paramVal)) {
                const varBlock = createValueBlockFromString(ws, paramVal);
                connectValue(sb, fieldKey, varBlock);
              } else if (typeof paramVal === "object") {
                const vjb = makeBlock(ws, "value_json");
                const jsonStr = JSON.stringify(paramVal, null, 2);
                vjb.setFieldValue(jsonStr, "JSON_VALUE");
                vjb.setFieldValue(truncateJsonPreview(jsonStr), "JSON_PREVIEW");
                connectValue(sb, fieldKey, vjb);
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
            case "filter_expression_list": {
              // Direct array format (e.g. pull_data_filtered_from_precondition)
              if (Array.isArray(paramVal)) {
                const filterBlocks = populateFilterExpressions(ws, paramVal, stepOutputs);
                attachChain(sb, fieldKey, filterBlocks);
              } else {
                // Nested format: effectiveParams.filter.filter_expression (query_catalog_with_filters)
                const filterObj = effectiveParams.filter as Record<string, unknown> | undefined;
                if (filterObj && typeof filterObj === "object") {
                  const expressions = filterObj.filter_expression;
                  if (Array.isArray(expressions)) {
                    const filterBlocks = populateFilterExpressions(ws, expressions, stepOutputs);
                    attachChain(sb, fieldKey, filterBlocks);
                  }
                }
              }
              break;
            }
            case "json_path": {
              const jpb = makeBlock(ws, "value_json_path");
              jpb.setFieldValue(String(paramVal), "VALUE");
              connectValue(sb, fieldKey, jpb);
              break;
            }
            case "api_path": {
              const apb = makeBlock(ws, "value_api_path");
              apb.setFieldValue(String(paramVal), "PATH");
              connectValue(sb, fieldKey, apb);
              break;
            }
            default:
              connectValue(sb, fieldKey, createValueBlockWithOutputResolution(ws, toBlockValueString(paramVal), stepOutputs));
              break;
          }
        }

        if (step.validate && step.validate.length > 0) {
          populateAssertions(ws, sb, step.validate);
        }

        // Attach grouped v2 assertion steps (validate/assert) to this step's EXPECT chain
        if (assertions.length > 0) {
          const inlineAssertions = assertions.map(assertionStepToInlineValidation);
          populateAssertions(ws, sb, inlineAssertions);
        }

        trackStepOutputs(sb, step, catalog, stepOutputs);
        blocks.push(sb);
      } catch (err) {
        const stepType = isTemplateStep(step) ? step.template : step.uses;
        const stepDesc = isTemplateStep(step) ? step.description ?? "" : step.name ?? "";
        if (import.meta.env.DEV) {
          console.warn(
            `[populateTest] Skipping step "${stepDesc}" (type: ${stepType}):`,
            err,
          );
        }
        try {
          blocks.push(
            createUnsupportedStepBlock(
              step.id,
              stepDesc,
              stepType ?? "unknown",
              isTemplateStep(step) ? step.params : step.with,
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
