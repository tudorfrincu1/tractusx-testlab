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

/** Loads JSON Schema documents and resolves their internal `#/` references. */

import { readFileSync } from "node:fs";

/** A minimal structural view of the JSON Schema nodes this codegen reads. */
export interface SchemaNode {
  $ref?: string;
  $id?: string;
  const?: string | number | boolean;
  type?: string;
  pattern?: string;
  enum?: string[];
  examples?: unknown[];
  items?: SchemaNode;
  anyOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  allOf?: SchemaNode[];
  properties?: Record<string, SchemaNode>;
  definitions?: Record<string, SchemaNode>;
  $defs?: Record<string, SchemaNode>;
  [extra: string]: unknown;
}

/** Read and parse a JSON Schema file from disk. */
export function readSchemaDoc(filePath: string): SchemaNode {
  return JSON.parse(readFileSync(filePath, "utf8")) as SchemaNode;
}

/**
 * Resolve a local JSON pointer (`#/definitions/X` or `#/$defs/X`) against the
 * document that contains it. Throws when the pointer cannot be walked.
 */
export function resolveLocalRef(doc: SchemaNode, ref: string): SchemaNode {
  if (!ref.startsWith("#/")) {
    throw new Error(`Only local refs are resolvable, received: ${ref}`);
  }
  const segments = ref.slice(2).split("/");
  let current: unknown = doc;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") {
      throw new Error(`Unresolvable ref segment "${segment}" in ${ref}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (current === undefined) {
    throw new Error(`Ref pointer not found: ${ref}`);
  }
  return current as SchemaNode;
}

/**
 * Follow a node's local `$ref` chain until a concrete node is reached. Nodes
 * without a local `$ref` are returned unchanged.
 */
export function deref(doc: SchemaNode, node: SchemaNode): SchemaNode {
  let current = node;
  while (typeof current.$ref === "string" && current.$ref.startsWith("#/")) {
    current = resolveLocalRef(doc, current.$ref);
  }
  return current;
}

/** Extract the trailing file name from a `$ref` URL (drops any fragment). */
export function basenameFromRef(ref: string): string {
  const withoutFragment = ref.split("#")[0];
  const name = withoutFragment.split("/").pop();
  if (!name) {
    throw new Error(`Cannot derive a file name from ref: ${ref}`);
  }
  return name;
}
