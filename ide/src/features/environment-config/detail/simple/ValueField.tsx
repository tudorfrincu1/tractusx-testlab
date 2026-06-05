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

import type { SimpleVarType } from "../../model";

export interface ValueFieldProps {
  /** The primitive type that decides which input widget renders. */
  type: SimpleVarType;
  /** The value as stored in the model (always a string). */
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
}

/** Matches an integer-shaped prefix: optional leading minus, then digits. */
const INTEGER_PREFIX = /^-?\d*/;

/** The two boolean choices, rendered as a true/false toggle. */
const BOOL_CHOICES = ["true", "false"] as const;

/** Keeps only an integer-shaped string (optional leading minus, digits). */
function coerceInteger(raw: string): string {
  const match = INTEGER_PREFIX.exec(raw);
  return match ? match[0] : "";
}

/**
 * The ONE place that maps a primitive variable type to its input widget. Every
 * value-bearing field (the `value` source and the `input` default) renders
 * through here, so a type always gets the same type-appropriate control:
 * `str` text, `int`/`float` number inputs, `bool` a true/false toggle.
 */
export function ValueField({ type, value, placeholder, onChange }: Readonly<ValueFieldProps>) {
  if (type === "bool") {
    const current = value === "true" ? "true" : "false";
    return (
      <fieldset className="vars-bool" aria-label="Boolean value">
        {BOOL_CHOICES.map((choice) => {
          const active = choice === current;
          return (
            <button
              key={choice}
              type="button"
              className={active ? "vars-bool__seg vars-bool__seg--active" : "vars-bool__seg"}
              aria-pressed={active}
              onClick={() => onChange(choice)}
            >
              {choice}
            </button>
          );
        })}
      </fieldset>
    );
  }

  if (type === "int") {
    return (
      <input
        className="vars-field__input"
        type="number"
        step={1}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(coerceInteger(event.target.value))}
      />
    );
  }

  if (type === "float") {
    return (
      <input
        className="vars-field__input"
        type="number"
        step="any"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      className="vars-field__input"
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
