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

import { useState, useCallback, useRef, useEffect } from "react";
import { theme } from "@/shared/theme/tractusxTheme";

/** Reusable modal for displaying read-only YAML content. */
export function YamlPreviewModal({ yaml, onClose }: Readonly<{ yaml: string; onClose: () => void }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) onClose();
    };
    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="yaml-preview-overlay"
      aria-label="YAML Preview"
      onClose={onClose}
    >
      <div
        className="yaml-preview-dialog"
        style={{
          background: theme.colors.bgLighter,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div
          className="yaml-preview-header"
          style={{ color: theme.colors.text }}
        >
          <span>YAML Preview</span>
          <button
            type="button"
            onClick={onClose}
            className="yaml-preview-close-btn"
            style={{ color: theme.colors.textMuted }}
          >
            ×
          </button>
        </div>
        <pre
          className="yaml-preview-content"
          style={{ color: theme.colors.text }}
        >
          {yaml}
        </pre>
      </div>
    </dialog>
  );
}

/** Hook for managing inline rename input state. */
export function useRenameInput() {
  const [renaming, setRenaming] = useState<{ type: string; name: string } | null>(null);
  const [value, setValue] = useState("");

  const startRename = useCallback((type: string, name: string) => {
    setRenaming({ type, name });
    setValue(name);
  }, []);

  const cancelRename = useCallback(() => setRenaming(null), []);

  return { renaming, value, setValue, startRename, cancelRename };
}
