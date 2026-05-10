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

import type { Block, Workspace } from "blockly";
import type { Step, StepDefinition, ScriptDefinition } from "../../../models/schema";
import { isTemplateStep } from "../../../models/schema";
import { useServiceStore } from "../../../store/useServiceStore";
import { findCatalogEntry, type BlockCatalog } from "../blocks/catalogLoader";
import {
  makeBlock,
  setDropdownValue,
  attachChain,
  connectValue,
  createValueBlockFromString,
} from "./helpers";

export function populateTest(ws: Workspace, root: Block, script: ScriptDefinition, catalog: BlockCatalog) {
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

      if (step.type === "import_variable" && step.params?.file) {
        const ib = makeBlock(ws, "import_variable");
        setDropdownValue(ib, "FILE", String(step.params.file));
        if (step.params.export) {
          setDropdownValue(ib, "EXPORT_VAR", String(step.params.export));
        } else if (Array.isArray(step.params.outputs) && step.params.outputs.length > 0) {
          setDropdownValue(ib, "EXPORT_VAR", String(step.params.outputs[0]));
        }
        const varName = step.params.variable || step.params.export || "imported_var";
        ib.setFieldValue(String(varName), "OUTPUT_VAR");
        blocks.push(ib);
        continue;
      }

      if (step.type === "export_variable" && step.params?.name) {
        const eb = makeBlock(ws, "export_variable");
        setDropdownValue(eb, "VAR_NAME", String(step.params.name));
        blocks.push(eb);
        continue;
      }

      if (step.type === "load_schema" && step.params?.source === "file" && step.params?.path) {
        const sb = makeBlock(ws, "schema_import");
        setDropdownValue(sb, "SCHEMA_PATH", String(step.params.path));
        sb.setFieldValue(String(step.params.name || "schema_var"), "OUTPUT_SCHEMA");
        blocks.push(sb);
        continue;
      }

      const entry = findCatalogEntry(step.type, catalog);
      if (!entry) continue;

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
}
