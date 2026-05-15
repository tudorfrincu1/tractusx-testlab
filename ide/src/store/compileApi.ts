/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

/**
 * Backend API helper for YAML compilation.
 * Sends YAML to the compile endpoint and returns structured results.
 */

/** A single compilation error with a JSON-path location and message. */
export interface CompileError {
  path: string;
  message: string;
}

/** Response shape from POST /testlab/compile. */
export interface CompileResponse {
  status: string;
  errors: CompileError[];
}

/** Type guard for the compile response payload. */
function isCompileResponse(data: unknown): data is CompileResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    "errors" in data &&
    typeof (data as Record<string, unknown>).status === "string" &&
    Array.isArray((data as Record<string, unknown>).errors)
  );
}

/**
 * Submit a YAML string to the backend compile endpoint.
 * Supports cancellation via AbortSignal.
 */
export async function compileYaml(
  backendUrl: string,
  yaml: string,
  signal?: AbortSignal,
): Promise<CompileResponse> {
  const res = await fetch(`${backendUrl}/testlab/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/x-yaml" },
    body: yaml,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Compile request failed: ${res.status} ${res.statusText}`);
  }

  const data: unknown = await res.json();
  if (!isCompileResponse(data)) {
    throw new Error("Unexpected compile response format");
  }
  return data;
}
