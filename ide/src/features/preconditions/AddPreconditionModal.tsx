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

import { useEffect } from "react";
import type { PreconditionDefinition } from "@/models/schema";
import { POLICY_TEMPLATES } from "./templatePolicies";

export interface AddPreconditionModalProps {
  onAdd: (precondition: PreconditionDefinition) => void;
  onClose: () => void;
}

export function AddPreconditionModal({ onAdd, onClose }: Readonly<AddPreconditionModalProps>) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="preconditions-modal-overlay" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()} role="dialog" aria-modal="true">
      <div className="preconditions-modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="document">
        <h3>Add Precondition</h3>
        <p className="preconditions-modal__subtitle">Choose a template to get started quickly, or start blank.</p>
        <div className="preconditions-modal__options">
          {POLICY_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              className="preconditions-modal__option"
              onClick={() => onAdd(tpl.create())}
            >
              <span className={`preconditions-modal__option-icon preconditions-modal__option-icon--${tpl.iconClass}`}>
                {tpl.icon}
              </span>
              <span className="preconditions-modal__option-text">
                <strong>{tpl.label}</strong>
                <small>{tpl.description}</small>
              </span>
            </button>
          ))}
        </div>
        <button className="preconditions-modal__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
