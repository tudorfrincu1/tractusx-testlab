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

import { useProjectStore } from "../../store/slices/useProjectStore";
import { SectionCard, InlineField, SelectField, StandardsField, TagField, VersionField } from "./FormFields";

/* ── Constants ──────────────────────────────────────────────────────────── */

const DATASPACE_VERSIONS = ["saturn", "R25.03", "R25.06", "R24.12", "R24.08"] as const;

/* ── Main Component ─────────────────────────────────────────────────────── */

export function MetadataSection() {
  const tck = useProjectStore((s) => s.tck);
  const updateField = useProjectStore((s) => s.updateTckField);

  return (
    <SectionCard title="Metadata">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 16px" }}>
        <InlineField
          label="Name"
          value={tck.name}
          onChange={(v) => updateField("name", v)}
        />
        <VersionField
          label="Version"
          value={tck.version ?? ""}
          onChange={(v) => updateField("version", v)}
        />
        <SelectField
          label="Dataspace Version"
          value={tck.dataspace_version ?? ""}
          options={DATASPACE_VERSIONS}
          onChange={(v) => updateField("dataspace_version", v || undefined)}
        />
        <InlineField
          label="Author"
          value={tck.author ?? ""}
          onChange={(v) => updateField("author", v || undefined)}
          placeholder="team or person"
        />
        <div style={{ gridColumn: "2 / 4" }}>
          <InlineField
            label="Description"
            value={tck.description ?? ""}
            onChange={(v) => updateField("description", v || undefined)}
            placeholder="What does this TCK verify?"
            isMultiline
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
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
      </div>
    </SectionCard>
  );
}

export { SectionCard } from "./FormFields";

