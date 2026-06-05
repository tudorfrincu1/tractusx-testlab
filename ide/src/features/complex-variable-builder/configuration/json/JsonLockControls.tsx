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

// Right-aligned controls for a locked JSON output column: an "Edit" button to
// unlock the textarea, swapping to "Cancel" / "Apply" while editing. Copy stays
// available when locked so the operator can grab the resolved document.
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { CopyButton } from "../header/CopyButton";

export interface JsonLockControlsProps {
  copyText: string;
  isUnlocked: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onApply: () => void;
}

export function JsonLockControls({
  copyText,
  isUnlocked,
  onEdit,
  onCancel,
  onApply,
}: Readonly<JsonLockControlsProps>) {
  if (!isUnlocked) {
    return (
      <span className="precond-json__controls">
        <button type="button" className="precond-json__edit" onClick={onEdit}>
          <EditOutlinedIcon fontSize="inherit" />
          <span>Edit</span>
        </button>
        <CopyButton text={copyText} />
      </span>
    );
  }
  return (
    <span className="precond-json__controls">
      <button type="button" className="precond-json__cancel" onClick={onCancel}>
        <CloseOutlinedIcon fontSize="inherit" />
        <span>Cancel</span>
      </button>
      <button type="button" className="precond-json__apply" onClick={onApply}>
        <CheckOutlinedIcon fontSize="inherit" />
        <span>Apply</span>
      </button>
    </span>
  );
}
