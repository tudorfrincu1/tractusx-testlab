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

import type { FieldDropdown, Workspace } from "blockly";
import { useServiceStore } from "@/store";
import { useProjectStore } from "@/store";
import type { BlockCatalog } from "../catalog/catalogLoader";
import type { TypedVariable } from "../catalog/variables/typedVariableCollection";
import { collectTypedUpstreamVariables, collectTypedWorkspaceVariables } from "../catalog/variables/typedVariableCollection";

/** Collect all mock endpoint IDs defined in the workspace (for Wait block dropdown) */
export function collectMockEndpointIds(workspace: Workspace): Array<[string, string]> {
  const ids: Array<[string, string]> = [];
  for (const block of workspace.getAllBlocks(false)) {
    if (block.type.startsWith("step_mock_")) {
      // id param is a value input (not a field) — read the connected block
      const idInput = block.getInput("PARAM_ID");
      const connectedBlock = idInput?.connection?.targetBlock() ?? null;
      let id: string | undefined;
      if (connectedBlock) {
        if (connectedBlock.type === "value_string") {
          id = connectedBlock.getFieldValue("VALUE") || undefined;
        } else if (connectedBlock.type.startsWith("var_")) {
          id = connectedBlock.getFieldValue("VAR_NAME") || undefined;
        }
      }
      if (id) ids.push([id, id]);
    }
  }
  if (ids.length === 0) return [["(no mock endpoints)", "__NONE__"]];
  return ids;
}

/** Collect policy precondition block references from the workspace */
export function collectPreconditionRefs(workspace: Workspace): Array<[string, string]> {
  const refs: Array<[string, string]> = [];
  for (const block of workspace.getAllBlocks(false)) {
    if (block.type === "step_precondition_policy_config") {
      const description = block.getFieldValue("PARAM_DESCRIPTION") || block.getFieldValue("DESCRIPTION") || "";
      const blockId = block.id;
      const label = description || `Policy Precondition (${blockId.slice(0, 6)})`;
      refs.push([label, blockId]);
    }
  }
  return refs.length > 0 ? refs : [["(no policy preconditions)", "__NONE__"]];
}

/** Collect schema variable names from `schema_import` blocks in the workspace */
export function collectSchemaVariables(workspace: Workspace): Array<[string, string]> {
  const vars: Array<[string, string]> = [];
  for (const block of workspace.getAllBlocks(false)) {
    if (block.type === "schema_import") {
      const varName = block.getFieldValue("OUTPUT_SCHEMA");
      if (varName) vars.push([varName, varName]);
    }
  }
  if (vars.length === 0) return [["(no schemas loaded)", "__NONE__"]];
  return vars;
}

/** Collect schema file names from the project store as dropdown options (value = relative path). */
export function collectSchemaPaths(): Array<[string, string]> {
  const names = useProjectStore.getState().getSchemaNames();
  if (names.length === 0) return [["(no schemas in project)", "__NONE__"]];
  return names.map((name): [string, string] => [name, `../schemas/${name}.json`]);
}

/** Collect testdata file names from the project store as dropdown options (value = relative path). */
export function collectTestdataPaths(): Array<[string, string]> {
  const names = [...useProjectStore.getState().testdata.keys()];
  if (names.length === 0) return [["(no testdata in project)", "__NONE__"]];
  return names.map((name): [string, string] => [name, `testdata/${name}.json`]);
}

export function collectTestFilePaths(): Array<[string, string]> {
  const { getTestNames, activeFile } = useProjectStore.getState();
  const names = getTestNames().filter(
    (n) => !(activeFile?.type === "test" && activeFile.name === n),
  );
  if (names.length === 0) return [["(no other tests)", "__NONE__"]];
  return names.map((name): [string, string] => [name, `tests/${name}.yaml`]);
}

export function collectExportedVariables(filePath: string): Array<[string, string]> {
  if (!filePath || filePath === "__NONE__") return [["(select a test first)", "__NONE__"]];
  const testName = filePath.replace(/^tests\//, "").replace(/\.yaml$/, "");
  const { tests } = useProjectStore.getState();
  const script = tests.get(testName);
  if (!script) return [["(no exports found)", "__NONE__"]];
  const exports: string[] = [];
  for (const step of script.teardown ?? []) {
    if ("uses" in step && step.uses === "export_variable" && step.with?.name) {
      exports.push(String(step.with.name));
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
export function dynamicDropdown(
  provider: (ws: Workspace) => Array<[string, string]>,
  fallbackLabel = "—",
): (this: FieldDropdown) => Array<[string, string]> {
  return function (this: FieldDropdown): Array<[string, string]> {
    const block = this.getSourceBlock?.();
    const rawWs = block?.workspace;
    const targetWs = rawWs ? (rawWs as unknown as { targetWorkspace?: Workspace }).targetWorkspace : undefined;
    if (!rawWs || rawWs.disposed || (rawWs.isClearing && !targetWs)) {
      const cur = this.getValue?.() ?? "";
      if (cur && cur !== "__NONE__") return [[cur, cur]];
      // Schedule retry — block may not be attached yet
      setTimeout(() => {
        const blk = this.getSourceBlock?.();
        if (!blk || blk.disposed) return;
        const self = this as unknown as { menuOptions_: Array<[string, string]> | null };
        self.menuOptions_ = null;
        const fresh = this.getOptions(false);
        if (fresh.length > 0 && fresh[0][1] !== "__NONE__") {
          self.menuOptions_ = fresh;
          this.setValue(fresh[0][1]);
        }
      }, 100);
      return [[fallbackLabel, "__NONE__"]];
    }
    // If block is in a flyout, use the target (main) workspace for variable collection
    const ws = targetWs ?? rawWs;
    const options = provider(ws);
    const currentVal = this.getValue?.() ?? "";
    if (
      currentVal &&
      currentVal !== "__NONE__" &&
      !options.some(([, val]: [string, string]) => val === currentVal)
    ) {
      const label = currentVal.includes("/")
        ? currentVal.replace(/^.*\//, "").replace(/\.json$/, "")
        : currentVal;
      options.unshift([label, currentVal]);
    }
    // After block is fully attached, refresh display if showing placeholder
    if (!currentVal || currentVal === "__NONE__") {
      setTimeout(() => {
        const blk = this.getSourceBlock?.();
        if (!blk || blk.disposed) return;
        const self = this as unknown as { menuOptions_: Array<[string, string]> | null };
        self.menuOptions_ = null;
        const fresh = this.getOptions(false);
        if (fresh.length > 0 && fresh[0][1] !== "__NONE__") {
          self.menuOptions_ = fresh;
          this.setValue(fresh[0][1]);
        }
      }, 100);
    }
    return options;
  };
}

const SEPARATOR_OPTION: [string, string] = ["─────────────", "__SEP__"];

/**
 * Creates a dynamic dropdown that filters variables by class compatibility.
 * Compatible variables appear first, then a separator, then incompatible ones with ⚠️ prefix.
 * When `accepts` is undefined, shows all variables (backward compatible).
 */
export function typedVariableDropdown(
  catalog: BlockCatalog,
  accepts?: string[],
): (this: FieldDropdown) => Array<[string, string]> {
  return function (this: FieldDropdown): Array<[string, string]> {
    const block = this.getSourceBlock?.();
    const rawWs = block?.workspace;
    if (!rawWs || rawWs.isClearing || rawWs.disposed) {
      const cur = this.getValue?.() ?? "";
      if (cur && cur !== "__NONE__" && cur !== "__SEP__") return [[cur, cur]];
      return [["(no variables)", "__NONE__"]];
    }
    // If block is in a flyout, use the target (main) workspace for variable collection
    const ws = (rawWs as unknown as { targetWorkspace?: Workspace }).targetWorkspace ?? rawWs;

    const typedVars: TypedVariable[] = block
      ? collectTypedUpstreamVariables(block, catalog)
      : collectTypedWorkspaceVariables(ws, catalog);

    if (typedVars.length === 0) {
      return [["(no variables)", "__NONE__"]];
    }

    if (!accepts || accepts.length === 0) {
      return typedVars.map((v): [string, string] => [v.name, v.name]);
    }

    const acceptSet = new Set(accepts);
    const compatible: Array<[string, string]> = [];
    const incompatible: Array<[string, string]> = [];

    for (const v of typedVars) {
      if (acceptSet.has(v.class)) {
        compatible.push([v.name, v.name]);
      } else {
        incompatible.push([`[!] ${v.name} (${v.class})`, v.name]);
      }
    }

    const options: Array<[string, string]> = [];
    if (compatible.length > 0) {
      options.push(...compatible);
    }
    if (incompatible.length > 0) {
      if (compatible.length > 0) {
        options.push(SEPARATOR_OPTION);
      }
      options.push(...incompatible);
    }

    if (options.length === 0) {
      return [["(no variables)", "__NONE__"]];
    }

    // Preserve current value if it's not in the options
    const currentVal = this.getValue?.() ?? "";
    if (
      currentVal &&
      currentVal !== "__NONE__" &&
      currentVal !== "__SEP__" &&
      !options.some(([, val]) => val === currentVal)
    ) {
      options.unshift([currentVal, currentVal]);
    }

    return options;
  };
}
