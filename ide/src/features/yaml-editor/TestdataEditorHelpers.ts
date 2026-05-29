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

import type * as monaco from "monaco-editor";

const VARIABLE_PATTERN = /\$\{\{[^}]*\}\}/g;

/** Compute all ranges where `${{ ... }}` variables exist in the model */
export function getVariableRanges(
  model: monaco.editor.ITextModel,
  monacoNs: typeof monaco,
): monaco.IRange[] {
  const text = model.getValue();
  const ranges: monaco.IRange[] = [];

  VARIABLE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_PATTERN.exec(text)) !== null) {
    const startPos = model.getPositionAt(match.index);
    const endPos = model.getPositionAt(match.index + match[0].length);
    ranges.push(new monacoNs.Range(
      startPos.lineNumber, startPos.column,
      endPos.lineNumber, endPos.column,
    ));
  }
  return ranges;
}

/** Check if a position falls within any variable range */
export function isInsideVariable(
  position: monaco.IPosition,
  ranges: monaco.IRange[],
): boolean {
  return ranges.some((r) => containsPosition(r, position));
}

/** Get the variable range containing the given position, or null */
export function getVariableRangeAt(
  position: monaco.IPosition,
  ranges: monaco.IRange[],
): monaco.IRange | null {
  return ranges.find((r) => containsPosition(r, position)) ?? null;
}

/** Check if position is immediately after a variable (for Backspace) */
export function getVariableEndingAt(
  position: monaco.IPosition,
  ranges: monaco.IRange[],
): monaco.IRange | null {
  return ranges.find((r) =>
    r.endLineNumber === position.lineNumber && r.endColumn === position.column,
  ) ?? null;
}

/** Check if position is immediately before a variable (for Delete) */
export function getVariableStartingAt(
  position: monaco.IPosition,
  ranges: monaco.IRange[],
): monaco.IRange | null {
  return ranges.find((r) =>
    r.startLineNumber === position.lineNumber && r.startColumn === position.column,
  ) ?? null;
}

function containsPosition(range: monaco.IRange, pos: monaco.IPosition): boolean {
  if (pos.lineNumber < range.startLineNumber || pos.lineNumber > range.endLineNumber) {
    return false;
  }
  if (pos.lineNumber === range.startLineNumber && pos.column < range.startColumn) {
    return false;
  }
  if (pos.lineNumber === range.endLineNumber && pos.column > range.endColumn) {
    return false;
  }
  return true;
}

const NAVIGATION_KEYS = new Set([
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End", "PageUp", "PageDown",
  "Escape", "Tab",
  "F1", "F2", "F3", "F4", "F5", "F6",
  "F7", "F8", "F9", "F10", "F11", "F12",
]);

/** Returns true for keys that don't modify content */
export function isNavigationOrModifierKey(e: monaco.IKeyboardEvent): boolean {
  // Pure modifier keys
  if (e.keyCode === 5 || e.keyCode === 4 || e.keyCode === 6 || e.keyCode === 57) {
    // Shift=4, Ctrl=5, Alt=6, Meta=57
    return true;
  }

  // Allow Ctrl/Cmd combinations for copy, select-all, undo, redo
  if (e.ctrlKey || e.metaKey) {
    return true;
  }

  const keyName = e.browserEvent.key;
  if (NAVIGATION_KEYS.has(keyName)) {
    return true;
  }

  return false;
}
