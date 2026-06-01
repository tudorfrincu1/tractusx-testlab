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
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

export interface YamlLineRange {
  startLine: number;
  endLine: number;
}

/**
 * Finds the 1-based line range for a step with the given type inside a YAML
 * string. Scans `setup:`, `steps:`, and `teardown:` arrays for `- type:` items
 * whose `type:` field matches `stepType`.
 *
 * Returns `null` when no matching step is found.
 */
export function findStepLineRange(yaml: string, stepType: string): YamlLineRange | null {
  const lines = yaml.split("\n");
  const state = createScanState();

  for (let i = 0; i < lines.length; i++) {
    const result = scanLine(state, lines, i, stepType);
    if (result) return result;
  }

  return tryFlush(state, lines, stepType);
}

/**
 * Processes a single YAML line, updating the scan state. Returns a matching
 * range when the current step item is flushed and matches `stepType`, otherwise
 * `null` to continue scanning.
 */
function scanLine(state: ScanState, lines: string[], i: number, stepType: string): YamlLineRange | null {
  const line = lines[i];

  const arrayMatch = line.match(STEP_ARRAY_PATTERN);
  if (arrayMatch) {
    const result = tryFlush(state, lines, stepType);
    if (result) return result;
    resetToNewArray(state, arrayMatch[1].length);
    return null;
  }

  if (!state.insideStepArray) return null;
  if (line.trim() === "" || line.trim().startsWith("#")) return null;

  const lineIndent = line.search(/\S/);
  if (lineIndent !== -1 && lineIndent <= state.stepArrayIndent) {
    const result = tryFlush(state, lines, stepType);
    if (result) return result;
    state.insideStepArray = false;
    return null;
  }

  const itemOutcome = handleListItem(state, lines, i, line, stepType);
  if (itemOutcome === "consumed") return null;
  if (itemOutcome) return itemOutcome;

  captureItemType(state, line);
  return null;
}

/**
 * Handles a `- ` list-item line. Returns a flushed range, the marker
 * `"consumed"` when a new item started, or `null` when the line is not a
 * top-level item start.
 */
function handleListItem(
  state: ScanState,
  lines: string[],
  i: number,
  line: string,
  stepType: string,
): YamlLineRange | "consumed" | null {
  const itemMatch = line.match(LIST_ITEM_PATTERN);
  if (itemMatch && itemMatch[1].length > state.stepArrayIndent) {
    if (state.itemIndent === -1) state.itemIndent = itemMatch[1].length;
    if (itemMatch[1].length === state.itemIndent) {
      const result = tryFlush(state, lines, stepType);
      if (result) return result;
      state.currentItemStart = i;
      state.currentItemType = null;
      return "consumed";
    }
  }
  return null;
}

/** Records the `type:` field of the current item when present. */
function captureItemType(state: ScanState, line: string): void {
  if (state.currentItemStart !== -1) {
    const typeMatch = line.match(TYPE_FIELD_PATTERN);
    if (typeMatch) {
      state.currentItemType = typeMatch[1].replace(/^["']|["']$/g, "").trim();
    }
  }
}

const STEP_ARRAY_PATTERN = /^(\s*)(setup|steps|cleanup)\s*:/;
const LIST_ITEM_PATTERN = /^(\s*)-\s/;
const TYPE_FIELD_PATTERN = /^\s*type:\s*(.+)/;

interface ScanState {
  insideStepArray: boolean;
  stepArrayIndent: number;
  itemIndent: number;
  currentItemStart: number;
  currentItemType: string | null;
}

function createScanState(): ScanState {
  return { insideStepArray: false, stepArrayIndent: -1, itemIndent: -1, currentItemStart: -1, currentItemType: null };
}

function resetToNewArray(state: ScanState, indent: number): void {
  state.insideStepArray = true;
  state.stepArrayIndent = indent;
  state.itemIndent = -1;
  state.currentItemStart = -1;
  state.currentItemType = null;
}

function tryFlush(state: ScanState, lines: string[], stepType: string): YamlLineRange | null {
  if (state.currentItemStart === -1 || state.currentItemType !== stepType) return null;

  const endLine = findItemEndLine(lines, state.currentItemStart, state.itemIndent);
  const range: YamlLineRange = {
    startLine: state.currentItemStart + 1,
    endLine: endLine + 1,
  };

  state.currentItemStart = -1;
  state.currentItemType = null;
  return range;
}

function findItemEndLine(lines: string[], startIdx: number, itemIndent: number): number {
  const contentIndent = itemIndent + 2;
  let lastContentLine = startIdx;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const indent = line.search(/\S/);
    if (indent < contentIndent) break;

    lastContentLine = i;
  }

  return lastContentLine;
}
