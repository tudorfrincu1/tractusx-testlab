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

import { GeneratorPicker } from "./GeneratorPicker";
import { ValueField } from "./ValueField";
import { outputKey } from "./simpleVariableEdits";
import type { SimpleVariable } from "../../model";

export interface SimpleSourceBodyProps {
  variable: SimpleVariable;
  onChange: (next: SimpleVariable) => void;
}

/** Renders the source-specific fields for the active simple-variable mode. */
export function SimpleSourceBody({ variable, onChange }: Readonly<SimpleSourceBodyProps>) {
  if (variable.source === "value") {
    return (
      <label className="vars-field">
        <span className="vars-field__label">Default value</span>
        <ValueField
          type={variable.type}
          value={variable.value}
          placeholder="Fixed value injected before the run"
          onChange={(value) => onChange({ ...variable, value })}
        />
      </label>
    );
  }

  if (variable.source === "input") {
    return (
      <label className="vars-field">
        <span className="vars-field__label">Placeholder</span>
        <ValueField
          type={variable.type}
          value={variable.placeholder ?? ""}
          placeholder="Hint shown to the operator at run start"
          onChange={(placeholder) => onChange({ ...variable, placeholder: placeholder || undefined })}
        />
      </label>
    );
  }

  return (
    <div className="vars-field">
      <span className="vars-field__label">Generator</span>
      <GeneratorPicker
        outputType={outputKey(variable)}
        value={variable.generator}
        onChange={(generator) => onChange({ ...variable, generator })}
      />
    </div>
  );
}
