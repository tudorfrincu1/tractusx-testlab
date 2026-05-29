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

import type { Block } from "blockly";
import type { StepDefinition } from "@/models/schema";
import { readValueBlockAsString } from "../helpers";
import { parseUnsupportedParams } from "../unsupportedStepPayload";
import { parseJsonWithVarRefs } from "../../blocks/json/modal/jsonVarRefs";

interface UnsupportedBlockData {
  originalType: string;
  paramsJson: string;
  stepDescription: string;
}

function parseBlockData(data: string | null): UnsupportedBlockData {
  if (!data) return { originalType: "", paramsJson: "{}", stepDescription: "" };
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      return {
        originalType: typeof obj.originalType === "string" ? obj.originalType : "",
        paramsJson: typeof obj.paramsJson === "string" ? obj.paramsJson : "{}",
        stepDescription: typeof obj.stepDescription === "string" ? obj.stepDescription : "",
      };
    }
  } catch { /* fallback */ }
  return { originalType: "", paramsJson: "{}", stepDescription: "" };
}
import { emitVarRef } from "../varSyntax";

export function serializeExportVariable(block: Block): StepDefinition | null {
  const varName = block.getFieldValue("VAR_NAME");
  if (!varName || varName === "__NONE__") return null;
  return {
    id: "",
    uses: "util/export_env",
    name: `Export ${varName}`,
    with: { name: varName, value: emitVarRef("steps", varName) },
  } as StepDefinition;
}

export function serializeImportVariable(block: Block): StepDefinition | null {
  const file = block.getFieldValue("FILE") || "";
  const exportVar = block.getFieldValue("EXPORT_VAR") || "";
  const outputVar = block.getFieldValue("OUTPUT_VAR") || exportVar;
  if (!file || file === "__NONE__" || !exportVar || exportVar === "__NONE__") return null;
  const testName = file.replace(/^tests\//, "").replace(/\.yaml$/, "");
  return {
    id: "",
    uses: "import_variable",
    name: `Import ${exportVar} from ${testName}`,
    with: { test: testName, select: exportVar, store_in_variable: outputVar },
  } as StepDefinition;
}

export function serializeSchemaImport(block: Block): StepDefinition | null {
  const schemaPath = block.getFieldValue("SCHEMA_PATH") || "";
  const varName = block.getFieldValue("OUTPUT_SCHEMA") || "schema_var";
  if (!schemaPath || schemaPath === "__NONE__") return null;
  return {
    id: "",
    uses: "load_schema",
    name: `Load ${varName}`,
    with: { name: varName, source: "file", path: schemaPath },
    returns: { [varName]: "$" },
  } as unknown as StepDefinition;
}

export function serializeUnsupportedStep(block: Block, knownOutputs: ReadonlySet<string>): StepDefinition {
  const blockData = parseBlockData(block.data);
  const originalType = blockData.originalType || "unsupported_step";
  const stepDescription = blockData.stepDescription || "";
  const stepId = block.getFieldValue("STEP_ID") || "";
  const paramsJson = blockData.paramsJson || "{}";
  const params = parseUnsupportedParams(paramsJson, knownOutputs);
  return {
    id: stepId,
    uses: originalType,
    name: stepDescription || undefined,
    with: params,
  } as unknown as StepDefinition;
}

export function serializeOperationOrTemplate(block: Block, knownOutputs: ReadonlySet<string>): StepDefinition {
  const blockData = parseBlockData(block.data);
  const originalType = blockData.originalType || block.getFieldValue("OPERATION") || block.getFieldValue("PARAM_TEMPLATE") || "unsupported_step";
  const stepDescription = blockData.stepDescription || block.getFieldValue("DESCRIPTION") || "";
  const stepId = block.getFieldValue("STEP_ID") || "";
  const params: Record<string, unknown> = {};
  let kvBlock = block.getInputTargetBlock("PARAMS");
  while (kvBlock) {
    if (kvBlock.type === "key_value_pair") {
      const key = kvBlock.getFieldValue("KEY") || "";
      const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
      if (key) params[key] = value;
    } else if (kvBlock.type === "value_json") {
      const raw = kvBlock.getFieldValue("JSON_VALUE") || "{}";
      try {
        const parsed: unknown = parseJsonWithVarRefs(raw, knownOutputs);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          Object.assign(params, parsed as Record<string, unknown>);
        }
      } catch {
        // Invalid JSON stored — skip
      }
    }
    kvBlock = kvBlock.getNextBlock();
  }
  return {
    id: stepId,
    uses: originalType,
    name: stepDescription || undefined,
    with: params,
  } as unknown as StepDefinition;
}
