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

import { useState } from "react";
import type { PreconditionDefinition, PreconditionPolicyDefinition, PreconditionAssetDefinition, PreconditionContractDefinition, PolicyRule } from "../../models/schema";
import { VERSION_SCHEMAS } from "../PreconditionsDialog/constraintSchemas";
import { RuleSection } from "./RuleSection";

export interface PreconditionEditorProps {
  precondition: PreconditionDefinition;
  onChange: (updated: PreconditionDefinition) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function preconditionToYaml(p: PreconditionDefinition): string {
  const ind = (n: number) => "  ".repeat(n);
  if (p.type === "precondition_asset_config") {
    let yaml = `- type: ${p.type}\n  description: ${p.description}\n  params:\n${ind(2)}version: ${p.params.version}\n`;
    if (p.params.asset_id) yaml += `${ind(2)}asset_id: ${p.params.asset_id}\n`;
    yaml += `${ind(2)}properties:\n`;
    for (const [k, v] of Object.entries(p.params.properties)) yaml += `${ind(3)}${k}: ${v}\n`;
    yaml += `${ind(2)}data_address:\n`;
    for (const [k, v] of Object.entries(p.params.data_address)) yaml += `${ind(3)}${k}: ${v}\n`;
    return yaml;
  }
  if (p.type === "precondition_contract_def_config") {
    let yaml = `- type: ${p.type}\n  description: ${p.description}\n  params:\n${ind(2)}version: ${p.params.version}\n`;
    if (p.params.contract_def_id) yaml += `${ind(2)}contract_def_id: ${p.params.contract_def_id}\n`;
    if (p.params.access_policy_id) yaml += `${ind(2)}access_policy_id: ${p.params.access_policy_id}\n`;
    if (p.params.contract_policy_id) yaml += `${ind(2)}contract_policy_id: ${p.params.contract_policy_id}\n`;
    if (p.params.asset_selector?.length) {
      yaml += `${ind(2)}asset_selector:\n`;
      for (const sel of p.params.asset_selector) {
        yaml += `${ind(3)}- ${Object.entries(sel).map(([k, v]) => `${k}: ${v}`).join(", ")}\n`;
      }
    }
    return yaml;
  }

  // Policy type
  const params = p.params ?? { version: "jupiter", policy_type: "access" };
  let yaml = `- type: ${p.type}\n  description: ${p.description}\n  params:\n${ind(2)}version: ${params.version}\n${ind(2)}policy_type: ${params.policy_type}\n`;
  const renderRules = (key: string, rules: PolicyRule[] | undefined) => {
    if (!rules || rules.length === 0) return;
    yaml += `${ind(2)}${key}:\n`;
    for (const rule of rules) {
      yaml += `${ind(3)}- action: ${rule.action}\n`;
      if (rule.constraints.length > 0) {
        yaml += `${ind(4)}constraints:\n`;
        for (const c of rule.constraints) {
          const val = Array.isArray(c.rightOperand) ? c.rightOperand.join(", ") : c.rightOperand;
          yaml += `${ind(5)}- left_operand: ${c.leftOperand}\n${ind(6)}operator: ${c.operator}\n${ind(6)}right_operand: ${val}\n`;
        }
      }
    }
  };
  renderRules("permissions", params.permissions);
  renderRules("prohibitions", params.prohibitions);
  renderRules("obligations", params.obligations);
  return yaml;
}

const DEFAULT_POLICY_PARAMS: PreconditionPolicyDefinition["params"] = {
  version: "jupiter",
  policy_type: "access",
  permissions: [],
  prohibitions: [],
  obligations: [],
};

export function PreconditionEditor({ precondition, onChange, onDelete, onDuplicate }: Readonly<PreconditionEditorProps>) {
  const [yamlOpen, setYamlOpen] = useState(false);

  const renderHeader = () => (
    <div className="preconditions-detail__header">
      <input
        className="preconditions-detail__id-input"
        value={precondition.description}
        onChange={(e) => onChange({ ...precondition, description: e.target.value })}
      />
      <div className="preconditions-detail__actions">
        <button className="preconditions-topbar__back" onClick={onDuplicate} title="Duplicate">⧉</button>
        <button className="preconditions-topbar__back" onClick={onDelete} title="Delete">×</button>
      </div>
    </div>
  );

  const renderYamlPreview = () => (
    <div className="preconditions-preview">
      <div className="preconditions-preview__header" onClick={() => setYamlOpen(!yamlOpen)} onKeyDown={(e) => e.key === "Enter" && setYamlOpen(!yamlOpen)} role="button" tabIndex={0}>
        <span>YAML Preview</span>
        <span>{yamlOpen ? "▲" : "▼"}</span>
      </div>
      {yamlOpen && <div className="preconditions-preview__body">{preconditionToYaml(precondition)}</div>}
    </div>
  );

  if (precondition.type === "precondition_policy_config") {
    return <PolicyEditor precondition={precondition} onChange={onChange} renderHeader={renderHeader} renderYamlPreview={renderYamlPreview} />;
  }
  if (precondition.type === "precondition_asset_config") {
    return <AssetEditor precondition={precondition} onChange={onChange} renderHeader={renderHeader} renderYamlPreview={renderYamlPreview} />;
  }
  if (precondition.type === "precondition_contract_def_config") {
    return <ContractEditor precondition={precondition} onChange={onChange} renderHeader={renderHeader} renderYamlPreview={renderYamlPreview} />;
  }
  return null;
}

/* ─── Policy Editor ─────────────────────────────────────────────── */

interface PolicyEditorProps {
  precondition: PreconditionPolicyDefinition;
  onChange: (updated: PreconditionDefinition) => void;
  renderHeader: () => React.JSX.Element;
  renderYamlPreview: () => React.JSX.Element;
}

function PolicyEditor({ precondition, onChange, renderHeader, renderYamlPreview }: PolicyEditorProps) {
  const params = precondition.params ?? DEFAULT_POLICY_PARAMS;
  const { version, policy_type } = params;
  const schema = VERSION_SCHEMAS[version];

  const updateParams = (patch: Partial<PreconditionPolicyDefinition["params"]>) => {
    onChange({ ...precondition, params: { ...params, ...patch } });
  };

  const handleVersionChange = (v: "jupiter" | "saturn") => {
    const patch: Partial<PreconditionPolicyDefinition["params"]> = { version: v };
    if (v === "jupiter") { patch.prohibitions = []; patch.obligations = []; }
    updateParams(patch);
  };

  const handlePolicyTypeChange = (pt: "access" | "usage") => {
    const patch: Partial<PreconditionPolicyDefinition["params"]> = { policy_type: pt };
    if (pt === "access") { patch.prohibitions = []; patch.obligations = []; }
    updateParams(patch);
  };

  const showAdvanced = version === "saturn" && policy_type === "usage";

  return (
    <div className="preconditions-right">
      {renderHeader()}
      <div className="preconditions-detail__badges">
        <span className="preconditions-detail__badge preconditions-detail__badge--policy">{policy_type}</span>
        <span className={`preconditions-detail__badge preconditions-detail__badge--${version}`}>{schema?.label}</span>
      </div>
      <div className="preconditions-config">
        <div className="preconditions-config__title">Configuration</div>
        <div className="preconditions-config__toggle-row">
          <span>Policy Type</span>
          <div className="preconditions-config__pill-group">
            <button className={`preconditions-config__pill ${policy_type === "access" ? "preconditions-config__pill--active" : ""}`} onClick={() => handlePolicyTypeChange("access")}>Access</button>
            <button className={`preconditions-config__pill ${policy_type === "usage" ? "preconditions-config__pill--active" : ""}`} onClick={() => handlePolicyTypeChange("usage")}>Usage</button>
          </div>
        </div>
        <div className="preconditions-config__toggle-row">
          <span>Dataspace Version</span>
          <div className="preconditions-config__pill-group">
            <button className={`preconditions-config__pill ${version === "jupiter" ? "preconditions-config__pill--active" : ""}`} onClick={() => handleVersionChange("jupiter")}>Jupiter</button>
            <button className={`preconditions-config__pill ${version === "saturn" ? "preconditions-config__pill--active" : ""}`} onClick={() => handleVersionChange("saturn")}>Saturn</button>
          </div>
        </div>
      </div>
      <RuleSection title="Permissions" rules={params.permissions ?? []} ruleType="permission" version={version} policyType={policy_type} onChange={(rules) => updateParams({ permissions: rules })} />
      <RuleSection title="Prohibitions" rules={params.prohibitions ?? []} ruleType="prohibition" version={version} policyType={policy_type} isHidden={!showAdvanced} onChange={(rules) => updateParams({ prohibitions: rules })} />
      <RuleSection title="Obligations" rules={params.obligations ?? []} ruleType="obligation" version={version} policyType={policy_type} isHidden={!showAdvanced} onChange={(rules) => updateParams({ obligations: rules })} />
      {renderYamlPreview()}
    </div>
  );
}

/* ─── Asset Editor ──────────────────────────────────────────────── */

interface AssetEditorProps {
  precondition: PreconditionAssetDefinition;
  onChange: (updated: PreconditionDefinition) => void;
  renderHeader: () => React.JSX.Element;
  renderYamlPreview: () => React.JSX.Element;
}

function AssetEditor({ precondition, onChange, renderHeader, renderYamlPreview }: AssetEditorProps) {
  const params = precondition.params;
  const updateField = (field: string, value: string) => {
    if (field === "asset_id") {
      onChange({ ...precondition, params: { ...params, asset_id: value } });
    }
  };
  const updateProperty = (key: string, value: string) => {
    onChange({ ...precondition, params: { ...params, properties: { ...params.properties, [key]: value } } });
  };
  const updateDataAddress = (key: string, value: string) => {
    onChange({ ...precondition, params: { ...params, data_address: { ...params.data_address, [key]: value } } });
  };

  return (
    <div className="preconditions-right">
      {renderHeader()}
      <div className="preconditions-detail__badges">
        <span className="preconditions-detail__badge preconditions-detail__badge--policy">asset</span>
        <span className="preconditions-detail__badge preconditions-detail__badge--saturn">{params.version}</span>
      </div>
      <div className="preconditions-config">
        <div className="preconditions-config__title">Asset Configuration</div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Asset ID</label>
          <input className="preconditions-field__input" value={params.asset_id ?? ""} onChange={(e) => updateField("asset_id", e.target.value)} placeholder="@asset_id or UUID" />
        </div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Properties</label>
          {Object.entries(params.properties).map(([key, val]) => (
            <div key={key} className="preconditions-field__row">
              <input className="preconditions-field__input preconditions-field__input--key" value={key} readOnly />
              <input className="preconditions-field__input" value={val} onChange={(e) => updateProperty(key, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Data Address</label>
          {Object.entries(params.data_address).map(([key, val]) => (
            <div key={key} className="preconditions-field__row">
              <input className="preconditions-field__input preconditions-field__input--key" value={key} readOnly />
              <input className="preconditions-field__input" value={val} onChange={(e) => updateDataAddress(key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
      {renderYamlPreview()}
    </div>
  );
}

/* ─── Contract Definition Editor ────────────────────────────────── */

interface ContractEditorProps {
  precondition: PreconditionContractDefinition;
  onChange: (updated: PreconditionDefinition) => void;
  renderHeader: () => React.JSX.Element;
  renderYamlPreview: () => React.JSX.Element;
}

function ContractEditor({ precondition, onChange, renderHeader, renderYamlPreview }: ContractEditorProps) {
  const params = precondition.params;
  const updateField = (field: keyof PreconditionContractDefinition["params"], value: string) => {
    onChange({ ...precondition, params: { ...params, [field]: value } });
  };

  return (
    <div className="preconditions-right">
      {renderHeader()}
      <div className="preconditions-detail__badges">
        <span className="preconditions-detail__badge preconditions-detail__badge--policy">contract</span>
        <span className="preconditions-detail__badge preconditions-detail__badge--saturn">{params.version}</span>
      </div>
      <div className="preconditions-config">
        <div className="preconditions-config__title">Contract Definition</div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Contract Definition ID</label>
          <input className="preconditions-field__input" value={params.contract_def_id ?? ""} onChange={(e) => updateField("contract_def_id", e.target.value)} placeholder="@contract_def_id or UUID" />
        </div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Access Policy ID</label>
          <input className="preconditions-field__input" value={params.access_policy_id ?? ""} onChange={(e) => updateField("access_policy_id", e.target.value)} placeholder="@access_policy_id" />
        </div>
        <div className="preconditions-field">
          <label className="preconditions-field__label">Contract Policy ID</label>
          <input className="preconditions-field__input" value={params.contract_policy_id ?? ""} onChange={(e) => updateField("contract_policy_id", e.target.value)} placeholder="@usage_policy_id" />
        </div>
      </div>
      {renderYamlPreview()}
    </div>
  );
}
