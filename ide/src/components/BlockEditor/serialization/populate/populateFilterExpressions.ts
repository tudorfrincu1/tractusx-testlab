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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import type { Block, Workspace } from "blockly";
import { makeBlock, setDropdownValue, connectValue, toBlockValueString } from "../helpers";
import { createValueBlockWithOutputResolution, type StepOutputMap } from "./stepOutputTracker";

/** Map full URIs to the dropdown values used by the filter_expression block. */
const URI_TO_DROPDOWN: Record<string, string> = {
  "https://w3id.org/edc/v0.0.1/ns/type": "https://w3id.org/edc/v0.0.1/ns/type",
  "http://purl.org/dc/terms/type": "https://w3id.org/edc/v0.0.1/ns/type",
  "http://purl.org/dc/terms/subject": "http://purl.org/dc/terms/subject",
  "https://w3id.org/catenax/ontology/common#version": "https://w3id.org/catenax/ontology/common#version",
  "https://w3id.org/edc/v0.0.1/ns/id": "https://w3id.org/edc/v0.0.1/ns/id",
  "'https://w3id.org/edc/v0.0.1/ns/id'": "https://w3id.org/edc/v0.0.1/ns/id",
};

interface FilterExpressionYaml {
  operand_left?: string;
  operator?: string;
  operand_right?: string;
}

export function populateFilterExpressions(ws: Workspace, expressions: unknown[], stepOutputs: StepOutputMap): Block[] {
  const blocks: Block[] = [];
  for (const raw of expressions) {
    if (!raw || typeof raw !== "object") continue;
    const expr = raw as FilterExpressionYaml;
    const fb = makeBlock(ws, "filter_expression");

    const rawLeft = expr.operand_left || "";
    const mappedLeft = URI_TO_DROPDOWN[rawLeft];
    if (mappedLeft) {
      setDropdownValue(fb, "OPERAND_LEFT", mappedLeft);
    } else {
      setDropdownValue(fb, "OPERAND_LEFT", "custom");
      fb.setFieldValue(rawLeft, "OPERAND_LEFT_CUSTOM");
    }

    if (expr.operator) {
      setDropdownValue(fb, "OPERATOR", expr.operator);
    }
    if (expr.operand_right !== undefined) {
      connectValue(fb, "OPERAND_RIGHT", createValueBlockWithOutputResolution(ws, toBlockValueString(expr.operand_right), stepOutputs));
    }

    blocks.push(fb);
  }
  return blocks;
}
