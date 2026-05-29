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
import { yamlToModel } from "./yamlToModel";
import { modelToYaml } from "./modelToYaml";
import { ScriptKind } from "@/models/schema";
import type { ScriptDefinition, TckDefinition } from "@/models/schema";

describe("yamlToModel", () => {
  it("parses a valid minimal YAML into a ScriptDefinition", () => {
    const yaml = `
kind: test
name: minimal-test
version: "1.0"
steps:
  - type: http_request
    params:
      url: https://example.com
`;
    const result = yamlToModel(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const model = result.model as ScriptDefinition;
    expect(model.kind).toBe(ScriptKind.TEST);
    expect(model.name).toBe("minimal-test");
    expect(model.version).toBe("1.0");
    expect(model.steps).toHaveLength(1);
    expect(model.steps[0].type).toBe("http_request");
  });

  it("returns error for empty string", () => {
    const result = yamlToModel("");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeTruthy();
  });

  it("returns error for invalid YAML syntax", () => {
    const badYaml = `
kind: test
name: broken
  invalid:
    - [unclosed
`;
    const result = yamlToModel(badYaml);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("YAML parse error");
  });

  it("parses YAML with services correctly", () => {
    const yaml = `
kind: test
name: service-test
version: "1.0"
services:
  - name: provider
    type: edc_connector
    base_url: https://provider.local
  - name: consumer
    type: edc_connector
    base_url: https://consumer.local
steps: []
`;
    const result = yamlToModel(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const model = result.model as ScriptDefinition;
    expect(model.services).toHaveLength(2);
    expect(model.services![0].name).toBe("provider");
    expect(model.services![1].type).toBe("edc_connector");
  });

  it("parses YAML with validate blocks", () => {
    const yaml = `
kind: test
name: validate-test
version: "1.0"
steps:
  - type: http_request
    params:
      url: https://api.example.com
      method: GET
    validate:
      - type: EQUALS
        output: status_code
        value: 200
      - type: CONTAINS
        output: body
        value: healthy
`;
    const result = yamlToModel(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const model = result.model as ScriptDefinition;
    expect(model.steps[0].validate).toHaveLength(2);
    expect(model.steps[0].validate![0].type).toBe("EQUALS");
    expect(model.steps[0].validate![1].output).toBe("body");
  });

  it("detects TCK kind from structure when kind is missing", () => {
    const yaml = `
name: auto-tck
version: "1.0"
tests:
  - test-a.yaml
  - test-b.yaml
`;
    const result = yamlToModel(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.kind).toBe(ScriptKind.TCK);
    const model = result.model as TckDefinition;
    expect(model.tests).toHaveLength(2);
  });

  it("round-trips a model through modelToYaml and yamlToModel", () => {
    const original: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "roundtrip-test",
      version: "2.0",
      steps: [
        {
          type: "http_request",
          description: "Health check",
          params: { url: "https://api.example.com/health", method: "GET" },
          validate: [{ type: "EQUALS" as const, output: "status_code", value: 200 }],
        },
      ],
    };

    const yaml = modelToYaml(original);
    const result = yamlToModel(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const roundTripped = result.model as ScriptDefinition;
    expect(roundTripped.name).toBe(original.name);
    expect(roundTripped.version).toBe(original.version);
    expect(roundTripped.steps).toHaveLength(1);
    expect(roundTripped.steps[0].type).toBe("http_request");
    expect(roundTripped.steps[0].validate![0].value).toBe(200);
  });
});
