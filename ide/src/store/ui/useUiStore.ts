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
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: GPT-5.3-Codex).
// It was reviewed and tested by a human committer.

import { create } from "zustand";

const DEFAULT_LOADING_MESSAGE = "Loading selected test...";
const GLOBAL_LOADING_TIMEOUT_MS = 15000;

let loadingSequence = 0;

interface UiState {
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  globalLoadingToken: string | null;
  globalLoadingStartedAt: number | null;
  globalLoadingTimeoutId: ReturnType<typeof setTimeout> | null;
  pendingHydrationTokens: string[];
  startGlobalLoading: (message?: string) => string;
  queueHydrationCompletionToken: (token: string) => void;
  shiftHydrationCompletionToken: () => string | null;
  finishGlobalLoading: (token: string) => void;
  clearGlobalLoading: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isGlobalLoading: false,
  globalLoadingMessage: DEFAULT_LOADING_MESSAGE,
  globalLoadingToken: null,
  globalLoadingStartedAt: null,
  globalLoadingTimeoutId: null,
  pendingHydrationTokens: [],

  startGlobalLoading: (message?: string) => {
    const previousTimeoutId = get().globalLoadingTimeoutId;
    if (previousTimeoutId) {
      clearTimeout(previousTimeoutId);
    }

    const token = `${Date.now()}-${++loadingSequence}`;
    const timeoutId = setTimeout(() => {
      const currentState = get();
      if (currentState.globalLoadingToken !== token) {
        return;
      }
      set({
        isGlobalLoading: false,
        globalLoadingMessage: DEFAULT_LOADING_MESSAGE,
        globalLoadingToken: null,
        globalLoadingStartedAt: null,
        globalLoadingTimeoutId: null,
      });
    }, GLOBAL_LOADING_TIMEOUT_MS);

    set({
      isGlobalLoading: true,
      globalLoadingMessage: message ?? DEFAULT_LOADING_MESSAGE,
      globalLoadingToken: token,
      globalLoadingStartedAt: Date.now(),
      globalLoadingTimeoutId: timeoutId,
    });

    return token;
  },

  queueHydrationCompletionToken: (token) => {
    set((state) => ({ pendingHydrationTokens: [...state.pendingHydrationTokens, token] }));
  },

  shiftHydrationCompletionToken: () => {
    const [nextToken, ...remainingTokens] = get().pendingHydrationTokens;
    if (!nextToken) {
      return null;
    }
    set({ pendingHydrationTokens: remainingTokens });
    return nextToken;
  },

  finishGlobalLoading: (token: string) => {
    const currentState = get();
    if (currentState.globalLoadingToken !== token) {
      return;
    }

    if (currentState.globalLoadingTimeoutId) {
      clearTimeout(currentState.globalLoadingTimeoutId);
    }

    set({
      isGlobalLoading: false,
      globalLoadingMessage: DEFAULT_LOADING_MESSAGE,
      globalLoadingToken: null,
      globalLoadingStartedAt: null,
      globalLoadingTimeoutId: null,
    });
  },

  clearGlobalLoading: () => {
    const timeoutId = get().globalLoadingTimeoutId;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    set({
      isGlobalLoading: false,
      globalLoadingMessage: DEFAULT_LOADING_MESSAGE,
      globalLoadingToken: null,
      globalLoadingStartedAt: null,
      globalLoadingTimeoutId: null,
      pendingHydrationTokens: [],
    });
  },
}));
