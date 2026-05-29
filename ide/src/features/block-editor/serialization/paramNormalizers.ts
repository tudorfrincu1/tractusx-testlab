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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

/**
 * Normalizes YAML step params from complex/backend formats into the flat
 * param structure expected by Blockly block definitions.
 *
 * The block definitions use simple flat params (e.g. filter_by, filter_value,
 * operator) while YAML files may use richer nested structures
 * (e.g. filter.filter_expression[]).
 */

type Params = Record<string, unknown>;

interface FilterExpression {
  operand_left?: string;
  operator?: string;
  operand_right?: string;
}

/** Map full EDC/Dublin Core URIs to the short dropdown labels used by blocks. */
const OPERAND_LEFT_TO_FILTER_BY: Record<string, string> = {
  "http://purl.org/dc/terms/type": "dct:type",
  "https://w3id.org/edc/v0.0.1/ns/type": "edc:type",
  "http://purl.org/dc/terms/subject": "dct:subject",
  "https://w3id.org/edc/v0.0.1/ns/id": "edc:id",
  "'https://w3id.org/edc/v0.0.1/ns/id'": "edc:id",
};

/**
 * Normalize params for a given step type. Returns a new params object with
 * flat keys that match the block definition fields.
 */
export function normalizeStepParams(stepType: string, params: Params): Params {
  if (stepType === "query_catalog" || stepType === "query_catalog_with_filters") {
    return normalizeQueryCatalogParams(params);
  }
  if (stepType === "http_call_dataplane") {
    return normalizeHttpCallDataplaneParams(params);
  }
  if (stepType === "pull_data_filtered" || stepType === "pull_data_filtered_by_policy" || stepType === "pull_data_filtered_from_precondition") {
    return normalizePullDataParams(params);
  }
  return params;
}

/**
 * If the YAML uses the nested `filter.filter_expression[]` format, keep the full
 * filter object as a JSON param for the block's `filter` field, and also extract
 * the first expression into flat `filter_by`, `filter_value`, and `operator`
 * params for backward compatibility. Already-flat params are preserved as-is.
 */
function normalizeQueryCatalogParams(params: Params): Params {
  const filter = params.filter;
  if (!filter || typeof filter !== "object") return params;

  const filterObj = filter as Record<string, unknown>;
  const expressions = filterObj.filter_expression;

  // Keep the full filter object as the `filter` param (will be stored as JSON in the block)
  const normalized: Params = { ...params };

  // The block definition uses `filters` (plural) but YAML uses `filter` (singular).
  // Map filter → filters so the param is found during population.
  if (normalized.filters === undefined) {
    normalized.filters = normalized.filter;
  }

  // If flat params already exist, preserve them
  if (params.filter_value !== undefined) return normalized;

  if (!Array.isArray(expressions) || expressions.length === 0) return normalized;

  const first = expressions[0] as FilterExpression;
  if (!first || typeof first !== "object") return normalized;

  // Map operand_left → filter_by (short label)
  if (first.operand_left && params.filter_by === undefined) {
    const shortLabel = OPERAND_LEFT_TO_FILTER_BY[first.operand_left];
    normalized.filter_by = shortLabel ?? first.operand_left;
  }

  // Map operand_right → filter_value
  if (first.operand_right !== undefined) {
    normalized.filter_value = String(first.operand_right);
  }

  // Map operator
  if (first.operator && params.operator === undefined) {
    normalized.operator = first.operator;
  }

  return normalized;
}

/**
 * YAML uses `url` for the dataplane URL but the block definition uses `dataplane_url`.
 * Normalize by copying `url` → `dataplane_url` if needed.
 */
function normalizeHttpCallDataplaneParams(params: Params): Params {
  if (params.url !== undefined && params.dataplane_url === undefined) {
    const normalized: Params = { ...params, dataplane_url: params.url };
    delete normalized.url;
    return normalized;
  }
  return params;
}

/**
 * YAML uses `connector_service` but pull_data_filtered block expects `service`.
 * Normalize by copying `connector_service` → `service` if needed.
 */
function normalizePullDataParams(params: Params): Params {
  const normalized: Params = { ...params };
  if (normalized.connector_service !== undefined && normalized.service === undefined) {
    normalized.service = normalized.connector_service;
  }
  return normalized;
}
