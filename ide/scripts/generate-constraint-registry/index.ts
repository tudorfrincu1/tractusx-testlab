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
 * Constraint registry codegen entrypoint. Driven entirely by the policy schema
 * manifest (`ide/schemas/policies/manifest.json`): it iterates the declared
 * versions, dispatches each to its resolution strategy, merges the editorial
 * overlay, and writes the keyed `constraintRegistry.generated.ts`. Adding a new
 * version is a manifest entry plus a schema folder — no code change here.
 *
 * Run with `npm run generate:registry` (Node 23+, native TypeScript execution).
 */

import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  renderRegistryModule,
  type EmittedConstraint,
  type EmittedRegistry,
  type EmittedRightOperand,
} from "./emitter.ts";
import { deriveSchemaVersion, loadManifest, type ManifestVersion } from "./manifest.ts";
import { PLACEHOLDERS, resolveVersionMetadata, type VersionMetadata } from "./overlay.ts";
import { readSchemaDoc } from "./schema/index.ts";
import { STRATEGIES, type RawRegistry } from "./strategies/index.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const policiesDir = resolve(scriptDir, "../../schemas/policies");
const manifestPath = join(policiesDir, "manifest.json");
const outputPath = resolve(
  scriptDir,
  "../../src/shared/ui/policy-constraints/constraintRegistry.generated.ts",
);

function withPlaceholder(
  version: string,
  key: string,
  rightOperand: { type: string; values?: string[] },
): EmittedRightOperand {
  const placeholder = PLACEHOLDERS[version]?.[key];
  const emitted: EmittedRightOperand = { type: rightOperand.type };
  if (rightOperand.values !== undefined) {
    emitted.values = rightOperand.values;
  }
  if (placeholder !== undefined) {
    emitted.placeholder = placeholder;
  }
  return emitted;
}

/** Merge the editorial placeholder overlay onto a strategy's raw registry. */
function overlayRegistry(version: string, raw: RawRegistry): EmittedRegistry {
  const emitted: EmittedRegistry = {};
  for (const [key, data] of Object.entries(raw)) {
    const constraint: EmittedConstraint = {
      operators: data.operators,
      rightOperand: withPlaceholder(version, key, data.rightOperand),
    };
    emitted[key] = constraint;
  }
  return emitted;
}

/** Resolve a version through its strategy and apply the editorial overlay. */
function buildVersion(version: ManifestVersion): Record<string, EmittedRegistry> {
  const strategy = STRATEGIES[version.resolution];
  const raw = strategy({
    dir: join(policiesDir, version.dir),
    entry: version.entry,
    constraintDir: version.constraintDir ?? "",
  });
  const buckets: Record<string, EmittedRegistry> = {};
  for (const [bucket, registry] of Object.entries(raw)) {
    buckets[bucket] = overlayRegistry(version.id, registry);
  }
  return buckets;
}

function main(): void {
  const manifest = loadManifest(manifestPath);

  const versionEntryDoc = readSchemaDoc(join(policiesDir, manifest.schemaVersionFrom.entry));
  const fieldValue = String(versionEntryDoc[manifest.schemaVersionFrom.field] ?? "");
  const schemaVersion = deriveSchemaVersion(manifest.schemaVersionFrom, fieldValue);
  const schemaNamespace = fieldValue.replace(/\/[^/]+$/, "");

  const policyVersions: string[] = [];
  const versionSchemas: Record<string, VersionMetadata> = {};
  const versionBucketing: Record<string, string> = {};
  const constraintsByVersion: Record<string, Record<string, EmittedRegistry>> = {};
  const provenance: Record<string, string> = {
    generator: "ide/scripts/generate-constraint-registry",
    schemasRoot: "ide/schemas/policies",
    schemaNamespace,
  };

  for (const version of manifest.versions) {
    const buckets = buildVersion(version);
    policyVersions.push(version.id);
    constraintsByVersion[version.id] = buckets;
    versionSchemas[version.id] = resolveVersionMetadata(version.id, version.label);
    versionBucketing[version.id] = version.bucketing;
    provenance[`${version.id}Source`] = `ide/schemas/policies/${version.dir}`;
    for (const [bucket, registry] of Object.entries(buckets)) {
      console.log(`  ${version.id}.${bucket}: ${Object.keys(registry).length} constraints`);
    }
  }

  const module = renderRegistryModule({
    schemaVersion,
    provenance,
    policyVersions,
    versionSchemas,
    versionBucketing,
    constraintsByVersion,
  });

  writeFileSync(outputPath, module, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main();
