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

export type BottomPanelTab = "console" | "network" | "performance";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface ConsoleEntry {
  readonly time: string;
  readonly level: LogLevel;
  readonly message: string;
}

export type NetworkType = "ext" | "int";
export type NetworkDirection = "outbound" | "inbound";

export interface NetworkEntry {
  readonly id: string;
  readonly type: NetworkType;
  readonly direction: NetworkDirection;
  readonly method: string;
  readonly url: string;
  readonly status: number;
  readonly duration: string;
  readonly requestHeaders?: Record<string, string>;
  readonly responseHeaders?: Record<string, string>;
  readonly requestBody?: string;
  readonly responseBody?: string;
}

export type NetworkFilter = "all" | "int" | "ext";

export type NetworkDetailTab = "headers" | "request" | "response";

export interface PerformanceEntry {
  readonly label: string;
  readonly durationMs: number;
  readonly durationLabel: string;
}
