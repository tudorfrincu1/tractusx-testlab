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

const MAX_DEPTH = 5;

/**
 * Convert an arbitrary JSON value into a JSON-Schema-like structure
 * that SchemaTree can render. Recurses up to 5 levels deep.
 */
export function jsonToSchema(
  value: unknown,
  depth: number = 0,
): Record<string, unknown> {
  if (depth >= MAX_DEPTH) {
    return { type: "string", description: "(max depth reached)" };
  }

  if (value === null || value === undefined) {
    return { type: "string" };
  }

  if (Array.isArray(value)) {
    const items =
      value.length > 0
        ? jsonToSchema(value[0], depth + 1)
        : { type: "string" };
    return { type: "array", items };
  }

  if (typeof value === "object") {
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      properties[k] = jsonToSchema(v, depth + 1);
    }
    return { type: "object", properties };
  }

  if (typeof value === "number") {
    return { type: Number.isInteger(value) ? "integer" : "number" };
  }

  if (typeof value === "boolean") {
    return { type: "boolean" };
  }

  return { type: "string" };
}
