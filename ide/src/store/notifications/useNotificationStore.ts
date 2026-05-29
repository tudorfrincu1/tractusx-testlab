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

/**
 * Lightweight notification store for surfacing transient messages to the user.
 * Used by persistence, compilation, and other subsystems that need to show
 * feedback without coupling to execution state.
 */

import { create } from "zustand";

export type NotificationSeverity = "error" | "warning" | "success" | "info";

export interface AppNotification {
  readonly id: string;
  readonly message: string;
  readonly severity: NotificationSeverity;
  readonly timestamp: number;
}

interface NotificationState {
  notifications: readonly AppNotification[];
  push: (message: string, severity: NotificationSeverity) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

let nextId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  push: (message, severity) => {
    const id = `notif-${Date.now()}-${nextId++}`;
    set((state) => ({
      notifications: [...state.notifications, { id, message, severity, timestamp: Date.now() }],
    }));
  },

  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  dismissAll: () => {
    set({ notifications: [] });
  },
}));

/** Fire-and-forget helper for use outside React components. */
export function notify(message: string, severity: NotificationSeverity): void {
  useNotificationStore.getState().push(message, severity);
}
