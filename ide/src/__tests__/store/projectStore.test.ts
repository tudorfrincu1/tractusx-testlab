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

import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "@/store/project/useProjectStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("useProjectStore — project lifecycle", () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    useProjectStore.setState({
      hasProject: false,
      projectName: "new-tck",
      tck: { kind: "tck", testlab: "v1-alpha", id: "new-tck", name: "new-tck", metadata: { name: "New TCK", version: "1.0" }, tests: [] },
      tests: new Map(),
      testOrder: [],
      activeFile: null,
      dirty: new Map(),
      workspaceStates: {},
      lastSavedAt: null,
    });
  });

  it("createProject sets hasProject to true", () => {
    useProjectStore.getState().createProject("my-project");

    const state = useProjectStore.getState();
    expect(state.hasProject).toBe(true);
    expect(state.projectName).toBe("my-project");
  });

  it("createProject defaults name to new-tck when none given", () => {
    useProjectStore.getState().createProject();

    const state = useProjectStore.getState();
    expect(state.projectName).toBe("new-tck");
  });

  it("createProject resets tests and testOrder", () => {
    // Seed some data first
    useProjectStore.setState({
      tests: new Map([["old-test", { kind: "test", name: "old-test", steps: [] } as never]]),
      testOrder: ["old-test"],
    });

    useProjectStore.getState().createProject("fresh");

    const state = useProjectStore.getState();
    expect(state.tests.size).toBe(0);
    expect(state.testOrder).toHaveLength(0);
  });

  it("createProject sets activeFile to tck index", () => {
    useProjectStore.getState().createProject("proj");

    const state = useProjectStore.getState();
    expect(state.activeFile).toEqual({ type: "tck", name: "index" });
  });

  it("createProject increments projectGeneration", () => {
    const gen0 = useProjectStore.getState().projectGeneration;
    useProjectStore.getState().createProject("a");
    const gen1 = useProjectStore.getState().projectGeneration;
    useProjectStore.getState().createProject("b");
    const gen2 = useProjectStore.getState().projectGeneration;

    expect(gen1).toBe(gen0 + 1);
    expect(gen2).toBe(gen1 + 1);
  });
});

describe("useProjectStore — test management", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useProjectStore.getState().createProject("test-project");
  });

  it("addTest creates a new test with default name", () => {
    const name = useProjectStore.getState().addTest();

    const state = useProjectStore.getState();
    expect(state.tests.has(name)).toBe(true);
    expect(state.testOrder).toContain(name);
  });

  it("addTest generates unique names for duplicates", () => {
    const name1 = useProjectStore.getState().addTest("my-test");
    const name2 = useProjectStore.getState().addTest("my-test");

    expect(name1).toBe("my-test");
    expect(name2).toBe("my-test-1");
  });

  it("removeTest deletes from tests map and testOrder", () => {
    const name = useProjectStore.getState().addTest("doomed");

    useProjectStore.getState().removeTest(name);

    const state = useProjectStore.getState();
    expect(state.tests.has(name)).toBe(false);
    expect(state.testOrder).not.toContain(name);
  });

  it("removeTest navigates to index when active test is removed", () => {
    const name = useProjectStore.getState().addTest("active-test");
    useProjectStore.setState({ activeFile: { type: "test", name } });

    useProjectStore.getState().removeTest(name);

    const state = useProjectStore.getState();
    expect(state.activeFile).toEqual({ type: "tck", name: "index" });
  });

  it("renameTest updates tests map key and testOrder entry", () => {
    useProjectStore.getState().addTest("original");

    useProjectStore.getState().renameTest("original", "renamed");

    const state = useProjectStore.getState();
    expect(state.tests.has("original")).toBe(false);
    expect(state.tests.has("renamed")).toBe(true);
    expect(state.testOrder).toContain("renamed");
    expect(state.testOrder).not.toContain("original");
  });

  it("renameTest rejects empty name", () => {
    useProjectStore.getState().addTest("keep-me");

    useProjectStore.getState().renameTest("keep-me", "  ");

    const state = useProjectStore.getState();
    expect(state.tests.has("keep-me")).toBe(true);
  });

  it("renameTest rejects duplicate name", () => {
    useProjectStore.getState().addTest("alpha");
    useProjectStore.getState().addTest("beta");

    useProjectStore.getState().renameTest("alpha", "beta");

    const state = useProjectStore.getState();
    expect(state.tests.has("alpha")).toBe(true);
    expect(state.tests.has("beta")).toBe(true);
  });

  it("updateTest replaces the model for an existing test", () => {
    useProjectStore.getState().addTest("updatable");
    const updatedModel = {
      kind: "test" as const,
      name: "updatable",
      steps: [{ id: "step-1", uses: "http/request", with: { url: "http://example.com" } }],
    };

    useProjectStore.getState().updateTest("updatable", updatedModel as never);

    const state = useProjectStore.getState();
    const test = state.tests.get("updatable");
    expect(test?.steps).toHaveLength(1);
  });
});
