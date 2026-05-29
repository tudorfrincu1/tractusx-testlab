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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

export interface BlockCatalogParam {
  name: string;
  type: string;
  item_type?: string;
  required: boolean;
  description: string;
  default?: unknown;
  options?: string[];
  accepts?: string[];
}

export interface BlockCatalogOutput {
  name: string;
  description: string;
  class?: string;
  schema?: Record<string, unknown>;
  example?: unknown;
}

export interface SequenceInteraction {
  type: "outbound" | "inbound" | "internal";
  has_response?: boolean;
}

export interface BlockCatalogEntry {
  type: string;
  uses?: string | string[];
  label: string;
  description: string;
  template?: boolean;
  container?: boolean;
  custom_registration?: boolean;
  expect?: boolean;
  sequence?: SequenceInteraction;
  params: BlockCatalogParam[];
  outputs?: BlockCatalogOutput[];
  depends_on?: string[];
  dataspace_version?: string;
}

export interface BlockCatalogShortcutSubcategory {
  name: string;
  blocks: BlockCatalogEntry[];
}

export interface BlockCatalogShortcutGroup {
  name: string;
  description?: string;
  blocks: BlockCatalogEntry[];
  subcategories?: BlockCatalogShortcutSubcategory[];
}

export interface BlockCatalogSubcategory {
  name: string;
  description?: string;
  blocks: BlockCatalogEntry[];
  programmatic_blocks?: string[];
}

export interface BlockCatalogCategory {
  name: string;
  description?: string;
  service_type?: string;
  dataspace_version?: string;
  blocks: BlockCatalogEntry[];
  subcategories?: BlockCatalogSubcategory[];
  shortcuts?: BlockCatalogShortcutGroup[];
}

export type BlockCatalog = BlockCatalogCategory[];

interface BlockIndexShortcutSubcategory {
  name: string;
  blocks: string[];
}

interface BlockIndexShortcutGroup {
  name: string;
  description?: string;
  blocks?: string[];
  subcategories?: BlockIndexShortcutSubcategory[];
}

interface BlockIndexCategory {
  name: string;
  description?: string;
  service_type?: string;
  blocks?: string[];
  subcategories?: { name: string; description?: string; blocks?: string[]; programmatic_blocks?: string[] }[];
  shortcuts?: BlockIndexShortcutGroup[];
}

interface BlockIndex {
  version: string;
  categories: BlockIndexCategory[];
}

let catalogCache: BlockCatalog | null = null;

async function fetchJsonWithRetry(url: string, maxAttempts = 3): Promise<unknown> {
  const baseDelay = 500;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await fetch(url);
    if (resp.ok) {
      const contentType = resp.headers.get("content-type") ?? "";
      if (contentType.includes("json")) {
        return resp.json();
      }
      // Fallback: peek at body text to detect JSON even without correct content-type
      const text = await resp.text();
      if (text.trimStart().startsWith("{") || text.trimStart().startsWith("[")) {
        return JSON.parse(text) as unknown;
      }
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error(`Failed to fetch JSON from ${url} after ${maxAttempts} attempts (got non-JSON or error response)`);
}

async function fetchBlockSafe(base: string, path: string): Promise<BlockCatalogEntry | null> {
  try {
    const resp = await fetch(`${base}blocks/${path}`);
    if (!resp.ok) {
      if (import.meta.env.DEV) console.warn(`[catalogLoader] Failed to load block: ${path} (${resp.status})`);
      return null;
    }
    return resp.json() as Promise<BlockCatalogEntry>;
  } catch (err) {
    if (import.meta.env.DEV) console.warn(`[catalogLoader] Error loading block: ${path}`, err);
    return null;
  }
}

export async function loadBlockCatalog(): Promise<BlockCatalog> {
  if (catalogCache) return catalogCache;
  const base = import.meta.env.BASE_URL;

  try {
    const index = (await fetchJsonWithRetry(`${base}blocks/index.json`)) as BlockIndex;
      const categories: BlockCatalog = await Promise.all(
        index.categories.map(async (cat) => {
          // Collect block paths from both top-level blocks and subcategories
          const blockPaths: string[] = [
            ...(cat.blocks ?? []),
            ...(cat.subcategories ?? []).flatMap((sub) => sub.blocks ?? []),
          ];

          const blockResults = await Promise.all(blockPaths.map((p) => fetchBlockSafe(base, p)));
          const blocks: BlockCatalogEntry[] = blockResults.filter((b): b is BlockCatalogEntry => b !== null);

          // Preserve subcategory groupings with loaded block entries
          let subcategories: BlockCatalogSubcategory[] | undefined;
          if (cat.subcategories && cat.subcategories.length > 0) {
            subcategories = await Promise.all(
              cat.subcategories.map(async (sub) => {
                const results = await Promise.all((sub.blocks ?? []).map((p) => fetchBlockSafe(base, p)));
                return {
                  name: sub.name,
                  description: sub.description,
                  blocks: results.filter((b): b is BlockCatalogEntry => b !== null),
                  programmatic_blocks: sub.programmatic_blocks,
                };
              })
            );
          }

          let shortcuts: BlockCatalogShortcutGroup[] | undefined;
          if (cat.shortcuts) {
            shortcuts = await Promise.all(
              cat.shortcuts.map(async (group) => {
                if (group.subcategories) {
                  const subcategories = await Promise.all(
                    group.subcategories.map(async (sub) => {
                      const results = await Promise.all(sub.blocks.map((p) => fetchBlockSafe(base, p)));
                      return { name: sub.name, blocks: results.filter((b): b is BlockCatalogEntry => b !== null) };
                    })
                  );
                  const allBlocks = subcategories.flatMap((s) => s.blocks);
                  return { name: group.name, description: group.description, blocks: allBlocks, subcategories };
                }
                const groupResults = await Promise.all((group.blocks ?? []).map((p) => fetchBlockSafe(base, p)));
                const groupBlocks = groupResults.filter((b): b is BlockCatalogEntry => b !== null);
                return { name: group.name, description: group.description, blocks: groupBlocks };
              })
            );
          }

          return {
            name: cat.name,
            description: cat.description,
            service_type: cat.service_type,
            blocks,
            subcategories,
            shortcuts,
          };
        })
      );
      catalogCache = categories;
      return catalogCache;
  } catch (err) {
    throw new Error(`Failed to load block catalog from ${base}blocks/index.json: ${err}`);
  }
}

export function findCatalogEntry(stepType: string, catalog: BlockCatalog): BlockCatalogEntry | null {
  for (const cat of catalog) {
    for (const b of cat.blocks) {
      if (matchesUses(b, stepType)) return b;
    }
    if (cat.shortcuts) {
      for (const group of cat.shortcuts) {
        for (const b of group.blocks) {
          if (matchesUses(b, stepType)) return b;
        }
      }
    }
  }
  return null;
}

function matchesUses(entry: BlockCatalogEntry, stepType: string): boolean {
  if (entry.type === stepType) return true;
  if (!entry.uses) return false;
  if (Array.isArray(entry.uses)) return entry.uses.includes(stepType);
  return entry.uses === stepType;
}

/**
 * Search the catalog for an output whose name matches `variableName`
 * and return its schema definition (or `undefined`).
 */
export function findOutputSchema(
  variableName: string,
  catalog: BlockCatalog,
): Record<string, unknown> | undefined {
  for (const cat of catalog) {
    for (const block of cat.blocks) {
      for (const output of block.outputs ?? []) {
        if (output.name === variableName && output.schema) {
          return output.schema;
        }
      }
    }
    if (cat.shortcuts) {
      for (const group of cat.shortcuts) {
        for (const block of group.blocks) {
          for (const output of block.outputs ?? []) {
            if (output.name === variableName && output.schema) {
              return output.schema;
            }
          }
        }
      }
    }
  }
  return undefined;
}
