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

import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "@/store/notifications/useNotificationStore";

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.getState().dismissAll();
  });

  it("starts with empty notifications", () => {
    const { notifications } = useNotificationStore.getState();

    expect(notifications).toHaveLength(0);
  });

  it("push adds a notification with correct severity", () => {
    const store = useNotificationStore.getState();

    store.push("Something failed", "error");

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toBe("Something failed");
    expect(notifications[0].severity).toBe("error");
  });

  it("push assigns unique IDs to each notification", () => {
    const store = useNotificationStore.getState();

    store.push("First", "info");
    store.push("Second", "warning");

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].id).not.toBe(notifications[1].id);
  });

  it("dismiss removes a specific notification by ID", () => {
    const store = useNotificationStore.getState();
    store.push("Keep me", "info");
    store.push("Remove me", "error");

    const all = useNotificationStore.getState().notifications;
    const toRemove = all[1].id;

    useNotificationStore.getState().dismiss(toRemove);

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toBe("Keep me");
  });

  it("dismissAll clears all notifications", () => {
    const store = useNotificationStore.getState();
    store.push("A", "info");
    store.push("B", "warning");
    store.push("C", "error");

    useNotificationStore.getState().dismissAll();

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(0);
  });

  it("push records a timestamp", () => {
    const before = Date.now();
    useNotificationStore.getState().push("Timed", "success");
    const after = Date.now();

    const { notifications } = useNotificationStore.getState();
    expect(notifications[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(notifications[0].timestamp).toBeLessThanOrEqual(after);
  });

  it("dismiss with unknown ID does not throw or modify state", () => {
    useNotificationStore.getState().push("Existing", "info");

    useNotificationStore.getState().dismiss("nonexistent-id");

    const { notifications } = useNotificationStore.getState();
    expect(notifications).toHaveLength(1);
  });
});
