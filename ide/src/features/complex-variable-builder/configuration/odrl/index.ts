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

// Public surface of the ODRL serializer. Dispatches the version-agnostic
// logical PolicyPayload to the matching dialect builder (Jupiter expanded vs
// Saturn compact) and renders the standalone EDC `PolicyDefinition` the
// operator copies into their connector.
import type { PolicyPayload, PolicyType } from "../../types";
import { buildJupiterPolicy } from "./odrlJupiter";
import { buildSaturnPolicy } from "./odrlSaturn";
import { parseOdrlPolicy } from "./parseOdrl";
import type { LogicalPolicy } from "./parseOdrl";
import type { JsonObject } from "./odrlTypes";

export type { JsonObject, JsonValue } from "./odrlTypes";
export type { LogicalPolicy } from "./parseOdrl";

/** Build the real EDC `PolicyDefinition` object for the active profile version. */
export function policyToOdrl(policy: PolicyPayload, id: string): JsonObject {
  return policy.version === "saturn" ? buildSaturnPolicy(policy, id) : buildJupiterPolicy(policy, id);
}

/** Render the real EDC `PolicyDefinition` as the JSON the operator pastes. */
export function policyToOdrlJson(policy: PolicyPayload, id: string): string {
  return JSON.stringify(policyToOdrl(policy, id), null, 2);
}

/** Outcome of decoding hand-edited ODRL text back into the logical policy. */
export type OdrlParseResult =
  | { ok: true; policy: LogicalPolicy }
  | { ok: false; error: string };

/** Parse operator-edited ODRL JSON text back into the logical policy model. */
export function parseOdrlJson(text: string, fallbackType: PolicyType): OdrlParseResult {
  let root: unknown;
  try {
    root = JSON.parse(text) as unknown;
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Invalid JSON" };
  }
  const policy = parseOdrlPolicy(root, fallbackType);
  if (policy === null) {
    return { ok: false, error: "Not a recognizable EDC ODRL PolicyDefinition" };
  }
  return { ok: true, policy };
}
