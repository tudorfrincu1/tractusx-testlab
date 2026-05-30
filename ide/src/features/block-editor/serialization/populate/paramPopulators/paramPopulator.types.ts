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

import type { Block, Workspace } from "blockly";
import type { StepDefinition } from "@/models/schema";
import type { BlockCatalogParam } from "../../../blocks";
import type { StepOutputMap } from "../stepOutputTracker";

/**
 * Everything a single param populator needs to write one catalog param value
 * onto a step block: the workspace, the target block + field, the value and its
 * catalog definition, the shared step-output map, the params already normalized
 * for the step, and the recursive step-block builder (used by nested `steps`).
 */
export interface ParamPopulatorContext {
  ws: Workspace;
  stepBlock: Block;
  fieldKey: string;
  paramValue: unknown;
  paramDefinition: BlockCatalogParam;
  effectiveParams: Record<string, unknown>;
  stepOutputs: StepOutputMap;
  buildStepBlocks: (steps: StepDefinition[]) => Block[];
}

/** Applies one catalog param value to its step block field, by param type. */
export type ParamPopulator = (context: ParamPopulatorContext) => void;
