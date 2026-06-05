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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

/** A parsed JSON value (the canonical value embedded under a complex var). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Renders a parsed JSON value as indented YAML lines. Minimal and
 * human-readable: scalars on the key line, arrays as `-` items, objects nested
 * by two spaces. Used to embed a complex variable's canonical value under the
 * `value:` key of its variable YAML.
 */
export function jsonValueToYamlLines(value: JsonValue, indent: number): string[] {
  if (Array.isArray(value)) {
    return value.length === 0 ? [`${pad(indent)}[]`] : arrayToYamlLines(value, indent);
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value).length === 0
      ? [`${pad(indent)}{}`]
      : objectToYamlLines(value, indent);
  }
  return [`${pad(indent)}${formatScalar(value)}`];
}

function objectToYamlLines(object: Record<string, JsonValue>, indent: number): string[] {
  const lines: string[] = [];
  for (const [key, child] of Object.entries(object)) {
    lines.push(...keyedLines(key, child, indent));
  }
  return lines;
}

function arrayToYamlLines(items: readonly JsonValue[], indent: number): string[] {
  const lines: string[] = [];
  for (const item of items) {
    const inline = emptyContainerInline(item);
    if (inline) {
      lines.push(`${pad(indent)}- ${inline}`);
    } else if (isContainer(item)) {
      const [head, ...rest] = jsonValueToYamlLines(item, indent + 1);
      lines.push(`${pad(indent)}- ${head.trimStart()}`, ...rest);
    } else {
      lines.push(`${pad(indent)}- ${formatScalar(item)}`);
    }
  }
  return lines;
}

function keyedLines(key: string, child: JsonValue, indent: number): string[] {
  const renderedKey = formatKey(key);
  const inline = emptyContainerInline(child);
  if (inline) {
    return [`${pad(indent)}${renderedKey}: ${inline}`];
  }
  if (isContainer(child)) {
    return [`${pad(indent)}${renderedKey}:`, ...jsonValueToYamlLines(child, indent + 1)];
  }
  return [`${pad(indent)}${renderedKey}: ${formatScalar(child)}`];
}

/** Returns the inline flow form (`[]`/`{}`) for an empty container, else null. */
function emptyContainerInline(value: JsonValue): string | null {
  if (Array.isArray(value)) return value.length === 0 ? "[]" : null;
  if (value !== null && typeof value === "object") {
    return Object.keys(value).length === 0 ? "{}" : null;
  }
  return null;
}

function isContainer(value: JsonValue): value is JsonValue[] | Record<string, JsonValue> {
  return Array.isArray(value) || (value !== null && typeof value === "object");
}

function formatScalar(value: Exclude<JsonValue, JsonValue[] | object>): string {
  if (value === null) return "null";
  if (typeof value === "string") return needsQuoting(value) ? quoteString(value) : value;
  return String(value);
}

/** Quotes a mapping key when YAML rules require it. */
function formatKey(key: string): string {
  return needsQuoting(key) ? quoteString(key) : key;
}

/**
 * Decides whether a plain scalar must be double-quoted to remain valid YAML.
 * Covers the reserved/indicator characters (`@`, backtick, `!`, `&`, `*`, `?`,
 * `|`, `>`, `%`, `#`, `,`, brackets/braces, quotes, leading `-`/`:`/space),
 * structural sequences (`: `, ` #`, trailing colon/space), and scalars that
 * would otherwise parse as null/bool/number rather than a string.
 */
function needsQuoting(text: string): boolean {
  if (text === "") return true;
  if (/^[@`!&*?|>%#,[\]{}'"\-:\s]/.test(text)) return true;
  if (/\s$/.test(text)) return true;
  if (text.endsWith(":")) return true;
  if (text.includes(": ") || text.includes(" #")) return true;
  if (/^(~|null|true|false|yes|no|on|off)$/i.test(text)) return true;
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text)) return true;
  return false;
}

/** Renders a string as a double-quoted YAML scalar with escaping. */
function quoteString(text: string): string {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

function pad(indent: number): string {
  return "  ".repeat(indent);
}
