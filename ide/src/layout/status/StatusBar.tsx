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

import { useEditorStore } from "@/store";
import { useProjectStore } from "@/store";
import { isTest, isTck } from "@/models/schema";

import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmber from "@mui/icons-material/WarningAmber";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import Science from "@mui/icons-material/Science";
import { useSaveIndicator } from "./useSaveIndicator";

function formatFileName(file: { type: string; name: string }): string {
  if (file.type === "tck") return "index.yaml";
  if (file.type === "schema") return `schemas / ${file.name}.json`;
  return `tests / ${file.name}.yaml`;
}

export function StatusBar() {
  const errors = useEditorStore((s) => s.errors);
  const toggleValidation = useEditorStore((s) => s.toggleValidation);
  const showValidation = useEditorStore((s) => s.showValidation);
  const model = useEditorStore((s) => s.model);
  const activeFile = useProjectStore((s) => s.activeFile);
  const projectName = useProjectStore((s) => s.projectName);
  const isDirty = useProjectStore((s) => s.isDirty);
  const isSaveVisible = useSaveIndicator();

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  const stepCount = isTest(model)
    ? (model.setup?.length ?? 0) +
      (model.steps?.length ?? 0) +
      (model.teardown?.length ?? 0)
    : 0;

  const testCount = isTck(model)
    ? model.tests.length
    : 0;

  const toggleClassName = [
    "statusbar__issues-toggle",
    showValidation ? "statusbar__issues-toggle--active" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="statusbar">
      <div className="statusbar__left">
        <button
          type="button"
          onClick={toggleValidation}
          title={showValidation ? "Hide Issues Panel" : "Show Issues Panel"}
          className={toggleClassName}
        >
          {errorCount > 0 && (
            <span className="statusbar__badge statusbar__badge--error">
              <ErrorOutlined sx={{ fontSize: 13 }} />
              {errorCount} error{errorCount === 1 ? "" : "s"}
            </span>
          )}
          {warningCount > 0 && (
            <span className="statusbar__badge statusbar__badge--warning">
              <WarningAmber sx={{ fontSize: 13 }} />
              {warningCount} warning{warningCount === 1 ? "" : "s"}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <span className="statusbar__badge statusbar__badge--success">
              <CheckCircleOutlined sx={{ fontSize: 13 }} />
              No issues
            </span>
          )}
        </button>
        {isTest(model) && (
          <span>{stepCount} step{stepCount === 1 ? "" : "s"}</span>
        )}
        {isTck(model) && (
          <span>{testCount} test{testCount === 1 ? "" : "s"}</span>
        )}
      </div>
      <div className="statusbar__right">
        {isSaveVisible && (
          <span className="statusbar__saved">Saved</span>
        )}
        {activeFile && (
          <span className={isDirty(activeFile.name) ? "statusbar__file--dirty" : ""}>
            {projectName} / {formatFileName(activeFile)}
            {isDirty(activeFile.name) ? " •" : ""}
          </span>
        )}
        <span className="statusbar__branding">
          <Science sx={{ fontSize: 12 }} />
          Tractus-X TestLab IDE
        </span>
      </div>
    </div>
  );
}

