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

/** Status of a pipeline stage during execution. */
export type PipelineStageStatus = "idle" | "running" | "passed" | "failed" | "skipped";

/** Layout direction for the pipeline graph. */
export type PipelineDirection = "TB" | "LR";

/** Data attached to each pipeline React Flow node. */
export interface PipelineNodeData {
  name: string;
  stageIndex: number;
  stepCount: number;
  completedSteps: number;
  status: PipelineStageStatus;
  outputs: string[];
  inputs: Array<{ variable: string; source: string }>;
  services: string[];
  stepNames: string[];
  direction: PipelineDirection;
  [key: string]: unknown;
}

/** Data attached to each pipeline React Flow edge. */
export interface PipelineEdgeData {
  variables: string[];
  [key: string]: unknown;
}
