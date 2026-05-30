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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

import { memo } from "react";
import { useProjectStore } from "@/store";
import {
  InlineField,
  StandardsField,
  TagField,
} from "../../forms/FormFields";

export interface GraphInfoEditFormProps {
  onClose: () => void;
}

/**
 * Inline edit form for the graph info panel.
 * Reuses the same form field components as MetadataEditor.
 * Does NOT include variables editing.
 */
export const GraphInfoEditForm = memo(function GraphInfoEditForm({
  onClose,
}: GraphInfoEditFormProps) {
  const tck = useProjectStore((s) => s.tck);
  const updateField = useProjectStore((s) => s.updateTckField);

  return (
    <div className="graph-info-panel__edit-form">
      <InlineField
        label="Author"
        value={tck.author ?? ""}
        onChange={(v) => updateField("author", v || undefined)}
        placeholder="team or person"
      />
      <InlineField
        label="Description"
        value={tck.description ?? ""}
        onChange={(v) => updateField("description", v || undefined)}
        placeholder="What does this TCK verify?"
        isMultiline
      />
      <StandardsField
        values={tck.standards ?? []}
        onChange={(v) => updateField("standards", v.length > 0 ? v : undefined)}
      />
      <TagField
        label="Tags"
        values={tck.tags ?? []}
        onChange={(v) => updateField("tags", v.length > 0 ? v : undefined)}
        placeholder="e.g. integration"
        chipColor="rgba(15, 118, 110, 0.25)"
        chipTextColor="#5eead4"
      />

      <div className="graph-info-panel__edit-actions">
        <button className="graph-info-panel__cancel-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
});
