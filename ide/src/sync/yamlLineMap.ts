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

  let insideStepArray = false;
  let stepArrayIndent = -1;
  let itemIndent = -1;
  let currentItemStart = -1;
  let currentItemType: string | null = null;

  const stepArrayPattern = /^(\s*)(setup|steps|cleanup)\s*:/;
  const listItemPattern = /^(\s*)-\s/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const arrayMatch = line.match(stepArrayPattern);
    if (arrayMatch) {
      const result = flushMatch(lines);
      if (result) return result;
      insideStepArray = true;
      stepArrayIndent = arrayMatch[1].length;
      itemIndent = -1;
      currentItemStart = -1;
      currentItemType = null;
      continue;
    }

    if (!insideStepArray) continue;
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const lineIndent = line.search(/\S/);
    if (lineIndent !== -1 && lineIndent <= stepArrayIndent) {
      const result = flushMatch(lines);
      if (result) return result;
      insideStepArray = false;
      continue;
    }

    const itemMatch = line.match(listItemPattern);
    if (itemMatch && itemMatch[1].length > stepArrayIndent) {
      if (itemIndent === -1) {
        itemIndent = itemMatch[1].length;
      }
      if (itemMatch[1].length === itemIndent) {
        const result = flushMatch(lines);
        if (result) return result;

        currentItemStart = i;
        currentItemType = null;
        continue;
      }
    }

    if (currentItemStart !== -1) {
      const typeMatch = line.match(/^\s*type:\s*(.+)/);
      if (typeMatch) {
        currentItemType = typeMatch[1].replace(/^["']|["']$/g, "").trim();
      }
    }
  }

  return flushMatch(lines) ?? null;

  function flushMatch(allLines: string[]): YamlLineRange | null {
    if (currentItemStart === -1 || currentItemType !== stepType) return null;

    const endLine = findItemEndLine(allLines, currentItemStart, itemIndent);
    const range: YamlLineRange = {
      startLine: currentItemStart + 1,
      endLine: endLine + 1,
    };

    currentItemStart = -1;
    currentItemType = null;
    return range;
  }
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
