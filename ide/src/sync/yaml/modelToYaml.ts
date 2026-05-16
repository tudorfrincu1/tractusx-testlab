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
 * Converts a TestLabDocument JSON model into a YAML string.
 */

import yaml from "js-yaml";
import type { TestLabDocument } from "../../models/schema";
import { isTck, isTestRef } from "../../models/schema";

export function modelToYaml(model: TestLabDocument): string {
  const clean = stripEmpty(structuredClone(model));

  if (isTck(model)) {
    const tc = clean as Record<string, unknown>;
    // Canonical YAML field is shared_variables, not variables
    if (tc.variables !== undefined) {
      tc.shared_variables = tc.variables;
      delete tc.variables;
    }
    if (Array.isArray(tc.tests)) {
      tc.tests = tc.tests.map((t: unknown) => {
        if (typeof t === "string") return t;
        if (isTestRef(t)) return stripEmpty(t);
        return stripEmpty(t as Record<string, unknown>);
      });
    }
  }

  return yaml.dump(clean, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  });
}

function stripEmpty(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const filtered = obj.map(stripEmpty).filter((v) => v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = stripEmpty(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return obj;
}
