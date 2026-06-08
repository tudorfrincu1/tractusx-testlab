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

/** Shared contracts for the resolution-strategy registry. */

import type { ConstraintData } from "../schema/index.ts";

/** Where a version's schemas live, plus its entry schema file name. */
export interface StrategyContext {
  dir: string;
  entry: string;
  /** Sub-folder (relative to `dir`) holding per-constraint schema files. */
  constraintDir: string;
}

/** A single bucket's constraints keyed by left-operand value (pre-overlay). */
export type RawRegistry = Record<string, ConstraintData>;

/**
 * A resolution strategy turns a version's schema folder into a
 * `bucket -> registry` map. The bucket keys are version-agnostic (e.g.
 * `access_permission` for by-rule bucketing, or `all` for single bucketing).
 */
export type ResolutionStrategy = (ctx: StrategyContext) => Record<string, RawRegistry>;

/** Identifier of a registered resolution strategy (manifest `resolution`). */
export type ResolutionId = "catenax-atomic-buckets" | "selfcontained-defs";
