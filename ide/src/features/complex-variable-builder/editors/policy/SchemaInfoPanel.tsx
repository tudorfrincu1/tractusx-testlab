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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  VERSION_SCHEMAS,
  getConstraintsForContext,
} from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import type { PolicyType, PolicyVersion } from "../../model";

export interface SchemaInfoPanelProps {
  version: PolicyVersion;
  policyType: PolicyType;
}

/** Collapsible read-only summary of the active schema's capabilities. */
export function SchemaInfoPanel({ version, policyType }: Readonly<SchemaInfoPanelProps>) {
  const [open, setOpen] = useState(false);
  const schema = VERSION_SCHEMAS[version];
  const permissions = getConstraintsForContext(version, policyType, "permission");
  const leftOperands = Object.keys(permissions);
  const operators = collectOperators(permissions);

  return (
    <section className={panelClass(open)}>
      <button type="button" className="precond-policy__info-head" onClick={() => setOpen((value) => !value)}>
        <ExpandMoreIcon className="precond-policy__info-chevron" fontSize="small" />
        <span>Schema reference — {schema.label}</span>
      </button>
      {open && (
        <dl className="precond-policy__info-grid">
          <InfoRow label="Description" value={schema.description} />
          <InfoRow label="Allowed actions" value={schema.allowedActions[policyType].join(", ")} />
          <InfoRow label="Allowed operators" value={operators.join(", ")} />
          <InfoRow label="Left operands" value={leftOperands.join(", ") || "—"} />
          <SupportRow label="Prohibitions" supported={schema.supportsProhibitions} />
          <SupportRow label="Obligations" supported={schema.supportsObligations} />
        </dl>
      )}
    </section>
  );
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <>
      <dt className="precond-policy__info-label">{label}</dt>
      <dd className="precond-policy__info-value">{value}</dd>
    </>
  );
}

function SupportRow({ label, supported }: Readonly<{ label: string; supported: boolean }>) {
  const className = supported
    ? "precond-policy__info-value precond-policy__info-value--ok"
    : "precond-policy__info-value precond-policy__info-value--off";
  return (
    <>
      <dt className="precond-policy__info-label">{label}</dt>
      <dd className={className}>{supported ? "Supported" : "Not supported"}</dd>
    </>
  );
}

function collectOperators(registry: ReturnType<typeof getConstraintsForContext>): string[] {
  const operators = new Set<string>();
  for (const def of Object.values(registry)) {
    for (const operator of def.operators) operators.add(operator);
  }
  return [...operators];
}

function panelClass(open: boolean): string {
  return open ? "precond-policy__info precond-policy__info--open" : "precond-policy__info";
}
