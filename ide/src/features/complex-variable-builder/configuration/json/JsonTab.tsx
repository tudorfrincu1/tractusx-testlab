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

import { CopyButton } from "../header/CopyButton";
import { JsonEditor } from "./JsonEditor";
import { JsonLockControls } from "./JsonLockControls";
import { MustExistCallout } from "../callouts/MustExistCallout";
import { useJsonLock } from "./useJsonLock";

export interface JsonTabProps {
  /** Initial JSON text, seeded once from the source-of-truth object. */
  sourceText: string;
  /** Validates the current draft, returning an inline error or null. */
  validate?: (text: string) => string | null;
  /** Receives every keystroke so the host can re-hydrate its object. */
  onCommit?: (text: string) => void;
  /** Show the twin "Must exist with these IDs" callout below the editor. */
  showAssetIds: boolean;
  /** Label above the editor. Defaults to the operator-facing "Resolved JSON". */
  label?: string;
  /**
   * Render the column as a copy-only output. The form/template remains the
   * single editable source of truth and this text is regenerated from it, so
   * the operator copies — but never edits — the resolved document.
   */
  readOnly?: boolean;
  /**
   * Applies hand-edited JSON back to the host object. Providing this on a
   * {@link readOnly} column turns it into a lockable output: an "Edit" button
   * unlocks the textarea, and "Apply" hands the edited text to this callback.
   */
  onApply?: (text: string) => void;
}

/**
 * Owns the editable JSON draft for one Configuration item. The draft is the
 * live text the operator copies; the host decides how a committed draft maps
 * back onto the single source object (parse-on-valid vs. store-raw).
 *
 * A plain `readOnly` column is copy-only. A `readOnly` column WITH `onApply`
 * becomes lockable: it stays output-only until the operator clicks "Edit",
 * then accepts manual edits and reconciles them via `onApply` on "Apply".
 */
export function JsonTab({
  sourceText,
  validate,
  onCommit,
  showAssetIds,
  label,
  readOnly,
  onApply,
}: Readonly<JsonTabProps>) {
  const lock = useJsonLock({ sourceText, onCommit, onApply });
  const lockable = readOnly === true && typeof onApply === "function";
  const isEditable = !readOnly || (lockable && lock.isUnlocked);
  const error = isEditable ? validate?.(lock.draft) ?? null : null;

  return (
    <div className="precond-json">
      <div className="precond-json__bar">
        <span className="precond-json__label">{label ?? "Resolved JSON"}</span>
        {lockable ? (
          <JsonLockControls
            copyText={lock.draft}
            isUnlocked={lock.isUnlocked}
            onEdit={lock.beginEdit}
            onCancel={lock.cancelEdit}
            onApply={lock.applyEdit}
          />
        ) : (
          <CopyButton text={lock.draft} />
        )}
      </div>
      <JsonEditor
        value={lock.draft}
        error={error}
        onChange={lock.handleChange}
        onFocus={lock.handleFocus}
        onBlur={lock.handleBlur}
        readOnly={!isEditable}
      />
      {showAssetIds && <MustExistCallout template={lock.draft} />}
    </div>
  );
}
