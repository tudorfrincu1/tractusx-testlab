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
 * Vendors the upstream Catena-X CX-0152 policy `assets/` subtree into
 * `ide/schemas/policies/saturn/` as a byte-for-byte mirror, so a spec bump is a
 * re-download rather than a hand-merge.
 *
 * Source of truth (PINNED, do not bump without intent):
 *   repo:  catenax-eV/catenax-ev.github.io
 *   path:  docs/standards/CX-0152-PolicyConstrainsForDataExchange/assets/
 *   sha:   85f1ad8acdb6a835a40a3422119c3ecd2a1ec055
 *
 * The script enumerates the assets subtree from the GitHub git-trees API at the
 * pinned SHA, fetches every blob from the raw endpoint, and replaces the saturn
 * folder so it equals upstream verbatim. It is OPT-IN (`npm run sync:schemas`),
 * never wired into build/CI — codegen never needs network. Idempotent: it prints
 * the per-file action (add/update/unchanged) and prunes saturn files that no
 * longer exist upstream.
 *
 * Run from the `ide` working dir with `npm run sync:schemas` (Node 23+).
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UPSTREAM_REPO = "catenax-eV/catenax-ev.github.io";
const UPSTREAM_SHA = "85f1ad8acdb6a835a40a3422119c3ecd2a1ec055";
const UPSTREAM_ASSETS_DIR = "docs/standards/CX-0152-PolicyConstrainsForDataExchange/assets/";
const TREES_API = `https://api.github.com/repos/${UPSTREAM_REPO}/git/trees/${UPSTREAM_SHA}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${UPSTREAM_SHA}/${UPSTREAM_ASSETS_DIR}`;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const saturnDir = resolve(scriptDir, "../../schemas/policies/saturn");

interface TreeEntry {
  path: string;
  type: string;
}

interface TreeResponse {
  tree: TreeEntry[];
}

/** Fetch the upstream tree and return the asset-relative paths of every blob. */
async function listUpstreamFiles(): Promise<string[]> {
  const response = await fetch(TREES_API, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "testlab-sync-schemas" },
  });
  if (!response.ok) {
    throw new Error(`Trees API failed: ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as TreeResponse;
  return body.tree
    .filter((entry) => entry.type === "blob" && entry.path.startsWith(UPSTREAM_ASSETS_DIR))
    .map((entry) => entry.path.slice(UPSTREAM_ASSETS_DIR.length))
    .sort((a, b) => a.localeCompare(b));
}

/** Fetch a single upstream blob as raw bytes. */
async function fetchBlob(relPath: string): Promise<Buffer> {
  const response = await fetch(`${RAW_BASE}${relPath}`, {
    headers: { "User-Agent": "testlab-sync-schemas" },
  });
  if (!response.ok) {
    throw new Error(`Raw fetch failed for ${relPath}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Collect saturn-relative paths of every currently vendored file. */
function listLocalFiles(): Set<string> {
  const files = new Set<string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        files.add(relative(saturnDir, full));
      }
    }
  };
  if (statSync(saturnDir, { throwIfNoEntry: false })?.isDirectory()) {
    walk(saturnDir);
  }
  return files;
}

/** Write a blob to saturn; return "add" | "update" | "unchanged". */
function writeFile(relPath: string, bytes: Buffer): "add" | "update" | "unchanged" {
  const target = join(saturnDir, relPath);
  const existing = statSync(target, { throwIfNoEntry: false });
  if (existing?.isFile() && readFileSync(target).equals(bytes)) {
    return "unchanged";
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  return existing?.isFile() ? "update" : "add";
}

const PROVENANCE_NAME = "PROVENANCE.txt";

function renderProvenance(files: string[]): string {
  return [
    "Vendored Catena-X CX-0152 policy schemas — DO NOT HAND-EDIT.",
    "",
    `Source repo : ${UPSTREAM_REPO}`,
    `Source path : ${UPSTREAM_ASSETS_DIR}`,
    `Pinned SHA  : ${UPSTREAM_SHA}`,
    `Vendored on : ${new Date().toISOString().slice(0, 10)}`,
    `File count  : ${files.length} (mirror of upstream assets/, verbatim)`,
    "",
    "These files are a byte-for-byte mirror of the upstream CX-0152 assets/ folder.",
    "Regenerate with `npm run sync:schemas`. To bump the spec, change the pinned SHA",
    "in ide/scripts/sync-schemas/index.ts and re-run. Never edit these files by hand.",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  console.log(`Syncing saturn schemas from ${UPSTREAM_REPO}@${UPSTREAM_SHA.slice(0, 7)}`);
  const upstreamFiles = await listUpstreamFiles();
  const upstreamSet = new Set(upstreamFiles);
  upstreamSet.add(PROVENANCE_NAME);

  const before = listLocalFiles();
  const counts = { add: 0, update: 0, unchanged: 0, remove: 0 };

  for (const relPath of upstreamFiles) {
    const bytes = await fetchBlob(relPath);
    const action = writeFile(relPath, bytes);
    counts[action] += 1;
    if (action !== "unchanged") {
      console.log(`  ${action.padEnd(9)} ${relPath}`);
    }
  }

  const provenance = Buffer.from(renderProvenance(upstreamFiles), "utf8");
  const provenanceAction = writeFile(PROVENANCE_NAME, provenance);
  if (provenanceAction !== "unchanged") {
    console.log(`  ${provenanceAction.padEnd(9)} ${PROVENANCE_NAME}`);
  }

  for (const relPath of before) {
    if (!upstreamSet.has(relPath)) {
      rmSync(join(saturnDir, relPath));
      counts.remove += 1;
      console.log(`  remove    ${relPath}`);
    }
  }

  console.log(
    `Done: +${counts.add} ~${counts.update} =${counts.unchanged} -${counts.remove} ` +
      `(${upstreamFiles.length} upstream files + ${PROVENANCE_NAME})`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
