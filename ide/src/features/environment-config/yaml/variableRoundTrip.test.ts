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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.8).
// It was reviewed and tested by a human committer.

import { readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { parseEnvVariables } from "./variableDeserialize";
import { envVariablesToYamlList } from "./variableSerialize";
import { envVariablesToVariables, variablesToEnvVariables } from "./variableRoundTrip";

/**
 * The canonical target shape: the migrated example's `env.variables` block. The
 * Variable Explorer must reproduce it faithfully in BOTH directions — parsed in
 * for editing and serialized back out for export — without losing the complex
 * `ccm_usage_policy` policy variable or any simple variable.
 */
const EXAMPLE = path.resolve(
  process.cwd(),
  "public/examples/certificate-management-v2.0/index.yaml",
);

function loadExampleVariables(): Record<string, unknown>[] {
  const doc = yaml.load(readFileSync(EXAMPLE, "utf8")) as { env?: { variables?: unknown } };
  const list = doc.env?.variables;
  if (!Array.isArray(list)) throw new Error("example env.variables is not a list");
  return list as Record<string, unknown>[];
}

describe("env.variables round-trip (certificate-management-v2.0)", () => {
  const original = loadExampleVariables();

  it("parses every declared variable, including the complex policy", () => {
    const record = parseEnvVariables(original);
    expect(record).toBeDefined();
    const names = Object.keys(record ?? {});
    expect(names).toContain("ccm_usage_policy");
    expect(names).toContain("consumer_bpn");
    // The policy keeps its original entry verbatim for lossless re-export.
    expect(record?.ccm_usage_policy.raw?.uses).toBe("config/connector/policy");
  });

  it("round-trips the document export path byte-for-byte", () => {
    const record = parseEnvVariables(original) ?? {};
    expect(envVariablesToYamlList(record)).toEqual(original);
  });

  it("reconstructs the policy as a complex variable and simple vars as simple", () => {
    const record = parseEnvVariables(original) ?? {};
    const variables = envVariablesToVariables(record);
    const policy = variables.find((variable) => variable.id === "ccm_usage_policy");
    expect(policy?.kind).toBe("complex");
    expect(policy?.kind === "complex" && policy.type).toBe("connector_policy");
    const providerUrl = variables.find((variable) => variable.id === "provider_url");
    expect(providerUrl?.kind).toBe("simple");
    expect(providerUrl?.kind === "simple" && providerUrl.source).toBe("input");
  });

  it("round-trips the Explorer edit path (rich variables back to YAML)", () => {
    const record = parseEnvVariables(original) ?? {};
    const reExported = envVariablesToYamlList(variablesToEnvVariables(envVariablesToVariables(record)));
    expect(reExported).toEqual(original);
  });
});
