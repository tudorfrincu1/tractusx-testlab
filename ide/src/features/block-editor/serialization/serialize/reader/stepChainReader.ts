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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import type { Block } from "blockly";
import type { Step } from "@/models/schema";
import { type BlockCatalog } from "../../../blocks";
import { serializePreconditionPolicyBlock } from "../writer/preconditionSerializers";
import {
  serializeExportVariable,
  serializeImportVariable,
  serializeSchemaImport,
  serializeUnsupportedStep,
  serializeOperationOrTemplate,
} from "../writer/utilityStepSerializers";
import { blockToStep } from "../writer/blockToStepSerializer";
import { flattenValidateToSteps } from "../validation/validateBlockFlattener";

/** Walk a vertical chain of step blocks and serialize each into a v2 step. */
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
