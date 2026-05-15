/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: GPT-5.3-Codex).
// It was reviewed and tested by a human committer.

import type { Block } from "blockly";
import type { TckDefinition, TestRef } from "../../../../models/schema";
import { readValueBlockAsString } from "../helpers";

export function workspaceToTck(root: Block): Partial<TckDefinition> {
  const name = root.getFieldValue("NAME") || "my-tck";
  const version = root.getFieldValue("VERSION") || "1.0";
  const description = root.getFieldValue("DESCRIPTION") || "";

  const preconditions: Array<{ id: string; description: string }> = [];
  let preBlock = root.getInputTargetBlock("PRECONDITIONS");
  while (preBlock) {
    if (preBlock.type === "precondition") {
      const preId = preBlock.getFieldValue("PRE_ID") || "";
      const preDesc = preBlock.getFieldValue("PRE_DESCRIPTION") || "";
      if (preId) preconditions.push({ id: preId, description: preDesc });
    }
    preBlock = preBlock.getNextBlock();
  }

  const tests: (string | TestRef)[] = [];
  let testBlock = root.getInputTargetBlock("TESTS");
  while (testBlock) {
    if (testBlock.type === "test_ref") {
      const testName = testBlock.getFieldValue("TEST_NAME") || "";
      const desc = testBlock.getFieldValue("DESCRIPTION") || "";
      if (testName) {
        const ref: TestRef = { test: testName };
        if (desc) ref.description = desc;
        const withOverrides: Record<string, unknown> = {};
        let kvBlock = testBlock.getInputTargetBlock("WITH");
        while (kvBlock) {
          if (kvBlock.type === "key_value_pair") {
            const key = kvBlock.getFieldValue("KEY") || "";
            const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
            if (key) withOverrides[key] = value;
          }
          kvBlock = kvBlock.getNextBlock();
        }
        if (Object.keys(withOverrides).length > 0) ref.with = withOverrides;
        tests.push(ref);
      }
    }
    testBlock = testBlock.getNextBlock();
  }

  return {
    kind: "tck",
    name,
    version,
    description,
    preconditions: preconditions.length > 0 ? preconditions : undefined,
    tests,
  } as Partial<TckDefinition>;
}
