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

/** Derives an atomic bucket -> constraint-file grouping from an atomic schema. */

import { resolveLocalRef, type SchemaNode } from "../schema/index.ts";

/** Registry bucket name paired with the atomic definition that lists its files. */
const ATOMIC_BUCKET_DEFINITIONS: ReadonlyArray<readonly [string, string]> = [
  ["access_permission", "AtomicAccessPermissionConstraint"],
  ["usage_permission", "AtomicUsagePermissionConstraint"],
  ["usage_prohibition", "AtomicProhibitionConstraint"],
  ["usage_obligation", "AtomicObligationConstraint"],
];

const CONSTRAINT_FILE_SUFFIX = "-constraint-schema.json";

/**
 * Walk a definition subtree and collect every per-constraint schema file it
 * references, preserving schema order and skipping duplicates. The dspace
 * envelope ref (`...contract-schema.json#/...`) is ignored by suffix.
 */
export function collectConstraintFiles(node: SchemaNode): string[] {
  const files: string[] = [];
  const seen = new Set<string>();

  const visit = (candidate: SchemaNode | undefined): void => {
    if (!candidate || typeof candidate !== "object") {
      return;
    }
    if (typeof candidate.$ref === "string" && candidate.$ref.endsWith(CONSTRAINT_FILE_SUFFIX)) {
      const file = candidate.$ref.split("/").pop();
      if (file && !seen.has(file)) {
        seen.add(file);
        files.push(file);
      }
      return;
    }
    for (const branch of [candidate.anyOf, candidate.oneOf, candidate.allOf]) {
      if (Array.isArray(branch)) {
        branch.forEach(visit);
      }
    }
  };

  visit(node);
  return files;
}

/** Build the atomic `bucket -> [constraint file names]` map in schema order. */
export function buildAtomicBuckets(atomicDoc: SchemaNode): Record<string, string[]> {
  const buckets: Record<string, string[]> = {};
  for (const [bucket, definitionName] of ATOMIC_BUCKET_DEFINITIONS) {
    const definition = resolveLocalRef(atomicDoc, `#/definitions/${definitionName}`);
    buckets[bucket] = collectConstraintFiles(definition);
  }
  return buckets;
}
