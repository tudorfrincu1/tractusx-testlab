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

import { CopyButton } from "@/features/complex-variable-builder";
import { useGeneratorCatalog } from "../catalog";
import type { Variable } from "../model";
import { knownValueText } from "./valuePreview";

export interface RunVariableRowProps {
  variable: Variable;
  /** The bucket this row belongs to, selecting which preview/affordance shows. */
  bucket: "requested" | "known" | "generated";
}

/** A single run-configuration row: name, type and a bucket-specific preview. */
export function RunVariableRow({ variable, bucket }: Readonly<RunVariableRowProps>) {
  return (
    <li className="vars-run__row">
      <div className="vars-run__row-head">
        <code className="vars-run__name">{variable.name}</code>
        <span className="vars-run__type">{variableTypeLabel(variable)}</span>
      </div>
      <RowBody variable={variable} bucket={bucket} />
    </li>
  );
}

function RowBody({ variable, bucket }: Readonly<RunVariableRowProps>) {
  if (bucket === "requested") {
    return <p className="vars-run__hint">{requestedHint(variable)}</p>;
  }
  if (bucket === "generated") {
    return <GeneratedPreview variable={variable} />;
  }
  return <KnownPreview variable={variable} />;
}

/** The hint shown for a REQUEST variable: its placeholder, then description. */
function requestedHint(variable: Variable): string {
  if (variable.kind === "simple" && variable.source === "input" && variable.placeholder) {
    return variable.placeholder;
  }
  return variable.description ?? "Supplied by the operator at run start.";
}

function KnownPreview({ variable }: Readonly<{ variable: Variable }>) {
  const text = knownValueText(variable);
  const isJson = variable.kind === "complex";
  return (
    <div className="vars-run__value">
      {isJson ? (
        <pre className="vars-run__code">{text}</pre>
      ) : (
        <code className="vars-run__inline">{text || "—"}</code>
      )}
      {text && <CopyButton text={text} />}
    </div>
  );
}

function GeneratedPreview({ variable }: Readonly<{ variable: Variable }>) {
  const { generators } = useGeneratorCatalog();
  if (variable.kind !== "simple" || variable.source !== "generated") {
    return null;
  }
  const generator = generators.find((entry) => entry.id === variable.generator);
  return (
    <p className="vars-run__hint">
      Produced by <strong>{generator?.label ?? variable.generator}</strong> →{" "}
      <code className="vars-run__inline">{generator?.output_type ?? variable.type}</code>
    </p>
  );
}

function variableTypeLabel(variable: Variable): string {
  return variable.type;
}
