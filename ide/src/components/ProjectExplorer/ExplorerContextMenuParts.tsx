/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

import { useState, useCallback } from "react";
import { theme } from "../../theme/tractusxTheme";

/** Reusable modal for displaying read-only YAML content. */
export function YamlPreviewModal({ yaml, onClose }: { yaml: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.colors.bgLighter,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 8,
          padding: 16,
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
          minWidth: 400,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
            fontSize: 13,
            fontWeight: 600,
            color: theme.colors.text,
          }}
        >
          YAML Preview
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: theme.colors.textMuted,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        <pre
          style={{
            fontSize: 12,
            color: theme.colors.text,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            margin: 0,
            fontFamily: "monospace",
          }}
        >
          {yaml}
        </pre>
      </div>
    </div>
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
