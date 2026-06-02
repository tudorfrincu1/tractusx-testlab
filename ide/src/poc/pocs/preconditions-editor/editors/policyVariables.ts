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

/**
 * Test-suite variables an operator can bind a right operand to instead of a
 * literal value. Mock catalog for the POC; in production these would come from
 * the test_root config and earlier step outputs.
 */
export const AVAILABLE_VARIABLES = [
  "@provider_address",
  "@provider_bpn",
  "@consumer_bpn",
  "@certificate_type",
  "@location_bpns",
  "@testlab_management_url",
  "@testlab_dsp_url",
  "@testlab_mock_base_url",
  "@sut_response_timeout",
] as const;

/** A right operand bound to a variable starts with the `@` sigil. */
export function isVariableValue(value: string): boolean {
  return value.startsWith("@");
}
