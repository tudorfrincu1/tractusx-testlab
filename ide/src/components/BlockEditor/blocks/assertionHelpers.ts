/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
import { findCatalogEntry, type BlockCatalog } from "./catalogLoader";
import type { PathSegment } from "./pathBuilder";

/** Pencil icon as SVG data URI for the path edit button. */
export const ICON_EDIT_PENCIL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">' +
  '<path fill="#80deea" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 ' +
  '7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 ' +
  '1.83 3.75 3.75 1.84-1.82z"/></svg>'
)}`;

/** Internal type for blocks that store segment data. */
export interface BlockWithSegments {
  __segments?: PathSegment[];
}

/** Resolve the JSON schema from the parent step's first output in the catalog. */
export function resolveParentStepSchema(
  block: Block,
  catalog: BlockCatalog,
): Record<string, unknown> | undefined {
  let parent = block.getSurroundParent();
  while (parent && !parent.type.startsWith("step_")) {
    parent = parent.getSurroundParent();
  }
  if (!parent) return undefined;
  const stepType = parent.type.replace(/^step_/, "");
  const entry = findCatalogEntry(stepType, catalog);
  if (!entry?.outputs || entry.outputs.length === 0) return undefined;
  return entry.outputs[0].schema;
}

/** Collect output names from the parent step block's catalog entry. */
export function collectParentOutputs(block: Block, catalog: BlockCatalog): Array<[string, string]> {
  let parent = block.getSurroundParent();
  while (parent && !parent.type.startsWith("step_")) {
    parent = parent.getSurroundParent();
  }
  if (!parent) return [["(no outputs)", "__NONE__"]];
  const stepType = parent.type.replace(/^step_/, "");
  const entry = findCatalogEntry(stepType, catalog);
  if (!entry?.outputs || entry.outputs.length === 0) return [["(no outputs)", "__NONE__"]];
  return entry.outputs.map((o) => [o.name, o.name] as [string, string]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function outputDropdown(catalog: BlockCatalog): (this: any) => Array<[string, string]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any): Array<[string, string]> {
    const b = this.getSourceBlock?.();
    if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) {
      const cur = this.getValue?.() ?? "";
      if (cur && cur !== "__NONE__") return [[cur, cur]];
      return [["—", "__NONE__"]];
    }
    const options = collectParentOutputs(b, catalog);
    const currentVal = this.getValue?.() ?? "";
    if (
      currentVal &&
      currentVal !== "__NONE__" &&
      !options.some(([, v]: [string, string]) => v === currentVal)
    ) {
      options.unshift([currentVal, currentVal]);
    }
    return options;
  };
}
