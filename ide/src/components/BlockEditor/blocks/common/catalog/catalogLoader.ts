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
}

export interface BlockCatalogOutput {
  name: string;
  description: string;
  schema?: Record<string, unknown>;
  example?: unknown;
}

export interface BlockCatalogEntry {
  type: string;
  label: string;
  description: string;
  template?: boolean;
  container?: boolean;
  custom_registration?: boolean;
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

export interface BlockCatalogCategory {
  name: string;
  description?: string;
  service_type?: string;
  dataspace_version?: string;
  blocks: BlockCatalogEntry[];
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
  blocks: string[];
  shortcuts?: BlockIndexShortcutGroup[];
}

interface BlockIndex {
  version: string;
  categories: BlockIndexCategory[];
}

let catalogCache: BlockCatalog | null = null;

export async function loadBlockCatalog(): Promise<BlockCatalog> {
  if (catalogCache) return catalogCache;
  const base = import.meta.env.BASE_URL;

  try {
    const indexResp = await fetch(`${base}blocks/index.json`);
    if (indexResp.ok) {
      const index: BlockIndex = await indexResp.json();
      const categories: BlockCatalog = await Promise.all(
        index.categories.map(async (cat) => {
          const blocks: BlockCatalogEntry[] = await Promise.all(
            cat.blocks.map(async (path) => {
              const resp = await fetch(`${base}blocks/${path}`);
              return resp.json() as Promise<BlockCatalogEntry>;
            })
          );

          let shortcuts: BlockCatalogShortcutGroup[] | undefined;
          if (cat.shortcuts) {
            shortcuts = await Promise.all(
              cat.shortcuts.map(async (group) => {
                if (group.subcategories) {
                  const subcategories = await Promise.all(
                    group.subcategories.map(async (sub) => {
                      const subBlocks = await Promise.all(
                        sub.blocks.map(async (path) => {
                          const resp = await fetch(`${base}blocks/${path}`);
                          return resp.json() as Promise<BlockCatalogEntry>;
                        })
                      );
                      return { name: sub.name, blocks: subBlocks };
                    })
                  );
                  const allBlocks = subcategories.flatMap((s) => s.blocks);
                  return { name: group.name, description: group.description, blocks: allBlocks, subcategories };
                }
                const groupBlocks = await Promise.all(
                  (group.blocks ?? []).map(async (path) => {
                    const resp = await fetch(`${base}blocks/${path}`);
                    return resp.json() as Promise<BlockCatalogEntry>;
                  })
                );
                return { name: group.name, description: group.description, blocks: groupBlocks };
              })
            );
          }

          return {
            name: cat.name,
            description: cat.description,
            service_type: cat.service_type,
            blocks,
            shortcuts,
          };
        })
      );
      catalogCache = categories;
      return catalogCache;
    }
  } catch (err) {
    throw new Error(`Failed to load block catalog from ${base}blocks/index.json: ${err}`);
  }

  catalogCache = [];
  return catalogCache;
}

export function findCatalogEntry(stepType: string, catalog: BlockCatalog): BlockCatalogEntry | null {
  for (const cat of catalog) {
    for (const b of cat.blocks) {
      if (b.type === stepType) return b;
    }
    if (cat.shortcuts) {
      for (const group of cat.shortcuts) {
        for (const b of group.blocks) {
          if (b.type === stepType) return b;
        }
      }
    }
  }
  return null;
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
