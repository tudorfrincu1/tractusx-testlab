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

import { useState } from "react";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { findGenerator } from "./generators";

export interface GeneratorDetailProps {
  generatorId: string;
}

/** Strips characters that are invalid in a `@variable` reference. */
function sanitizeVar(raw: string): string {
  return raw.trim().replace(/\W/g, "_");
}

/** L3 for Generate: name the output and preview the resulting typed variable. */
export function GeneratorDetail({ generatorId }: Readonly<GeneratorDetailProps>) {
  const generator = findGenerator(generatorId);
  const [name, setName] = useState(generator?.defaultVar ?? "my_value");

  if (!generator) {
    return <p className="precond-poc__empty">Unknown generator.</p>;
  }

  const variableName = sanitizeVar(name) || generator.defaultVar;

  return (
    <article className="precond-detail">
      <header className="precond-detail__header">
        <span className="precond-detail__id-static">
          <generator.Icon fontSize="inherit" />
          {generator.label}
        </span>
        <span className="precond-detail__badge precond-detail__badge--generate">
          {generator.outputClass}
        </span>
      </header>
      <p className="precond-detail__desc">{generator.description}</p>

      <div className="precond-editor__group">
        <label className="precond-editor__field-label" htmlFor="poc-gen-varname">
          Variable name
        </label>
        <div className="precond-var-input">
          <span className="precond-var-input__at">@</span>
          <input
            id="poc-gen-varname"
            className="precond-editor__input precond-var-input__field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={generator.defaultVar}
          />
        </div>
        <p className="precond-editor__hint">
          Reuse this value elsewhere with the variable below.
        </p>
        <div className="precond-editor__generated">
          <span className="precond-editor__generated-icon">
            <AutoAwesomeOutlinedIcon fontSize="small" />
          </span>
          <code className="precond-editor__generated-value">
            @{variableName} : {generator.outputClass}
          </code>
        </div>
      </div>
    </article>
  );
}
