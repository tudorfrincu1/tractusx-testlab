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

import type { Workspace } from "blockly";
import { useServiceStore } from "../../../../../store/slices/useServiceStore";
import { useProjectStore } from "../../../../../store/slices/useProjectStore";

/** Collect all mock endpoint IDs defined in the workspace (for Wait block dropdown) */
export function collectMockEndpointIds(workspace: Workspace): Array<[string, string]> {
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
export function collectServiceRefs(_workspace: Workspace, serviceType?: string): Array<[string, string]> {
  const { services } = useServiceStore.getState();
  const filtered = serviceType
    ? services.filter((s) => s.type === serviceType)
    : services;
  const refs: Array<[string, string]> = filtered.map((s) => [s.name, s.name]);
  return refs.length > 0 ? refs : [["(no services configured)", "__NONE__"]];
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
export function dynamicDropdown(
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
      const label = currentVal.includes("/")
        ? currentVal.replace(/^.*\//, "").replace(/\.json$/, "")
        : currentVal;
      options.unshift([label, currentVal]);
    }
    return options;
  };
}
