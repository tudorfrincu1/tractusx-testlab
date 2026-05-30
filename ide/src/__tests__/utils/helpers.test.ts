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

import { describe, it, expect } from "vitest";
import { uniqueName, buildTckTestsArray } from "@/store/selectors/storeBuilders";

describe("uniqueName", () => {
  it("returns base name when it does not exist", () => {
    const existing = new Set<string>();

    const result = uniqueName("my-test", existing);

    expect(result).toBe("my-test");
  });

  it("appends -1 when base name exists", () => {
    const existing = new Set(["my-test"]);

    const result = uniqueName("my-test", existing);

    expect(result).toBe("my-test-1");
  });

  it("increments suffix until unique", () => {
    const existing = new Set(["test", "test-1", "test-2"]);

    const result = uniqueName("test", existing);

    expect(result).toBe("test-3");
  });

  it("handles empty base string", () => {
    const existing = new Set([""]);

    const result = uniqueName("", existing);

    expect(result).toBe("-1");
  });
});

describe("buildTckTestsArray", () => {
  it("converts test names to TestRef objects", () => {
    const order = ["test-a", "test-b", "test-c"];

    const result = buildTckTestsArray(order);

    expect(result).toEqual([
      { test: "test-a" },
      { test: "test-b" },
      { test: "test-c" },
    ]);
  });

  it("returns empty array for empty order", () => {
    const result = buildTckTestsArray([]);

    expect(result).toEqual([]);
  });

  it("preserves order of test names", () => {
    const order = ["z-test", "a-test", "m-test"];

    const result = buildTckTestsArray(order);

    expect(result[0].test).toBe("z-test");
    expect(result[1].test).toBe("a-test");
    expect(result[2].test).toBe("m-test");
  });
});
