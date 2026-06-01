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

import { connectValue, createValueBlockFromString, makeBlock } from "../../serializationParts";
import { truncateJsonPreview } from "../../../blocks";
import type { ParamPopulator } from "./paramPopulator.types";

/**
 * Populates a `json` field. A `${{ ... }}` template string becomes a variable
 * value block; a plain object becomes a `value_json` block carrying the
 * formatted JSON plus a truncated preview.
 */
export const jsonParamPopulator: ParamPopulator = ({ ws, stepBlock, fieldKey, paramValue }) => {
  if (typeof paramValue === "string" && /^\$\{\{\s*[^{}]+?\s*\}\}$/.test(paramValue)) {
    const variableBlock = createValueBlockFromString(ws, paramValue);
    connectValue(stepBlock, fieldKey, variableBlock);
  } else if (typeof paramValue === "object") {
    const jsonBlock = makeBlock(ws, "value_json");
    const jsonText = JSON.stringify(paramValue, null, 2);
    jsonBlock.setFieldValue(jsonText, "JSON_VALUE");
    jsonBlock.setFieldValue(truncateJsonPreview(jsonText), "JSON_PREVIEW");
    connectValue(stepBlock, fieldKey, jsonBlock);
  }
};
