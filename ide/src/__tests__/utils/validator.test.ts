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
import { validate, setKnownStepTypes } from "@/services/validation/validator";
import type { ScriptDefinition, TckDefinition } from "@/models/schema";
import { ScriptKind } from "@/models/schema";

describe("validate — ScriptDefinition", () => {
  const minimalValid: ScriptDefinition = {
    kind: ScriptKind.TEST,
    name: "valid-test",
    version: "1.0",
    steps: [{ id: "s1", uses: "http/request", with: { url: "http://x.com" } }],
  };

  it("returns no errors for a valid minimal test", () => {
    const errors = validate(minimalValid);

    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("reports error when name is empty", () => {
    const doc: ScriptDefinition = { ...minimalValid, name: "" };

    const errors = validate(doc);

    expect(errors.some((e) => e.path === "name" && e.severity === "error")).toBe(true);
  });

  it("reports warning when steps array is empty", () => {
    const doc: ScriptDefinition = { ...minimalValid, steps: [] };

    const errors = validate(doc);

    expect(errors.some((e) => e.path === "steps" && e.severity === "warning")).toBe(true);
  });

  it("reports error when step has no uses field", () => {
    const doc: ScriptDefinition = {
      ...minimalValid,
      steps: [{ id: "s1", uses: "", with: {} }],
    };

    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("'uses' is required"))).toBe(true);
  });

  it("reports error when step has no id field", () => {
    const doc: ScriptDefinition = {
      ...minimalValid,
      steps: [{ id: "", uses: "http/request", with: {} }],
    };

    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("'id' is required"))).toBe(true);
  });

  it("reports error for unknown step type when catalog is set", () => {
    setKnownStepTypes(["http/request", "edc/create_asset"]);

    const doc: ScriptDefinition = {
      ...minimalValid,
      steps: [{ id: "s1", uses: "nonexistent/step", with: {} }],
    };

    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Unknown step type"))).toBe(true);

    // Reset
    setKnownStepTypes([]);
  });

  it("reports error for invalid on_failure value", () => {
    const doc: ScriptDefinition = {
      ...minimalValid,
      steps: [{ id: "s1", uses: "http/request", with: {}, on_failure: "INVALID" as never }],
    };

    const errors = validate(doc);

    expect(errors.some((e) => e.message.includes("Invalid on_failure"))).toBe(true);
  });

  it("validates setup and teardown steps", () => {
    const doc: ScriptDefinition = {
      ...minimalValid,
      setup: [{ id: "", uses: "setup/step", with: {} }],
      teardown: [{ id: "t1", uses: "", with: {} }],
    };

    const errors = validate(doc);

    expect(errors.some((e) => e.path.includes("setup") && e.message.includes("'id' is required"))).toBe(true);
    expect(errors.some((e) => e.path.includes("teardown") && e.message.includes("'uses' is required"))).toBe(true);
  });
});

describe("validate — TckDefinition", () => {
  it("returns no errors for valid TCK", () => {
    const tck: TckDefinition = {
      kind: ScriptKind.TCK,
      name: "my-tck",
      version: "1.0",
      tests: [{ test: "test-a" }],
    };

    const errors = validate(tck);

    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("reports error when TCK name is empty", () => {
    const tck: TckDefinition = {
      kind: ScriptKind.TCK,
      name: "",
      version: "1.0",
      tests: [],
    };

    const errors = validate(tck);

    expect(errors.some((e) => e.path === "name")).toBe(true);
  });
});
