<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# How to Debug Common Issues

## Block doesn't appear in the toolbox

1. Check `ide/public/blocks/index.json` — is the block path listed?
2. Check the block JSON file — is it valid JSON? Open browser DevTools → Network tab → look for 404s
3. If the category has `service_type`, check if the corresponding service is configured in the Service Dialog
4. Open browser DevTools → Console — look for catalog loading errors

## YAML doesn't update when blocks change

1. Check `lastEditSource` in the store (React DevTools → Zustand store)
2. If stuck at `"yaml"`, the sync loop may be broken — check for errors in `workspaceToModel()`
3. Check the debounce timers haven't been set too high

## Variables don't appear in dropdowns

1. Variables come from multiple sources — see [Block System → collectWorkspaceVariables](../developer/block-system.md)
2. Check if the step block has `outputs` defined in its JSON — outputs auto-generate `store_in_memory`
3. For templates, check `TEMPLATE_OUTPUTS` in `variableCollection.ts`
4. Dropdowns refresh on a 300ms debounce after workspace changes — try waiting

## Block positions reset after file switch

1. Canvas state is saved per file in `useProjectStore.workspaceStates`
2. Check that `projectGeneration` hasn't changed (prevents stale saves)
3. Verify `setWorkspaceState()` is called before the file switch completes

## Python step not found at runtime

1. Check the `@step("type_name")` decorator — the type must match the block JSON's `type` field exactly
2. Check the module is imported in `steps/__init__.py`
3. For version-specific steps, check the `dataspace_version` parameter matches the runtime config
