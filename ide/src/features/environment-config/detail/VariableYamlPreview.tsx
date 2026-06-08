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

import { useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CopyButton } from "@/features/complex-variable-builder";
import { buildVariableYaml } from "../yaml";
import type { Variable } from "../model";

export interface VariableYamlPreviewProps {
  variable: Variable;
}

/**
 * The single YAML preview for the variables manager. It serializes the selected
 * variable in the ADR-0018 v2 VARIABLE shape (never a `config/connector/policy`
 * step) and is referenced elsewhere with `@name`. Collapsed on first render.
 */
export function VariableYamlPreview({ variable }: Readonly<VariableYamlPreviewProps>) {
  const [open, setOpen] = useState(false);
  const yaml = useMemo(() => buildVariableYaml(variable), [variable]);

  return (
    <section className="vars-yaml">
      <button
        type="button"
        className="vars-yaml__head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ExpandMoreIcon className={chevronClass(open)} fontSize="small" />
        <span className="vars-yaml__title">Variable YAML</span>
        <span className="vars-yaml__ref">{variable.name}</span>
      </button>
      {open && (
        <div className="vars-yaml__body">
          <div className="vars-yaml__bar">
            <span className="vars-yaml__hint">referenced as {variable.name}</span>
            <CopyButton text={yaml} />
          </div>
          <pre className="vars-yaml__code">{yaml}</pre>
        </div>
      )}
    </section>
  );
}

function chevronClass(open: boolean): string {
  return open ? "vars-yaml__chevron vars-yaml__chevron--open" : "vars-yaml__chevron";
}
