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
 * Canonical v2 formats:
 * - Step outputs:             `${{ steps.step_id.field }}`
 * - Environment variables:    `${{ env.variable_name }}`
 * - Precondition outputs:     `${{ preconditions.step_id.field }}`
 * - Services:                 `${{ env.services.name.field }}`
 * - Metadata:                 `${{ metadata.field }}`
 * - Setup outputs:            `${{ setup.step_id.field }}`
 */

/** Variable scope — determines which prefix is emitted. */
export type VarScope = "env" | "steps" | "preconditions" | "metadata" | "setup" | "services" | "execution" | "testdata";

/* ─── v2 scoped variable parsing ─── */

/** Matches `${{ env.services.<path> }}` — must be tested before generic env. */
const SERVICES_RE = /^\$\{\{\s*env\.services\.(.+?)\s*\}\}$/;

/** Matches `${{ <scope>.<path> }}` for all v2 scopes. */
const V2_SCOPE_RE = /^\$\{\{\s*(steps|preconditions|metadata|setup|env|execution|testdata)\.(.+?)\s*\}\}$/;

/** Block type for each v2 variable scope. */
export const VAR_BLOCK_TYPES: Record<string, VarScope> = {
  var_steps: "steps",
  var_preconditions: "preconditions",
  var_env: "env",
  var_services: "services",
  var_metadata: "metadata",
  var_setup: "setup",
  var_execution: "execution",
  var_testdata: "testdata",
};

/** Scope → block type mapping (inverse of VAR_BLOCK_TYPES). */
export const SCOPE_TO_BLOCK_TYPE: Record<VarScope, string> = {
  steps: "var_steps",
  preconditions: "var_preconditions",
  env: "var_env",
  services: "var_services",
  metadata: "var_metadata",
  setup: "var_setup",
  execution: "var_execution",
  testdata: "var_testdata",
};

/**
 * Parse a v2 scoped variable reference string.
 * Returns the scope and the remaining path, or undefined if not a scoped ref.
 */
export function parseVarRef(value: string): { scope: VarScope; path: string } | undefined {
  // Services must be checked first (it's nested under env)
  const svcMatch = SERVICES_RE.exec(value);
  if (svcMatch) return { scope: "services", path: svcMatch[1] };

  const scopeMatch = V2_SCOPE_RE.exec(value);
  if (scopeMatch) return { scope: scopeMatch[1] as VarScope, path: scopeMatch[2] };

  return undefined;
}

/**
 * Emit a v2 scoped variable reference string from scope + path.
 */
export function emitVarRef(scope: VarScope, path: string): string {
  if (scope === "services") return `\${{ env.services.${path} }}`;
  return `\${{ ${scope}.${path} }}`;
}
