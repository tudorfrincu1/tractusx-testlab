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

// Golden-output regression guard for the policy emitters.
//
// This pins the CURRENT, hand-written emitter output (JSON, ODRL, YAML) for a
// representative PolicyPayload matrix as committed snapshots. Later phases that
// switch the constraint source to a schema-derived registry must reproduce this
// exact output — any byte-level drift fails here. The guard intentionally
// depends ONLY on the public emit entrypoints, never on the registry, so it
// stays valid across the refactor.
import { describe, expect, it } from "vitest";
import { policyToJson, policyToOdrlJson } from "..";
import { buildPolicyYaml, type PolicyYamlResult } from "../editors/yaml/policyYaml";
import { POLICY_FIXTURES } from "./fixtures";

/** Flattens the colour-tokenised YAML preview into the plain emitted text. */
function yamlText(result: PolicyYamlResult): string {
  return result.lines.map((line) => line.tokens.map((token) => token.text).join("")).join("\n");
}

describe("policy emitter golden output", () => {
  describe("JSON (policyToJson)", () => {
    for (const fixture of POLICY_FIXTURES) {
      it(`pins ${fixture.name} — ${fixture.covers}`, () => {
        expect(policyToJson(fixture.policy)).toMatchSnapshot();
      });
    }
  });

  describe("ODRL (policyToOdrlJson)", () => {
    for (const fixture of POLICY_FIXTURES) {
      it(`pins ${fixture.name} — ${fixture.covers}`, () => {
        expect(policyToOdrlJson(fixture.policy, fixture.id)).toMatchSnapshot();
      });
    }
  });

  describe("YAML (buildPolicyYaml)", () => {
    for (const fixture of POLICY_FIXTURES) {
      it(`pins ${fixture.name} — ${fixture.covers}`, () => {
        const result = buildPolicyYaml(fixture.id, fixture.name, fixture.policy);
        expect(yamlText(result)).toMatchSnapshot();
      });
    }
  });
});
