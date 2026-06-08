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

import { POLICY_VERSIONS } from "@/shared/ui/policy-constraints/constraintSchemas";
import type { PolicyPayload, PolicyType, PolicyVersion } from "../../model";

const POLICY_TYPES: readonly PolicyType[] = ["access", "usage"] as const;

/** Outcome of decoding raw JSON back into a {@link PolicyPayload}. */
export type PolicyParseResult =
  | { ok: true; policy: PolicyPayload }
  | { ok: false; error: string };

/** A specificAssetId name/value pair parsed from a twin descriptor template. */
export interface AssetIdPair {
  name: string;
  value: string;
}

/** Serialize the single source object to the JSON the operator registers. */
export function policyToJson(policy: PolicyPayload): string {
  // Build the operator deliverable from the logical fields only, dropping the
  // POC-local authoring metadata so the template-first UI bookkeeping never
  // leaks into the JSON the operator copies.
  const logical = {
    version: policy.version,
    policyType: policy.policyType,
    permissions: policy.permissions,
    ...(policy.prohibitions ? { prohibitions: policy.prohibitions } : {}),
    ...(policy.obligations ? { obligations: policy.obligations } : {}),
    ...(policy.optionalUsagePurposes ? { optionalUsagePurposes: policy.optionalUsagePurposes } : {}),
  };
  return JSON.stringify(logical, null, 2);
}

/** Decode operator-edited JSON back into the canonical policy object. */
export function jsonToPolicy(text: string): PolicyParseResult {
  const parsed = parseJson(text);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  return narrowPolicy(parsed.value);
}

/** Validate free-form JSON (provide templates); returns an error or null. */
export function validateJsonText(text: string): string | null {
  if (text.trim() === "") {
    return null;
  }
  const parsed = parseJson(text);
  return parsed.ok ? null : parsed.error;
}

/** Pull specificAssetIds from a twin descriptor template; [] when absent. */
export function extractSpecificAssetIds(text: string): AssetIdPair[] {
  const parsed = parseJson(text);
  if (!parsed.ok || !isRecord(parsed.value)) {
    return [];
  }
  const raw = parsed.value.specificAssetIds;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isAssetIdPair).map((entry) => ({ name: entry.name, value: entry.value }));
}

type JsonParse = { ok: true; value: unknown } | { ok: false; error: string };

function parseJson(text: string): JsonParse {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Invalid JSON" };
  }
}

function narrowPolicy(value: unknown): PolicyParseResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Expected a JSON object" };
  }
  if (!isPolicyVersion(value.version)) {
    return { ok: false, error: `"version" must be one of: ${POLICY_VERSIONS.join(", ")}` };
  }
  if (!isPolicyType(value.policyType)) {
    return { ok: false, error: `"policyType" must be one of: ${POLICY_TYPES.join(", ")}` };
  }
  if (!Array.isArray(value.permissions)) {
    return { ok: false, error: `"permissions" must be an array` };
  }
  return { ok: true, policy: value as unknown as PolicyPayload };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPolicyVersion(value: unknown): value is PolicyVersion {
  return typeof value === "string" && (POLICY_VERSIONS as readonly string[]).includes(value);
}

function isPolicyType(value: unknown): value is PolicyType {
  return typeof value === "string" && (POLICY_TYPES as readonly string[]).includes(value);
}

function isAssetIdPair(value: unknown): value is AssetIdPair {
  return isRecord(value) && typeof value.name === "string" && typeof value.value === "string";
}
