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

import { connectValue, toBlockValueString } from "../../serializationParts";
import { createValueBlockWithOutputResolution } from "../stepOutputTracker";
import type { ParamPopulator } from "./paramPopulator.types";

/**
 * Fallback populator for any param type without a dedicated populator. Builds a
 * generic value block from the stringified value, resolving references to prior
 * step outputs, and connects it to the field.
 */
export const defaultParamPopulator: ParamPopulator = ({ ws, stepBlock, fieldKey, paramValue, stepOutputs }) => {
  const valueBlock = createValueBlockWithOutputResolution(ws, toBlockValueString(paramValue), stepOutputs);
  connectValue(stepBlock, fieldKey, valueBlock);
};
