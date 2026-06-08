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
 * Loads and types the policy schema manifest. The manifest is the single
 * config that drives codegen: each version entry names its schema folder,
 * entry schema, and resolution strategy. Adding a version is a manifest edit
 * plus a schema folder — no code change for known resolution shapes.
 */

import { readFileSync } from "node:fs";

import type { ResolutionId } from "./strategies/index.ts";

/** How the registry constraints are grouped for a version. */
export type Bucketing = "by-rule" | "single";

/** Rule for deriving the stable SCHEMA_VERSION from an entry schema field. */
export interface SchemaVersionFrom {
  entry: string;
  field: string;
  pattern: string;
  template: string;
}

/** One dataspace policy version declared in the manifest. */
export interface ManifestVersion {
  id: string;
  label: string;
  dir: string;
  entry: string;
  resolution: ResolutionId;
  bucketing: Bucketing;
  /** Sub-folder (relative to `dir`) holding per-constraint schema files. */
  constraintDir?: string;
}

/** The full policy schema manifest. */
export interface PolicyManifest {
  schemaVersionFrom: SchemaVersionFrom;
  versions: ManifestVersion[];
}

/** Read and parse the manifest JSON from disk. */
export function loadManifest(manifestPath: string): PolicyManifest {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as PolicyManifest;
}

/**
 * Derive the stable schema-version identifier (e.g. `catenax-2025-9`) from an
 * entry schema field, applying the manifest's regex pattern and `$N` template.
 */
export function deriveSchemaVersion(rule: SchemaVersionFrom, fieldValue: string): string {
  const match = new RegExp(rule.pattern).exec(fieldValue);
  if (!match) {
    return "catenax-unknown";
  }
  return rule.template.replace(/\$(\d+)/g, (_whole, index: string) => match[Number(index)] ?? "");
}
