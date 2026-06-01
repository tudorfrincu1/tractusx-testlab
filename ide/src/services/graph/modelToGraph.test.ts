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
import { modelToGraph } from "./modelToGraph";
import type { ScriptDefinition } from "@/models/schema";
import { ScriptKind } from "@/models/schema";

describe("modelToGraph", () => {
  it("produces start and end nodes for an empty model", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "empty-test",
      version: "1.0",
      steps: [],
    };

    const { nodes, edges } = modelToGraph(model, "execution");

    const startNode = nodes.find((n) => n.id === "flow-start");
    const endNode = nodes.find((n) => n.id === "flow-end");
    expect(startNode).toBeDefined();
    expect(endNode).toBeDefined();
    expect(edges.length).toBeGreaterThanOrEqual(1);
  });

  it("creates step nodes for each step in execution mode", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "multi-step",
      version: "1.0",
      steps: [
        { id: "s1", uses: "http_request", with: { url: "https://a.com" } },
        { id: "s2", uses: "http_request", with: { url: "https://b.com" } },
        { id: "s3", uses: "wait", with: { seconds: 5 } },
      ],
    };

    const { nodes } = modelToGraph(model, "execution");

    const stepNodes = nodes.filter((n) => n.type === "step");
    expect(stepNodes).toHaveLength(3);
    expect(stepNodes[0].data.stepType).toBe("http_request");
    expect(stepNodes[2].data.stepType).toBe("wait");
  });

  it("creates variable nodes and edges for returns in dataflow mode", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "variable-test",
      version: "1.0",
      steps: [
        {
          id: "s1",
          uses: "http_request",
          with: { url: "https://api.com" },
          returns: { auth_token: "$.token" },
        },
        {
          id: "s2",
          uses: "http_request",
          with: { url: "https://api.com/data", headers: { Authorization: "@auth_token" } },
        },
      ],
    };

    const { nodes, edges } = modelToGraph(model, "dataflow");

    const variableNodes = nodes.filter((n) => n.type === "variable");
    expect(variableNodes).toHaveLength(1);
    expect(variableNodes[0].data.label).toBe("auth_token");

    const storeEdges = edges.filter((e) => e.label === "stores");
    expect(storeEdges).toHaveLength(1);

    const readEdges = edges.filter((e) => e.label === "reads");
    expect(readEdges).toHaveLength(1);
  });

  it("includes phase nodes for setup and teardown", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "phased-test",
      version: "1.0",
      setup: [{ id: "setup1", uses: "http_request", with: { url: "https://setup.com" } }],
      steps: [{ id: "main1", uses: "http_request", with: { url: "https://main.com" } }],
      teardown: [{ id: "teardown1", uses: "http_request", with: { url: "https://teardown.com" } }],
    };

    const { nodes } = modelToGraph(model, "execution");

    const phaseNodes = nodes.filter((n) => n.type === "phase");
    expect(phaseNodes).toHaveLength(3);
    expect(phaseNodes.map((n) => n.data.label)).toEqual(
      expect.arrayContaining(["▸ Setup", "▸ Steps", "▸ Teardown"])
    );
  });

  it("creates service nodes in dataflow mode", () => {
    const model: ScriptDefinition = {
      kind: ScriptKind.TEST,
      name: "service-test",
      version: "1.0",
      services: [
        { name: "provider", uses: "edc_connector", with: { base_url: "https://provider.local" } },
      ],
      steps: [{ id: "s1", uses: "http_request", with: { url: "https://provider.local/api" } }],
    };

    const { nodes } = modelToGraph(model, "dataflow");

    const serviceNodes = nodes.filter((n) => n.type === "service");
    expect(serviceNodes).toHaveLength(1);
    expect(serviceNodes[0].data.label).toBe("provider");
  });
});
