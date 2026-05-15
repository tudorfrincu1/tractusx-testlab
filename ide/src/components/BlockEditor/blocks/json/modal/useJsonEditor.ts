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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useCallback, useMemo, useRef, useState } from "react";
import { useProjectStore } from "../../../../../store/slices/useProjectStore";
import {
  countVarRefsOutsideStrings,
  formatJsonWithVarRefs,
  validateJsonWithVarRefs,
} from "./jsonVarRefs";

export interface UseJsonEditorResult {
  text: string;
  setText: (value: string) => void;
  validation: { isValid: boolean; error?: string };
  varCount: number;
  statusMessage: string;
  isValid: boolean;
  availableVariables: string[];
  isPickerOpen: boolean;
  togglePicker: () => void;
  closePicker: () => void;
  insertVariable: (varName: string) => void;
  handleFormat: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useJsonEditor(initialJson: string): UseJsonEditorResult {
  const [text, setText] = useState(initialJson);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const validation = useMemo(() => validateJsonWithVarRefs(text), [text]);
  const varCount = useMemo(
    () => (validation.isValid ? countVarRefsOutsideStrings(text) : 0),
    [text, validation.isValid],
  );

  const statusMessage = validation.isValid
    ? varCount > 0
      ? `Valid JSON — detected ${varCount} variable(s) ✓`
      : "Valid JSON ✓"
    : `Invalid JSON: ${validation.error}`;

  // Read available variables once on mount — modal remounts each open,
  // so we always get a fresh snapshot without subscribing to the store.
  const [availableVariables] = useState(() =>
    useProjectStore.getState().getAggregatedVariables().map((v) => v.name),
  );

  const handleFormat = useCallback(() => {
    const formatted = formatJsonWithVarRefs(text);
    if (formatted !== null) setText(formatted);
  }, [text]);

  const togglePicker = useCallback(() => {
    setIsPickerOpen((prev) => !prev);
  }, []);

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  const insertVariable = useCallback(
    (varName: string) => {
      const el = textareaRef.current;
      const token = `@${varName}`;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = text.slice(0, start) + token + text.slice(end);
        setText(next);
        requestAnimationFrame(() => {
          el.focus();
          const pos = start + token.length;
          el.setSelectionRange(pos, pos);
        });
      } else {
        setText(text + token);
      }
      setIsPickerOpen(false);
    },
    [text],
  );

  return {
    text,
    setText,
    validation,
    varCount,
    statusMessage,
    isValid: validation.isValid,
    availableVariables,
    isPickerOpen,
    togglePicker,
    closePicker,
    insertVariable,
    handleFormat,
    textareaRef,
  };
}
