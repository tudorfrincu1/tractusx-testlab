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

import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import type { GeneratePayload, InputPayload, CheckPayload, ProvidePayload } from "../types";

/** Read-only view of a TestLab-generated value (generate category). */
export function GenerateEditor({ generate }: Readonly<{ generate: GeneratePayload }>) {
  return (
    <div className="precond-editor__group">
      <div className="precond-editor__field-grid">
        <Field label="Generator" value={generate.generator} mono />
        <Field label="Field type" value={generate.fieldType} />
      </div>
      <div className="precond-editor__generated">
        <span className="precond-editor__generated-icon">
          <AutoAwesomeOutlinedIcon fontSize="small" />
        </span>
        <code className="precond-editor__generated-value">{generate.preview}</code>
      </div>
      <p className="precond-editor__hint">Auto-generated at TCK start — shown to the operator, never editable.</p>
    </div>
  );
}

/** Static template the operator copies into their SUT (provide category). */
export function TemplateEditor({ provide }: Readonly<{ provide: ProvidePayload }>) {
  return (
    <div className="precond-editor__group">
      <span className="precond-editor__field-label">Template (JSON)</span>
      <pre className="precond-editor__code-block">{provide.template}</pre>
      <p className="precond-editor__hint">Copy this object into your connector or registry.</p>
    </div>
  );
}

/** Operator-supplied value (input category). */
export function InputEditor({ input }: Readonly<{ input: InputPayload }>) {
  return (
    <div className="precond-editor__group">
      <div className="precond-editor__field-grid">
        <Field label="Label" value={input.label} />
        <Field label="Field type" value={input.fieldType} />
      </div>
      <label className="precond-editor__field-label" htmlFor="poc-input-preview">
        Operator input preview
      </label>
      <input
        id="poc-input-preview"
        className="precond-editor__input"
        placeholder={input.placeholder}
        readOnly
      />
    </div>
  );
}

/** Automated readiness check (check category). */
export function CheckEditor({ check }: Readonly<{ check: CheckPayload }>) {
  return (
    <div className="precond-editor__group">
      <div className="precond-editor__field-grid">
        <Field label="Target" value={check.target} mono />
        <Field label="Expression" value={check.expression} mono />
      </div>
      <p className="precond-editor__hint">Runs before tests start; failure blocks execution.</p>
    </div>
  );
}

function Field({ label, value, mono }: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="precond-editor__field">
      <span className="precond-editor__field-label">{label}</span>
      <span className={mono ? "precond-editor__field-value precond-editor__field-value--mono" : "precond-editor__field-value"}>
        {value}
      </span>
    </div>
  );
}
