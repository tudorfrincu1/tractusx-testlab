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

import { isVariableValue } from "./policyVariables";

export type YamlTokenKind = "key" | "string" | "variable";

export interface YamlToken {
  id: string;
  text: string;
  kind: YamlTokenKind;
}

export interface YamlLine {
  id: string;
  tokens: YamlToken[];
}

/** Accumulates colour-tokenised lines and tracks overall validity. */
export class YamlBuilder {
  readonly lines: YamlLine[] = [];
  valid = true;
  private counter = 0;

  line(...tokens: YamlToken[]): void {
    this.lines.push({ id: `line-${this.counter++}`, tokens });
  }
}

let tokenCounter = 0;
function makeToken(text: string, kind: YamlTokenKind): YamlToken {
  return { id: `token-${tokenCounter++}`, text, kind };
}

export function key(text: string): YamlToken {
  return makeToken(text, "key");
}
export function str(text: string): YamlToken {
  return makeToken(text, "string");
}
export function variable(text: string): YamlToken {
  return makeToken(text, "variable");
}

/** True when `value` is a purely numeric literal (no surrounding whitespace check skipped). */
export function isNumericValue(value: string): boolean {
  return value.trim() !== "" && !Number.isNaN(Number(value));
}

/**
 * Renders a single right-operand value: variables stay unquoted (`@var`),
 * purely numeric values are emitted as bare numbers, everything else is a
 * double-quoted string — matching the canonical authoring YAML.
 */
export function scalarValueToken(value: string): YamlToken {
  if (isVariableValue(value)) return variable(value);
  if (isNumericValue(value)) return str(value);
  return str(`"${value}"`);
}
