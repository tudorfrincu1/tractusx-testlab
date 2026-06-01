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
import { useServiceStore } from "@/store";
import { findCatalogEntry, type BlockCatalog } from "../../blocks";

import { normalizeStepParams } from "../paramNormalizers";
import { makeBlock, setDropdownValue, attachChain } from "../serializationParts";
import { populateAssertions, groupStepsWithAssertions, assertionStepToInlineValidation } from "./assertions";
import { deserializePreconditionPolicyBlock } from "../serialize";
import { trackStepOutputs, type StepOutputMap } from "./stepOutputTracker";
import { resolveParamPopulator } from "./paramPopulators";

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

  const buildImportVariableBlock = (step: Step & { uses: string; with?: Record<string, unknown> }): Block | null => {
    if ((step.uses !== "util/import_variable" && step.uses !== "import_variable") || (!step.with?.file && !step.with?.test)) {
      return null;
    }
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
    return ib;
  };

  const buildExportVariableBlock = (step: Step & { uses: string; with?: Record<string, unknown> }): Block | null => {
    if ((step.uses !== "util/export_env" && step.uses !== "export_variable") || !step.with?.name) {
      return null;
    }
    const eb = makeBlock(ws, "export_variable");
    setDropdownValue(eb, "VAR_NAME", String(step.with.name));
    return eb;
  };

  const buildLoadSchemaBlock = (step: Step & { uses: string; with?: Record<string, unknown> }): Block | null => {
    if (step.uses !== "load_schema" || step.with?.source !== "file" || !step.with?.path) {
      return null;
    }
    const sb = makeBlock(ws, "schema_import");
    setDropdownValue(sb, "SCHEMA_PATH", String(step.with.path));
    sb.setFieldValue(String(step.with.name || "schema_var"), "OUTPUT_SCHEMA");
    return sb;
  };

  const stepOutputs: StepOutputMap = new Map();

  const resolveCatalogStepType = (step: Step & { uses: string; with?: Record<string, unknown> }): string => {
    const catalogStepType = step.uses;
    if (catalogStepType === "query_catalog" || catalogStepType === "connector/consumer/query_catalog") {
      const filterExpr = (step.with?.filter as Record<string, unknown> | undefined)?.filter_expression;
      if (Array.isArray(filterExpr) && filterExpr.length >= 2) {
        return "connector/consumer/query_catalog_with_filters";
      }
    }
    return catalogStepType;
  };

  const buildGenericStepBlock = (
    step: StepDefinition,
    assertions: StepDefinition[],
  ): Block | null => {
    const catalogStepType = resolveCatalogStepType(step);
    const entry = findCatalogEntry(catalogStepType, catalog);
    if (!entry) return null;

    const effectiveParams = normalizeStepParams(entry.type, step.with ?? {});
    const blockType = `step_${entry.type}`;
    const sb = makeBlock(ws, blockType);
    if (step.id) sb.setFieldValue(step.id, "STEP_ID");
    sb.setFieldValue(step.name || "", "DESCRIPTION");

    const returns = step.returns;
    if (returns && typeof returns === "object") {
      sb.data = JSON.stringify({ returns });
    }

    for (const p of entry.params) {
      const paramVal = effectiveParams[p.name];
      if (paramVal === undefined || paramVal === null) continue;
      const fieldKey = `PARAM_${p.name.toUpperCase()}`;
      const populateParam = resolveParamPopulator(p.type);
      populateParam({
        ws,
        stepBlock: sb,
        fieldKey,
        paramValue: paramVal,
        paramDefinition: p,
        effectiveParams,
        stepOutputs,
        buildStepBlocks,
      });
    }

    if (step.validate && step.validate.length > 0) {
      populateAssertions(ws, sb, step.validate);
    }

    if (assertions.length > 0) {
      const inlineAssertions = assertions.map(assertionStepToInlineValidation);
      populateAssertions(ws, sb, inlineAssertions);
    }

    trackStepOutputs(sb, step, catalog, stepOutputs);
    return sb;
  };

  const handleStepError = (step: Step, err: unknown, blocks: Block[]) => {
    const stepType = isTemplateStep(step) ? step.template : step.uses;
    const stepDesc = isTemplateStep(step) ? step.description ?? "" : step.name ?? "";
    if (import.meta.env.DEV) {
      console.warn(`[populateTest] Skipping step "${stepDesc}" (type: ${stepType}):`, err);
    }
    try {
      blocks.push(createUnsupportedStepBlock(isTemplateStep(step) ? undefined : step.id, stepDesc, stepType ?? "unknown", isTemplateStep(step) ? step.params : step.with));
    } catch {
      // Last-resort: skip the step entirely if even the fallback fails
    }
  };

  const buildStepBlocks = (steps: Step[]): Block[] => {
    const blocks: Block[] = [];
    const groups = groupStepsWithAssertions(steps);

    for (const { step, assertions } of groups) {
      try {
        if (isTemplateStep(step)) {
          blocks.push(createUnsupportedStepBlock(undefined, step.description, step.template, step.params));
          continue;
        }

        const specialBlock = buildImportVariableBlock(step) || buildExportVariableBlock(step) || buildLoadSchemaBlock(step);
        if (specialBlock) { blocks.push(specialBlock); continue; }

        if (step.uses === "precondition_policy_config") {
          blocks.push(deserializePreconditionPolicyBlock(ws, step));
          continue;
        }

        const genericBlock = buildGenericStepBlock(step, assertions);
        if (genericBlock) {
          blocks.push(genericBlock);
        } else {
          blocks.push(createUnsupportedStepBlock(step.id, step.name, step.uses, step.with));
        }
      } catch (err) {
        handleStepError(step, err, blocks);
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
