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

/** Segment types for the path builder. */
export type SegmentType = "key" | "index";

export interface PathSegment {
  type: SegmentType;
  value: string;
}

export interface PathBuilderRequest {
  blockId: string;
  segments: PathSegment[];
  position: { x: number; y: number };
  sourceVariable?: string;
  sourceSchema?: Record<string, unknown>;
}

const DEFAULT_PATH = "items.0.id";

let _onOpenPathBuilder: ((req: PathBuilderRequest) => void) | null = null;

/**
 * Registers a callback invoked when the edit button on a value_json_path block is clicked.
 * Returns a cleanup function.
 */
export function setupPathBuilderCallback(
  onOpen: (req: PathBuilderRequest) => void,
): () => void {
  _onOpenPathBuilder = onOpen;
  return () => { _onOpenPathBuilder = null; };
}

/** Fire the registered callback to open the path builder modal. */
export function requestOpenPathBuilder(req: PathBuilderRequest): void {
  _onOpenPathBuilder?.(req);
}

/** Characters that allow a key to use simple dot notation. */
const SIMPLE_KEY_RE = /^[a-zA-Z_@][a-zA-Z0-9_\-@]*$/;

/** Check whether a key can be represented with dot notation. */
function isSimpleKey(key: string): boolean {
  return SIMPLE_KEY_RE.test(key);
}

/**
 * Parse a path string (with bracket notation support) into typed segments.
 *
 * Supported notations:
 * - `foo` / `.bar` — simple key (dot notation)
 * - `[0]` — numeric index
 * - `['complex.key']` — bracket-quoted key (single quotes)
 */
export function parsePathToSegments(path: string): PathSegment[] {
  if (!path) return [];

  const segments: PathSegment[] = [];
  let i = 0;

  while (i < path.length) {
    if (path[i] === ".") i++;
    if (i >= path.length) break;

    if (path[i] === "[") {
      i++;
      const result = path[i] === "'"
        ? parseBracketQuotedKey(path, i)
        : parseBracketIndex(path, i);
      segments.push(result.segment);
      i = result.nextIndex;
    } else {
      const result = parseDotKey(path, i);
      if (result.segment) segments.push(result.segment);
      i = result.nextIndex;
    }
  }

  return segments;
}

/** Parse a bracket-quoted key segment: `['complex.key']` starting after the opening `'`. */
function parseBracketQuotedKey(path: string, startAfterBracket: number): { segment: PathSegment; nextIndex: number } {
  let i = startAfterBracket + 1; // skip opening quote
  let value = "";
  while (i < path.length) {
    if (path[i] === "'" && i + 1 < path.length && path[i + 1] === "]") break;
    if (path[i] === "\\" && i + 1 < path.length) {
      i++;
      value += path[i];
    } else {
      value += path[i];
    }
    i++;
  }
  return { segment: { type: "key", value }, nextIndex: i + 2 };
}

/** Parse a numeric index segment: `[0]` starting after the `[`. */
function parseBracketIndex(path: string, start: number): { segment: PathSegment; nextIndex: number } {
  let i = start;
  let value = "";
  while (i < path.length && path[i] !== "]") {
    value += path[i];
    i++;
  }
  return { segment: { type: "index", value }, nextIndex: i + 1 };
}

/** Parse a simple dot-notation key starting at `start`. */
function parseDotKey(path: string, start: number): { segment: PathSegment | null; nextIndex: number } {
  let i = start;
  let value = "";
  while (i < path.length && path[i] !== "." && path[i] !== "[") {
    value += path[i];
    i++;
  }
  if (!value) return { segment: null, nextIndex: i };
  const type = /^\d+$/.test(value) ? "index" : "key";
  return { segment: { type, value }, nextIndex: i };
}

/**
 * Assemble segments into a path string using bracket notation for complex keys.
 *
 * Rules:
 * - Index segments → `[N]`
 * - Simple keys → `.key` (first segment omits the leading dot)
 * - Complex keys (containing dots, colons, slashes, etc.) → `['key']`
 */
export function segmentsToPath(segments: PathSegment[]): string {
  let result = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === "index") {
      result += `[${seg.value}]`;
    } else if (isSimpleKey(seg.value)) {
      result += i === 0 ? seg.value : `.${seg.value}`;
    } else {
      const escaped = seg.value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      result += `['${escaped}']`;
    }
  }
  return result;
}

/** Default segments shown on a new block. */
export function defaultSegments(): PathSegment[] {
  return parsePathToSegments(DEFAULT_PATH);
}
