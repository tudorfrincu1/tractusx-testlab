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

// Reference-syntax utilities for the complex-variable builder. A template
// variable can store an env REFERENCE string (`${{ env.NAME }}`) as its value;
// `applyTemplate` substitutes that string verbatim and `matchTemplate`
// round-trips it, so the reference flows untouched into the operator-facing
// policy. The catalog of selectable variables is NOT defined here — it is the
// live set the operator authors in the Environment Configuration view, fed into
// the builder through {@link EnvVariableProvider}. This module owns only the
// reference syntax shared between authoring and resolution.

/** A named environment value the operator can reuse across policies. */
export interface EnvVariable {
  name: string;
  value: string;
  description?: string;
}

// Matches a full `${{ env.NAME }}` reference and captures NAME. Kept permissive
// on surrounding whitespace so references authored elsewhere still parse.
const ENV_REFERENCE_PATTERN = /^\$\{\{\s*env\.([A-Za-z_]\w*)\s*\}\}$/;

/** Build the canonical reference string for an env-variable name. */
export function envReference(name: string): string {
  return "${{ env." + name + " }}";
}

/** True when `value` is a single, well-formed `${{ env.NAME }}` reference. */
export function isEnvReference(value: string): boolean {
  return ENV_REFERENCE_PATTERN.test(value.trim());
}

/** The NAME inside an env reference, or `null` when `value` is not a reference. */
export function envNameFromReference(value: string): string | null {
  const match = ENV_REFERENCE_PATTERN.exec(value.trim());
  return match ? match[1] : null;
}
