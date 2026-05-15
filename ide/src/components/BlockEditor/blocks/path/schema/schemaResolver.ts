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

import type { Workspace } from "blockly";
import type { BlockCatalog, BlockCatalogOutput } from "../../common/catalog/catalogLoader";
import { findCatalogEntry } from "../../common/catalog/catalogLoader";

/**
 * Find the catalog output entry that produces `variableName` by scanning
 * the actual step blocks present in the workspace.
 */
function findOutputForVariable(
  variableName: string,
  workspace: Workspace,
  catalog: BlockCatalog,
): BlockCatalogOutput | undefined {
  const stepBlocks = workspace.getAllBlocks(false)
    .filter((b) => b.type.startsWith("step_"));

  for (const block of stepBlocks) {
    const entry = findCatalogEntry(block.type, catalog);
    if (!entry?.outputs) continue;
    const match = entry.outputs.find((o) => o.name === variableName);
    if (match) return match;
  }
  return undefined;
}

/** Resolve a variable name to its source block's output JSON Schema. */
export function resolveVariableSchema(
  variableName: string,
  workspace: Workspace,
  catalog: BlockCatalog,
): Record<string, unknown> | undefined {
  return findOutputForVariable(variableName, workspace, catalog)?.schema;
}

/** Resolve a variable name to its source block's output example value. */
export function resolveVariableExample(
  variableName: string,
  workspace: Workspace,
  catalog: BlockCatalog,
): unknown | undefined {
  return findOutputForVariable(variableName, workspace, catalog)?.example;
}
