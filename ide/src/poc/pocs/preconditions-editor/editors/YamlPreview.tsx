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
import type { PolicyPayload } from "../types";
import { buildPolicyYaml } from "./policyYaml";

export interface YamlPreviewProps {
  id: string;
  policy: PolicyPayload;
}

/** Collapsible, colour-tokenised YAML preview of the policy under edit. */
export function YamlPreview({ id, policy }: Readonly<YamlPreviewProps>) {
  const [open, setOpen] = useState(true);
  const result = useMemo(() => buildPolicyYaml(id, policy), [id, policy]);

  return (
    <section className="precond-policy__yaml">
      <button type="button" className="precond-policy__yaml-head" onClick={() => setOpen((value) => !value)}>
        <ExpandMoreIcon className="precond-policy__info-chevron" fontSize="small" />
        <span>YAML preview</span>
        <span className={badgeClass(result.valid)}>{result.valid ? "Valid" : "Needs attention"}</span>
      </button>
      {open && (
        <pre className="precond-policy__yaml-body">
          {result.lines.map((line) => (
            <div className="precond-policy__yaml-line" key={line.id}>
              {line.tokens.map((token) => (
                <span key={token.id} className={`precond-policy__yaml-${token.kind}`}>
                  {token.text}
                </span>
              ))}
            </div>
          ))}
        </pre>
      )}
    </section>
  );
}

function badgeClass(valid: boolean): string {
  return valid
    ? "precond-policy__yaml-badge precond-policy__yaml-badge--ok"
    : "precond-policy__yaml-badge precond-policy__yaml-badge--warn";
}
