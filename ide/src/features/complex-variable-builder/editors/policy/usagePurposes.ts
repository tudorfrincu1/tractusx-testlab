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

// Reuses the salvaged constraint schema as the single source of truth for the
// known CX usage purposes, so the optional section stays in sync with the
// required-constraint dropdown instead of duplicating the catalog.
import { getConstraintsForContext } from "@/shared/ui/policy-constraints/constraintSchemas";
import type { OptionalUsagePurpose, PolicyVersion } from "../../model";

const CUSTOM_OPTION = "__custom__" as const;

/** Sentinel value the value select uses to switch a row into free-text mode. */
export const USAGE_PURPOSE_CUSTOM = CUSTOM_OPTION;

/**
 * Known usage purposes for a profile version, sourced from the UsagePurpose
 * operand in the usage-permission registry (mocked catalog, same as the
 * required-constraint dropdown).
 */
export function getKnownUsagePurposes(version: PolicyVersion): readonly string[] {
  const registry = getConstraintsForContext(version, "usage", "permission");
  return registry.UsagePurpose?.rightOperand.values ?? [];
}

/** Builds a fresh optional purpose pre-filled with the first known value. */
export function createOptionalUsagePurpose(version: PolicyVersion): OptionalUsagePurpose {
  const [first] = getKnownUsagePurposes(version);
  return { id: crypto.randomUUID(), value: first ?? "", custom: false };
}
