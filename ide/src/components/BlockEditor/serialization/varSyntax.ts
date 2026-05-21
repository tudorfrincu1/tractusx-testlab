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
 * Variable reference syntax utilities.
 *
 * Canonical formats:
 * - Step return variables: `${{ vars.variable_name }}`
 * - Environment variables:  `${{ env.variable_name }}`
 * Legacy format (still parsed for backward compat): `@variable_name`
 */

/** Variable scope — determines which prefix is emitted. */
export type VarScope = "vars" | "env";

/** Emit a step-return variable reference: `${{ vars.x }}`. */
export function toVarRef(varName: string): string {
  return `\${{ vars.${varName} }}`;
}

/** Emit an environment variable reference: `${{ env.x }}`. */
export function toEnvRef(varName: string): string {
  return `\${{ env.${varName} }}`;
}

/** Emit a variable reference with an explicit scope. */
export function toScopedRef(varName: string, scope: VarScope): string {
  return `\${{ ${scope}.${varName} }}`;
}

/** Regex matching `${{ vars.name }}` syntax. */
const VARS_REF_RE = /^\$\{\{\s*vars\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}$/;

/** Regex matching `${{ env.name }}` syntax. */
const ENV_REF_RE = /^\$\{\{\s*env\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}$/;

/** Regex matching either `${{ vars.name }}` or `${{ env.name }}`. */
const NEW_VAR_REF_RE = /^\$\{\{\s*(?:vars|env)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}$/;

/** Regex matching the legacy `@name` syntax. */
const LEGACY_VAR_REF_RE = /^@([a-zA-Z_][a-zA-Z0-9_]*)$/;

/** Check if a string is a pure variable reference (new or legacy). */
export function isVarRef(value: string): boolean {
  return NEW_VAR_REF_RE.test(value) || LEGACY_VAR_REF_RE.test(value);
}

/** Check if a string is specifically an env variable reference. */
export function isEnvRef(value: string): boolean {
  return ENV_REF_RE.test(value);
}

/** Check if a string is specifically a step-return (vars) reference. */
export function isVarsRef(value: string): boolean {
  return VARS_REF_RE.test(value);
}

/** Extract the variable name from a reference string, or undefined if not a var ref. */
export function extractVarName(value: string): string | undefined {
  const newMatch = NEW_VAR_REF_RE.exec(value);
  if (newMatch) return newMatch[1];
  const legacyMatch = LEGACY_VAR_REF_RE.exec(value);
  if (legacyMatch) return legacyMatch[1];
  return undefined;
}

/** Extract the scope from a reference string, or undefined if not a scoped ref. */
export function extractVarScope(value: string): VarScope | undefined {
  if (VARS_REF_RE.test(value)) return "vars";
  if (ENV_REF_RE.test(value)) return "env";
  return undefined;
}

/**
 * Global pattern matching variable references (new + legacy) inside strings.
 * Groups: [1] = vars format name, [2] = env format name, [3] = legacy format name.
 * IMPORTANT: Reset lastIndex before each use (or use matchAll).
 */
export const VAR_REF_GLOBAL_PATTERN = /\$\{\{\s*vars\.(\w+)\s*\}\}|\$\{\{\s*env\.(\w+)\s*\}\}|@(\w+)/g;

/**
 * Extract all variable names referenced in a string (all syntaxes).
 */
export function extractAllVarNames(value: string): string[] {
  const names: string[] = [];
  for (const match of value.matchAll(VAR_REF_GLOBAL_PATTERN)) {
    names.push(match[1] || match[2] || match[3]);
  }
  return names;
}
