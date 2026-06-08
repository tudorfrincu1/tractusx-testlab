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

/**
 * `catenax-atomic-buckets` resolution strategy. Reads an atomic constraint
 * schema that references one schema file per constraint, grouped by rule
 * bucket. External dataspace envelope refs are excluded by suffix in
 * {@link buildAtomicBuckets}.
 */

import { join } from "node:path";

import { mapConstraint, readSchemaDoc, resolveLocalRef } from "../schema/index.ts";
import { buildAtomicBuckets } from "./buckets.ts";
import type { RawRegistry, ResolutionStrategy, StrategyContext } from "./types.ts";

export const catenaxAtomicBuckets: ResolutionStrategy = ({
  dir,
  entry,
  constraintDir,
}: StrategyContext) => {
  const atomicDoc = readSchemaDoc(join(dir, entry));
  const buckets = buildAtomicBuckets(atomicDoc);
  const result: Record<string, RawRegistry> = {};
  for (const [bucket, fileNames] of Object.entries(buckets)) {
    const registry: RawRegistry = {};
    for (const fileName of fileNames) {
      const doc = readSchemaDoc(join(dir, constraintDir, fileName));
      const rootRef = doc.allOf?.[0]?.$ref;
      if (typeof rootRef !== "string") {
        throw new TypeError(`Schema ${fileName} has no root constraint ref`);
      }
      const constraintDef = resolveLocalRef(doc, rootRef);
      const { key, data } = mapConstraint(doc, constraintDef);
      registry[key] = data;
    }
    result[bucket] = registry;
  }
  return result;
};
