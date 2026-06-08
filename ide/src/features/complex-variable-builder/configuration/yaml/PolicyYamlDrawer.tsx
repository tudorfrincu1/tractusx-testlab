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

// Collapsed-by-default disclosure beneath the side-by-side authoring. It shows
// the canonical `config/connector/policy` variable YAML this policy contributes to the
// test config — the testlab authoring layer, distinct from the standalone EDC
// ODRL JSON the operator copies above. Reuses the existing policy YAML builder.
import { useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CopyButton } from "../header/CopyButton";
import { buildPolicyYaml } from "../../editors/yaml";
import type { YamlLine } from "../../editors/yaml";
import type { PolicyPayload } from "../../model";

export interface PolicyYamlDrawerProps {
  id: string;
  name: string;
  policy: PolicyPayload;
}

/** Expandable step-YAML drawer with a copy affordance; closed on first render. */
export function PolicyYamlDrawer({ id, name, policy }: Readonly<PolicyYamlDrawerProps>) {
  const [open, setOpen] = useState(false);
  const result = useMemo(() => buildPolicyYaml(id, name, policy), [id, name, policy]);
  const plainText = useMemo(() => linesToText(result.lines), [result.lines]);

  return (
    <section className="precond-yaml-drawer">
      <button
        type="button"
        className="precond-yaml-drawer__head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ExpandMoreIcon className={chevronClass(open)} fontSize="small" />
        <span className="precond-yaml-drawer__title">YAML added to the configuration</span>
      </button>
      {open && (
        <div className="precond-yaml-drawer__body">
          <div className="precond-yaml-drawer__bar">
            <span className="precond-yaml-drawer__hint">config/connector/policy variable</span>
            <CopyButton text={plainText} />
          </div>
          <pre className="precond-yaml-drawer__code">
            {result.lines.map((line) => (
              <div className="precond-yaml-drawer__line" key={line.id}>
                {line.tokens.map((token) => (
                  <span key={token.id} className={`precond-policy__yaml-${token.kind}`}>
                    {token.text}
                  </span>
                ))}
              </div>
            ))}
          </pre>
        </div>
      )}
    </section>
  );
}

function chevronClass(open: boolean): string {
  return open
    ? "precond-yaml-drawer__chevron precond-yaml-drawer__chevron--open"
    : "precond-yaml-drawer__chevron";
}

function linesToText(lines: readonly YamlLine[]): string {
  return lines.map((line) => line.tokens.map((token) => token.text).join("")).join("\n");
}
