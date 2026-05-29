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

import { describe, it, expect } from "vitest";
import { modelToYaml } from "./modelToYaml";
import type { ScriptDefinition, TckDefinition } from "@/models/schema";
import { ScriptKind } from "@/models/schema";

describe("modelToYaml", () => {
  it("converts a minimal test definition to YAML", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "minimal-test",
      version: "1.0",
      steps: [],
    };

    const result = modelToYaml(model);

    expect(result).toContain("kind: test");
    expect(result).toContain("name: minimal-test");
    expect(result).toContain("version: \"1.0\"");
  });

  it("strips empty arrays and undefined values", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "clean-test",
      version: "1.0",
      description: undefined,
      setup: [],
      steps: [
        {
          type: "http_request",
          params: { url: "https://example.com" },
        },
      ],
      teardown: [],
    };

    const result = modelToYaml(model);

    expect(result).not.toContain("setup:");
    expect(result).not.toContain("teardown:");
    expect(result).not.toContain("description:");
    expect(result).toContain("type: http_request");
  });

  it("renames variables to shared_variables for TCK documents", () => {
    const model: TckDefinition = {
      kind: ScriptKind.TCK,
      name: "my-tck",
      version: "2.0",
      variables: {
        base_url: { type: "string", default: "http://localhost" },
      },
      tests: ["test-a.yaml"],
    };

    const result = modelToYaml(model);

    expect(result).toContain("shared_variables:");
    expect(result).not.toMatch(/^\s*variables:/m);
    expect(result).toContain("base_url:");
  });

  it("preserves step params and assertions", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "step-test",
      version: "1.0",
      steps: [
        {
          type: "http_request",
          description: "Call the API",
          params: {
            url: "https://api.example.com/health",
            method: "GET",
          },
          validate: [
            {
              type: "EQUALS" as const,
              output: "status_code",
              value: 200,
            },
          ],
        },
      ],
    };

    const result = modelToYaml(model);

    expect(result).toContain("description: Call the API");
    expect(result).toContain("method: GET");
    expect(result).toContain("type: EQUALS");
    expect(result).toContain("value: 200");
  });

  it("handles TCK with inline test definitions and test refs", () => {
    const model: TckDefinition = {
      kind: ScriptKind.TCK,
      name: "composite-tck",
      tests: [
        "external-test.yaml",
        {
          test: "referenced-test.yaml",
          order: 1,
          prerequisite_tests: ["setup-test.yaml"],
        },
      ],
    };

    const result = modelToYaml(model);

    expect(result).toContain("- external-test.yaml");
    expect(result).toContain("test: referenced-test.yaml");
    expect(result).toContain("order: 1");
    expect(result).toContain("- setup-test.yaml");
  });
});
