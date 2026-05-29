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

import { useState } from "react";
import type { PreconditionDefinition } from "@/models/schema";

export interface PreconditionEditorProps {
  precondition: PreconditionDefinition;
  onChange: (updated: PreconditionDefinition) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function preconditionToYaml(p: PreconditionDefinition): string {
  const ind = (n: number) => "  ".repeat(n);
  let yaml = `- id: ${p.id}\n  uses: ${p.uses}\n  name: ${p.name}\n`;
  if (p.with && Object.keys(p.with).length > 0) {
    yaml += `  with:\n`;
    for (const [k, v] of Object.entries(p.with)) {
      yaml += `${ind(2)}${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}\n`;
    }
  }
  if (p.returns && Object.keys(p.returns).length > 0) {
    yaml += `  returns:\n`;
    for (const [k, field] of Object.entries(p.returns)) {
      yaml += `${ind(2)}${k}:\n${ind(3)}type: ${field.type}\n`;
      if (field.class) yaml += `${ind(3)}class: ${field.class}\n`;
      if (field.generator) yaml += `${ind(3)}generator: ${field.generator}\n`;
    }
  }
  if (p.validate && p.validate.length > 0) {
    yaml += `  validate:\n`;
    for (const v of p.validate) {
      yaml += `${ind(2)}- uses: ${v.uses}\n`;
      if (Object.keys(v.with).length > 0) {
        yaml += `${ind(3)}with:\n`;
        for (const [wk, wv] of Object.entries(v.with)) {
          yaml += `${ind(4)}${wk}: ${typeof wv === "object" ? JSON.stringify(wv) : String(wv)}\n`;
        }
      }
    }
  }
  return yaml;
}

export function PreconditionEditor({ precondition, onChange, onDelete, onDuplicate }: Readonly<PreconditionEditorProps>) {
  const [yamlOpen, setYamlOpen] = useState(false);

  const updateWithField = (key: string, value: string) => {
    const currentWith = precondition.with ?? {};
    onChange({ ...precondition, with: { ...currentWith, [key]: value } });
  };

  return (
    <div className="preconditions-right">
      <div className="preconditions-detail__header">
        <input
          className="preconditions-detail__id-input"
          value={precondition.name}
          onChange={(e) => onChange({ ...precondition, name: e.target.value })}
        />
        <div className="preconditions-detail__actions">
          <button className="preconditions-topbar__back" onClick={onDuplicate} title="Duplicate">⧉</button>
          <button className="preconditions-topbar__back" onClick={onDelete} title="Delete">×</button>
        </div>
      </div>

      <div className="preconditions-detail__badges">
        <span className="preconditions-detail__badge preconditions-detail__badge--policy">{precondition.uses}</span>
      </div>

      <div className="preconditions-config">
        <div className="preconditions-config__title">Configuration</div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">ID</label>
          <input
            className="preconditions-field__input"
            value={precondition.id}
            onChange={(e) => onChange({ ...precondition, id: e.target.value })}
          />
        </div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Uses</label>
          <input className="preconditions-field__input" value={precondition.uses} readOnly />
        </div>

        {precondition.with && Object.keys(precondition.with).length > 0 && (
          <>
            <div className="preconditions-config__title">Parameters</div>
            {Object.entries(precondition.with).map(([key, val]) => (
              <div key={key} className="preconditions-field">
                <label className="preconditions-field__label">{key}</label>
                <input
                  className="preconditions-field__input"
                  value={typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}
                  onChange={(e) => updateWithField(key, e.target.value)}
                />
              </div>
            ))}
          </>
        )}

        {precondition.returns && Object.keys(precondition.returns).length > 0 && (
          <>
            <div className="preconditions-config__title">Returns</div>
            {Object.entries(precondition.returns).map(([key, field]) => (
              <div key={key} className="preconditions-field">
                <label className="preconditions-field__label">{key}</label>
                <input className="preconditions-field__input" value={`${field.type}${field.class ? ` (${field.class})` : ""}`} readOnly />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="preconditions-preview">
        <div
          className="preconditions-preview__header"
          onClick={() => setYamlOpen(!yamlOpen)}
          onKeyDown={(e) => e.key === "Enter" && setYamlOpen(!yamlOpen)}
          role="button"
          tabIndex={0}
        >
          <span>YAML Preview</span>
          <span>{yamlOpen ? "▲" : "▼"}</span>
        </div>
        {yamlOpen && <div className="preconditions-preview__body">{preconditionToYaml(precondition)}</div>}
      </div>
    </div>
  );
}
