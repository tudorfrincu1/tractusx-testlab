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

import { useMemo } from "react";
import { partitionForRun } from "./partitionForRun";
import { RunVariableRow } from "./RunVariableRow";
import type { Variable } from "../model";

export interface RunConfigurationProps {
  variables: readonly Variable[];
}

type BucketKey = "requested" | "known" | "generated";

interface BucketMeta {
  key: BucketKey;
  title: string;
  caption: string;
}

const BUCKETS: readonly BucketMeta[] = [
  { key: "requested", title: "Requested from you", caption: "Values the operator must supply at run start." },
  { key: "known", title: "Known values", caption: "Fixed values and payloads, ready to copy." },
  { key: "generated", title: "Generated at start", caption: "Values a generator produces automatically." },
] as const;

/**
 * The run-start view: derives three buckets from a pure selector and renders
 * each as a section. The classification rule lives entirely in
 * {@link partitionForRun}; this component is presentation only.
 */
export function RunConfiguration({ variables }: Readonly<RunConfigurationProps>) {
  const partition = useMemo(() => partitionForRun(variables), [variables]);

  return (
    <div className="vars-run">
      {BUCKETS.map((bucket) => {
        const rows = partition[bucket.key];
        return (
          <section key={bucket.key} className={`vars-run__bucket vars-run__bucket--${bucket.key}`}>
            <header className="vars-run__bucket-head">
              <h3 className="vars-run__bucket-title">{bucket.title}</h3>
              <span className="vars-run__count">{rows.length}</span>
            </header>
            <p className="vars-run__bucket-caption">{bucket.caption}</p>
            {rows.length === 0 ? (
              <p className="vars-run__empty">No variables in this bucket.</p>
            ) : (
              <ul className="vars-run__list">
                {rows.map((variable) => (
                  <RunVariableRow key={variable.id} variable={variable} bucket={bucket.key} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
