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

import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "@/store";
import { PolicySection } from "./PolicySection";
import { VERSION_SCHEMAS } from "./constraintSchemas";
import type { PreconditionDefinition, PolicyRule } from "@/models/schema";

export interface PreconditionsDialogProps {
  onClose: () => void;
}

type Version = "jupiter" | "saturn";
type PolicyType = "access" | "usage";

interface PolicyState {
  permissions: PolicyRule[];
  prohibitions: PolicyRule[];
  obligations: PolicyRule[];
}

function buildEmptyPolicy(): PolicyState {
  return { permissions: [], prohibitions: [], obligations: [] };
}

function loadFromPreconditions(
  preconditions: PreconditionDefinition[],
  policyType: PolicyType,
): PolicyState {
  const entry = preconditions.find((p) => p.params.policy_type === policyType);
  if (!entry) return buildEmptyPolicy();
  return {
    permissions: entry.params.permissions ?? [],
    prohibitions: entry.params.prohibitions ?? [],
    obligations: entry.params.obligations ?? [],
  };
}

function detectVersion(preconditions: PreconditionDefinition[]): Version {
  const first = preconditions.find((p) => p.type === "precondition_policy_config");
  return first?.params.version ?? "jupiter";
}

export function PreconditionsDialog({ onClose }: PreconditionsDialogProps) {
  const tck = useProjectStore((s) => s.tck);
  const existing = tck?.preconditions?.filter(
    (p): p is PreconditionDefinition => p.type === "precondition_policy_config",
  ) ?? [];

  const [version, setVersion] = useState<Version>(() => detectVersion(existing));
  const [policyTab, setPolicyTab] = useState<PolicyType>("access");
  const [accessPolicy, setAccessPolicy] = useState<PolicyState>(() => loadFromPreconditions(existing, "access"));
  const [usagePolicy, setUsagePolicy] = useState<PolicyState>(() => loadFromPreconditions(existing, "usage"));

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleVersionChange = (v: Version) => {
    setVersion(v);
    setAccessPolicy(buildEmptyPolicy());
    setUsagePolicy(buildEmptyPolicy());
  };

  const handleDone = () => {
    const schema = VERSION_SCHEMAS[version];
    const preconditions: PreconditionDefinition[] = [];

    const accessAction = schema.allowedActions.access[0];
    if (accessPolicy.permissions.length > 0 || hasConstraints(accessPolicy)) {
      preconditions.push({
        type: "precondition_policy_config",
        description: "Access Policy",
        params: {
          version,
          policy_type: "access",
          permissions: applyAction(accessPolicy.permissions, accessAction),
        },
      });
    }

    const usageAction = schema.allowedActions.usage[0];
    if (usagePolicy.permissions.length > 0 || hasConstraints(usagePolicy)) {
      const entry: PreconditionDefinition = {
        type: "precondition_policy_config",
        description: "Usage Policy",
        params: {
          version,
          policy_type: "usage",
          permissions: applyAction(usagePolicy.permissions, usageAction),
        },
      };
      if (version === "saturn") {
        entry.params.prohibitions = applyAction(usagePolicy.prohibitions, usageAction);
        entry.params.obligations = applyAction(usagePolicy.obligations, usageAction);
      }
      preconditions.push(entry);
    }

    useProjectStore.getState().updateTckField("preconditions", preconditions);
    onClose();
  };

  const currentPolicy = policyTab === "access" ? accessPolicy : usagePolicy;
  const setCurrentPolicy = policyTab === "access" ? setAccessPolicy : setUsagePolicy;
  const versionSchema = VERSION_SCHEMAS[version];

  return (
    <dialog
      ref={dialogRef}
      className="precond-dialog__overlay"
      onCancel={onClose}
      onClick={handleBackdropClick}
    >
      <div className="precond-dialog__panel" onClick={(e) => e.stopPropagation()}>
        <div className="precond-dialog__header">
          <h3 className="precond-dialog__title">Preconditions</h3>
          <button className="precond-dialog__close-btn" onClick={onClose} title="Close">
            x
          </button>
        </div>

        <div className="precond-dialog__body">
          <p className="precond-dialog__description">
            Catena-X Policy Profile — configures access and usage policies for dataspace negotiation.
          </p>

          <div>
            <div className="precond-dialog__version-pills">
              {(["jupiter", "saturn"] as const).map((v) => (
                <button
                  key={v}
                  className={`precond-dialog__version-pill${version === v ? " precond-dialog__version-pill--active" : ""}`}
                  onClick={() => handleVersionChange(v)}
                >
                  {VERSION_SCHEMAS[v].label}
                </button>
              ))}
            </div>
            <p className="precond-dialog__version-desc">{versionSchema.description}</p>
          </div>

          <div className="precond-dialog__policy-tabs">
            {(["access", "usage"] as const).map((pt) => (
              <button
                key={pt}
                className={`precond-dialog__policy-tab${policyTab === pt ? " precond-dialog__policy-tab--active" : ""}`}
                onClick={() => setPolicyTab(pt)}
              >
                {pt === "access" ? "Access Policy" : "Usage Policy"}
              </button>
            ))}
          </div>

          <PolicySection
            title="Permissions"
            rules={currentPolicy.permissions}
            ruleType="permission"
            version={version}
            policyType={policyTab}
            onChange={(rules) => setCurrentPolicy((prev) => ({ ...prev, permissions: rules }))}
          />

          {version === "saturn" && policyTab === "usage" && (
            <>
              <PolicySection
                title="Prohibitions"
                rules={currentPolicy.prohibitions}
                ruleType="prohibition"
                version={version}
                policyType={policyTab}
                onChange={(rules) => setCurrentPolicy((prev) => ({ ...prev, prohibitions: rules }))}
              />
              <PolicySection
                title="Obligations"
                rules={currentPolicy.obligations}
                ruleType="obligation"
                version={version}
                policyType={policyTab}
                onChange={(rules) => setCurrentPolicy((prev) => ({ ...prev, obligations: rules }))}
              />
            </>
          )}
        </div>

        <div className="precond-dialog__footer">
          <button className="precond-dialog__done-btn" onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}

function hasConstraints(policy: PolicyState): boolean {
  return (
    policy.permissions.some((r) => r.constraints.length > 0) ||
    policy.prohibitions.some((r) => r.constraints.length > 0) ||
    policy.obligations.some((r) => r.constraints.length > 0)
  );
}

function applyAction(rules: PolicyRule[], action: string): PolicyRule[] {
  return rules.map((r) => ({ ...r, action }));
}
