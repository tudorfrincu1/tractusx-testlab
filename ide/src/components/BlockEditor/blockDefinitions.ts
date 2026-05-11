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

import type { StepDefinition, Assertion, ScriptDefinition, TestLabDocument, TestCaseDefinition, TestRef, ServiceDefinition } from "../../models/schema";
import { AssertionType, AssertionSeverity, ScriptKind, ServiceType, isTestCase, isTest, isTestRef } from "../../models/schema";
import { blockColors, getCategoryColor } from "./blockColors";
import { FieldWrappedText } from "./FieldWrappedText";
import type { Block, Workspace, WorkspaceSvg } from "blockly";
import type * as BlocklyType from "blockly";
import { loadBlockCatalog as loadCatalogFromIndex } from "./blocks/catalogLoader";

interface BlockCatalogParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  autogenerate?: boolean;
}

interface BlockCatalogOutput {
  name: string;
  path: string;
}

interface BlockCatalogEntry {
  type: string;
  label: string;
  description: string;
  service_type?: string;
  params: BlockCatalogParam[];
  outputs?: BlockCatalogOutput[];
}

interface BlockCatalogCategory {
  name: string;
  blocks: BlockCatalogEntry[];
}

type BlockCatalog = BlockCatalogCategory[];

let catalogCache: BlockCatalog | null = null;

export async function loadBlockCatalog(): Promise<BlockCatalog> {
  if (catalogCache) return catalogCache;
  catalogCache = await loadCatalogFromIndex();
  return catalogCache!;
}

// Inline SVG icon data URIs for Blockly FieldImage (16x16)
const ICON_SIZE = 16;
function svgDataUri(pathD: string, color = "#fff"): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="${color}" d="${pathD}"/></svg>`
  )}`;
}
// MUI Science (test tube) — for test root
const ICON_TEST = svgDataUri("M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6");
// MUI PlaylistAddCheck — for test-case root
const ICON_TEST_CASE = svgDataUri("M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm17.59-2.07l-4.25 4.24-2.12-2.12-1.41 1.41L16.34 19 22 13.34z");
// MUI AttachFile — for !include
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ICON_INCLUDE = svgDataUri("M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6z");
// MUI Tune — for variable
const ICON_VARIABLE = svgDataUri("M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z");
// MUI ReportProblem — for precondition
const ICON_PRECONDITION = svgDataUri("M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z");
// MUI BoltRounded — for step action
const ICON_STEP = svgDataUri("M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z");

// MUI DataObject — for JSON/object param
const ICON_JSON = svgDataUri("M4 7v2c0 .55-.45 1-1 1H2v4h1c.55 0 1 .45 1 1v2c0 1.65 1.35 3 3 3h3v-2H7c-.55 0-1-.45-1-1v-2c0-1.3-.84-2.42-2-2.83v-.34C5.16 11.42 6 10.3 6 9V7c0-.55.45-1 1-1h3V4H7C5.35 4 4 5.35 4 7zm17 3c-.55 0-1-.45-1-1V7c0-1.65-1.35-3-3-3h-3v2h3c.55 0 1 .45 1 1v2c0 1.3.84 2.42 2 2.83v.34c-1.16.41-2 1.52-2 2.83v2c0 .55-.45 1-1 1h-3v2h3c1.65 0 3-1.35 3-3v-2c0-.55.45-1 1-1h1v-4h-1z");
// MUI AutoFixHigh — for autogenerate (used by step block autogenerate feature)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ICON_AUTO = svgDataUri("M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.9959.9959 0 0 0-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35z");
// MUI Output/SaveAlt — for store_output
const ICON_STORE = svgDataUri("M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z");
// MUI Power — for service container
const ICON_SERVICE = svgDataUri("M16.01 7L16 3h-2v4h-4V3H8v4h-.01C7 6.99 6 7.99 6 8.99v5.49L9.5 18v3h5v-3l3.5-3.51v-5.5c0-1-1-2-1.99-1.99z");
// MUI Security — for ODRL permission
const ICON_PERMISSION = svgDataUri("M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z");
// MUI FilterList — for ODRL constraint
const ICON_CONSTRAINT = svgDataUri("M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z");

function blockIcon(Blockly: typeof BlocklyType, src: string): InstanceType<typeof BlocklyType.FieldImage> {
  return new Blockly.FieldImage(src, ICON_SIZE, ICON_SIZE);
}

/** Checks if a param name is an ID-like field that can be autogenerated */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isAutoGeneratable(param: BlockCatalogParam): boolean {
  if (param.autogenerate) return true;
  const n = param.name.toLowerCase();
  return (n.endsWith("_id") || n === "id" || n === "name") && param.type === "string";
}

/** Derive a human-readable test name from a file path */
export function deriveTestLabel(filePath: string): string {
  // "tests/cx0135_asset_catalog.yaml" → "cx0135_asset_catalog"
  const base = filePath.replace(/^.*\//, "").replace(/\.(yaml|yml)$/, "");
  // "cx0135_asset_catalog" → "CX-0135 Asset Catalog"
  return base
    .replace(/_/g, " ")
    .replace(/\bcx\s*(\d+)/gi, "CX-$1")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Service-type index — maps step block type to its allowed service type ────
const stepServiceTypeIndex = new Map<string, string>();

export function registerBlocks(Blockly: typeof BlocklyType, catalog: BlockCatalog) {
  // Build the service-type index from catalog
  stepServiceTypeIndex.clear();
  for (const cat of catalog) {
    for (const entry of cat.blocks) {
      if (entry.service_type) {
        stepServiceTypeIndex.set(`step_${entry.type}`, entry.service_type);
      }
    }
  }

  // ── Key-Value pair block for JSON/object params ──────────────────────────
  Blockly.Blocks["key_value_pair"] = {
    init(this: Block) {
      this.appendValueInput("VALUE")
        .appendField(new Blockly.FieldTextInput("key"), "KEY")
        .appendField("=")
        .setCheck("param_value");
      this.setPreviousStatement(true, "key_value");
      this.setNextStatement(true, "key_value");
      this.setColour(blockColors.keyValue);
      this.setTooltip("A key-value pair — connect a string or variable block as the value");
    },
  };

  // ── JSON Object block — groups key-value pairs into a named object ──────
  Blockly.Blocks["json_object"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_JSON))
        .appendField(new Blockly.FieldLabelSerializable("object"), "PARAM_NAME");
      this.appendStatementInput("ENTRIES").setCheck("key_value");
      this.setPreviousStatement(true, "json_param");
      this.setNextStatement(true, "json_param");
      this.setColour(blockColors.json);
      this.setTooltip("JSON object — add key-value pairs inside");
    },
  };

  // ── Value blocks — connectable parameter values ─────────────────────────
  Blockly.Blocks["value_string"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("str")
        .appendField(new Blockly.FieldTextInput(""), "VALUE");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueString);
      this.setTooltip("A literal string value");
    },
  };

  Blockly.Blocks["variable_get"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_VARIABLE))
        .appendField("get")
        .appendField(
          new Blockly.FieldDropdown(
            // Dynamic menu — regenerated each time the dropdown opens
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function (this: any): Array<[string, string]> {
              const block = this.getSourceBlock?.();
              const ws = block?.workspace;
              // Guard: workspace unavailable or being cleared/disposed
              if (!ws || ws.isClearing || ws.disposed) return [["—", "__NONE__"]];
              let vars: string[];
              try {
                vars = collectWorkspaceVariables(ws);
              } catch {
                return [["—", "__NONE__"]];
              }
              const currentVal = this.getValue?.() ?? "";
              const options: Array<[string, string]> = vars.map(
                (v: string): [string, string] => [v, v]
              );
              if (
                currentVal &&
                currentVal !== "__NONE__" &&
                !options.some(([, val]) => val === currentVal)
              ) {
                options.unshift([currentVal, currentVal]);
              }
              if (options.length === 0) {
                options.push(["(no variables)", "__NONE__"]);
              }
              return options;
            } as () => Array<[string, string]>
          ),
          "VAR_NAME"
        );
      this.setOutput(true, "param_value");
      this.setColour(blockColors.variableGet);
      this.setTooltip("Get a variable value — select from declared variables");
    },
  };

  Blockly.Blocks["value_auto"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_AUTO))
        .appendField("auto-generate");
      this.setOutput(true, "param_value");
      this.setColour(blockColors.valueAuto);
      this.setTooltip("Auto-generated value (UUID, unique name, etc.)");
    },
  };

  // ── Store output block — declares a variable and captures a step result ──
  Blockly.Blocks["store_output"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_STORE))
        .appendField("set")
        .appendField(new Blockly.FieldTextInput("result"), "VAR_NAME");
      this.appendDummyInput()
        .appendField("from path")
        .appendField(new Blockly.FieldTextInput("$"), "JSON_PATH");
      this.setPreviousStatement(true, "store_output");
      this.setNextStatement(true, "store_output");
      this.setColour(blockColors.storeOutput);
      this.setTooltip("Declare a variable and capture a value from the response. Use the \"get\" block to reference it later.");
    },
  };

  // ── Service container block — C-shaped, holds steps for a service ────────
  Blockly.Blocks["service_block"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_SERVICE))
        .appendField("Service:")
        .appendField(new Blockly.FieldTextInput("my-service"), "SERVICE_NAME");
      this.appendDummyInput()
        .appendField("type:")
        .appendField(
          new Blockly.FieldDropdown(
            Object.values(ServiceType).map((t) => [t, t])
          ),
          "SERVICE_TYPE"
        );
      this.appendValueInput("BASE_URL")
        .appendField("base_url:")
        .setCheck("param_value");
      this.appendStatementInput("AUTH")
        .appendField(blockIcon(Blockly, ICON_JSON))
        .appendField("auth:")
        .setCheck("key_value");
      this.appendStatementInput("STEPS")
        .appendField(blockIcon(Blockly, ICON_STEP))
        .appendField("steps:")
        .setCheck("inner_step");
      this.setPreviousStatement(true, "step");
      this.setNextStatement(true, "step");
      this.setColour(blockColors.service);
      this.setTooltip("Service container — drag steps that use this service inside");
    },
    onchange(this: Block) {
      if (!this.workspace) return;
      if ("isDragging" in this.workspace && (this.workspace as WorkspaceSvg).isDragging()) return;
      const svcType = this.getFieldValue("SERVICE_TYPE") || "";
      // Walk inner steps and validate service_type compatibility
      let inner = this.getInputTargetBlock("STEPS");
      while (inner) {
        if (inner.type.startsWith("step_")) {
          const allowed = stepServiceTypeIndex.get(inner.type);
          // null/undefined → generic step, allowed anywhere
          if (allowed && allowed !== svcType) {
            inner.setWarningText(
              `This step requires a ${allowed} service, but this container is ${svcType}.`
            );
          } else {
            inner.setWarningText(null);
          }
        }
        inner = inner.getNextBlock();
      }
    },
  };

  // Register phase blocks: setup, steps, cleanup
  for (const phase of ["setup", "steps", "cleanup"]) {
    Blockly.Blocks[`phase_${phase}`] = {
      init(this: Block) {
        this.appendDummyInput().appendField(phase.toUpperCase());
        this.appendStatementInput("STEPS").setCheck("step");
        this.setColour(phase === "setup" ? blockColors.phaseSetup : phase === "cleanup" ? blockColors.phaseCleanup : blockColors.phaseSteps);
        this.setTooltip(`${phase} phase — add steps here`);
        this.setDeletable(false);
      },
    };
  }

  // Root test block
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
      this.appendStatementInput("CLEANUP").appendField("Cleanup").setCheck("step");
      this.setColour(blockColors.root);
      this.setTooltip("Root test definition");
      this.setDeletable(false);
    },
  };

  // Root test-case block
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
      this.setTooltip(
        "Test case — groups multiple tests with shared configuration"
      );
      this.setDeletable(false);
    },
  };

  // Test reference block — named test with optional variable overrides
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
        .appendField(blockIcon(Blockly, ICON_VARIABLE) + " with:")
        .setCheck("key_value");
      this.setPreviousStatement(true, "test_entry");
      this.setNextStatement(true, "test_entry");
      this.setColour(blockColors.testRef);
      this.setTooltip("Reference a reusable test — override variables with key-value pairs");
    },
  };

  // Shared variable definition block
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

  // Precondition block
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

  // Assertion block
  Blockly.Blocks["assertion"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField("Assert")
        .appendField(
          new Blockly.FieldDropdown([
            ["STATUS_CODE", "STATUS_CODE"],
            ["EXACT", "EXACT"],
            ["CONTAINS", "CONTAINS"],
            ["NOT_CONTAINS", "NOT_CONTAINS"],
            ["REGEX", "REGEX"],
            ["SCHEMA", "SCHEMA"],
          ]),
          "TYPE"
        );
      this.appendValueInput("FIELD")
        .appendField("field:")
        .setCheck("param_value");
      this.appendValueInput("VALUE")
        .appendField("value:")
        .setCheck("param_value");
      this.appendDummyInput()
        .appendField("severity:")
        .appendField(
          new Blockly.FieldDropdown([
            ["HARD", "HARD"],
            ["SOFT", "SOFT"],
          ]),
          "SEVERITY"
        );
      this.setPreviousStatement(true, "assertion");
      this.setNextStatement(true, "assertion");
      this.setColour(blockColors.assertion);
      this.setTooltip("Assertion for a step");
    },
  };

  // ── ODRL Policy blocks ──────────────────────────────────────────────────

  // Permission block — defines an ODRL permission (action + constraints)
  Blockly.Blocks["odrl_permission"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_PERMISSION))
        .appendField("Permission")
        .appendField(
          new Blockly.FieldDropdown([
            ["access", "access"],
            ["use", "use"],
            ["transfer", "transfer"],
          ]),
          "ACTION"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField(blockIcon(Blockly, ICON_CONSTRAINT))
        .appendField("constraint:")
        .setCheck("constraint");
      this.setPreviousStatement(true, "permission");
      this.setNextStatement(true, "permission");
      this.setColour(blockColors.odrlPermission);
      this.setTooltip("ODRL permission — define an action with constraints");
    },
  };

  // Constraint block — a single ODRL constraint (leftOperand operator rightOperand)
  Blockly.Blocks["odrl_constraint"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_CONSTRAINT))
        .appendField("Constraint");
      this.appendDummyInput()
        .appendField("leftOperand:")
        .appendField(new Blockly.FieldTextInput("BusinessPartnerNumber"), "LEFT_OPERAND");
      this.appendDummyInput()
        .appendField("operator:")
        .appendField(
          new Blockly.FieldDropdown([
            ["eq", "eq"],
            ["neq", "neq"],
            ["isAnyOf", "isAnyOf"],
            ["isNoneOf", "isNoneOf"],
            ["isAllOf", "isAllOf"],
            ["in", "in"],
            ["lt", "lt"],
            ["gt", "gt"],
            ["lteq", "lteq"],
            ["gteq", "gteq"],
          ]),
          "OPERATOR"
        );
      this.appendValueInput("RIGHT_OPERAND")
        .appendField("rightOperand:")
        .setCheck("param_value");
      this.setPreviousStatement(true, "constraint");
      this.setNextStatement(true, "constraint");
      this.setColour(blockColors.odrlConstraint);
      this.setTooltip("ODRL constraint — a single condition");
    },
  };

  // Constraint group block — AND/OR logical grouping of constraints
  Blockly.Blocks["odrl_constraint_group"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_CONSTRAINT))
        .appendField("Constraint Group")
        .appendField(
          new Blockly.FieldDropdown([
            ["and", "and"],
            ["or", "or"],
          ]),
          "LOGIC"
        );
      this.appendStatementInput("CONSTRAINTS")
        .appendField("constraints:")
        .setCheck("constraint");
      this.setPreviousStatement(true, "constraint");
      this.setNextStatement(true, "constraint");
      this.setColour(blockColors.odrlGroup);
      this.setTooltip("Group constraints with AND/OR logic");
    },
  };

  // Context URL entry
  Blockly.Blocks["context_entry"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_JSON))
        .appendField("@context:")
        .appendField(new FieldWrappedText("https://..."), "URL");
      this.setPreviousStatement(true, "context_entry");
      this.setNextStatement(true, "context_entry");
      this.setColour(blockColors.context);
      this.setTooltip("JSON-LD context URL");
    },
  };

  // Context @vocab mapping
  Blockly.Blocks["context_vocab"] = {
    init(this: Block) {
      this.appendDummyInput()
        .appendField(blockIcon(Blockly, ICON_JSON))
        .appendField("@vocab:")
        .appendField(
          new FieldWrappedText("https://w3id.org/edc/v0.0.1/ns/"),
          "URL"
        );
      this.setPreviousStatement(true, "context_entry");
      this.setNextStatement(true, "context_entry");
      this.setColour(blockColors.context);
      this.setTooltip("JSON-LD @vocab namespace mapping");
    },
  };

  // Generate step blocks from catalog
  for (const category of catalog) {
    const categoryColor = getCategoryColor(category.name);

    for (const block of category.blocks) {

      Blockly.Blocks[`step_${block.type}`] = {
        init(this: Block) {
          this.appendDummyInput()
            .appendField(blockIcon(Blockly, ICON_STEP))
            .appendField(block.label);
          this.appendDummyInput()
            .appendField("name:")
            .appendField(new Blockly.FieldTextInput(block.label), "NAME");

          for (const param of block.params) {
            if (param.type === "json") {
              // JSON/object param — use statement input for key-value sub-blocks
              this.appendStatementInput(`JSON_${param.name.toUpperCase()}`)
                .appendField(blockIcon(Blockly, ICON_JSON))
                .appendField(`${param.name}:`)
                .setCheck("key_value");
            } else if (param.type === "permission") {
              // ODRL permission chain
              this.appendStatementInput(`PERM_${param.name.toUpperCase()}`)
                .appendField(blockIcon(Blockly, ICON_PERMISSION))
                .appendField(`${param.name}:`)
                .setCheck("permission");
            } else if (param.type === "context") {
              // JSON-LD context entries
              this.appendStatementInput(`CTX_${param.name.toUpperCase()}`)
                .appendField(blockIcon(Blockly, ICON_JSON))
                .appendField(`${param.name}:`)
                .setCheck("context_entry");
            } else {
              // All other params — value input accepting value blocks
              this.appendValueInput(param.name.toUpperCase())
                .appendField(`${param.name}:`)
                .setCheck("param_value");
            }
          }

          if (block.outputs && block.outputs.length > 0) {
            this.appendStatementInput("STORE")
              .appendField(blockIcon(Blockly, ICON_STORE))
              .appendField("store outputs")
              .setCheck("store_output");
          }

          this.appendDummyInput()
            .appendField("failure_policy:")
            .appendField(
              new Blockly.FieldDropdown([
                ["ABORT", "ABORT"],
                ["CONTINUE", "CONTINUE"],
                ["SKIP_REST", "SKIP_REST"],
              ]),
              "FAILURE_POLICY"
            );

          this.appendStatementInput("EXPECT").appendField("expect").setCheck("assertion");

          this.setPreviousStatement(true, ["step", "inner_step"]);
          this.setNextStatement(true, ["step", "inner_step"]);
          this.setColour(categoryColor);
          this.setTooltip(block.description);
        },
      };
    }
  }
}

/** Scan workspace for defined variable names (from store_output and variable_def blocks) */
export function collectWorkspaceVariables(workspace: Workspace): string[] {
  const vars = new Set<string>();

  for (const b of workspace.getBlocksByType("store_output", false)) {
    const name = b.getFieldValue("VAR_NAME");
    if (name) vars.add(`memory.${name}`);
  }

  for (const b of workspace.getBlocksByType("variable_def", false)) {
    const name = b.getFieldValue("VAR_NAME");
    if (name) vars.add(name);
  }

  return Array.from(vars).sort();
}

export function buildToolbox(catalog: BlockCatalog, kind?: ScriptKind, variables?: string[]): object {
  if (kind === "test-case") {
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
      ],
    };
  }

  const vars = variables || [];

  // Build Variables category — Scratch-like: store_output + pre-filled reporters
  const variableContents: object[] = [
    { kind: "block", type: "store_output" },
  ];

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

  // Always include a blank variable_get for selecting variables
  variableContents.push({ kind: "block", type: "variable_get" });

  const categoryContents = catalog.map((cat) => ({
    kind: "category",
    name: cat.name,
    contents: cat.blocks.map((b) => ({
      kind: "block",
      type: `step_${b.type}`,
    })),
  }));

  return {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: "Services",
        contents: [{ kind: "block", type: "service_block" }],
      },
      {
        kind: "category",
        name: "Variables",
        contents: variableContents,
      },
      {
        kind: "category",
        name: "Values",
        contents: [
          { kind: "block", type: "value_string" },
          { kind: "block", type: "value_auto" },
        ],
      },
      {
        kind: "category",
        name: "Assertions",
        contents: [{ kind: "block", type: "assertion" }],
      },
      ...categoryContents,
      {
        kind: "category",
        name: "ODRL / Policies",
        contents: [
          { kind: "block", type: "odrl_permission" },
          { kind: "block", type: "odrl_constraint" },
          { kind: "block", type: "odrl_constraint_group" },
          { kind: "block", type: "context_entry" },
          { kind: "block", type: "context_vocab" },
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

export function workspaceToModel(
  _Blockly: typeof BlocklyType,
  workspace: Workspace,
  catalog: BlockCatalog
): Partial<TestLabDocument> {
  // Try test-case root first
  const testCaseRoot = workspace.getBlocksByType("test_case_root", false)[0];
  if (testCaseRoot) {
    return workspaceToTestCase(testCaseRoot);
  }

  // Then try regular test root
  const rootBlock = workspace.getBlocksByType("test_root", false)[0];
  if (!rootBlock) return {};

  const name = rootBlock.getFieldValue("NAME") || "my_test";
  const version = rootBlock.getFieldValue("VERSION") || "1.0";
  const description = rootBlock.getFieldValue("DESCRIPTION") || "";

  // Collect services and steps from all phases (service_blocks in step chains)
  const services: ServiceDefinition[] = [];
  const setup = readStepChainWithServices(rootBlock.getInputTargetBlock("SETUP"), catalog, services);
  const steps = readStepChainWithServices(rootBlock.getInputTargetBlock("STEPS"), catalog, services);
  const cleanup = readStepChainWithServices(rootBlock.getInputTargetBlock("CLEANUP"), catalog, services);

  return {
    kind: "test",
    name,
    version,
    description,
    services: services.length > 0 ? services : undefined,
    setup: setup.length > 0 ? setup : undefined,
    steps,
    cleanup: cleanup.length > 0 ? cleanup : undefined,
  } as Partial<ScriptDefinition>;
}

function workspaceToTestCase(root: Block): Partial<TestCaseDefinition> {
  const name = root.getFieldValue("NAME") || "my-test-case";
  const version = root.getFieldValue("VERSION") || "1.0";
  const description = root.getFieldValue("DESCRIPTION") || "";

  // Read shared variables
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

  // Read preconditions
  const preconditions: Array<{ id: string; description: string }> = [];
  let preBlock = root.getInputTargetBlock("PRECONDITIONS");
  while (preBlock) {
    if (preBlock.type === "precondition") {
      const preId = preBlock.getFieldValue("PRE_ID") || "";
      const preDesc = preBlock.getFieldValue("PRE_DESCRIPTION") || "";
      if (preId) {
        preconditions.push({ id: preId, description: preDesc });
      }
    }
    preBlock = preBlock.getNextBlock();
  }

  // Read test references
  const tests: (ScriptDefinition | string | TestRef)[] = [];
  let testBlock = root.getInputTargetBlock("TESTS");
  while (testBlock) {
    if (testBlock.type === "test_ref") {
      const testName = testBlock.getFieldValue("TEST_NAME") || "";
      const description = testBlock.getFieldValue("DESCRIPTION") || "";
      if (testName) {
        const ref: TestRef = { test: testName };
        if (description) ref.description = description;
        // Read WITH key-value pairs
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
    } else if (testBlock.type === "include_test") {
      // Legacy backward compat
      const filePath = testBlock.getFieldValue("FILE_PATH") || "";
      if (filePath) tests.push(`!include ${filePath}`);
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

/** Read a service_block and extract its ServiceDefinition */
function readServiceBlock(block: Block): ServiceDefinition | null {
  const name = block.getFieldValue("SERVICE_NAME") || "";
  const type = block.getFieldValue("SERVICE_TYPE") || ServiceType.CONNECTOR_CONSUMER;

  let baseUrl = "";
  const urlBlock = block.getInputTargetBlock("BASE_URL");
  if (urlBlock) {
    if (urlBlock.type === "variable_get") {
      const varName = urlBlock.getFieldValue("VAR_NAME") || "";
      baseUrl = varName ? `\${${varName}}` : "";
    } else if (urlBlock.type === "value_string") {
      baseUrl = urlBlock.getFieldValue("VALUE") || "";
    } else if (urlBlock.type === "value_auto") {
      baseUrl = "{{auto}}";
    }
  }

  let auth: Record<string, unknown> | undefined;
  let kvBlock = block.getInputTargetBlock("AUTH");
  while (kvBlock) {
    if (kvBlock.type === "key_value_pair") {
      const key = kvBlock.getFieldValue("KEY") || "";
      const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
      if (key) {
        if (!auth) auth = {};
        auth[key] = value;
      }
    }
    kvBlock = kvBlock.getNextBlock();
  }

  if (!name) return null;
  const svc: ServiceDefinition = {
    name,
    type: type as ServiceDefinition["type"],
    base_url: baseUrl,
  };
  if (auth) svc.auth = auth;
  return svc;
}

/** Read a step chain, handling service_blocks as containers.
 *  service_blocks extract service definitions and wrap inner steps with params.service. */
function readStepChainWithServices(
  block: Block | null,
  catalog: BlockCatalog,
  services: ServiceDefinition[]
): StepDefinition[] {
  const steps: StepDefinition[] = [];
  let current = block;
  while (current) {
    if (current.type === "service_block") {
      // Extract service definition
      const svc = readServiceBlock(current);
      if (svc) {
        // Avoid duplicate service definitions
        if (!services.some((s) => s.name === svc.name)) {
          services.push(svc);
        }
        // Read inner steps and add params.service
        const innerSteps = readStepChain(current.getInputTargetBlock("STEPS"), catalog);
        for (const s of innerSteps) {
          s.params = { service: svc.name, ...s.params };
          steps.push(s);
        }
      }
    } else {
      const step = blockToStep(current, catalog);
      if (step) steps.push(step);
    }
    current = current.getNextBlock();
  }
  return steps;
}

function readStepChain(block: Block | null, catalog: BlockCatalog): StepDefinition[] {
  const steps: StepDefinition[] = [];
  let current = block;
  while (current) {
    const step = blockToStep(current, catalog);
    if (step) steps.push(step);
    current = current.getNextBlock();
  }
  return steps;
}

// ── ODRL serialization helpers ──────────────────────────────────────────────

/** Read a value block and return its string representation */
function readValueBlockAsString(block: Block | null): string | undefined {
  if (!block) return undefined;
  if (block.type === "value_auto") return "{{auto}}";
  if (block.type === "variable_get") {
    const v = block.getFieldValue("VAR_NAME") || "";
    return v && v !== "__NONE__" ? `\${${v}}` : undefined;
  }
  if (block.type === "value_string") {
    return block.getFieldValue("VALUE") || undefined;
  }
  return undefined;
}

/** Read a chain of odrl_permission blocks → ODRL permissions array */
function readPermissionChain(block: Block | null): object[] {
  const perms: object[] = [];
  let current = block;
  while (current) {
    if (current.type === "odrl_permission") {
      const action = current.getFieldValue("ACTION") || "use";
      const constraint = readConstraintInput(current.getInputTargetBlock("CONSTRAINTS"));
      const perm: Record<string, unknown> = { action };
      if (constraint) perm.constraint = constraint;
      perms.push(perm);
    }
    current = current.getNextBlock();
  }
  return perms;
}

/** Read constraint blocks from a statement input → single constraint object or AND group */
function readConstraintInput(block: Block | null): object | undefined {
  const constraints = readConstraintList(block);
  if (constraints.length === 0) return undefined;
  if (constraints.length === 1) return constraints[0];
  // Multiple top-level constraints → implicit AND
  return { and: constraints };
}

/** Read a chain of constraint/constraint_group blocks → array of constraint objects */
function readConstraintList(block: Block | null): object[] {
  const list: object[] = [];
  let current = block;
  while (current) {
    if (current.type === "odrl_constraint") {
      const leftOperand = current.getFieldValue("LEFT_OPERAND") || "";
      const operator = current.getFieldValue("OPERATOR") || "eq";
      const rightOperand = readValueBlockAsString(current.getInputTargetBlock("RIGHT_OPERAND")) || "";
      list.push({ leftOperand, operator, rightOperand });
    } else if (current.type === "odrl_constraint_group") {
      const logic = current.getFieldValue("LOGIC") || "and";
      const inner = readConstraintList(current.getInputTargetBlock("CONSTRAINTS"));
      if (inner.length > 0) list.push({ [logic]: inner });
    }
    current = current.getNextBlock();
  }
  return list;
}

/** Read a chain of context_entry/context_vocab blocks → JSON-LD context array */
function readContextChain(block: Block | null): (string | Record<string, string>)[] {
  const ctx: (string | Record<string, string>)[] = [];
  let current = block;
  while (current) {
    if (current.type === "context_entry") {
      const url = current.getFieldValue("URL") || "";
      if (url) ctx.push(url);
    } else if (current.type === "context_vocab") {
      const url = current.getFieldValue("URL") || "";
      if (url) ctx.push({ "@vocab": url });
    }
    current = current.getNextBlock();
  }
  return ctx;
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
  const blockType = block.type;
  if (!blockType.startsWith("step_")) return null;

  const stepType = blockType.replace("step_", "");
  const name = block.getFieldValue("NAME") || stepType;
  const failurePolicy = block.getFieldValue("FAILURE_POLICY") || undefined;

  // Read params from catalog
  const catalogEntry = findCatalogEntry(stepType, catalog);
  const params: Record<string, unknown> = {};
  if (catalogEntry) {
    for (const p of catalogEntry.params) {
      if (p.type === "json") {
        // Read key-value pairs from statement input
        const jsonObj: Record<string, string> = {};
        let kvBlock = block.getInputTargetBlock(`JSON_${p.name.toUpperCase()}`);
        while (kvBlock) {
          if (kvBlock.type === "key_value_pair") {
            const key = kvBlock.getFieldValue("KEY") || "";
            const value = readValueBlockAsString(kvBlock.getInputTargetBlock("VALUE")) || "";
            if (key) jsonObj[key] = value;
          }
          kvBlock = kvBlock.getNextBlock();
        }
        if (Object.keys(jsonObj).length > 0) params[p.name] = jsonObj;
      } else if (p.type === "permission") {
        const perms = readPermissionChain(block.getInputTargetBlock(`PERM_${p.name.toUpperCase()}`));
        if (perms.length > 0) params[p.name] = perms;
      } else if (p.type === "context") {
        const ctx = readContextChain(block.getInputTargetBlock(`CTX_${p.name.toUpperCase()}`));
        if (ctx.length > 0) params[p.name] = ctx;
      } else {
        // Read connected value block
        const connectedBlock = block.getInputTargetBlock(p.name.toUpperCase());
        if (connectedBlock) {
          if (connectedBlock.type === "value_auto") {
            params[p.name] = "{{auto}}";
          } else if (connectedBlock.type === "variable_get") {
            const varName = connectedBlock.getFieldValue("VAR_NAME") || "";
            if (varName && varName !== "__NONE__") params[p.name] = `\${${varName}}`;
          } else if (connectedBlock.type === "value_string") {
            const val = connectedBlock.getFieldValue("VALUE");
            if (val) params[p.name] = val;
          }
        }
      }
    }
  }

  // Read store_output blocks from STORE input
  let storeInMemory: Record<string, string> | undefined;
  let storeBlock = block.getInputTargetBlock("STORE");
  while (storeBlock) {
    if (storeBlock.type === "store_output") {
      const varName = storeBlock.getFieldValue("VAR_NAME") || "";
      const jsonPath = storeBlock.getFieldValue("JSON_PATH") || "$";
      if (varName) {
        if (!storeInMemory) storeInMemory = {};
        storeInMemory[varName] = jsonPath;
      }
    }
    storeBlock = storeBlock.getNextBlock();
  }

  // Read assertions
  const expect = readAssertionChain(block.getInputTargetBlock("EXPECT"));

  const step: StepDefinition = {
    type: stepType,
    name,
    params,
    expect: expect.length > 0 ? expect : undefined,
    store_in_memory: storeInMemory,
    on_failure: failurePolicy === "ABORT" ? undefined : failurePolicy,
  };

  return step;
}

function readAssertionChain(block: Block | null): Assertion[] {
  const assertions: Assertion[] = [];
  let current = block;
  while (current) {
    if (current.type === "assertion") {
      const a: Assertion = {
        type: (current.getFieldValue("TYPE") || "STATUS_CODE") as AssertionType,
        value: readValueBlockAsString(current.getInputTargetBlock("VALUE")) || "",
        severity: (current.getFieldValue("SEVERITY") || "HARD") as AssertionSeverity,
        path: readValueBlockAsString(current.getInputTargetBlock("FIELD")) || undefined,
      };
      if (!a.path) delete a.path;
      assertions.push(a);
    }
    current = current.getNextBlock();
  }
  return assertions;
}

// ── Populate workspace from model ─────────────────────────────────────────────

/** Helper: create a block, init SVG, set fields, return it */
function makeBlock(ws: Workspace, type: string): Block {
  const b = ws.newBlock(type);
  // initSvg exists on rendered blocks but not in the Block type
  (b as unknown as { initSvg: () => void }).initSvg();
  return b;
}

/**
 * Set a FieldDropdown value, bypassing doClassValidation_ which rejects
 * values not yet in the dynamic option list (e.g. variable names whose
 * defining blocks haven't been created yet during population).
 */
function setDropdownValue(block: Block, fieldName: string, value: string) {
  const field = block.getField(fieldName);
  if (!field) return;
  // Temporarily replace the validator to allow any value during population
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = field as any;
  const original = f.doClassValidation_;
  f.doClassValidation_ = (v: string) => v;
  try {
    field.setValue(value);
  } finally {
    f.doClassValidation_ = original;
  }
}

/** Connect a chain of blocks to a statement input on parent */
function attachChain(parent: Block, inputName: string, blocks: Block[]) {
  if (blocks.length === 0) return;
  const input = parent.getInput(inputName);
  if (!input?.connection) return;
  input.connection.connect(blocks[0].previousConnection!);
  for (let i = 1; i < blocks.length; i++) {
    blocks[i - 1].nextConnection!.connect(blocks[i].previousConnection!);
  }
}

/** Connect a value block to a value input on parent */
function connectValue(parent: Block, inputName: string, child: Block) {
  const input = parent.getInput(inputName);
  if (input?.connection && child.outputConnection) {
    input.connection.connect(child.outputConnection);
  }
}

// ── ODRL populate helpers ─────────────────────────────────────────────────────

/** Build permission blocks from parsed ODRL permissions array */
function buildPermissionBlocks(ws: Workspace, perms: unknown[]): Block[] {
  const blocks: Block[] = [];
  for (const perm of perms) {
    if (typeof perm !== "object" || perm === null) continue;
    const p = perm as Record<string, unknown>;
    const pb = makeBlock(ws, "odrl_permission");
    pb.setFieldValue(String(p.action || "use"), "ACTION");
    if (p.constraint) {
      const constraintBlocks = buildConstraintBlocks(ws, p.constraint);
      attachChain(pb, "CONSTRAINTS", constraintBlocks);
    }
    blocks.push(pb);
  }
  return blocks;
}

/** Build constraint blocks from an ODRL constraint object (single or group) */
function buildConstraintBlocks(ws: Workspace, constraint: unknown): Block[] {
  if (typeof constraint !== "object" || constraint === null) return [];
  const c = constraint as Record<string, unknown>;

  // Check for and/or group
  if (c.and || c.or) {
    const logic = c.and ? "and" : "or";
    const items = (c.and || c.or) as unknown[];
    const gb = makeBlock(ws, "odrl_constraint_group");
    gb.setFieldValue(logic, "LOGIC");
    const innerBlocks: Block[] = [];
    for (const item of items) {
      innerBlocks.push(...buildConstraintBlocks(ws, item));
    }
    attachChain(gb, "CONSTRAINTS", innerBlocks);
    return [gb];
  }

  // Single constraint
  if (c.leftOperand) {
    return [buildSingleConstraint(ws, c)];
  }

  return [];
}

/** Build a single odrl_constraint block */
function buildSingleConstraint(ws: Workspace, c: Record<string, unknown>): Block {
  const cb = makeBlock(ws, "odrl_constraint");
  cb.setFieldValue(String(c.leftOperand || ""), "LEFT_OPERAND");
  cb.setFieldValue(String(c.operator || "eq"), "OPERATOR");
  if (c.rightOperand !== undefined) {
    const strVal = String(c.rightOperand);
    const vb = createValueBlockFromString(ws, strVal);
    connectValue(cb, "RIGHT_OPERAND", vb);
  }
  return cb;
}

/** Build context entry blocks from parsed JSON-LD context array */
function buildContextBlocks(ws: Workspace, ctx: unknown[]): Block[] {
  const blocks: Block[] = [];
  for (const entry of ctx) {
    if (typeof entry === "string") {
      const cb = makeBlock(ws, "context_entry");
      cb.setFieldValue(entry, "URL");
      blocks.push(cb);
    } else if (typeof entry === "object" && entry !== null) {
      const obj = entry as Record<string, string>;
      if (obj["@vocab"]) {
        const vb = makeBlock(ws, "context_vocab");
        vb.setFieldValue(obj["@vocab"], "URL");
        blocks.push(vb);
      }
    }
  }
  return blocks;
}

/** Create a value block from a string, handling ${} and {{}} variable syntax */
function createValueBlockFromString(ws: Workspace, strVal: string): Block {
  if (strVal === "{{auto}}") {
    return makeBlock(ws, "value_auto");
  }
  const varMatch = strVal.match(/^(?:\{\{(.+)\}\}|\$\{(.+)\})$/);
  if (varMatch) {
    const vb = makeBlock(ws, "variable_get");
    setDropdownValue(vb, "VAR_NAME", varMatch[1] || varMatch[2]);
    return vb;
  }
  const vb = makeBlock(ws, "value_string");
  vb.setFieldValue(strVal, "VALUE");
  return vb;
}

function populateTestCase(ws: Workspace, root: Block, tc: TestCaseDefinition) {
  // Variables
  if (tc.variables) {
    const varBlocks: Block[] = [];
    for (const [varName, varDef] of Object.entries(tc.variables)) {
      const vb = makeBlock(ws, "variable_def");
      vb.setFieldValue(varName, "VAR_NAME");
      vb.setFieldValue(varDef.type || "str", "VAR_TYPE");
      vb.setFieldValue(String(varDef.default ?? ""), "VAR_DEFAULT");
      vb.setFieldValue(varDef.runtime ? "true" : "false", "VAR_RUNTIME");
      vb.setFieldValue(varDef.description || "", "VAR_DESCRIPTION");
      varBlocks.push(vb);
    }
    attachChain(root, "VARIABLES", varBlocks);
  }

  // Preconditions
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

  // Tests (named references and legacy !include)
  if (tc.tests) {
    const testBlocks: Block[] = [];
    for (const t of tc.tests) {
      if (isTestRef(t)) {
        const tb = makeBlock(ws, "test_ref");
        tb.setFieldValue(t.test, "TEST_NAME");
        tb.setFieldValue(t.description || "", "DESCRIPTION");
        // Populate WITH key-value pairs
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
        // Legacy !include — convert to test_ref block
        const tb = makeBlock(ws, "test_ref");
        const path = t.replace(/^!include\s+/, "");
        tb.setFieldValue(deriveTestLabel(path), "TEST_NAME");
        tb.setFieldValue("", "DESCRIPTION");
        testBlocks.push(tb);
      } else if (typeof t === "object" && t !== null && "name" in t) {
        // Inline ScriptDefinition — render as test_ref block
        const script = t as ScriptDefinition;
        const tb = makeBlock(ws, "test_ref");
        tb.setFieldValue(script.name, "TEST_NAME");
        tb.setFieldValue(script.description || "", "DESCRIPTION");
        testBlocks.push(tb);
      }
    }
    attachChain(root, "TESTS", testBlocks);
  }
}

function populateTest(ws: Workspace, root: Block, script: ScriptDefinition, catalog: BlockCatalog) {
  // Index services by name for lookup
  const serviceMap = new Map<string, ServiceDefinition>();
  if (script.services) {
    for (const svc of script.services) {
      serviceMap.set(svc.name, svc);
    }
  }

  /** Create a value block from a string, handling both ${...} and {{...}} variable syntax */
  const createValueBlock = (strVal: string): Block => {
    if (strVal === "{{auto}}") {
      return makeBlock(ws, "value_auto");
    }
    // Match {{var}} or ${var} variable syntax
    const varMatch = strVal.match(/^(?:\{\{(.+)\}\}|\$\{(.+)\})$/);
    if (varMatch) {
      const vb = makeBlock(ws, "variable_get");
      setDropdownValue(vb, "VAR_NAME", varMatch[1] || varMatch[2]);
      return vb;
    }
    const vb = makeBlock(ws, "value_string");
    vb.setFieldValue(strVal, "VALUE");
    return vb;
  };

  /** Create a service_block from a ServiceDefinition */
  const createServiceBlock = (svc: ServiceDefinition): Block => {
    const sb = makeBlock(ws, "service_block");
    sb.setFieldValue(svc.name, "SERVICE_NAME");
    sb.setFieldValue(svc.type || ServiceType.CONNECTOR_CONSUMER, "SERVICE_TYPE");

    if (svc.base_url) {
      connectValue(sb, "BASE_URL", createValueBlock(svc.base_url));
    }

    if (svc.auth && Object.keys(svc.auth).length > 0) {
      const kvBlocks: Block[] = [];
      for (const [key, value] of Object.entries(svc.auth)) {
        const kvb = makeBlock(ws, "key_value_pair");
        kvb.setFieldValue(key, "KEY");
        connectValue(kvb, "VALUE", createValueBlock(String(value)));
        kvBlocks.push(kvb);
      }
      attachChain(sb, "AUTH", kvBlocks);
    }

    return sb;
  };

  /** Build step blocks from StepDefinitions, grouping consecutive same-service steps into containers */
  const buildStepBlocks = (steps: StepDefinition[]): Block[] => {
    const topBlocks: Block[] = [];
    // Track service containers created in this phase so we can add steps to them
    const activeServiceBlocks = new Map<string, Block>();

    for (const step of steps) {
      // Only create blocks for known step types
      if (!findCatalogEntry(step.type, catalog)) continue;

      const blockType = `step_${step.type}`;
      const sb = makeBlock(ws, blockType);
      sb.setFieldValue(step.name || step.type, "NAME");

      // Set params (skip 'service' — it's handled via the container)
      const entry = findCatalogEntry(step.type, catalog)!;
      for (const p of entry.params) {
        const paramVal = step.params?.[p.name];
        if (paramVal === undefined || paramVal === null) continue;

        if (p.type === "json" && typeof paramVal === "object") {
          const kvBlocks: Block[] = [];
          for (const [key, value] of Object.entries(paramVal as Record<string, unknown>)) {
            const kvb = makeBlock(ws, "key_value_pair");
            kvb.setFieldValue(key, "KEY");
            connectValue(kvb, "VALUE", createValueBlock(String(value)));
            kvBlocks.push(kvb);
          }
          attachChain(sb, `JSON_${p.name.toUpperCase()}`, kvBlocks);
        } else if (p.type === "permission" && Array.isArray(paramVal)) {
          const permBlocks = buildPermissionBlocks(ws, paramVal as unknown[]);
          attachChain(sb, `PERM_${p.name.toUpperCase()}`, permBlocks);
        } else if (p.type === "context" && Array.isArray(paramVal)) {
          const ctxBlocks = buildContextBlocks(ws, paramVal as unknown[]);
          attachChain(sb, `CTX_${p.name.toUpperCase()}`, ctxBlocks);
        } else {
          connectValue(sb, p.name.toUpperCase(), createValueBlock(String(paramVal)));
        }
      }

      // Store in memory
      if (step.store_in_memory) {
        const storeBlocks: Block[] = [];
        for (const [k, v] of Object.entries(step.store_in_memory)) {
          const sob = makeBlock(ws, "store_output");
          sob.setFieldValue(k, "VAR_NAME");
          sob.setFieldValue(v || "$", "JSON_PATH");
          storeBlocks.push(sob);
        }
        attachChain(sb, "STORE", storeBlocks);
      }

      // Failure policy
      if (step.on_failure) {
        sb.setFieldValue(step.on_failure, "FAILURE_POLICY");
      }

      // Assertions
      if (step.expect && step.expect.length > 0) {
        const assertBlocks: Block[] = [];
        for (const a of step.expect) {
          const ab = makeBlock(ws, "assertion");
          ab.setFieldValue(a.type || "STATUS_CODE", "TYPE");
          if (a.path) {
            connectValue(ab, "FIELD", createValueBlock(a.path));
          }
          connectValue(ab, "VALUE", createValueBlock(String(a.value ?? "200")));
          ab.setFieldValue(a.severity || "HARD", "SEVERITY");
          assertBlocks.push(ab);
        }
        attachChain(sb, "EXPECT", assertBlocks);
      }

      // Determine service binding
      const serviceName = step.params?.service as string | undefined;
      if (serviceName && serviceMap.has(serviceName)) {
        // Step belongs to a service — put it inside a service container
        let containerBlock = activeServiceBlocks.get(serviceName);
        if (!containerBlock) {
          // Create the service container block
          containerBlock = createServiceBlock(serviceMap.get(serviceName)!);
          activeServiceBlocks.set(serviceName, containerBlock);
          topBlocks.push(containerBlock);
        }
        // Append step to the service container's STEPS chain
        const stepsInput = containerBlock.getInput("STEPS");
        if (stepsInput?.connection) {
          // Find the last block in the STEPS chain
          let lastInner = stepsInput.connection.targetBlock();
          if (!lastInner) {
            stepsInput.connection.connect(sb.previousConnection!);
          } else {
            while (lastInner.getNextBlock()) {
              lastInner = lastInner.getNextBlock()!;
            }
            lastInner.nextConnection!.connect(sb.previousConnection!);
          }
        }
      } else {
        // No service — add directly to the phase
        topBlocks.push(sb);
      }
    }

    return topBlocks;
  };

  if (script.setup && script.setup.length > 0) {
    attachChain(root, "SETUP", buildStepBlocks(script.setup));
  }
  if (script.steps && script.steps.length > 0) {
    attachChain(root, "STEPS", buildStepBlocks(script.steps));
  }
  if (script.cleanup && script.cleanup.length > 0) {
    attachChain(root, "CLEANUP", buildStepBlocks(script.cleanup));
  }
}

/**
 * Populate a Blockly workspace from a model, creating child blocks
 * and connecting them to the root block's statement inputs.
 */
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

  // Render all blocks after population
  for (const block of ws.getAllBlocks(false)) {
    (block as unknown as { render: () => void }).render();
  }
}

/**
 * Dispose blocks not connected to `root`. Call only during initial workspace
 * load — NOT during incremental syncs (detached blocks should stay on canvas).
 */
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
