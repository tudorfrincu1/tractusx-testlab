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

export interface JsonEditorRequest {
  blockId: string;
  jsonValue: string;
  position: { x: number; y: number };
}

let _onOpenJsonEditor: ((req: JsonEditorRequest) => void) | null = null;

/**
 * Registers a callback invoked when the edit button on a value_json block is clicked.
 * Returns a cleanup function.
 */
export function setupJsonEditorCallback(
  onOpen: (req: JsonEditorRequest) => void,
): () => void {
  _onOpenJsonEditor = onOpen;
  return () => { _onOpenJsonEditor = null; };
}

/** Fire the registered callback to open the JSON editor modal. */
export function requestOpenJsonEditor(req: JsonEditorRequest): void {
  _onOpenJsonEditor?.(req);
}

/** Maximum characters shown in the block preview label. */
export const JSON_PREVIEW_MAX_LENGTH = 30;

/** Truncate a JSON string for display in the block label. */
export function truncateJsonPreview(json: string): string {
  const compact = json.replace(/\s+/g, " ").trim();
  if (compact.length <= JSON_PREVIEW_MAX_LENGTH) return compact;
  return compact.slice(0, JSON_PREVIEW_MAX_LENGTH) + "\u2026";
}
