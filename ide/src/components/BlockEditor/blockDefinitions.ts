/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0
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

import type { StepDefinition, Step, TemplateStepDefinition, Assertion, ScriptDefinition, TestLabDocument, TestCaseDefinition, TestRef, VariableDefinition } from "../../models/schema";
import { ScriptKind, isTestCase, isTest, isTestRef, isTemplateStep } from "../../models/schema";
import { useServiceStore } from "../../store/useServiceStore";
import { useProjectStore } from "../../store/useProjectStore";
import { blockColors, getCategoryColor } from "./blockColors";
import { FieldWrappedText } from "./FieldWrappedText";
import type { Block, Workspace, WorkspaceSvg } from "blockly";
import type * as BlocklyType from "blockly";

// ── Catalog Types (v2 format) ─────────────────────────────────────────────────

interface BlockCatalogParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
  options?: string[];
}

interface BlockCatalogOutput {
  name: string;
  description: string;
}

interface BlockCatalogEntry {
  type: string;
  label: string;
  description: string;
  template?: boolean;
  container?: boolean;
  params: BlockCatalogParam[];
  outputs?: BlockCatalogOutput[];
  depends_on?: string[];
}

interface BlockCatalogCategory {
  name: string;
  description?: string;
  service_type?: string;
  blocks: BlockCatalogEntry[];
}

export type BlockCatalog = BlockCatalogCategory[];

interface BlockIndexCategory {
  name: string;
  description?: string;
  service_type?: string;
  blocks: string[];
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
          return {
            name: cat.name,
            description: cat.description,
            service_type: cat.service_type,
            blocks,
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

// ── SVG Icon Helpers ──────────────────────────────────────────────────────────

const ICON_SIZE = 16;
function svgDataUri(pathD: string, color = "#fff"): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="${color}" d="${pathD}"/></svg>`
  )}`;
}

const ICON_TEST = svgDataUri("M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6");
const ICON_TEST_CASE = svgDataUri("M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm17.59-2.07l-4.25 4.24-2.12-2.12-1.41 1.41L16.34 19 22 13.34z");
const ICON_VARIABLE = svgDataUri("M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z");
const ICON_PRECONDITION = svgDataUri("M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z");
const ICON_STEP = svgDataUri("M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z");
const ICON_JSON = svgDataUri("M4 7v2c0 .55-.45 1-1 1H2v4h1c.55 0 1 .45 1 1v2c0 1.65 1.35 3 3 3h3v-2H7c-.55 0-1-.45-1-1v-2c0-1.3-.84-2.42-2-2.83v-.34C5.16 11.42 6 10.3 6 9V7c0-.55.45-1 1-1h3V4H7C5.35 4 4 5.35 4 7zm17 3c-.55 0-1-.45-1-1V7c0-1.65-1.35-3-3-3h-3v2h3c.55 0 1 .45 1 1v2c0 1.3.84 2.42 2 2.83v.34c-1.16.41-2 1.52-2 2.83v2c0 .55-.45 1-1 1h-3v2h3c1.65 0 3-1.35 3-3v-2c0-.55.45-1 1-1h1v-4h-1z");
const ICON_STORE = svgDataUri("M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z");
const ICON_MOCK = svgDataUri("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z");
const ICON_WAIT = svgDataUri("M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z");
const ICON_LOCK = svgDataUri("M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z");
const ICON_KEY = svgDataUri("M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z");
const ICON_SCHEMA = svgDataUri("M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 15h8v2H8v-2zm0-4h8v2H8v-2z");

function blockIcon(Blockly: typeof BlocklyType, src: string): InstanceType<typeof BlocklyType.FieldImage> {
  return new Blockly.FieldImage(src, ICON_SIZE, ICON_SIZE);
}

/** Derive a human-readable test name from a file path */
export function deriveTestLabel(filePath: string): string {
  const base = filePath.replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
  return base
    .replace(/_/g, " ")
    .replace(/\bcx\s*(\d+)/gi, "CX-$1")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Block Registration ────────────────────────────────────────────────────────

/** Collect all mock endpoint IDs defined in the workspace (for Wait block dropdown) */
function collectMockEndpointIds(workspace: Workspace): Array<[string, string]> {
  const ids: Array<[string, string]> = [];
  for (const block of workspace.getAllBlocks(false)) {
    if (block.type.startsWith("step_mock_")) {
      const id = block.getFieldValue("PARAM_ID");
      if (id) ids.push([id, id]);
    }
  }
  if (ids.length === 0) return [["(no mock endpoints)", "__NONE__"]];
  return ids;
}

/** Collect service names from the service store, optionally filtered by service_type */
function collectServiceRefs(_workspace: Workspace, serviceType?: string): Array<[string, string]> {
  const { services } = useServiceStore.getState();
  const filtered = serviceType
    ? services.filter((s) => s.type === serviceType)
    : services;
  const refs: Array<[string, string]> = filtered.map((s) => [s.name, s.name]);
  return refs.length > 0 ? refs : [["(no services configured)", "__NONE__"]];
}

/** Collect schema file names from the project store as dropdown options (value = relative path). */
function collectSchemaPaths(): Array<[string, string]> {
  const names = useProjectStore.getState().getSchemaNames();
  if (names.length === 0) return [["(no schemas in project)", "__NONE__"]];
  return names.map((name): [string, string] => [name, `../schemas/${name}.json`]);
}

function collectTestFilePaths(): Array<[string, string]> {
  const { getTestNames, activeFile } = useProjectStore.getState();
  const names = getTestNames().filter(
    (n) => !(activeFile?.type === "test" && activeFile.name === n),
  );
  if (names.length === 0) return [["(no other tests)", "__NONE__"]];
  return names.map((name): [string, string] => [name, `tests/${name}.yaml`]);
}

function collectExportedVariables(filePath: string): Array<[string, string]> {
  if (!filePath || filePath === "__NONE__") return [["(select a test first)", "__NONE__"]];
  // Extract test name from file path: "tests/foo.yaml" → "foo"
  const testName = filePath.replace(/^tests\//, "").replace(/\.yaml$/, "");
  const { tests } = useProjectStore.getState();
  const script = tests.get(testName);
  if (!script) return [["(no exports found)", "__NONE__"]];
  const exports: string[] = [];
  for (const step of script.teardown ?? []) {
    if ("type" in step && step.type === "export_variable" && step.params?.name) {
      exports.push(String(step.params.name));
    }
  }
  if (exports.length === 0) return [["(no exports in test)", "__NONE__"]];
  return exports.map((v): [string, string] => [v, v]);
}

/**
 * Wraps a dynamic options provider for FieldDropdown so the current value
 * is always preserved in the options list, even if the data source hasn't
 * loaded yet.  This prevents the dropdown from reverting to "__NONE__".
 */
function dynamicDropdown(
  provider: (ws: Workspace) => Array<[string, string]>,
  fallbackLabel = "—",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (this: any) => Array<[string, string]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any): Array<[string, string]> {
    const block = this.getSourceBlock?.();
    const ws = block?.workspace;
    if (!ws || ws.isClearing || ws.disposed) {
      const cur = this.getValue?.() ?? "";
      if (cur && cur !== "__NONE__") return [[cur, cur]];
      return [[fallbackLabel, "__NONE__"]];
    }
    const options = provider(ws);
    const currentVal = this.getValue?.() ?? "";
    if (
      currentVal &&
      currentVal !== "__NONE__" &&
      !options.some(([, val]: [string, string]) => val === currentVal)
    ) {
      // Derive a display label from the value (strip path prefix for schema paths)
      const label = currentVal.includes("/")
        ? currentVal.replace(/^.*\//, "").replace(/\.json$/, "")
        : currentVal;
      options.unshift([label, currentVal]);
    }
    return options;
  };
}

export function registerBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog) {

  // ── Value blocks — connectable parameter values ─────────────────────────

  Blockly.Blocks["value_string"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("\"")
        .appendField(new Blockly.FieldTextInput(""), "VALUE")
        .appendField("\"");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A literal string value");
    },
  };

  Blockly.Blocks["value_number"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("#")
        .appendField(new Blockly.FieldNumber(0), "VALUE");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A numeric value");
    },
  };

  Blockly.Blocks["variable_get"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("@")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectWorkspaceVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(no variables)", "__NONE__"]];
              },
              "(no variables)"
            ) as () => Array<[string, string]>
          ),
          "VAR_NAME"
        );
      this.setOutput(true, "param_value");
      this.setColour(blockColors.variableGet);
      this.setTooltip("Reference a variable — uses @variable_name syntax");
    },
  };

  // ── Key-Value pair block for JSON params ────────────────────────────────

  Blockly.Blocks["key_value_pair"] = {
    init(this: Block) {
      this.appendValueInput("VALUE")
        .appendField(new Blockly.FieldTextInput("key"), "KEY")
        .appendField(":")
        .setCheck("param_value");
      this.setPreviousStatement(true, "key_value");
      this.setNextStatement(true, "key_value");
      this.setColour(blockColors.keyValue);
      this.setTooltip("A key-value pair for JSON objects");
    },
  };

  // ── Typed assertion blocks ───────────────────────────────────────────────

  /** Collect output names from the parent step block's catalog entry */
  function collectParentOutputs(block: Block): Array<[string, string]> {
    let parent = block.getSurroundParent();
    while (parent && !parent.type.startsWith("step_")) {
      parent = parent.getSurroundParent();
    }
    if (!parent) return [["(no outputs)", "__NONE__"]];
    const stepType = parent.type.replace(/^step_/, "");
    const entry = findCatalogEntry(stepType, catalog);
    if (!entry?.outputs || entry.outputs.length === 0) return [["(no outputs)", "__NONE__"]];
    return entry.outputs.map((o) => [o.name, o.name] as [string, string]);
  }

  Blockly.Blocks["assert_equals"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("equals");
      this.appendValueInput("EXPECTED")
        .appendField("expected:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output equals expected value");
    },
  };

  Blockly.Blocks["assert_not_equals"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("not equals");
      this.appendValueInput("EXPECTED")
        .appendField("expected:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output does not equal expected value");
    },
  };

  Blockly.Blocks["assert_contains"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("contains");
      this.appendValueInput("SUBSTRING")
        .appendField("substring:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output contains substring");
    },
  };

  Blockly.Blocks["assert_not_contains"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("not contains");
      this.appendValueInput("SUBSTRING")
        .appendField("substring:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output does not contain substring");
    },
  };

  Blockly.Blocks["assert_matches"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("matches");
      this.appendValueInput("PATTERN")
        .appendField("pattern:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output matches regex pattern");
    },
  };

  Blockly.Blocks["assert_schema"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("matches schema");
      this.appendValueInput("SCHEMA")
        .appendField("schema:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output conforms to a JSON Schema");
    },
  };

  Blockly.Blocks["assert_compare"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField(
          new Blockly.FieldDropdown([
            ["greater than", "greater_than"],
            ["less than", "less_than"],
            ["greater or equal", "greater_or_equal"],
            ["less or equal", "less_or_equal"],
          ]),
          "OPERATOR"
        );
      this.appendValueInput("VALUE")
        .appendField("value:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert numeric comparison on output");
    },
  };

  Blockly.Blocks["assert_between"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("between");
      this.appendValueInput("MIN")
        .appendField("min:")
        .setCheck("param_value");
      this.appendValueInput("MAX")
        .appendField("max:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output is between min and max (inclusive)");
    },
  };

  Blockly.Blocks["assert_not_null"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("is not null");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output is not null");
    },
  };

  Blockly.Blocks["assert_not_empty"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const b = this.getSourceBlock?.();
              if (!b || !b.workspace || b.workspace.isClearing || b.workspace.disposed) return [["—", "__NONE__"]];
              return collectParentOutputs(b);
            } as () => Array<[string, string]>
          ),
          "OUTPUT"
        )
        .appendField("is not empty");
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assert that output is not empty");
    },
  };

  // ── Boolean value block ─────────────────────────────────────────────────

  Blockly.Blocks["value_boolean"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ["true", "true"],
            ["false", "false"],
          ]),
          "VALUE"
        );
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A boolean value (true/false)");
    },
  };

  // ── Root blocks (structural) ────────────────────────────────────────────

  Blockly.Blocks["test_root"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_TEST))
        .appendField("Test:")
        .appendField(new Blockly.FieldTextInput("my_test"), "NAME");
      this.appendDummyInput()
        .appendField("Version:")
        .appendField(new Blockly.FieldTextInput("1.0"), "VERSION");
      this.appendDummyInput()
        .appendField("Description:")
        .appendField(new FieldWrappedText(""), "DESCRIPTION");
      this.appendStatementInput("SETUP").appendField("Setup").setCheck("step");
      this.appendStatementInput("STEPS").appendField("Steps").setCheck("step");
      this.appendStatementInput("TEARDOWN").appendField("Teardown").setCheck("step");
      this.appendStatementInput("VARIABLES")
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Variables")
        .setCheck("variable_def");
      this.setColour(blockColors.root);
      this.setTooltip("Root test definition");
      this.setDeletable(false);
    },
  };

  Blockly.Blocks["test_case_root"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_TEST_CASE))
        .appendField("Test Case:")
        .appendField(new Blockly.FieldTextInput("my-test-case"), "NAME");
      this.appendDummyInput()
        .appendField("Version:")
        .appendField(new Blockly.FieldTextInput("1.0"), "VERSION");
      this.appendDummyInput()
        .appendField("Description:")
        .appendField(new FieldWrappedText(""), "DESCRIPTION");
      this.appendStatementInput("VARIABLES")
        .appendField("Shared Variables")
        .setCheck("variable_def");
      this.appendStatementInput("PRECONDITIONS")
        .appendField("Preconditions")
        .setCheck("precondition");
      this.appendStatementInput("TESTS")
        .appendField("Tests")
        .setCheck("test_entry");
      this.setColour(blockColors.rootTestCase);
      this.setTooltip("Test case — groups multiple tests with shared configuration");
      this.setDeletable(false);
    },
  };

  // ── Test reference block ────────────────────────────────────────────────

  Blockly.Blocks["test_ref"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_TEST))
        .appendField("Test:")
        .appendField(new Blockly.FieldTextInput("test-name"), "TEST_NAME");
      this.appendDummyInput()
        .appendField("Description:")
        .appendField(new FieldWrappedText(""), "DESCRIPTION");
      this.appendStatementInput("WITH")
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("with:")
        .setCheck("key_value");
      this.setPreviousStatement(true, "test_entry");
      this.setNextStatement(true, "test_entry");
      this.setColour(blockColors.testRef);
      this.setTooltip("Reference a reusable test with optional variable overrides");
    },
  };

  // ── Variable definition block ───────────────────────────────────────────

  Blockly.Blocks["variable_def"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Variable:")
        .appendField(new Blockly.FieldTextInput("var_name"), "VAR_NAME");
      this.appendDummyInput()
        .appendField("type:")
        .appendField(
          new Blockly.FieldDropdown([
            ["str", "str"],
            ["int", "int"],
            ["bool", "bool"],
            ["float", "float"],
          ]),
          "VAR_TYPE"
        );
      this.appendDummyInput()
        .appendField("default:")
        .appendField(new FieldWrappedText(""), "VAR_DEFAULT");
      this.appendDummyInput()
        .appendField("runtime:")
        .appendField(
          new Blockly.FieldDropdown([
            ["false", "false"],
            ["true", "true"],
          ]),
          "VAR_RUNTIME"
        );
      this.appendDummyInput()
        .appendField("description:")
        .appendField(new FieldWrappedText(""), "VAR_DESCRIPTION");
      this.setPreviousStatement(true, "variable_def");
      this.setNextStatement(true, "variable_def");
      this.setColour(blockColors.variableDef);
      this.setTooltip("Define a shared variable for the test case");
    },
  };

  // ── Precondition block ──────────────────────────────────────────────────

  Blockly.Blocks["precondition"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_PRECONDITION))
        .appendField("Precondition:")
        .appendField(new Blockly.FieldTextInput("PRE-001"), "PRE_ID");
      this.appendDummyInput()
        .appendField("description:")
        .appendField(new FieldWrappedText(""), "PRE_DESCRIPTION");
      this.setPreviousStatement(true, "precondition");
      this.setNextStatement(true, "precondition");
      this.setColour(blockColors.precondition);
      this.setTooltip("Define a precondition that must be met before running");
    },
  };

  // ── Authentication blocks ──────────────────────────────────────────────

  Blockly.Blocks["auth_oauth2"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_LOCK))
        .appendField("OAuth2")
        .appendField(new Blockly.FieldTextInput("my-oauth2"), "NAME");
      this.appendDummyInput()
        .appendField("auth_url:")
        .appendField(new Blockly.FieldTextInput(""), "AUTH_URL");
      this.appendDummyInput()
        .appendField("realm:")
        .appendField(new Blockly.FieldTextInput(""), "REALM");
      this.appendDummyInput()
        .appendField("client_id:")
        .appendField(new Blockly.FieldTextInput(""), "CLIENT_ID");
      this.appendDummyInput()
        .appendField("client_secret:")
        .appendField(new Blockly.FieldTextInput(""), "CLIENT_SECRET");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(blockColors.authentication);
      this.setTooltip("Configure OAuth2 authentication credentials");
    },
  };

  Blockly.Blocks["auth_api_key"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_KEY))
        .appendField("API Key")
        .appendField(new Blockly.FieldTextInput("my-api-key"), "NAME");
      this.appendDummyInput()
        .appendField("api_key:")
        .appendField(new Blockly.FieldTextInput(""), "API_KEY");
      this.appendDummyInput()
        .appendField("header_name:")
        .appendField(new Blockly.FieldTextInput("X-Api-Key"), "HEADER_NAME");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(blockColors.authentication);
      this.setTooltip("Configure API Key authentication");
    },
  };

  // ── Depends-on entry block ───────────────────────────────────────────────

  Blockly.Blocks["depends_on_entry"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("file:")
        .appendField(new Blockly.FieldTextInput("tests/my_test.yaml"), "FILE");
      this.appendDummyInput()
        .appendField("outputs:")
        .appendField(new FieldWrappedText(""), "OUTPUTS");
      this.setPreviousStatement(true, "depends_on_entry");
      this.setNextStatement(true, "depends_on_entry");
      this.setColour(blockColors.root);
      this.setTooltip("Declare a dependency on another test file and its outputs (comma-separated)");
    },
  };

  // ── Output entry block ──────────────────────────────────────────────────

  Blockly.Blocks["output_entry"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField(new Blockly.FieldTextInput("variable_name"), "OUTPUT_NAME")
        .appendField(":")
        .appendField(new Blockly.FieldTextInput("$"), "OUTPUT_EXPR");
      this.setPreviousStatement(true, "output_entry");
      this.setNextStatement(true, "output_entry");
      this.setColour(blockColors.root);
      this.setTooltip("Declare a test-level output variable exposed to dependent tests");
    },
  };

  // ── Schema import block ─────────────────────────────────────────────────

  Blockly.Blocks["schema_import"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_SCHEMA))
        .appendField("Import Schema");
      this.appendDummyInput()
        .appendField("schema:")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(() => collectSchemaPaths()) as () => Array<[string, string]>
          ),
          "SCHEMA_PATH"
        );
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("variable:")
        .appendField(new Blockly.FieldTextInput("schema_var"), "OUTPUT_SCHEMA");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#0891B2");
      this.setTooltip("Import a schema file from the project and store it as a variable");
    },
  };

  // ── Export variable block ───────────────────────────────────────────────

  Blockly.Blocks["export_variable"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("Export Variable");
      this.appendDummyInput()
        .appendField("name:")
        .appendField(
          new Blockly.FieldDropdown(
            dynamicDropdown(
              (ws) => {
                const vars = collectWorkspaceVariables(ws);
                return vars.length > 0
                  ? vars.map((v): [string, string] => [v, v])
                  : [["(no variables)", "__NONE__"]];
              },
              "(no variables)"
            ) as () => Array<[string, string]>
          ),
          "VAR_NAME"
        );
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#059669");
      this.setTooltip("Export a variable as a test output — available to dependent tests");
    },
  };

  // ── Import variable block ──────────────────────────────────────────────

  Blockly.Blocks["import_variable"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("Import Variable");
      this.appendDummyInput()
        .appendField("from:")
        .appendField(new Blockly.FieldDropdown(
          dynamicDropdown(() => collectTestFilePaths()),
        ), "FILE");
      this.appendDummyInput()
        .appendField("export:")
        .appendField(new Blockly.FieldDropdown(
          dynamicDropdown(
            (_ws) => {
              const filePath = this.getFieldValue("FILE") || "";
              return collectExportedVariables(filePath);
            },
            "(select a test first)"
          ) as () => Array<[string, string]>
        ), "EXPORT_VAR");
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("variable:")
        .appendField(new Blockly.FieldTextInput("imported_var"), "OUTPUT_VAR");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#7C3AED");
      this.setTooltip("Import an exported variable from another test and store it locally.");
    },
  };

  // ── Template step block ──────────────────────────────────────────────────

  Blockly.Blocks["step_template"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STEP))
        .appendField("⟪ Template ⟫");

      this.appendDummyInput()
        .appendField("name:")
        .appendField(new Blockly.FieldTextInput(""), "NAME");

      this.appendDummyInput()
        .appendField("template:")
        .appendField(new (FieldWrappedText as typeof Blockly.FieldTextInput)(""), "PARAM_TEMPLATE");

      this.appendStatementInput("PARAMS")
        .setCheck("key_value")
        .appendField("params:");

      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour("#6D28D9");
      this.setTooltip("A reusable template step macro");
    },
  };

  // ── Catalog-driven step blocks (Mock, Wait, and future categories) ──────

  for (const category of catalog) {
    const categoryColor = getCategoryColor(category.name);
    const categoryIcon = category.name === "Mock" ? ICON_MOCK
      : category.name === "Wait" ? ICON_WAIT
      : ICON_STEP;

    for (const block of category.blocks) {
      const blockType = `step_${block.type}`;

      Blockly.Blocks[blockType] = {
        init(this: Block) {
          this.appendDummyInput()
            .appendField(blockIcon(Blockly, categoryIcon))
            .appendField(block.label);

          this.appendDummyInput()
            .appendField("name:")
            .appendField(new Blockly.FieldTextInput(block.label), "NAME");

          for (const param of block.params) {
            const fieldKey = `PARAM_${param.name.toUpperCase()}`;
            const paramLabel = param.required ? `${param.name}:` : `(opt) ${param.name}:`;

            switch (param.type) {
              case "dropdown":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      (param.options || []).map((o: string): [string, string] => [o, o])
                    ),
                    fieldKey
                  );
                break;

              case "number":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldNumber(
                      typeof param.default === "number" ? param.default : 0
                    ),
                    fieldKey
                  );
                break;

              case "json":
                this.appendStatementInput(fieldKey)
                  .appendField(blockIcon(Blockly, ICON_JSON))
                  .appendField(paramLabel)
                  .setCheck("key_value");
                break;

              case "endpoint_ref":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown((ws) => collectMockEndpointIds(ws)) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;

              case "service_ref": {
                const catServiceType = category.service_type;
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown((ws) => collectServiceRefs(ws, catServiceType)) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;
              }

              case "schema_path":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown(() => collectSchemaPaths()) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;

              case "variable":
                this.appendDummyInput()
                  .appendField(paramLabel)
                  .appendField(
                    new Blockly.FieldDropdown(
                      dynamicDropdown(
                        (ws) => {
                          const vars = collectWorkspaceVariables(ws);
                          return vars.length > 0
                            ? vars.map((v): [string, string] => [v, v])
                            : [["(no variables)", "__NONE__"]];
                        },
                        "(no variables)"
                      ) as () => Array<[string, string]>
                    ),
                    fieldKey
                  );
                break;

              case "steps":
                this.appendStatementInput(fieldKey)
                  .appendField(paramLabel)
                  .setCheck("step");
                break;

              default:
                this.appendValueInput(fieldKey)
                  .appendField(paramLabel)
                  .setCheck("param_value");
                break;
            }
          }

          // Blocks with outputs get assertion inputs
          if (block.outputs && block.outputs.length > 0) {
            this.appendStatementInput("EXPECT")
              .appendField("expect:")
              .setCheck("assertion");
          }

          this.setPreviousStatement(true, "step");
          this.setNextStatement(true, "step");
          this.setColour(categoryColor);
          this.setTooltip(block.description);
        },
        onchange(this: Block) {
          if (!block.depends_on || block.depends_on.length === 0) return;
          if (!this.workspace) return;
          if ("isDragging" in this.workspace && (this.workspace as WorkspaceSvg).isDragging()) return;

          const requiredTypes = new Set(block.depends_on.map((t: string) => `step_${t}`));
          let found = false;

          for (const wsBlock of this.workspace.getAllBlocks(false)) {
            if (wsBlock === this) continue;
            if (requiredTypes.has(wsBlock.type)) {
              found = true;
              break;
            }
          }

          if (!found) {
            this.setWarningText(
              `Requires a mock endpoint block (${block.depends_on.join(" or ")}) to be present in the workspace.`
            );
          } else {
            this.setWarningText(null);
          }
        },
      };
    }
  }
}

// ── Block Output Helpers ──────────────────────────────────────────────────────

// ── Variable Collection ───────────────────────────────────────────────────────

/**
 * Static map of template names → the variable names they produce.
 * Used by collectWorkspaceVariables to expose template outputs in the variable dropdown.
 */
const TEMPLATE_OUTPUTS: Record<string, string[]> = {
  "catalog-negotiation": ["contract_agreement_id", "data_address", "edr_token"],
  "transfer-dataplane-access": ["data_address", "edr_token"],
  "dtr-shell-lookup": ["shell_descriptors"],
};

export function collectWorkspaceVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();

  const collectFromSteps = (steps?: Step[]) => {
    if (!steps) return;
    for (const step of steps) {
      if (isTemplateStep(step)) {
        const produced = TEMPLATE_OUTPUTS[step.template];
        if (produced) {
          for (const v of produced) vars.add(v);
        }
        continue;
      }

      if (step.type === "import_variable") {
        const importedVar = step.params?.variable;
        if (typeof importedVar === "string" && importedVar) {
          vars.add(importedVar);
        }
      }

      if (step.store_in_memory) {
        for (const varName of Object.keys(step.store_in_memory)) {
          if (varName) vars.add(varName);
        }
      }

      // Include nested steps params to keep dropdowns complete for composed blocks.
      for (const val of Object.values(step.params ?? {})) {
        if (!Array.isArray(val)) continue;
        const nested = val.filter((item): item is Step => (
          typeof item === "object" &&
          item !== null &&
          ("template" in item || "type" in item)
        ));
        if (nested.length > 0) collectFromSteps(nested);
      }
    }
  };

  // Include test-case level variables from the project store
  const { testCase, tests } = useProjectStore.getState();
  if (testCase?.variables) {
    for (const varName of Object.keys(testCase.variables)) {
      vars.add(varName);
    }
  }

  // Include variables from scripts in the project store (especially imported examples)
  if (tests) {
    for (const script of tests.values()) {
      if (script.variables) {
        for (const varName of Object.keys(script.variables)) {
          vars.add(varName);
        }
      }

      collectFromSteps(script.setup);
      collectFromSteps(script.steps);
      collectFromSteps(script.teardown);

      // Scan teardown steps for export_variable step params
      if (script.teardown) {
        for (const step of script.teardown) {
          if ("type" in step && step.type === "export_variable" && step.params?.name) {
            vars.add(String(step.params.name));
          }
        }
      }
    }
  }

  // Variables are now declared via variable_def blocks
  for (const b of workspace.getBlocksByType("variable_def", false)) {
    const name = b.getFieldValue("VAR_NAME");
    if (name) vars.add(name);
  }

  // Include variables already referenced in the current workspace.
  // This prevents temporary "(no variables)" states right after loading.
  for (const b of workspace.getBlocksByType("variable_get", false)) {
    const ref = b.getFieldValue("VAR_NAME");
    if (ref && ref !== "__NONE__") vars.add(ref);
  }

  // Inject outputs from step_template blocks based on their template name
  for (const b of workspace.getBlocksByType("step_template", false)) {
    const templateName = b.getFieldValue("PARAM_TEMPLATE");
    if (templateName && TEMPLATE_OUTPUTS[templateName]) {
      for (const v of TEMPLATE_OUTPUTS[templateName]) {
        vars.add(v);
      }
    }
  }

  // Inject variables from import_variable blocks (OUTPUT_VAR field)
  for (const b of workspace.getBlocksByType("import_variable", false)) {
    const varName = b.getFieldValue("OUTPUT_VAR");
    if (varName) vars.add(varName);
  }

  return Array.from(vars).sort();
}

// ── Toolbox Builder ───────────────────────────────────────────────────────────

/**
 * Maps catalog `service_type` values to the ServiceType(s) in the store that
 * satisfy them. A category is shown when ANY of the mapped types is configured.
 * When the catalog is updated to use exact ServiceType values, this map can be
 * trimmed to identity mappings only.
 */
const SERVICE_TYPE_RESOLUTION: Record<string, string[]> = {
  edc_connector: ["edc_connector_saturn", "edc_connector_jupiter"],
  edc_connector_saturn: ["edc_connector_saturn"],
  edc_connector_jupiter: ["edc_connector_jupiter"],
  dtr: ["aas"],
  aas: ["aas"],
  discovery_finder: ["discovery_finder"],
  edc_discovery: ["edc_discovery"],
  bpn_discovery: ["bpn_discovery"],
};

/** Returns true if at least one service matching `catalogServiceType` is configured. */
function isServiceCategoryEnabled(catalogServiceType: string): boolean {
  const store = useServiceStore.getState();
  const mappedTypes = SERVICE_TYPE_RESOLUTION[catalogServiceType];
  if (!mappedTypes) return store.services.some((s) => s.type === catalogServiceType);
  return mappedTypes.some((t) => store.hasServiceType(t as import("../../models/schema").ServiceType));
}

/** Build catalog-driven category entries, filtering by configured services. */
function buildServiceCategories(catalog: BlockCatalog): object[] {
  return catalog
    .filter((cat) => !cat.service_type || isServiceCategoryEnabled(cat.service_type))
    .map((cat) => ({
      kind: "category",
      name: cat.name,
      contents: cat.blocks.map((b) => ({
        kind: "block",
        type: `step_${b.type}`,
      })),
    }));
}

export function buildToolbox(catalog: BlockCatalog, kind?: ScriptKind, variables?: string[]): object {
  if (kind === "test-case") {
    // Test-case toolbox: structural blocks + service-dependent step categories
    const serviceCategories = buildServiceCategories(catalog);
    return {
      kind: "categoryToolbox",
      contents: [
        {
          kind: "category",
          name: "Tests",
          contents: [{ kind: "block", type: "test_ref" }],
        },
        {
          kind: "category",
          name: "Variables",
          contents: [{ kind: "block", type: "variable_def" }],
        },
        {
          kind: "category",
          name: "Preconditions",
          contents: [{ kind: "block", type: "precondition" }],
        },
        {
          kind: "category",
          name: "Authentication",
          contents: [
            { kind: "block", type: "auth_oauth2" },
            { kind: "block", type: "auth_api_key" },
          ],
        },
        ...serviceCategories,
      ],
    };
  }

  const vars = variables || [];

  const variableContents: object[] = [];
  if (vars.length > 0) {
    variableContents.push({ kind: "label", text: "Defined Variables" });
    for (const v of vars) {
      variableContents.push({
        kind: "block",
        type: "variable_get",
        fields: { VAR_NAME: v },
      });
    }
    variableContents.push({ kind: "sep", gap: "8" });
  }
  variableContents.push({ kind: "block", type: "variable_get" });

  const categoryContents = buildServiceCategories(catalog);

  return {
    kind: "categoryToolbox",
    contents: [
      ...categoryContents,
      {
        kind: "category",
        name: "Template",
        contents: [
          { kind: "block", type: "step_template" },
        ],
      },
      {
        kind: "category",
        name: "Authentication",
        contents: [
          { kind: "block", type: "auth_oauth2" },
          { kind: "block", type: "auth_api_key" },
        ],
      },
      {
        kind: "category",
        name: "Variables",
        contents: [
          { kind: "block", type: "variable_def" },
          { kind: "sep", gap: "16" },
          ...variableContents,
          { kind: "sep", gap: "16" },
          { kind: "block", type: "schema_import" },
          { kind: "sep", gap: "16" },
          { kind: "block", type: "import_variable" },
          { kind: "block", type: "export_variable" },
        ],
      },
      {
        kind: "category",
        name: "Values",
        contents: [
          { kind: "block", type: "value_string" },
          { kind: "block", type: "value_number" },
          { kind: "block", type: "value_boolean" },
        ],
      },
      {
        kind: "category",
        name: "Assertions",
        contents: [
          { kind: "block", type: "assert_equals" },
          { kind: "block", type: "assert_not_equals" },
          { kind: "block", type: "assert_contains" },
          { kind: "block", type: "assert_not_contains" },
          { kind: "block", type: "assert_matches" },
          { kind: "block", type: "assert_schema" },
          { kind: "block", type: "assert_compare" },
          { kind: "block", type: "assert_between" },
          { kind: "block", type: "assert_not_null" },
          { kind: "block", type: "assert_not_empty" },
        ],
      },
      {
        kind: "category",
        name: "JSON",
        contents: [{ kind: "block", type: "key_value_pair" }],
      },
    ],
  };
}

// ── Workspace → Model (serialization) ─────────────────────────────────────────

export function workspaceToModel(
  _Blockly: typeof BlocklyType,
  workspace: Workspace,
  catalog: BlockCatalog
): Partial<TestLabDocument> {
  const testCaseRoot = workspace.getBlocksByType("test_case_root", false)[0];
  if (testCaseRoot) {
    return workspaceToTestCase(testCaseRoot);
  }

  const rootBlock = workspace.getBlocksByType("test_root", false)[0];
  if (!rootBlock) return {};

  const name = rootBlock.getFieldValue("NAME") || "my_test";
  const version = rootBlock.getFieldValue("VERSION") || "1.0";
  const description = rootBlock.getFieldValue("DESCRIPTION") || "";

  const setupHead = rootBlock.getInputTargetBlock("SETUP");
  const setup = readStepChain(setupHead, catalog);
  const steps = readStepChain(rootBlock.getInputTargetBlock("STEPS"), catalog);
  const teardown = readStepChain(rootBlock.getInputTargetBlock("TEARDOWN"), catalog);

  // Collect variable_def blocks from the VARIABLES input
  const variables: Record<string, VariableDefinition> = {};
  let varBlock = rootBlock.getInputTargetBlock("VARIABLES");
  while (varBlock) {
    if (varBlock.type === "variable_def") {
      const varName = varBlock.getFieldValue("VAR_NAME") || "";
      const varType = varBlock.getFieldValue("VAR_TYPE") || "str";
      const varDefault = varBlock.getFieldValue("VAR_DEFAULT") || "";
      const varRuntime = varBlock.getFieldValue("VAR_RUNTIME") === "true";
      const varDesc = varBlock.getFieldValue("VAR_DESCRIPTION") || "";
      if (varName) {
        const varDef: VariableDefinition = { type: varType };
        if (varDefault) varDef.default = varDefault;
        if (varRuntime) varDef.runtime = true;
        if (varDesc) varDef.description = varDesc;
        variables[varName] = varDef;
      }
    }
    varBlock = varBlock.getNextBlock();
  }

  // Services come from the service store, not from workspace blocks
  const { services } = useServiceStore.getState();

  return {
    kind: "test",
    name,
    version,
    description,
    services: services.length > 0 ? services : undefined,
    setup: setup.length > 0 ? setup : undefined,
    steps,
    teardown: teardown.length > 0 ? teardown : undefined,
    variables: Object.keys(variables).length > 0 ? variables : undefined,
  } as Partial<ScriptDefinition>;
}

function workspaceToTestCase(root: Block): Partial<TestCaseDefinition> {
  const name = root.getFieldValue("NAME") || "my-test-case";
  const version = root.getFieldValue("VERSION") || "1.0";
  const description = root.getFieldValue("DESCRIPTION") || "";

  const variables: Record<string, unknown> = {};
  let varBlock = root.getInputTargetBlock("VARIABLES");
  while (varBlock) {
    if (varBlock.type === "variable_def") {
      const varName = varBlock.getFieldValue("VAR_NAME") || "";
      const varType = varBlock.getFieldValue("VAR_TYPE") || "str";
      const varDefault = varBlock.getFieldValue("VAR_DEFAULT") || "";
      const varRuntime = varBlock.getFieldValue("VAR_RUNTIME") === "true";
      const varDesc = varBlock.getFieldValue("VAR_DESCRIPTION") || "";
      if (varName) {
        const varDef: Record<string, unknown> = { type: varType };
        if (varDefault) varDef.default = varDefault;
        if (varRuntime) varDef.runtime = true;
        if (varDesc) varDef.description = varDesc;
        variables[varName] = varDef;
      }
    }
    varBlock = varBlock.getNextBlock();
  }

  const preconditions: Array<{ id: string; description: string }> = [];
  let preBlock = root.getInputTargetBlock("PRECONDITIONS");
  while (preBlock) {
    if (preBlock.type === "precondition") {
      const preId = preBlock.getFieldValue("PRE_ID") || "";
      const preDesc = preBlock.getFieldValue("PRE_DESCRIPTION") || "";
      if (preId) preconditions.push({ id: preId, description: preDesc });
    }
    preBlock = preBlock.getNextBlock();
  }

  const tests: (ScriptDefinition | string | TestRef)[] = [];
  let testBlock = root.getInputTargetBlock("TESTS");
  while (testBlock) {
    if (testBlock.type === "test_ref") {
      const testName = testBlock.getFieldValue("TEST_NAME") || "";
      const desc = testBlock.getFieldValue("DESCRIPTION") || "";
      if (testName) {
        const ref: TestRef = { test: testName };
        if (desc) ref.description = desc;
        const withOverrides: Record<string, unknown> = {};
        let kvBlock = testBlock.getInputTargetBlock("WITH");
        while (kvBlock) {
          if (kvBlock.type === "key_value_pair") {
            const key = kvBlock.getFieldValue("KEY") || "";
            const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
            if (key) withOverrides[key] = value;
          }
          kvBlock = kvBlock.getNextBlock();
        }
        if (Object.keys(withOverrides).length > 0) ref.with = withOverrides;
        tests.push(ref);
      }
    }
    testBlock = testBlock.getNextBlock();
  }

  return {
    kind: "test-case",
    name,
    version,
    description,
    variables: Object.keys(variables).length > 0 ? variables : undefined,
    preconditions: preconditions.length > 0 ? preconditions : undefined,
    tests,
  } as Partial<TestCaseDefinition>;
}

// ── Step Chain Reading ─────────────────────────────────────────────────────────

function readStepChain(block: Block | null, catalog: BlockCatalog): Step[] {
  const steps: Step[] = [];
  let current = block;
  while (current) {
    // export_variable blocks serialize as export_variable steps (in teardown)
    if (current.type === "export_variable") {
      const varName = current.getFieldValue("VAR_NAME");
      if (varName && varName !== "__NONE__") {
        steps.push({
          type: "export_variable",
          name: `Export ${varName}`,
          params: { name: varName, value: `@${varName}` },
        } as StepDefinition);
      }
      current = current.getNextBlock();
      continue;
    }
    // import_variable blocks serialize as import_variable steps
    if (current.type === "import_variable") {
      const file = current.getFieldValue("FILE") || "";
      const exportVar = current.getFieldValue("EXPORT_VAR") || "";
      const outputVar = current.getFieldValue("OUTPUT_VAR") || exportVar;
      if (file && file !== "__NONE__" && exportVar && exportVar !== "__NONE__") {
        steps.push({
          type: "import_variable",
          name: `Import ${exportVar}`,
          params: { file, export: exportVar, variable: outputVar },
        } as StepDefinition);
      }
      current = current.getNextBlock();
      continue;
    }
    if (current.type === "schema_import") {
      const schemaPath = current.getFieldValue("SCHEMA_PATH") || "";
      const varName = current.getFieldValue("OUTPUT_SCHEMA") || "schema_var";
      if (schemaPath && schemaPath !== "__NONE__") {
        steps.push({
          type: "load_schema",
          name: `Load ${varName}`,
          params: { name: varName, source: "file", path: schemaPath },
          store_in_memory: { [varName]: "$" },
        });
      }
    } else if (current.type === "step_template") {
      const templateName = current.getFieldValue("PARAM_TEMPLATE") || "";
      const name = current.getFieldValue("NAME") || undefined;
      const templateStep: TemplateStepDefinition = { template: templateName };
      if (name && name !== templateName) templateStep.name = name;

      // Read params from key_value_pair chain
      const params: Record<string, unknown> = {};
      let kvBlock = current.getInputTargetBlock("PARAMS");
      while (kvBlock) {
        if (kvBlock.type === "key_value_pair") {
          const key = kvBlock.getFieldValue("KEY") || "";
          const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
          if (key) params[key] = value;
        }
        kvBlock = kvBlock.getNextBlock();
      }
      if (Object.keys(params).length > 0) templateStep.params = params;

      steps.push(templateStep);
    } else {
      const step = blockToStep(current, catalog);
      if (step) steps.push(step);
    }
    current = current.getNextBlock();
  }
  return steps;
}

function findCatalogEntry(stepType: string, catalog: BlockCatalog): BlockCatalogEntry | null {
  for (const cat of catalog) {
    for (const b of cat.blocks) {
      if (b.type === stepType) return b;
    }
  }
  return null;
}

function blockToStep(block: Block, catalog: BlockCatalog): StepDefinition | null {
  if (!block.type.startsWith("step_")) return null;

  const stepType = block.type.replace("step_", "");
  const name = block.getFieldValue("NAME") || stepType;
  const catalogEntry = findCatalogEntry(stepType, catalog);

  const params: Record<string, unknown> = {};
  if (catalogEntry) {
    for (const p of catalogEntry.params) {
      const fieldKey = `PARAM_${p.name.toUpperCase()}`;

      switch (p.type) {
        case "dropdown":
        case "endpoint_ref":
        case "service_ref":
        case "schema_path":
        case "variable": {
          const val = block.getFieldValue(fieldKey);
          if (val && val !== "__NONE__") params[p.name] = val;
          break;
        }
        case "number": {
          const val = block.getFieldValue(fieldKey);
          if (val !== undefined && val !== null) params[p.name] = Number(val);
          break;
        }
        case "json": {
          const jsonObj: Record<string, string> = {};
          let kvBlock = block.getInputTargetBlock(fieldKey);
          while (kvBlock) {
            if (kvBlock.type === "key_value_pair") {
              const key = kvBlock.getFieldValue("KEY") || "";
              const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
              if (key) jsonObj[key] = value;
            }
            kvBlock = kvBlock.getNextBlock();
          }
          if (Object.keys(jsonObj).length > 0) params[p.name] = jsonObj;
          break;
        }
        case "steps": {
          const nested = readStepChain(block.getInputTargetBlock(fieldKey), catalog);
          if (nested.length > 0) params[p.name] = nested;
          break;
        }
        default: {
          const connectedBlock = block.getInputTargetBlock(fieldKey);
          if (connectedBlock) {
            const val = readValueBlockAsString(connectedBlock);
            if (val) params[p.name] = val;
          }
          break;
        }
      }
    }
  }

  // Auto-generate store_in_memory from catalog outputs (identity mapping)
  let storeInMemory: Record<string, string> | undefined;
  if (catalogEntry?.outputs && catalogEntry.outputs.length > 0) {
    storeInMemory = {};
    for (const output of catalogEntry.outputs) {
      storeInMemory[output.name] = "$";
    }
  }

  const expect = readAssertionChain(block.getInputTargetBlock("EXPECT"));

  // Special handling: send_notification — restructure flat params into notification.header + content
  if (stepType === "send_notification") {
    const notification: Record<string, unknown> = {};
    const header: Record<string, unknown> = {};
    const headerFields = ["classification", "severity", "status", "type"];

    if (params.notification_id) header.notificationId = params.notification_id;
    if (params.sender_bpn) header.senderBPN = params.sender_bpn;
    if (params.recipient_bpn) header.recipientBPN = params.recipient_bpn;
    for (const hf of headerFields) {
      if (params[hf]) {
        header[hf] = params[hf];
        delete params[hf];
      }
    }
    delete params.notification_id;
    delete params.sender_bpn;
    delete params.recipient_bpn;

    if (Object.keys(header).length > 0) notification.header = header;
    if (params.content) {
      notification.content = params.content;
      delete params.content;
    }
    if (Object.keys(notification).length > 0) {
      params.notification = notification;
    }
  }

  return {
    type: stepType,
    name,
    params,
    expect: expect.length > 0 ? expect : undefined,
    store_in_memory: storeInMemory,
  };
}

function readValueBlockAsString(block: Block | null): string | undefined {
  if (!block) return undefined;
  if (block.type === "variable_get") {
    const v = block.getFieldValue("VAR_NAME") || "";
    return v && v !== "__NONE__" ? `@${v}` : undefined;
  }
  if (block.type === "value_string") {
    return block.getFieldValue("VALUE") || undefined;
  }
  if (block.type === "value_number") {
    const n = block.getFieldValue("VALUE");
    return n !== undefined ? String(n) : undefined;
  }
  if (block.type === "value_boolean") {
    return block.getFieldValue("VALUE") || undefined;
  }
  return undefined;
}

function readAssertionChain(block: Block | null): Assertion[] {
  const assertions: Assertion[] = [];
  let current = block;
  while (current) {
    const output = current.getFieldValue("OUTPUT") || "";
    if (!output || output === "__NONE__") {
      current = current.getNextBlock();
      continue;
    }

    switch (current.type) {
      case "assert_equals": {
        const val = readValueBlockAsString(current.getInputTargetBlock("EXPECTED")) || "";
        assertions.push({ output, equals: val });
        break;
      }
      case "assert_not_equals": {
        const val = readValueBlockAsString(current.getInputTargetBlock("EXPECTED")) || "";
        assertions.push({ output, not_equals: val });
        break;
      }
      case "assert_contains": {
        const val = readValueBlockAsString(current.getInputTargetBlock("SUBSTRING")) || "";
        assertions.push({ output, contains: val });
        break;
      }
      case "assert_not_contains": {
        const val = readValueBlockAsString(current.getInputTargetBlock("SUBSTRING")) || "";
        assertions.push({ output, not_contains: val });
        break;
      }
      case "assert_matches": {
        const val = readValueBlockAsString(current.getInputTargetBlock("PATTERN")) || "";
        assertions.push({ output, matches: val });
        break;
      }
      case "assert_schema": {
        const val = readValueBlockAsString(current.getInputTargetBlock("SCHEMA")) || "";
        assertions.push({ output, schema: val });
        break;
      }
      case "assert_compare": {
        const operator = current.getFieldValue("OPERATOR") || "greater_than";
        const val = readValueBlockAsString(current.getInputTargetBlock("VALUE")) || "";
        assertions.push({ output, [operator]: val });
        break;
      }
      case "assert_between": {
        const min = readValueBlockAsString(current.getInputTargetBlock("MIN")) || "";
        const max = readValueBlockAsString(current.getInputTargetBlock("MAX")) || "";
        assertions.push({ output, between: [min, max] });
        break;
      }
      case "assert_not_null":
        assertions.push({ output, not_null: true });
        break;
      case "assert_not_empty":
        assertions.push({ output, not_empty: true });
        break;
    }
    current = current.getNextBlock();
  }
  return assertions;
}

// ── Model → Workspace (deserialization) ───────────────────────────────────────

function makeBlock(ws: Workspace, type: string): Block {
  const b = ws.newBlock(type);
  (b as unknown as { initSvg: () => void }).initSvg();
  return b;
}

function setDropdownValue(block: Block, fieldName: string, value: string) {
  const field = block.getField(fieldName);
  if (!field) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = field as any;
  const original = f.doClassValidation_;
  f.doClassValidation_ = (v: string) => v;
  try {
    field.setValue(value);
  } finally {
    f.doClassValidation_ = original;
  }
  // Force Blockly to refresh the cached display text from the options list
  if (typeof f.getOptions === "function") {
    f.getOptions(true);
    // Update displayed text to match the new value
    const opts = f.getOptions(false) as Array<[string, string]>;
    const match = opts.find(([, v]: [string, string]) => v === value);
    if (match) f.selectedOption_ = match;
  }
}

function attachChain(parent: Block, inputName: string, blocks: Block[]) {
  if (blocks.length === 0) return;
  const input = parent.getInput(inputName);
  if (!input?.connection) return;
  input.connection.connect(blocks[0].previousConnection!);
  for (let i = 1; i < blocks.length; i++) {
    blocks[i - 1].nextConnection!.connect(blocks[i].previousConnection!);
  }
}

function connectValue(parent: Block, inputName: string, child: Block) {
  const input = parent.getInput(inputName);
  if (input?.connection && child.outputConnection) {
    input.connection.connect(child.outputConnection);
  }
}

function createValueBlockFromString(ws: Workspace, strVal: string): Block {
  if (strVal.startsWith("@")) {
    const vb = makeBlock(ws, "variable_get");
    setDropdownValue(vb, "VAR_NAME", strVal.slice(1));
    return vb;
  }
  // Legacy ${var} or {{var}} syntax
  const varMatch = strVal.match(/^(?:\{\{(.+)\}\}|\$\{(.+)\})$/);
  if (varMatch) {
    const vb = makeBlock(ws, "variable_get");
    setDropdownValue(vb, "VAR_NAME", varMatch[1] || varMatch[2]);
    return vb;
  }
  // Strip JSONPath root prefix "$." — display paths without it
  if (strVal.startsWith("$.")) {
    strVal = strVal.slice(2);
  }
  const num = Number(strVal);
  if (!isNaN(num) && strVal.trim() !== "") {
    const nb = makeBlock(ws, "value_number");
    nb.setFieldValue(num, "VALUE");
    return nb;
  }
  const vb = makeBlock(ws, "value_string");
  vb.setFieldValue(strVal, "VALUE");
  return vb;
}

export function populateWorkspaceFromModel(
  ws: Workspace,
  root: Block,
  model: TestLabDocument,
  catalog: BlockCatalog
) {
  if (isTestCase(model)) {
    populateTestCase(ws, root, model);
  } else if (isTest(model)) {
    populateTest(ws, root, model, catalog);
  }

  for (const block of ws.getAllBlocks(false)) {
    (block as unknown as { render: () => void }).render();
  }

  // Refresh dynamic dropdown caches after population so newly available
  // variables are visible immediately without requiring a full UI refresh.
  for (const block of ws.getAllBlocks(false)) {
    for (const input of block.inputList) {
      for (const field of input.fieldRow) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = field as any;
        if (typeof f.getOptions !== "function") continue;
        const value = typeof f.getValue === "function" ? f.getValue() : undefined;
        f.getOptions(true);
        if (value && value !== "__NONE__") {
          const opts = f.getOptions(false) as Array<[string, string]>;
          const match = opts.find(([, v]: [string, string]) => v === value);
          if (match) f.selectedOption_ = match;
        }
      }
    }
  }
}

function populateTestCase(ws: Workspace, root: Block, tc: TestCaseDefinition) {
  if (tc.variables) {
    const varBlocks: Block[] = [];
    for (const [varName, varDef] of Object.entries(tc.variables)) {
      const vb = makeBlock(ws, "variable_def");
      vb.setFieldValue(varName, "VAR_NAME");
      vb.setFieldValue(String(varDef.type || "str"), "VAR_TYPE");
      vb.setFieldValue(String(varDef.default ?? ""), "VAR_DEFAULT");
      vb.setFieldValue(varDef.runtime ? "true" : "false", "VAR_RUNTIME");
      vb.setFieldValue(String(varDef.description || ""), "VAR_DESCRIPTION");
      varBlocks.push(vb);
    }
    attachChain(root, "VARIABLES", varBlocks);
  }

  if (tc.preconditions) {
    const preBlocks: Block[] = [];
    for (const pre of tc.preconditions) {
      const pb = makeBlock(ws, "precondition");
      pb.setFieldValue(pre.id || "", "PRE_ID");
      pb.setFieldValue(pre.description || "", "PRE_DESCRIPTION");
      preBlocks.push(pb);
    }
    attachChain(root, "PRECONDITIONS", preBlocks);
  }

  if (tc.tests) {
    const testBlocks: Block[] = [];
    for (const t of tc.tests) {
      if (isTestRef(t)) {
        const tb = makeBlock(ws, "test_ref");
        tb.setFieldValue(t.test, "TEST_NAME");
        tb.setFieldValue(t.description || "", "DESCRIPTION");
        if (t.with && Object.keys(t.with).length > 0) {
          const kvBlocks: Block[] = [];
          for (const [key, value] of Object.entries(t.with)) {
            const kvb = makeBlock(ws, "key_value_pair");
            kvb.setFieldValue(key, "KEY");
            connectValue(kvb, "VALUE", createValueBlockFromString(ws, String(value)));
            kvBlocks.push(kvb);
          }
          attachChain(tb, "WITH", kvBlocks);
        }
        testBlocks.push(tb);
      } else if (typeof t === "string") {
        const tb = makeBlock(ws, "test_ref");
        const path = t.replace(/^!include\s+/, "");
        tb.setFieldValue(deriveTestLabel(path), "TEST_NAME");
        tb.setFieldValue("", "DESCRIPTION");
        testBlocks.push(tb);
      }
    }
    attachChain(root, "TESTS", testBlocks);
  }
}

function populateTest(ws: Workspace, root: Block, script: ScriptDefinition, catalog: BlockCatalog) {
  const buildStepBlocks = (steps: Step[]): Block[] => {
    const blocks: Block[] = [];

    for (const step of steps) {
      if (isTemplateStep(step)) {
        const sb = makeBlock(ws, "step_template");
        sb.setFieldValue(step.name || step.template, "NAME");
        sb.setFieldValue(step.template, "PARAM_TEMPLATE");

        if (step.params && Object.keys(step.params).length > 0) {
          const kvBlocks: Block[] = [];
          for (const [key, value] of Object.entries(step.params)) {
            const kvb = makeBlock(ws, "key_value_pair");
            kvb.setFieldValue(key, "KEY");
            connectValue(kvb, "VALUE", createValueBlockFromString(ws, String(value)));
            kvBlocks.push(kvb);
          }
          attachChain(sb, "PARAMS", kvBlocks);
        }

        blocks.push(sb);
        continue;
      }

      // Deserialize import_variable step → import_variable block
      if (step.type === "import_variable" && step.params?.file) {
        const ib = makeBlock(ws, "import_variable");
        setDropdownValue(ib, "FILE", String(step.params.file));
        if (step.params.export) {
          setDropdownValue(ib, "EXPORT_VAR", String(step.params.export));
        } else if (Array.isArray(step.params.outputs) && step.params.outputs.length > 0) {
          // Legacy: old format had outputs array — take first
          setDropdownValue(ib, "EXPORT_VAR", String(step.params.outputs[0]));
        }
        const varName = step.params.variable || step.params.export || "imported_var";
        ib.setFieldValue(String(varName), "OUTPUT_VAR");
        blocks.push(ib);
        continue;
      }

      // Deserialize export_variable step → export_variable block
      if (step.type === "export_variable" && step.params?.name) {
        const eb = makeBlock(ws, "export_variable");
        setDropdownValue(eb, "VAR_NAME", String(step.params.name));
        blocks.push(eb);
        continue;
      }

      // Deserialize load_schema (source=file) → schema_import block
      if (step.type === "load_schema" && step.params?.source === "file" && step.params?.path) {
        const sb = makeBlock(ws, "schema_import");
        setDropdownValue(sb, "SCHEMA_PATH", String(step.params.path));
        sb.setFieldValue(String(step.params.name || "schema_var"), "OUTPUT_SCHEMA");
        blocks.push(sb);
        continue;
      }

      const entry = findCatalogEntry(step.type, catalog);
      if (!entry) continue;

      // Special handling: send_notification — flatten notification.header into top-level params
      let effectiveParams = step.params ?? {};
      if (step.type === "send_notification" && effectiveParams.notification) {
        const notif = effectiveParams.notification as Record<string, unknown>;
        const flat: Record<string, unknown> = { ...effectiveParams };
        delete flat.notification;
        if (notif.header && typeof notif.header === "object") {
          const h = notif.header as Record<string, unknown>;
          if (h.notificationId) flat.notification_id = h.notificationId;
          if (h.senderBPN) flat.sender_bpn = h.senderBPN;
          if (h.recipientBPN) flat.recipient_bpn = h.recipientBPN;
          if (h.classification) flat.classification = h.classification;
          if (h.severity) flat.severity = h.severity;
          if (h.status) flat.status = h.status;
          if (h.type) flat.type = h.type;
        }
        if (notif.content) flat.content = notif.content;
        effectiveParams = flat;
      }

      const blockType = `step_${step.type}`;
      const sb = makeBlock(ws, blockType);
      sb.setFieldValue(step.name || step.type, "NAME");

      for (const p of entry.params) {
        const paramVal = effectiveParams[p.name];
        if (paramVal === undefined || paramVal === null) continue;
        const fieldKey = `PARAM_${p.name.toUpperCase()}`;

        switch (p.type) {
          case "dropdown":
          case "endpoint_ref":
          case "service_ref":
          case "schema_path":
          case "variable":
            setDropdownValue(sb, fieldKey, String(paramVal));
            break;
          case "number":
            sb.setFieldValue(Number(paramVal), fieldKey);
            break;
          case "json":
            if (typeof paramVal === "object") {
              const kvBlocks: Block[] = [];
              for (const [key, value] of Object.entries(paramVal as Record<string, unknown>)) {
                const kvb = makeBlock(ws, "key_value_pair");
                kvb.setFieldValue(key, "KEY");
                connectValue(kvb, "VALUE", createValueBlockFromString(ws, String(value)));
                kvBlocks.push(kvb);
              }
              attachChain(sb, fieldKey, kvBlocks);
            }
            break;
          case "steps":
            if (Array.isArray(paramVal)) {
              const nestedBlocks = buildStepBlocks(paramVal as StepDefinition[]);
              attachChain(sb, fieldKey, nestedBlocks);
            }
            break;
          default:
            connectValue(sb, fieldKey, createValueBlockFromString(ws, String(paramVal)));
            break;
        }
      }

      // store_in_memory is auto-generated from catalog outputs — nothing to restore

      if (step.expect && step.expect.length > 0) {
        const assertBlocks: Block[] = [];
        for (const a of step.expect) {
          const output = a.output || "";
          const operators = Object.keys(a).filter((k) => k !== "output");
          if (operators.length === 0) continue;

          const op = operators[0];
          const val = a[op];

          let ab: Block;
          switch (op) {
            case "equals":
              ab = makeBlock(ws, "assert_equals");
              setDropdownValue(ab, "OUTPUT", output);
              connectValue(ab, "EXPECTED", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "not_equals":
              ab = makeBlock(ws, "assert_not_equals");
              setDropdownValue(ab, "OUTPUT", output);
              connectValue(ab, "EXPECTED", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "contains":
              ab = makeBlock(ws, "assert_contains");
              setDropdownValue(ab, "OUTPUT", output);
              connectValue(ab, "SUBSTRING", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "not_contains":
              ab = makeBlock(ws, "assert_not_contains");
              setDropdownValue(ab, "OUTPUT", output);
              connectValue(ab, "SUBSTRING", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "matches":
              ab = makeBlock(ws, "assert_matches");
              setDropdownValue(ab, "OUTPUT", output);
              connectValue(ab, "PATTERN", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "schema":
              ab = makeBlock(ws, "assert_schema");
              setDropdownValue(ab, "OUTPUT", output);
              connectValue(ab, "SCHEMA", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "greater_than":
            case "less_than":
            case "greater_or_equal":
            case "less_or_equal":
              ab = makeBlock(ws, "assert_compare");
              setDropdownValue(ab, "OUTPUT", output);
              setDropdownValue(ab, "OPERATOR", op);
              connectValue(ab, "VALUE", createValueBlockFromString(ws, String(val ?? "")));
              break;
            case "between": {
              ab = makeBlock(ws, "assert_between");
              setDropdownValue(ab, "OUTPUT", output);
              const arr = Array.isArray(val) ? val : [];
              connectValue(ab, "MIN", createValueBlockFromString(ws, String(arr[0] ?? "")));
              connectValue(ab, "MAX", createValueBlockFromString(ws, String(arr[1] ?? "")));
              break;
            }
            case "not_null":
              ab = makeBlock(ws, "assert_not_null");
              setDropdownValue(ab, "OUTPUT", output);
              break;
            case "not_empty":
              ab = makeBlock(ws, "assert_not_empty");
              setDropdownValue(ab, "OUTPUT", output);
              break;
            default:
              continue;
          }
          assertBlocks.push(ab);
        }
        attachChain(sb, "EXPECT", assertBlocks);
      }

      blocks.push(sb);
    }

    return blocks;
  };

  // Load services into the store (services are managed externally, not as blocks)
  if (script.services && script.services.length > 0) {
    useServiceStore.getState().setServices(script.services);
  }

  if (script.setup && script.setup.length > 0) {
    attachChain(root, "SETUP", buildStepBlocks(script.setup));
  }
  if (script.steps && script.steps.length > 0) {
    attachChain(root, "STEPS", buildStepBlocks(script.steps));
  }
  if (script.teardown && script.teardown.length > 0) {
    attachChain(root, "TEARDOWN", buildStepBlocks(script.teardown));
  }

  // Deserialize variables: section → variable_def blocks
  if (script.variables && Object.keys(script.variables).length > 0) {
    const varBlocks: Block[] = [];
    for (const [varName, varDef] of Object.entries(script.variables)) {
      const vb = makeBlock(ws, "variable_def");
      vb.setFieldValue(varName, "VAR_NAME");
      vb.setFieldValue(varDef.type || "str", "VAR_TYPE");
      if (varDef.default !== undefined) vb.setFieldValue(String(varDef.default), "VAR_DEFAULT");
      if (varDef.runtime) vb.setFieldValue("true", "VAR_RUNTIME");
      if (varDef.description) vb.setFieldValue(varDef.description, "VAR_DESCRIPTION");
      varBlocks.push(vb);
    }
    attachChain(root, "VARIABLES", varBlocks);
  }
}

export function cleanupOrphanBlocks(ws: Workspace, root: Block) {
  const connectedIds = new Set<string>();
  const collectConnected = (block: Block | null) => {
    while (block) {
      if (connectedIds.has(block.id)) break;
      connectedIds.add(block.id);
      for (const input of block.inputList) {
        if (input.connection) {
          collectConnected(input.connection.targetBlock());
        }
      }
      block = block.getNextBlock();
    }
  };
  collectConnected(root);

  for (const block of ws.getAllBlocks(false)) {
    if (!connectedIds.has(block.id)) {
      block.dispose(true);
    }
  }
}
