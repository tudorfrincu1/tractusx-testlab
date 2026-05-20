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

import { useState, useMemo } from "react";
import { useProjectStore } from "../../store/slices/useProjectStore";
import type { PreconditionDefinition } from "../../models/schema";
import { PreconditionsList } from "./PreconditionsList";
import { PreconditionEditor } from "./PreconditionEditor";
import { AddPreconditionModal } from "./AddPreconditionModal";
import "./PreconditionsPanel.css";

export function PreconditionsPanel() {
  const tck = useProjectStore((s) => s.tck);
  const updateTckField = useProjectStore((s) => s.updateTckField);
  const preconditions = useMemo(() => tck.preconditions ?? [], [tck.preconditions]);

  const [activeIndex, setActiveIndex] = useState<number>(preconditions.length > 0 ? 0 : -1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBack = () => {
    useProjectStore.setState({ activeFile: { type: "tck", name: "index" } });
  };

  const handleAdd = (template: PreconditionDefinition) => {
    const updated = [...preconditions, template];
    updateTckField("preconditions", updated);
    setActiveIndex(updated.length - 1);
    setShowAddModal(false);
  };

  const handleUpdate = (index: number, updated: PreconditionDefinition) => {
    const list = [...preconditions];
    list[index] = updated;
    updateTckField("preconditions", list);
  };

  const handleDelete = (index: number) => {
    const list = preconditions.filter((_, i) => i !== index);
    updateTckField("preconditions", list);
    setActiveIndex(Math.min(activeIndex, list.length - 1));
  };

  const handleDuplicate = (index: number) => {
    const source = preconditions[index];
    const copy: PreconditionDefinition = {
      ...source,
      description: `${source.description} (copy)`,
      params: { ...source.params },
    };
    const updated = [...preconditions, copy];
    updateTckField("preconditions", updated);
    setActiveIndex(updated.length - 1);
  };

  const activePrecondition = activeIndex >= 0 ? preconditions[activeIndex] : null;
  const projectTitle = tck.name ? `${tck.name} v${tck.version ?? "0.0.1"}` : "Untitled";

  return (
    <div className="preconditions-panel">
      <div className="preconditions-topbar">
        <div className="preconditions-topbar__left">
          <button className="preconditions-topbar__back" onClick={handleBack}>
            ← Back to Test Suite
          </button>
          <span className="preconditions-topbar__title">
            Preconditions — {projectTitle}
          </span>
        </div>
        <button className="preconditions-footer__btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Precondition
        </button>
      </div>

      <div className="preconditions-main">
        <PreconditionsList
          preconditions={preconditions}
          activeIndex={activeIndex}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={setActiveIndex}
        />
        {activePrecondition && (
          <PreconditionEditor
            precondition={activePrecondition}
            onChange={(updated) => handleUpdate(activeIndex, updated)}
            onDelete={() => handleDelete(activeIndex)}
            onDuplicate={() => handleDuplicate(activeIndex)}
          />
        )}
        {!activePrecondition && (
          <div className="preconditions-right preconditions-right--empty">
            <p>Select a precondition or add a new one to get started.</p>
          </div>
        )}
      </div>

      <div className="preconditions-footer">
        <div className="preconditions-footer__left">
          <button className="preconditions-footer__btn-primary" onClick={handleBack}>
            Save Changes
          </button>
          <button className="preconditions-footer__btn-ghost" onClick={handleBack}>
            Discard
          </button>
        </div>
        <span className="preconditions-footer__timestamp">
          {preconditions.length} precondition{preconditions.length === 1 ? "" : "s"} configured
        </span>
      </div>

      {showAddModal && (
        <AddPreconditionModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
