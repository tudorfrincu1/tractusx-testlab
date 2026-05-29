<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation
 Copyright (c) 2026 Catena-X Automotive Network e.V.

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

# TestLab IDE — Regression Test Plan

## Overview

This document defines the regression test suite for the TestLab IDE frontend.
All test cases validate end-user visible behavior from a third-person perspective.

**Priority Legend:**
- **P0** — Critical path, blocks release if broken
- **P1** — Important feature, should be fixed before release
- **P2** — Minor/cosmetic, can be deferred

---

## 1. Welcome Screen

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-WS-001 | Welcome screen renders on fresh load | No project in localStorage | Open IDE | Welcome screen visible with "New Project", "Open File", and example list | P0 |
| TC-WS-002 | Create new project navigates to editor | Welcome screen visible | Click "New Project" | Project explorer and block editor render, project name is "new-tck" | P0 |
| TC-WS-003 | Open file imports ZIP | Welcome screen visible, valid ZIP available | Click "Open File", select ZIP | Project loads, explorer shows tests from ZIP | P0 |
| TC-WS-004 | Load example creates project from template | Welcome screen visible | Click an example template | Project loads with template data, explorer shows tests | P0 |
| TC-WS-005 | Welcome screen hidden when project exists | Project in localStorage | Refresh page | IDE loads directly into editor, no welcome screen | P1 |

---

## 2. Project Explorer

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-PE-001 | Explorer shows TCK index at root | Project loaded | Inspect explorer | "index" entry visible at top level | P0 |
| TC-PE-002 | Explorer shows all tests in order | Project with 3+ tests | Inspect explorer | All tests listed in testOrder sequence | P0 |
| TC-PE-003 | Click test activates it | Project with tests | Click a test name | Active file changes, block editor loads test steps | P0 |
| TC-PE-004 | Context menu — rename test | Test selected | Right-click → Rename, enter new name | Test renamed in explorer and store, YAML updated | P1 |
| TC-PE-005 | Context menu — delete test | Test selected | Right-click → Delete | Confirm dialog appears | P0 |
| TC-PE-006 | Delete test confirmed removes it | Confirm dialog visible | Click "Confirm" | Test removed from explorer, store, and TCK tests array | P0 |
| TC-PE-007 | Delete test cancelled keeps it | Confirm dialog visible | Click "Cancel" | Test remains unchanged | P1 |
| TC-PE-008 | Context menu — duplicate test | Test selected | Right-click → Duplicate | New test with "-copy" suffix appears in explorer | P1 |
| TC-PE-009 | Add new test | Project loaded | Click "Add Test" button | New empty test appears in explorer and becomes active | P0 |
| TC-PE-010 | Explorer shows schemas section | Project with schemas | Inspect explorer | Schemas folder visible with schema files | P1 |
| TC-PE-011 | Explorer shows testdata section | Project with testdata | Inspect explorer | Testdata folder visible with data files | P1 |

---

## 3. Block Editor

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-BE-001 | Block editor renders workspace | Test file active | Navigate to block editor tab | Blockly workspace visible with toolbox | P0 |
| TC-BE-002 | Toolbox shows all categories | Block editor visible | Inspect toolbox | All categories present: Mock, Wait, Function, Flow, EDC, DTR, Discovery, HTTP, Notification, Validation | P0 |
| TC-BE-003 | Drag block from toolbox to workspace | Block editor visible | Drag an HTTP block to workspace | Block appears in workspace, YAML updates | P0 |
| TC-BE-004 | Connect two blocks vertically | Two blocks in workspace | Snap block B below block A | Blocks connected, step order reflects in YAML | P0 |
| TC-BE-005 | Phase enforcement — setup section | Block editor visible | Add block to setup area | Block appears in setup phase, YAML shows it under "setup:" | P1 |
| TC-BE-006 | Phase enforcement — teardown section | Block editor visible | Add block to teardown area | Block appears in teardown phase, YAML shows under "teardown:" | P1 |
| TC-BE-007 | Block deletion removes step | Block in workspace | Delete block (keyboard or context menu) | Block removed, YAML step removed | P0 |
| TC-BE-008 | Block field editing updates params | Block in workspace | Edit a text field on a block | YAML params update with new value | P0 |
| TC-BE-009 | Variable output appears as draggable | Block with output in workspace | Inspect variable refs | Output variable available for downstream blocks | P1 |
| TC-BE-010 | Undo/redo works | Block added to workspace | Ctrl+Z | Block removed; Ctrl+Shift+Z restores it | P1 |
| TC-BE-011 | Workspace state persists across navigation | Blocks arranged in workspace | Navigate away, then back | Workspace restores exact block positions | P0 |
| TC-BE-012 | Block tooltip shows on hover | Block in workspace | Hover over block | Tooltip with step description appears | P2 |
| TC-BE-013 | Details toggle expands optional fields | Block with optional params | Click "▼ More" / "▶ Details" | Additional fields appear/hide | P1 |

---

## 4. YAML Editor

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-YE-001 | YAML editor shows current test content | Test active with steps | Open YAML editor | Valid YAML displayed matching model | P0 |
| TC-YE-002 | YAML editor locked by default | Test active | Inspect YAML editor | Editor is read-only, lock icon visible | P0 |
| TC-YE-003 | Unlock YAML editor allows editing | YAML editor in locked mode | Click unlock toggle | Editor becomes editable | P1 |
| TC-YE-004 | Manual YAML edit syncs back to model | YAML editor unlocked | Edit YAML text, e.g., change step name | Model updates, block editor reflects change | P1 |
| TC-YE-005 | Invalid YAML shows error indicator | YAML editor unlocked | Type invalid YAML | Error indicator appears in status bar | P1 |
| TC-YE-006 | Variable references highlighted | YAML with `@variable_name` | Inspect YAML | Variable references have syntax highlight | P2 |
| TC-YE-007 | YAML updates live when blocks change | Block editor open side-by-side | Add block in block editor | YAML updates within debounce period | P0 |

---

## 5. Graph View

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-GV-001 | Graph view renders test flow | Test with 3+ steps active | Switch to graph view | Flow diagram shows nodes for each step | P1 |
| TC-GV-002 | Graph nodes match step order | Test with ordered steps | Inspect graph | Nodes connected top-to-bottom in step order | P1 |
| TC-GV-003 | Graph highlights active step | Step selected in block editor | Inspect graph | Corresponding node highlighted | P2 |
| TC-GV-004 | Empty test shows empty state | Test with no steps | Open graph view | Appropriate empty state message | P2 |

---

## 6. Status Bar

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-SB-001 | Step count shows current test steps | Test with 5 steps active | Inspect status bar | "5 steps" displayed | P1 |
| TC-SB-002 | Error count reflects validation errors | Test with validation errors | Inspect status bar | Error count > 0, clickable | P1 |
| TC-SB-003 | Save indicator shows when saved | Project just saved | Inspect status bar | Save timestamp or checkmark visible | P1 |
| TC-SB-004 | Dirty indicator shows unsaved changes | Edit a block field | Inspect status bar | Dirty/unsaved indicator visible | P1 |

---

## 7. Breadcrumb / Context Bar

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-BC-001 | Breadcrumb shows project > test path | Test file active | Inspect breadcrumb | Shows "ProjectName > test-name" | P1 |
| TC-BC-002 | Click breadcrumb segment navigates | Breadcrumb visible | Click project name segment | Navigates to TCK index view | P1 |
| TC-BC-003 | Breadcrumb updates on navigation | Switch from test A to test B | Inspect breadcrumb | Shows updated test name | P1 |

---

## 8. Project Info Dashboard (TCK Index)

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-PI-001 | Dashboard shows TCK metadata | TCK index active | Inspect dashboard | Name, version, description visible | P1 |
| TC-PI-002 | Test pipeline table lists all tests | TCK with tests | Inspect pipeline table | All tests listed with order and status | P1 |
| TC-PI-003 | Stages graph shows test lifecycle | TCK index active | Inspect stages graph | Visual pipeline stages rendered | P2 |
| TC-PI-004 | Edit TCK metadata updates model | Dashboard visible | Edit name field | TCK model updates, YAML reflects change | P1 |

---

## 9. Environment Editor

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-EE-001 | Environment editor shows services | Test/TCK with services | Open environment editor | Service list visible | P1 |
| TC-EE-002 | Add service creates entry | Environment editor open | Click "Add Service" | New service row appears | P1 |
| TC-EE-003 | Edit service URL updates model | Service entry visible | Change URL field | Model updates, YAML env section reflects | P1 |
| TC-EE-004 | Delete service removes it | Service entry visible | Click delete on service | Service removed from model and YAML | P1 |
| TC-EE-005 | Variables section shows shared vars | TCK with variables | Inspect environment | Variables listed with types and defaults | P1 |

---

## 10. Import / Export

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-IE-001 | Export produces valid ZIP | Project with tests | Click Export | ZIP downloaded with correct structure | P0 |
| TC-IE-002 | ZIP contains index.yaml at root | Export completed | Inspect ZIP | `{project}/index.yaml` present | P0 |
| TC-IE-003 | ZIP contains tests/ folder | Export completed | Inspect ZIP | `{project}/tests/*.yaml` for each test | P0 |
| TC-IE-004 | ZIP contains schemas/ folder | Project with schemas | Inspect ZIP | `{project}/schemas/*` present | P1 |
| TC-IE-005 | Import ZIP restores full project | Valid ZIP available | Import ZIP | Project loads with all tests, schemas, testdata | P0 |
| TC-IE-006 | Import invalid ZIP shows error | Corrupt/invalid file | Attempt import | Error notification shown, no crash | P1 |
| TC-IE-007 | Example loading works for all templates | IDE loaded | Load each example | Each example loads without error | P1 |

---

## 11. Auto-save / Persistence

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-AS-001 | Project auto-saves to localStorage | Project loaded | Make a change, wait for debounce | localStorage contains updated project | P0 |
| TC-AS-002 | Page refresh restores project | Project in localStorage | Refresh browser | Project restored with all tests and state | P0 |
| TC-AS-003 | Save timestamp updates | Auto-save triggers | Inspect lastSavedAt | Timestamp is recent | P1 |
| TC-AS-004 | Quota warning when storage near full | localStorage nearly full | Trigger save | Warning notification about storage | P2 |

---

## 12. Error Boundary

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-EB-001 | Error boundary catches render crash | Component throws error | Trigger error | Error boundary UI shown, not white screen | P0 |
| TC-EB-002 | Recovery action available | Error boundary active | Inspect UI | "Reset" or "Reload" button available | P0 |
| TC-EB-003 | Error details shown | Error boundary active | Inspect UI | Error message visible for debugging | P1 |

---

## 13. Confirm Dialogs

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-CD-001 | Delete action shows confirm dialog | Destructive action triggered | Attempt delete | Modal dialog with warning appears | P0 |
| TC-CD-002 | Confirm executes action | Dialog visible | Click "Confirm" | Action executed, dialog closes | P0 |
| TC-CD-003 | Cancel aborts action | Dialog visible | Click "Cancel" | Nothing happens, dialog closes | P0 |
| TC-CD-004 | Dialog shows context-specific message | Different delete targets | Trigger various deletes | Message reflects what will be deleted | P1 |

---

## 14. Notifications

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-NF-001 | Error notification renders | Error occurs | Trigger error | Red/error toast appears with message | P0 |
| TC-NF-002 | Warning notification renders | Warning condition | Trigger warning | Yellow/warning toast appears | P1 |
| TC-NF-003 | Dismiss notification removes it | Notification visible | Click dismiss | Notification disappears | P1 |
| TC-NF-004 | Multiple notifications stack | Multiple errors | Trigger several errors | All notifications visible, stacked | P2 |

---

## 15. Block Features

| ID | Test Name | Preconditions | Steps | Expected Result | Priority |
|----|-----------|---------------|-------|-----------------|----------|
| TC-BF-001 | Block shows text display | Block in workspace | Inspect block | Block label and step type visible | P0 |
| TC-BF-002 | Block tooltip shows description | Block in workspace | Hover block | Tooltip with step description appears | P2 |
| TC-BF-003 | Details toggle hides optional fields | Block with optional fields | Click collapse toggle | Optional fields hidden, block compact | P1 |
| TC-BF-004 | Details toggle shows optional fields | Block in collapsed state | Click expand toggle | Optional fields visible | P1 |
| TC-BF-005 | Field editing updates in real-time | Block with text field | Type in field | Value updates immediately in model | P0 |
| TC-BF-006 | Dropdown fields show valid options | Block with dropdown | Click dropdown | Valid options listed | P1 |

---

## Test Coverage Summary

| Area | P0 | P1 | P2 | Total |
|------|----|----|-----|-------|
| Welcome Screen | 4 | 1 | 0 | 5 |
| Project Explorer | 4 | 5 | 0 | 9 (TC-PE-002 split) |
| Block Editor | 5 | 5 | 1 | 11 (TC-BE-002 counted) |
| YAML Editor | 2 | 3 | 1 | 6 (TC-YE-001 counted) |
| Graph View | 0 | 2 | 2 | 4 |
| Status Bar | 0 | 4 | 0 | 4 |
| Breadcrumb | 0 | 3 | 0 | 3 |
| Project Info | 0 | 3 | 1 | 4 |
| Environment Editor | 0 | 4 | 0 | 4 (TC-EE-005 counted) |
| Import/Export | 3 | 3 | 0 | 6 (TC-IE-001 counted) |
| Auto-save | 2 | 1 | 1 | 4 |
| Error Boundary | 2 | 1 | 0 | 3 |
| Confirm Dialogs | 3 | 1 | 0 | 4 |
| Notifications | 1 | 2 | 1 | 4 |
| Block Features | 2 | 3 | 1 | 6 |
| **TOTAL** | **28** | **41** | **8** | **77** |
