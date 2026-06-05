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
 * Static format catalog, shaped EXACTLY like the ADR-0018 `GET /formats`
 * manifest. This is the POC stand-in for the backend endpoint: a later change
 * swaps the import in {@link useFormatCatalog} for an HTTP fetch of the same
 * JSON shape — no consumer of the hook changes.
 */

/** One format entry in the manifest (mirrors the backend `FormatMeta`). */
export interface FormatMeta {
  id: string;
  label: string;
  /** Catalog-owned validation regex (Option D: drives validation). */
  validation_regex: string;
  /** Generator suggested when this format is selected (optional). */
  default_generator_id?: string;
}

/** The full `GET /formats` response shape. */
export interface FormatManifest {
  version: string;
  formats: FormatMeta[];
}

export const FORMAT_MANIFEST: FormatManifest = {
  version: "1.0",
  formats: [
    {
      id: "uuid",
      label: "UUID",
      validation_regex: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
      default_generator_id: "uuid_v4",
    },
    {
      id: "url",
      label: "URL",
      validation_regex: String.raw`^https?://\S+$`,
      default_generator_id: "mock_endpoint_url",
    },
    {
      id: "bpn",
      label: "BPN",
      validation_regex: "^BPNL[0-9A-Z]{12}$",
      default_generator_id: "bpn",
    },
    {
      id: "did",
      label: "DID",
      validation_regex: String.raw`^did:[a-z0-9]+:\S+$`,
      default_generator_id: "did",
    },
  ],
};
