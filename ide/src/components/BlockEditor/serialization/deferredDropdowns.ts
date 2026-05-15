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

/**
 * Deferred dropdown queue for YAML import.
 *
 * During bulk block creation, Blockly's render pass triggers field validation
 * on every FieldDropdown. For variable dropdowns, validation calls getOptions()
 * → collectWorkspaceVariables() which may return incomplete results because not
 * all blocks exist yet. Validation then reverts the value to "__NONE__".
 *
 * This queue records every intended dropdown value during block creation so it
 * can be re-applied AFTER all blocks are created and rendered.
 */

interface DeferredEntry {
  blockId: string;
  fieldName: string;
  value: string;
}

const queue: DeferredEntry[] = [];

/** Record a dropdown value for deferred re-application after render. */
export function enqueue(blockId: string, fieldName: string, value: string): void {
  queue.push({ blockId, fieldName, value });
}

/**
 * Re-apply all queued dropdown values with validation bypassed.
 * Call this AFTER all blocks have been created and rendered.
 */
export function flush(ws: Workspace): void {
  const entries = queue.splice(0);
  for (const { blockId, fieldName, value } of entries) {
    const block = ws.getBlockById(blockId);
    if (!block) continue;
    const field = block.getField(fieldName);
    if (!field) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = field as any;
    const original = f.doClassValidation_;
    f.doClassValidation_ = (v: string) => v;
    try {
      field.setValue(value);
    } finally {
      f.doClassValidation_ = original;
    }
    if (typeof f.getOptions === "function") {
      f.getOptions(true);
      const opts = f.getOptions(false) as Array<[string, string]>;
      const match = opts.find(([, v]: [string, string]) => v === value);
      f.selectedOption = match ?? [value, value];
      if (typeof f.forceRerender === "function") f.forceRerender();
    }
  }
}

/** Discard any queued entries without applying them. */
export function clear(): void {
  queue.length = 0;
}
