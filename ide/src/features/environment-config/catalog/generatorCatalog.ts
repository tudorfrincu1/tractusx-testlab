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

/**
 * Static generator catalog, shaped EXACTLY like the ADR-0018 `GET /generators`
 * manifest. This is the POC stand-in for the backend endpoint: a later change
 * swaps the import in {@link useGeneratorCatalog} for an HTTP fetch of the same
 * JSON shape — no consumer of the hook changes.
 */

/** A single typed generator parameter, mirroring the backend `ParamSpec`. */
export interface GeneratorParamSpec {
  name: string;
  type: "str" | "int" | "bool" | "float";
  required: boolean;
  default?: string | number | boolean;
}

/** One generator entry in the manifest (mirrors the backend `GeneratorMeta`). */
export interface GeneratorManifestEntry {
  id: string;
  label: string;
  /** The variable type/format the generator produces (1:1 per ADR OQ-2). */
  output_type: string;
  params: GeneratorParamSpec[];
}

/** The full `GET /generators` response shape. */
export interface GeneratorManifest {
  version: string;
  generators: GeneratorManifestEntry[];
}

export const GENERATOR_MANIFEST: GeneratorManifest = {
  version: "1.0",
  generators: [
    { id: "uuid_v4", label: "Random UUID", output_type: "uuid", params: [] },
    {
      id: "bpn",
      label: "Business Partner Number",
      output_type: "bpn",
      params: [{ name: "country", type: "str", required: false, default: "DE" }],
    },
    { id: "did", label: "Decentralized Identifier", output_type: "did", params: [] },
    { id: "mock_endpoint_url", label: "Mock Endpoint URL", output_type: "url", params: [] },
    {
      id: "random_int",
      label: "Random Integer",
      output_type: "int",
      params: [
        { name: "min", type: "int", required: false, default: 0 },
        { name: "max", type: "int", required: false, default: 1000 },
      ],
    },
  ],
};
