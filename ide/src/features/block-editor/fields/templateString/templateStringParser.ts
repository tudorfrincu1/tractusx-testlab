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

import { parseVarRef } from "../../serialization/varSyntax";
import type { TemplateSegment } from "./templateSegment.types";

/** Regex matching `${{ scope.path }}` variable references within a string. */
const TEMPLATE_VAR_RE = /\$\{\{\s*(.+?)\s*\}\}/;

/**
 * Returns true if `value` contains embedded `${{ }}` references but is NOT
 * a pure single variable reference (i.e., `parseVarRef()` returns undefined).
 */
export function isTemplateString(value: string): boolean {
  if (parseVarRef(value) !== undefined) return false;
  return TEMPLATE_VAR_RE.test(value);
}

/**
 * Parse a template string into an ordered array of literal and variable segments.
 * Each `${{ scope.path }}` match is resolved via `parseVarRef`.
 */
export function parseTemplateString(value: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  const re = new RegExp(TEMPLATE_VAR_RE.source, "g");  // fresh regex with g for iteration
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(value)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "literal" as const, value: value.slice(lastIndex, match.index) });
    }
    const fullRef = match[0];
    const parsed = parseVarRef(fullRef);
    if (parsed) {
      segments.push({ type: "variable" as const, scope: parsed.scope, path: parsed.path });
    } else {
      // Fallback: treat unrecognized refs as literal text
      segments.push({ type: "literal" as const, value: fullRef });
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < value.length) {
    segments.push({ type: "literal" as const, value: value.slice(lastIndex) });
  }
  return segments;
}

/**
 * Serialize segments back into the canonical `${{ scope.path }}` template string.
 */
export function serializeTemplateString(segments: TemplateSegment[]): string {
  return segments
    .map((seg) => (seg.type === "literal" ? seg.value : `\${{ ${seg.scope}.${seg.path} }}`))
    .join("");
}

/**
 * Format segments as a human-readable preview using `${{ env.path }}` for variables.
 */
export function formatSegmentPreview(segments: TemplateSegment[]): string {
  return segments
    .map((seg) => (seg.type === "literal" ? seg.value : `\${{ ${seg.scope}.${seg.path} }}`))
    .join("");
}
