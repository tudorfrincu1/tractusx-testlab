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

import type { Variable } from "../model";

/**
 * The three run-start buckets, derived purely from each variable's source mode
 * (ADR-0018 single classification rule):
 *  - input      → REQUEST  ("Requested from you")
 *  - value      → KNOWN    ("Known values")
 *  - generated  → GENERATE ("Generated at start")
 */
export interface RunPartition {
  requested: Variable[];
  known: Variable[];
  generated: Variable[];
}

/** Pure selector: classifies every variable into exactly one run-start bucket. */
export function partitionForRun(variables: readonly Variable[]): RunPartition {
  const partition: RunPartition = { requested: [], known: [], generated: [] };
  for (const variable of variables) {
    if (variable.source === "input") {
      partition.requested.push(variable);
    } else if (variable.kind === "simple" && variable.source === "generated") {
      partition.generated.push(variable);
    } else {
      partition.known.push(variable);
    }
  }
  return partition;
}
