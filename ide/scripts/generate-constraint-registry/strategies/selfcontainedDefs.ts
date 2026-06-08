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
 * `selfcontained-defs` resolution strategy. Reads a single self-contained
 * schema whose `#/$defs/constraint` one-of enumerates every constraint inline.
 * All constraints collapse into one `all` bucket (single bucketing).
 */

import { join } from "node:path";

import { deref, mapConstraint, readSchemaDoc, resolveLocalRef } from "../schema/index.ts";
import type { RawRegistry, ResolutionStrategy, StrategyContext } from "./types.ts";

export const selfcontainedDefs: ResolutionStrategy = ({ dir, entry }: StrategyContext) => {
  const doc = readSchemaDoc(join(dir, entry));
  const constraintDef = resolveLocalRef(doc, "#/$defs/constraint");
  const refs = constraintDef.oneOf ?? [];
  const registry: RawRegistry = {};
  for (const ref of refs) {
    const def = deref(doc, ref);
    const { key, data } = mapConstraint(doc, def);
    registry[key] = data;
  }
  return { all: registry };
};
