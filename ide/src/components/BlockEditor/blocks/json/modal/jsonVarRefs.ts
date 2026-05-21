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

/**
 * Utilities for handling `@variable_name` references inside JSON text.
 *
 * The project convention uses `@variable_name` for variable references in YAML
 * and JSON values. Standard JSON.parse rejects these tokens, so we temporarily
 * swap them with valid JSON placeholder strings for validation and formatting,
 * then restore the originals.
 */

const PLACEHOLDER_PREFIX = "__TESTLAB_VAR__";
const PLACEHOLDER_SUFFIX = "__";

const PLACEHOLDER_RE = new RegExp(
  `"${PLACEHOLDER_PREFIX}([a-zA-Z_][a-zA-Z0-9_]*)${PLACEHOLDER_SUFFIX}"`,
  "g",
);

/** Matches the placeholder value inside a parsed string (no surrounding quotes). */
const PLACEHOLDER_RE_UNQUOTED = new RegExp(
  `${PLACEHOLDER_PREFIX}([a-zA-Z_][a-zA-Z0-9_]*)${PLACEHOLDER_SUFFIX}`,
  "g",
);

/**
 * Replace `@variable_name` tokens that appear outside of JSON strings with
 * valid placeholder strings like `"__TESTLAB_VAR__name__"`.
 *
 * Uses a character-level scanner to correctly skip over quoted strings so that
 * `@` characters inside string values are left untouched.
 */
export function replaceVarRefs(text: string): string {
  let result = "";
  let inString = false;
  let i = 0;

  while (i < text.length) {
    if (inString) {
      if (text[i] === "\\" && i + 1 < text.length) {
        result += text[i] + text[i + 1];
        i += 2;
        continue;
      }
      if (text[i] === '"') {
        inString = false;
      }
      result += text[i];
      i++;
    } else if (text[i] === '"') {
      inString = true;
      result += text[i];
      i++;
    } else if (text[i] === "@") {
      const rest = text.slice(i);
      const match = /^@([a-zA-Z_][a-zA-Z0-9_]*)/.exec(rest);
      if (match) {
        result += `"${PLACEHOLDER_PREFIX}${match[1]}${PLACEHOLDER_SUFFIX}"`;
        i += match[0].length;
      } else {
        result += text[i];
        i++;
      }
    } else if (text[i] === "$" && text.slice(i, i + 3) === "${{") {
      const rest = text.slice(i);
      const match = /^\$\{\{\s*vars\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/.exec(rest);
      if (match) {
        result += `"${PLACEHOLDER_PREFIX}${match[1]}${PLACEHOLDER_SUFFIX}"`;
        i += match[0].length;
      } else {
        result += text[i];
        i++;
      }
    } else {
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Restore placeholder strings back to `${{ vars.variable_name }}` tokens.
 */
export function restoreVarRefs(text: string): string {
  return text.replace(PLACEHOLDER_RE, "\\${{ vars.$1 }}");
}

/**
 * Validate JSON text that may contain `@variable_name` references.
 * Returns `{ isValid: true }` when the structure is valid, or
 * `{ isValid: false, error }` with a human-readable message.
 */
export function validateJsonWithVarRefs(
  text: string,
): { isValid: boolean; error?: string } {
  try {
    JSON.parse(replaceVarRefs(text));
    return { isValid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { isValid: false, error: message };
  }
}

/**
 * Format JSON text that may contain `@variable_name` references.
 * Returns the formatted text with variable refs preserved, or `null`
 * if the text cannot be parsed.
 */
export function formatJsonWithVarRefs(text: string): string | null {
  try {
    const replaced = replaceVarRefs(text);
    const parsed: unknown = JSON.parse(replaced);
    const formatted = JSON.stringify(parsed, null, 2);
    return restoreVarRefs(formatted);
  } catch {
    return null;
  }
}

/**
 * Parse JSON text that may contain `@variable_name` references.
 * Variable refs become scoped references in the resulting object:
 * - Names in `stepOutputs` → `${{ vars.x }}`
 * - All others → `${{ env.x }}`
 * Returns the parsed value, or `undefined` if parsing fails.
 */
export function parseJsonWithVarRefs(text: string, stepOutputs?: ReadonlySet<string>): unknown {
  const replaced = replaceVarRefs(text);
  const parsed: unknown = JSON.parse(replaced);
  return restorePlaceholdersInValue(parsed, stepOutputs);
}

/**
 * Pattern matching `${{ vars.variable_name }}`, `${{ env.variable_name }}`, or `@variable_name` tokens outside of JSON strings.
 * Exported so other modules can reuse the same regex.
 */
export const VAR_REF_PATTERN = /\$\{\{\s*(?:vars|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}|@([a-zA-Z_][a-zA-Z0-9_]*)/g;

/**
 * Count variable tokens that appear outside of JSON strings.
 * Uses the same character-level scanner as `replaceVarRefs`.
 */
export function countVarRefsOutsideStrings(text: string): number {
  let count = 0;
  let inString = false;
  let i = 0;

  while (i < text.length) {
    if (inString) {
      if (text[i] === "\\" && i + 1 < text.length) {
        i += 2;
        continue;
      }
      if (text[i] === '"') inString = false;
      i++;
    } else if (text[i] === '"') {
      inString = true;
      i++;
    } else if (text[i] === "$" && text.slice(i, i + 3) === "${{") {
      const rest = text.slice(i);
      const match = /^\$\{\{\s*vars\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/.exec(rest);
      if (match) {
        count++;
        i += match[0].length;
      } else {
        i++;
      }
    } else if (text[i] === "@") {
      const rest = text.slice(i);
      const match = /^@([a-zA-Z_][a-zA-Z0-9_]*)/.exec(rest);
      if (match) {
        count++;
        i += match[0].length;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return count;
}

/**
 * Collect unique variable tokens that appear outside of JSON strings.
 */
export function collectVarRefsOutsideStrings(text: string): string[] {
  const refs = new Set<string>();
  let inString = false;
  let i = 0;

  while (i < text.length) {
    if (inString) {
      if (text[i] === "\\" && i + 1 < text.length) {
        i += 2;
        continue;
      }
      if (text[i] === '"') inString = false;
      i++;
    } else if (text[i] === '"') {
      inString = true;
      i++;
    } else if (text[i] === "$" && text.slice(i, i + 3) === "${{") {
      const rest = text.slice(i);
      const match = /^\$\{\{\s*vars\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/.exec(rest);
      if (match) {
        refs.add(match[1]);
        i += match[0].length;
      } else {
        i++;
      }
    } else if (text[i] === "@") {
      const rest = text.slice(i);
      const match = /^@([a-zA-Z_][a-zA-Z0-9_]*)/.exec(rest);
      if (match) {
        refs.add(match[1]);
        i += match[0].length;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return [...refs];
}

/** Recursively walk a parsed value and restore placeholder strings.
 *  Names in `stepOutputs` → `${{ vars.x }}`, others → `${{ env.x }}`.
 */
function restorePlaceholdersInValue(value: unknown, stepOutputs?: ReadonlySet<string>): unknown {
  if (typeof value === "string") {
    return value.replace(PLACEHOLDER_RE_UNQUOTED, (_match, name: string) => {
      const scope = stepOutputs?.has(name) ? "vars" : "env";
      return `\${{ ${scope}.${name} }}`;
    });
  }
  if (Array.isArray(value)) {
    return value.map((v) => restorePlaceholdersInValue(v, stepOutputs));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = restorePlaceholdersInValue(v, stepOutputs);
    }
    return out;
  }
  return value;
}
