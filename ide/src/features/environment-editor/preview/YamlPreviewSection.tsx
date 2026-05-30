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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useMemo, useCallback } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import type { EnvironmentYamlInput } from "./yamlPreview";
import { generateEnvironmentYaml } from "./yamlPreview";
import { defineTractusDarkTheme } from "../../yaml-editor/monacoSetup";

export interface YamlPreviewSectionProps {
  config: EnvironmentYamlInput;
}

export function YamlPreviewSection({ config }: Readonly<YamlPreviewSectionProps>) {
  const yaml = useMemo(() => generateEnvironmentYaml(config), [config]);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    defineTractusDarkTheme(monaco);
  }, []);

  return (
    <div className="yaml-preview">
      <Editor
        height="300px"
        language="yaml"
        theme="tractus-x-dark"
        value={yaml}
        beforeMount={handleBeforeMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          lineNumbers: "off",
          scrollBeyondLastLine: false,
          folding: true,
          wordWrap: "on",
          renderLineHighlight: "none",
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
