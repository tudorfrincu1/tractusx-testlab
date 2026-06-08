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
 * Schema parity guard. Asserts the frontend policy schema copies
 * (`ide/schemas/policies/<version>/`) stay byte-identical to the backend
 * copies (`src/tractusx_testlab/schemas/policies/<version>/`), for EVERY
 * version, scaling to N versions with no edits:
 *
 *   - Every version directory present on one side must exist on the other
 *     (missing-copy detection), and their trees must be recursively identical.
 *   - Every `manifest.json` version `dir` must have both a frontend and a
 *     backend folder (manifest <-> backend parity).
 *
 * Run from the `ide` working dir with `npm run verify:schemas`. Exits non-zero
 * and names the offending file/version on any drift or missing copy.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, "..", "..", "schemas", "policies");
const backendRoot = resolve(
  scriptDir,
  "..",
  "..",
  "..",
  "src",
  "tractusx_testlab",
  "schemas",
  "policies",
);

const failures: string[] = [];

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function listVersionDirs(root: string): string[] {
  if (!isDirectory(root)) {
    return [];
  }
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

/** Recursively collect file relative paths under `root`. */
function listFiles(root: string): Set<string> {
  const files = new Set<string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        files.add(relative(root, full));
      }
    }
  };
  walk(root);
  return files;
}

/** Compare two version trees byte-for-byte; record every divergence. */
function compareVersionTree(version: string): void {
  const frontendDir = join(frontendRoot, version);
  const backendDir = join(backendRoot, version);

  const frontendFiles = listFiles(frontendDir);
  const backendFiles = listFiles(backendDir);

  for (const rel of frontendFiles) {
    if (!backendFiles.has(rel)) {
      failures.push(`missing in backend: ${version}/${rel}`);
    }
  }
  for (const rel of backendFiles) {
    if (!frontendFiles.has(rel)) {
      failures.push(`missing in frontend: ${version}/${rel}`);
    }
  }
  for (const rel of frontendFiles) {
    if (!backendFiles.has(rel)) {
      continue;
    }
    const frontendBytes = readFileSync(join(frontendDir, rel));
    const backendBytes = readFileSync(join(backendDir, rel));
    if (!frontendBytes.equals(backendBytes)) {
      failures.push(`content differs: ${version}/${rel}`);
    }
  }
}

interface ManifestVersion {
  dir: string;
}

function loadManifestDirs(): string[] {
  const manifestPath = join(frontendRoot, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    versions: ManifestVersion[];
  };
  return manifest.versions.map((version) => version.dir);
}

function main(): void {
  const frontendVersions = listVersionDirs(frontendRoot);
  const backendVersions = listVersionDirs(backendRoot);
  const allVersions = new Set([...frontendVersions, ...backendVersions]);

  // Missing-copy detection: a version dir present on only one side fails.
  for (const version of [...allVersions].sort((a, b) => a.localeCompare(b))) {
    const onFrontend = frontendVersions.includes(version);
    const onBackend = backendVersions.includes(version);
    if (onFrontend && !onBackend) {
      failures.push(`missing backend version dir: ${version}`);
    } else if (onBackend && !onFrontend) {
      failures.push(`missing frontend version dir: ${version}`);
    } else {
      compareVersionTree(version);
    }
  }

  // Manifest <-> backend (and frontend) parity.
  for (const dir of loadManifestDirs()) {
    if (!isDirectory(join(frontendRoot, dir))) {
      failures.push(`manifest version "${dir}" has no frontend folder`);
    }
    if (!isDirectory(join(backendRoot, dir))) {
      failures.push(`manifest version "${dir}" has no backend folder`);
    }
  }

  if (failures.length > 0) {
    console.error("Schema parity check FAILED:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    console.error(
      `\nFrontend: ${frontendRoot}\nBackend:  ${backendRoot}\n` +
        "Frontend and backend policy schema copies must be identical.",
    );
    process.exit(1);
  }

  console.log(
    `Schema parity OK: ${frontendVersions.length} version(s) ` +
      `(${frontendVersions.join(", ")}) match across frontend and backend.`,
  );
}

main();
