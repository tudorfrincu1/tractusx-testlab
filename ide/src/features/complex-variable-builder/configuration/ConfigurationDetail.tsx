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

import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { ConfigHeader } from "./header/ConfigHeader";
import { JsonTab } from "./json/JsonTab";
import { PolicyConfiguration } from "./policy/PolicyConfiguration";
import { validateJsonText } from "./json/jsonCodec";
import type { ComplexVariableItem, PolicyPayload, ProvidePayload } from "../model";

export interface ConfigurationDetailProps {
  /** A Configuration (register) item — either a policy or a provide template. */
  item: ComplexVariableItem;
  onPolicyChange: (next: PolicyPayload) => void;
  onProvideChange: (next: ProvidePayload) => void;
  /**
   * Whether to show the collapsed variable YAML drawer beneath the
   * policy authoring. Defaults to `true` so the standalone builder POC is
   * unchanged; the variables manager passes `false` because a complex variable
   * is serialized as a VARIABLE, not a `config/connector/policy` variable.
   */
  showYamlPreview?: boolean;
}

/**
 * Host for one Configuration item. Policy items run the template-first
 * side-by-side authoring flow; form-less provide templates keep the quiet
 * placeholder on the left while the JSON column carries the document. In both
 * cases the JSON column is the single source of truth.
 */
export function ConfigurationDetail({
  item,
  onPolicyChange,
  onProvideChange,
  showYamlPreview = true,
}: Readonly<ConfigurationDetailProps>) {
  if (item.category !== "register") {
    return null;
  }
  if (item.policy) {
    return (
      <PolicyConfiguration
        item={item}
        policy={item.policy}
        onPolicyChange={onPolicyChange}
        showYamlPreview={showYamlPreview}
      />
    );
  }
  return <ProvideDetail item={item} onProvideChange={onProvideChange} />;
}

interface ProvideDetailProps {
  item: ComplexVariableItem;
  onProvideChange: (next: ProvidePayload) => void;
}

function ProvideDetail({ item, onProvideChange }: Readonly<ProvideDetailProps>) {
  const template = item.category === "register" ? item.provide?.template ?? "" : "";
  return (
    <article className="precond-detail">
      <ConfigHeader item={item} />
      <div className="precond-split precond-split--formless">
        <div className="precond-split__form">
          <div className="precond-json__formless">
            <EditNoteOutlinedIcon fontSize="inherit" />
            This document is edited as raw JSON.
          </div>
        </div>
        <div className="precond-split__json">
          <JsonTab
            key={`${item.id}-provide`}
            sourceText={template}
            validate={validateJsonText}
            onCommit={(text) => onProvideChange({ template: text })}
            showAssetIds={item.subType === "aas_descriptor"}
          />
        </div>
      </div>
    </article>
  );
}

