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
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { useEffect, useRef } from "react";
import { TckVariableTable } from "./TckVariableTable";
import { TestOverridesPanel } from "./TestOverridesPanel";

export interface VariableEditorDialogProps {
  onClose: () => void;
}

export function VariableEditorDialog({ onClose }: VariableEditorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="var-dialog__overlay"
      onCancel={onClose}
      onClick={handleBackdropClick}
    >
      <div className="var-dialog__panel">
        <div className="var-dialog__header">
          <h3 className="var-dialog__title">Variables</h3>
          <button
            className="var-dialog__close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="var-dialog__body">
          <TckVariableTable />
          <TestOverridesPanel />
        </div>

        <div className="var-dialog__footer">
          <button className="var-dialog__done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
