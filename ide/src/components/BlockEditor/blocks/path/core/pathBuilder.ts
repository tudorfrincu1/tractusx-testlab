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

/** Parse a dot-notation path string into typed segments. */
export function parsePathToSegments(path: string): PathSegment[] {
  if (!path) return [];
  return path.split(".").map((part) => {
    const isIndex = /^\d+$/.test(part);
    return { type: isIndex ? "index" : "key", value: part } as PathSegment;
  });
}

/** Assemble segments into a dot-notation path string. */
export function segmentsToPath(segments: PathSegment[]): string {
  return segments.map((s) => s.value).join(".");
}

/** Default segments shown on a new block. */
export function defaultSegments(): PathSegment[] {
  return parsePathToSegments(DEFAULT_PATH);
}
