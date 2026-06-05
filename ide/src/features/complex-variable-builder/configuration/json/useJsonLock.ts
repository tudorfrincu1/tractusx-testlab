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

// Owns the editable JSON draft for the side-by-side Configuration column and,
// when the column is a locked output, the unlock/apply/cancel flow. The draft
// re-seeds from the source-of-truth text whenever the host regenerates it —
// but never while the operator is actively editing (focused or unlocked), so
// their in-progress text is never reformatted out from under them.
import { useState } from "react";

export interface UseJsonLockArgs {
  /** Source-of-truth text the host regenerates from its object. */
  sourceText: string;
  /** Receives every keystroke (live-edit columns); omitted for locked columns. */
  onCommit?: (text: string) => void;
  /** Applies the unlocked draft back to the host object on "Apply". */
  onApply?: (text: string) => void;
}

export interface JsonLockState {
  draft: string;
  isUnlocked: boolean;
  handleChange: (text: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  beginEdit: () => void;
  cancelEdit: () => void;
  applyEdit: () => void;
}

export function useJsonLock({ sourceText, onCommit, onApply }: UseJsonLockArgs): JsonLockState {
  const [draft, setDraft] = useState(sourceText);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lastSource, setLastSource] = useState(sourceText);

  if (sourceText !== lastSource) {
    setLastSource(sourceText);
    if (!isUnlocked && !isFocused && sourceText !== draft) {
      setDraft(sourceText);
    }
  }

  const handleChange = (text: string) => {
    setDraft(text);
    onCommit?.(text);
  };

  const beginEdit = () => setIsUnlocked(true);

  const cancelEdit = () => {
    setDraft(sourceText);
    setIsUnlocked(false);
    setIsFocused(false);
  };

  const applyEdit = () => {
    onApply?.(draft);
    setIsUnlocked(false);
    setIsFocused(false);
  };

  return {
    draft,
    isUnlocked,
    handleChange,
    handleFocus: () => setIsFocused(true),
    handleBlur: () => setIsFocused(false),
    beginEdit,
    cancelEdit,
    applyEdit,
  };
}
