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

/**
 * Utilities for building the FieldWrappedText modal dialog.
 * Extracted from FieldWrappedText to keep the main class focused on rendering.
 */

interface DialogElements {
  backdrop: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  saveBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
}

/** Create a styled modal dialog with a textarea for editing wrapped text. */
export function createWrappedTextDialog(currentValue: string): DialogElements {
  // Backdrop
  const backdrop = document.createElement("div");
  Object.assign(backdrop.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.55)",
    zIndex: "10000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  // Dialog container
  const dialog = document.createElement("div");
  Object.assign(dialog.style, {
    background: "#1a1a2e",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "20px",
    width: "600px",
    maxWidth: "90vw",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontFamily:
      "'JetBrains Mono','SF Mono','Fira Code','Cascadia Code',monospace",
  });

  // Title
  const title = document.createElement("div");
  title.textContent = "Edit Text";
  Object.assign(title.style, {
    color: "#FFD700",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  });

  // Textarea
  const textarea = document.createElement("textarea");
  textarea.value = currentValue;
  textarea.spellcheck = false;
  Object.assign(textarea.style, {
    background: "#111",
    border: "1px solid #444",
    borderRadius: "6px",
    color: "#F3F4F6",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.7",
    padding: "12px 14px",
    resize: "vertical",
    minHeight: "280px",
    maxHeight: "60vh",
    outline: "none",
  });

  // Focus ring
  textarea.addEventListener("focus", () => {
    textarea.style.borderColor = "#FFD700";
    textarea.style.boxShadow =
      "0 0 0 2px rgba(255,215,0,0.15), 0 4px 12px rgba(0,0,0,0.4)";
  });
  textarea.addEventListener("blur", () => {
    textarea.style.borderColor = "#444";
    textarea.style.boxShadow = "none";
  });

  // Button row
  const buttonRow = document.createElement("div");
  Object.assign(buttonRow.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  });

  const cancelBtn = createDialogButton("Cancel", false);
  const saveBtn = createDialogButton("Save", true);

  buttonRow.appendChild(cancelBtn);
  buttonRow.appendChild(saveBtn);

  dialog.appendChild(title);
  dialog.appendChild(textarea);
  dialog.appendChild(buttonRow);
  backdrop.appendChild(dialog);

  return { backdrop, textarea, saveBtn, cancelBtn };
}

function createDialogButton(label: string, isPrimary: boolean): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  Object.assign(btn.style, {
    padding: "6px 16px",
    borderRadius: "6px",
    border: isPrimary ? "1px solid #FFD700" : "1px solid #555",
    background: isPrimary ? "rgba(255,215,0,0.12)" : "transparent",
    color: isPrimary ? "#FFD700" : "#9CA3AF",
    fontSize: "12px",
    fontFamily: "inherit",
    cursor: "pointer",
    fontWeight: isPrimary ? "600" : "400",
  });
  btn.addEventListener("mouseenter", () => {
    btn.style.background = isPrimary
      ? "rgba(255,215,0,0.22)"
      : "rgba(255,255,255,0.06)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = isPrimary
      ? "rgba(255,215,0,0.12)"
      : "transparent";
  });
  return btn;
}
