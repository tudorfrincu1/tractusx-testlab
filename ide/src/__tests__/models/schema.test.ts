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
import {
  ScriptKind,
  isTck,
  isTest,
  isTestRef,
  createEmptyTest,
  createEmptyTck,
} from "@/models/schema";
import type { ScriptDefinition, TckDefinition, TestRef } from "@/models/schema";

describe("ScriptKind", () => {
  it("has TEST and TCK values", () => {
    expect(ScriptKind.TEST).toBe("test");
    expect(ScriptKind.TCK).toBe("tck");
  });
});

describe("isTck", () => {
  it("returns true for TCK documents", () => {
    const tck: TckDefinition = { kind: ScriptKind.TCK, name: "x", tests: [] };

    expect(isTck(tck)).toBe(true);
  });

  it("returns false for test documents", () => {
    const test: ScriptDefinition = { kind: ScriptKind.TEST, name: "x", steps: [] };

    expect(isTck(test)).toBe(false);
  });
});

describe("isTest", () => {
  it("returns true for test documents", () => {
    const test: ScriptDefinition = { kind: ScriptKind.TEST, name: "x", steps: [] };

    expect(isTest(test)).toBe(true);
  });

  it("returns false for TCK documents", () => {
    const tck: TckDefinition = { kind: ScriptKind.TCK, name: "x", tests: [] };

    expect(isTest(tck)).toBe(false);
  });
});

describe("isTestRef", () => {
  it("returns true for TestRef objects", () => {
    const ref: TestRef = { test: "my-test" };

    expect(isTestRef(ref)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isTestRef(null)).toBe(false);
  });

  it("returns false for strings", () => {
    expect(isTestRef("my-test")).toBe(false);
  });

  it("returns false for objects without test property", () => {
    expect(isTestRef({ name: "something" })).toBe(false);
  });

  it("returns false for objects with kind property (ScriptDefinition)", () => {
    expect(isTestRef({ test: "x", kind: "test" })).toBe(false);
  });
});

describe("createEmptyTest", () => {
  it("creates a test with default values", () => {
    const test = createEmptyTest();

    expect(test.kind).toBe(ScriptKind.TEST);
    expect(test.name).toBe("new-test");
    expect(test.steps).toEqual([]);
  });

  it("creates independent instances", () => {
    const a = createEmptyTest();
    const b = createEmptyTest();
    a.name = "modified";

    expect(b.name).toBe("new-test");
  });
});

describe("createEmptyTck", () => {
  it("creates a TCK with default values", () => {
    const tck = createEmptyTck();

    expect(tck.kind).toBe(ScriptKind.TCK);
    expect(tck.name).toBe("new-tck");
    expect(tck.tests).toEqual([]);
  });

  it("creates independent instances", () => {
    const a = createEmptyTck();
    const b = createEmptyTck();
    a.name = "modified";

    expect(b.name).toBe("new-tck");
  });
});
