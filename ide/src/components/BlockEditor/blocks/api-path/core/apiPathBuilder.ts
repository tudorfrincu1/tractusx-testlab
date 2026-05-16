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

/** Segment types for the API path builder. */
export type ApiSegmentType = "literal" | "variable";

export interface ApiPathSegment {
  type: ApiSegmentType;
  value: string;
}

export interface ApiPathBuilderRequest {
  blockId: string;
  segments: ApiPathSegment[];
  position: { x: number; y: number };
  variables: string[];
}

let _onOpenApiPathBuilder: ((req: ApiPathBuilderRequest) => void) | null = null;

/**
 * Registers a callback invoked when the edit button on an api_path block is clicked.
 * Returns a cleanup function.
 */
export function setupApiPathBuilderCallback(
  onOpen: (req: ApiPathBuilderRequest) => void,
): () => void {
  _onOpenApiPathBuilder = onOpen;
  return () => { _onOpenApiPathBuilder = null; };
}

/** Fire the registered callback to open the API path builder modal. */
export function requestOpenApiPathBuilder(req: ApiPathBuilderRequest): void {
  _onOpenApiPathBuilder?.(req);
}

/** Parse a slash-separated API path string into typed segments. */
export function parseApiPath(path: string): ApiPathSegment[] {
  if (!path) return [];
  return path.replace(/^\//, "").split("/").filter(Boolean).map((part) => {
    const isVar = part.startsWith("@");
    return { type: isVar ? "variable" : "literal", value: isVar ? part.slice(1) : part };
  });
}

/** Assemble segments into a slash-prefixed API path string. */
export function segmentsToApiPath(segments: ApiPathSegment[]): string {
  if (segments.length === 0) return "/";
  return "/" + segments.map((s) => s.type === "variable" ? `@${s.value}` : s.value).join("/");
}

/** Default segments shown on a new API path block. */
export function defaultApiSegments(): ApiPathSegment[] {
  return [{ type: "literal", value: "api" }, { type: "literal", value: "v1" }];
}
