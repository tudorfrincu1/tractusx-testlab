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

import type { PreconditionSubType } from "../../model";

/**
 * The class-specific call-to-action shown above every Configuration item.
 * Data-driven so the header never branches on payload internals — the sub-type
 * alone decides the verb the operator reads.
 */
export const HEADER_VERBS: Partial<Record<PreconditionSubType, string>> = {
  access_policy: "Configure this policy in your Connector.",
  usage_policy: "Configure this policy in your Connector.",
  asset_template: "Register this asset in your Connector.",
  aas_descriptor: "Register this digital twin in your DTR.",
} as const;

/** Resolve the header verb for a sub-type, falling back to a generic prompt. */
export function headerVerbFor(subType: PreconditionSubType): string {
  return HEADER_VERBS[subType] ?? "Register this object in your SUT.";
}
