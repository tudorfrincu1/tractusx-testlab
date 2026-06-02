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

// Schema-aware policy editor for the POC. Reuses the pure constraint-schema
// data engine (VERSION_SCHEMAS) and composes POC-local rule/constraint UI that
// covers the full mockup: prohibitions, obligations, schema reference, variable
// right operands, validation warnings and a live YAML preview.
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { VERSION_SCHEMAS } from "@/shared/ui/PreconditionsDialog/constraintSchemas";
import type { PolicyRule } from "@/models/schema";
import type { OptionalUsagePurpose, PolicyPayload, PolicyType, PolicyVersion } from "../types";
import { OptionalUsagePurposeSection } from "./OptionalUsagePurposeSection";
import { RuleSectionEditor } from "./RuleSectionEditor";
import { SchemaInfoPanel } from "./SchemaInfoPanel";
import { YamlPreview } from "./YamlPreview";
import "./policy-editor.scss";

const VERSIONS: readonly PolicyVersion[] = ["jupiter", "saturn"] as const;
const POLICY_TYPES: readonly PolicyType[] = ["access", "usage"] as const;

export interface PolicyEditorProps {
  id: string;
  policy: PolicyPayload;
  onChange: (next: PolicyPayload) => void;
}

export function PolicyEditor({ id, policy, onChange }: Readonly<PolicyEditorProps>) {
  const [showMore, setShowMore] = useState(false);
  const schema = VERSION_SCHEMAS[policy.version];
  const action = schema.allowedActions[policy.policyType][0];
  const showProhibitions = schema.supportsProhibitions && policy.policyType === "usage";
  const showObligations = schema.supportsObligations && policy.policyType === "usage";

  const handleVersion = (version: PolicyVersion) =>
    onChange({ ...policy, version, permissions: [], prohibitions: [], obligations: [] });

  const handlePolicyType = (policyType: PolicyType) =>
    onChange({ ...policy, policyType, permissions: [], prohibitions: [], obligations: [] });

  const handleRules =
    (key: "permissions" | "prohibitions" | "obligations") => (rules: PolicyRule[]) =>
      onChange({ ...policy, [key]: rules });

  const handleOptionalUsagePurposes = (optionalUsagePurposes: OptionalUsagePurpose[]) =>
    onChange({ ...policy, optionalUsagePurposes });

  return (
    <div className="precond-editor__group precond-policy">
      <PillRow
        label="Profile version"
        options={VERSIONS.map((version) => ({
          value: version,
          label: VERSION_SCHEMAS[version].label,
        }))}
        active={policy.version}
        onSelect={(value) => handleVersion(value as PolicyVersion)}
      />
      <p className="precond-editor__hint">{schema.description}</p>

      <PillRow
        label="Policy type"
        options={POLICY_TYPES.map((policyType) => ({
          value: policyType,
          label: policyType === "access" ? "Access" : "Usage",
        }))}
        active={policy.policyType}
        onSelect={(value) => handlePolicyType(value as PolicyType)}
      />

      <SchemaInfoPanel version={policy.version} policyType={policy.policyType} />

      <RuleSectionEditor
        title="Permissions"
        addLabel="+ Add permission rule"
        rules={policy.permissions}
        ruleType="permission"
        version={policy.version}
        policyType={policy.policyType}
        action={action}
        onChange={handleRules("permissions")}
      />

      {showProhibitions && (
        <RuleSectionEditor
          title="Prohibitions"
          addLabel="+ Add prohibition rule"
          rules={policy.prohibitions ?? []}
          ruleType="prohibition"
          version={policy.version}
          policyType={policy.policyType}
          action={action}
          onChange={handleRules("prohibitions")}
        />
      )}

      {showObligations && (
        <RuleSectionEditor
          title="Obligations"
          addLabel="+ Add obligation rule"
          rules={policy.obligations ?? []}
          ruleType="obligation"
          version={policy.version}
          policyType={policy.policyType}
          action={action}
          onChange={handleRules("obligations")}
        />
      )}

      {policy.policyType === "usage" && (
        <div className="precond-policy__more">
          <button
            type="button"
            className="precond-policy__more-toggle"
            aria-expanded={showMore}
            onClick={() => setShowMore((open) => !open)}
          >
            {showMore ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
            More options
          </button>
          {showMore && (
            <OptionalUsagePurposeSection
              version={policy.version}
              purposes={policy.optionalUsagePurposes ?? []}
              onChange={handleOptionalUsagePurposes}
            />
          )}
        </div>
      )}

      <YamlPreview id={id} policy={policy} />
    </div>
  );
}

interface PillOption {
  value: string;
  label: string;
}

interface PillRowProps {
  label: string;
  options: PillOption[];
  active: string;
  onSelect: (value: string) => void;
}

function PillRow({ label, options, active, onSelect }: Readonly<PillRowProps>) {
  return (
    <div className="precond-editor__pill-row">
      <span className="precond-editor__pill-label">{label}</span>
      <div className="precond-editor__pills">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={pillClass(option.value === active)}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function pillClass(active: boolean): string {
  return active ? "precond-editor__pill precond-editor__pill--active" : "precond-editor__pill";
}
