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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import { attachChain } from "../../serializationParts";
import { populateFilterExpressions } from "../populateFilterExpressions";
import type { ParamPopulator } from "./paramPopulator.types";

/**
 * Populates a `filter_expression_list` field. Accepts either the direct array
 * format (e.g. `pull_data_filtered_from_precondition`) or the nested
 * `filter.filter_expression` format (e.g. `query_catalog_with_filters`).
 */
export const filterExpressionListParamPopulator: ParamPopulator = ({
  ws,
  stepBlock,
  fieldKey,
  paramValue,
  effectiveParams,
  stepOutputs,
}) => {
  if (Array.isArray(paramValue)) {
    const filterBlocks = populateFilterExpressions(ws, paramValue, stepOutputs);
    attachChain(stepBlock, fieldKey, filterBlocks);
    return;
  }

  const filterObject = effectiveParams.filter as Record<string, unknown> | undefined;
  if (filterObject && typeof filterObject === "object") {
    const expressions = filterObject.filter_expression;
    if (Array.isArray(expressions)) {
      const filterBlocks = populateFilterExpressions(ws, expressions, stepOutputs);
      attachChain(stepBlock, fieldKey, filterBlocks);
    }
  }
};
