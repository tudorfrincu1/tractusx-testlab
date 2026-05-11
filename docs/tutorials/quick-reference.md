<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

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

# Quick Reference: File Locations

| Task | IDE files to modify | Python files to modify |
|------|--------------------|-----------------------|
| New block | `public/blocks/{category}/{name}.json`, `public/blocks/index.json` | — |
| New category | Same as above + `blockColors.ts`, possibly `toolboxBuilder.ts` | — |
| New step executor | — | `steps/{module}.py`, `steps/__init__.py` |
| New service type | `useServiceStore.ts`, `toolboxBuilder.ts` | `models/enums.py`, `services/manager.py` |
| New assertion | `blocks/assertionBlocks.ts`, `serialization/helpers.ts`, `serialization/populateTest.ts` | `steps/assertions.py` |
| New template | `public/templates/{name}.yaml`, `public/templates/index.json`, `blocks/variableCollection.ts` | — |
| New example | `public/examples/{name}/`, `WelcomeScreen.tsx`, `TopBar.tsx` | — |
| New YAML field | `models/schema.ts`, `workspaceToModel.ts`, `populateTest.ts`, `modelToYaml.ts`, `yamlToModel.ts`, `validator.ts` | `models/definitions.py`, `compiler/validator.py` |
| New component | `components/{Name}/{Name}.tsx`, `components/{Name}/{Name}.css` | — |
