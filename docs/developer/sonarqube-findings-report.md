# SonarQube Findings Report — PR #16

> Generated: 2026-05-31 | Branch: feat/refactor/ide_backend
> Project: eclipse-tractusx_tractusx-testlab

## Summary

| Metric | Count |
|--------|-------|
| **Total Issues** | 829 |
| **Files Affected** | 193 |
| BLOCKER | 3 |
| CRITICAL | 46 |
| MAJOR | 291 |
| MINOR | 489 |

## Resolution Strategy

### Priority Order

1. **BLOCKER** — Security/reliability risks. Must fix before merge.
2. **CRITICAL** — Bugs and vulnerabilities. Must fix before merge.
3. **MAJOR** — Code smells with significant impact. Should fix.
4. **MINOR** — Low-impact code smells. Fix opportunistically.

### Batch Strategy

1. **Group by rule** — Many issues share the same rule (e.g., CSS specificity, unused imports). Fixing by rule type is fastest.
2. **Group by directory** — Fix all SCSS files together, all test files together, etc.
3. **Skip mockups** — HTML mockups are prototypes, not production code. Lowest priority.
4. **After each batch** — Re-scan fixed files with `mcp_sonarqube_analyze_file_list` to confirm.
5. **Track progress** — Check off files in the table below as they are cleaned.

---

## Top Rules by Frequency

| # | Rule | Severity | Count | Fix Strategy |
|---|------|----------|-------|--------------|
| 1 | `css:S7924` | MAJOR | 94 | |
| 2 | `typescript:S6551` | MINOR | 82 | |
| 3 | `typescript:S6759` | MINOR | 62 | |
| 4 | `typescript:S4325` | MINOR | 54 | |
| 5 | `Web:MouseEventWithoutKeyboardEquivalentCheck` | MINOR | 52 | |
| 6 | `typescript:S3863` | MINOR | 51 | |
| 7 | `typescript:S7735` | MINOR | 47 | |
| 8 | `Web:S6848` | MAJOR | 47 | |
| 9 | `typescript:S6848` | MAJOR | 38 | |
| 10 | `typescript:S3776` | CRITICAL | 34 | |
| 11 | `typescript:S1082` | MINOR | 33 | |
| 12 | `typescript:S3358` | MAJOR | 24 | |
| 13 | `typescript:S7778` | MINOR | 18 | |
| 14 | `typescript:S6853` | MAJOR | 17 | |
| 15 | `typescript:S7763` | MINOR | 14 | |
| 16 | `typescript:S1128` | MINOR | 12 | |
| 17 | `typescript:S6353` | MINOR | 10 | |
| 18 | `typescript:S7764` | MINOR | 10 | |
| 19 | `javascript:S7781` | MINOR | 9 | |
| 20 | `typescript:S7744` | MINOR | 8 | |
| 21 | `typescript:S6819` | MAJOR | 7 | |
| 22 | `typescript:S6479` | MAJOR | 6 | |
| 23 | `typescript:S6847` | MAJOR | 6 | |
| 24 | `css:S4648` | MAJOR | 5 | |
| 25 | `python:S125` | MAJOR | 5 | |

---

## File Checklist

### Stubs (1 files, 3 issues, 3 blocker+critical)

| Done | File | Total | B | C | Ma | Mi |
|:----:|------|:-----:|:-:|:-:|:--:|:--:|
| [x] | `stubs/ccm-sut/management.py` | 3 | 3 | 0 | 0 | 0 | <!-- FIXED: 3x python:S8411 — split stacked DELETE decorators into 3 handlers with path params in signature; rescan 0 findings -->

### Python Backend (5 files, 7 issues, 2 blocker+critical)

| Done | File | Total | B | C | Ma | Mi |
|:----:|------|:-----:|:-:|:-:|:--:|:--:|
| [x] | `src/tractusx_testlab/compiler/_ir_helpers.py` | 2 | 0 | 2 | 0 | 0 | <!-- RESOLVED BY REFACTOR: file split into compiler/ir/ (Phase 6); rescan of ir/_helpers.py, builder.py, _compilation.py, _assets.py shows 0 S3776 findings -->
| [ ] | `src/tractusx_testlab/compiler/_ir_compilation.py` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `src/tractusx_testlab/compiler/_expressions.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `src/tractusx_testlab/server/streaming.py` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `src/tractusx_testlab/steps/pull_data/_executor.py` | 1 | 0 | 0 | 0 | 1 |

### Test Files (10 files, 20 issues, 5 blocker+critical)

| Done | File | Total | B | C | Ma | Mi |
|:----:|------|:-----:|:-:|:-:|:--:|:--:|
| [x] | `tests/test_test_runner.py` | 4 | 0 | 4 | 0 | 0 |
| [x] | `tests/test_mock_server_integration.py` | 3 | 0 | 1 | 0 | 2 |
| [ ] | `tests/test_mocks.py` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `tests/test_pause_endpoint.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `tests/test_pause_resume_events.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `tests/test_resume.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `tests/test_resume_endpoint.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `tests/test_models.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `tests/test_pause.py` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `tests/test_precondition_execution.py` | 5 | 0 | 0 | 0 | 5 |

### IDE TypeScript/React (140 files, 571 issues, 37 blocker+critical)

| Done | File | Total | B | C | Ma | Mi |
|:----:|------|:-----:|:-:|:-:|:--:|:--:|
| [x] | `ide/src/services/yaml/yamlToModel.ts` | 21 | 0 | 0 | 0 | 21 | CRITICAL 3→0 (already resolved by prior refactor; live scan, skipped) |
| [ ] | `ide/src/features/block-editor/blocks/common/catalog/catalogLoader.ts` | 4 | 0 | 4 | 0 | 0 |
| [ ] | `ide/src/features/block-editor/blocks/json/modal/jsonVarRefs.ts` | 11 | 0 | 3 | 0 | 8 |
| [ ] | `ide/src/features/block-editor/blocks/registration/steps/catalogBlocks.ts` | 5 | 0 | 2 | 1 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/populate/assertions/assertionPopulators.ts` | 5 | 0 | 2 | 0 | 3 |
| [x] | `ide/src/services/project/projectImportExport.ts` | 0 | 0 | 0 | 0 | 0 | CRITICAL 2→0 (already resolved; live scan clean, skipped) |
| [ ] | `ide/src/features/block-editor/sync/phaseEnforcement.ts` | 2 | 0 | 2 | 0 | 0 |
| [ ] | `ide/src/layout/panels/EditorPanels.tsx` | 19 | 0 | 1 | 3 | 15 |
| [ ] | `ide/src/features/preconditions/list/PreconditionEditor.tsx` | 8 | 0 | 1 | 4 | 3 |
| [ ] | `ide/src/features/block-editor/fields/wrappedText/FieldWrappedText.ts` | 3 | 0 | 1 | 1 | 1 |
| [ ] | `ide/src/features/block-editor/fields/wrappedText/bubblePatch.ts` | 2 | 0 | 1 | 1 | 0 |
| [x] | `ide/src/services/sequence/modelToSequence.ts` | 10 | 0 | 0 | 0 | 10 | CRITICAL 1→0 (already resolved; live scan, skipped) |
| [ ] | `ide/src/features/block-editor/serialization/populate/populateTest.ts` | 7 | 0 | 1 | 0 | 6 |
| [ ] | `ide/src/shared/ui/VariableEditorDialog/TestOverridesPanel.tsx` | 5 | 0 | 1 | 0 | 4 |
| [ ] | `ide/src/features/block-editor/blocks/common/fields/dropdownProviders.ts` | 4 | 0 | 1 | 0 | 3 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/builder/dataFlowBuilder.ts` | 4 | 0 | 1 | 0 | 3 |
| [x] | `ide/src/services/graph/modelToGraph.ts` | 4 | 0 | 0 | 0 | 4 | CRITICAL 1→0 (S3776: buildStepGraph extracted to stepGraphBuilder.ts) |
| [x] | `ide/src/services/yaml/yamlLineMap.ts` | 3 | 0 | 0 | 0 | 3 | CRITICAL 1→0 (S3776: findStepLineRange scan logic extracted to scanLine/handleListItem/captureItemType) |
| [ ] | `ide/src/services/project/projectDocumentParser.ts` | 3 | 0 | 1 | 0 | 2 |
| [ ] | `ide/src/features/environment-editor/services/InternalServiceCard.tsx` | 12 | 0 | 0 | 10 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/values/pathValueBlocks.ts` | 3 | 0 | 1 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/toolbox/toolboxBuilder.ts` | 3 | 0 | 1 | 0 | 2 |
| [ ] | `ide/src/features/yaml-editor/editors/TestdataEditor.tsx` | 2 | 0 | 1 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/blocks/path/core/pathBuilder.ts` | 2 | 0 | 1 | 0 | 1 |
| [x] | `ide/src/services/validation/validator.ts` | 1 | 0 | 0 | 0 | 1 | CRITICAL 1→0 (already resolved; live scan, skipped) |
| [ ] | `ide/src/features/block-editor/blocks/common/contextMenu/spawnOutputsMenu.ts` | 1 | 0 | 1 | 0 | 0 |
| [ ] | `ide/src/features/block-editor/toolbox/connectorCategory.ts` | 1 | 0 | 1 | 0 | 0 |
| [ ] | `ide/src/features/block-editor/blocks/api-path/modal/ApiPathBuilderModal.tsx` | 6 | 0 | 0 | 5 | 1 |
| [ ] | `ide/src/features/environment-editor/services/ExternalServiceCard.tsx` | 6 | 0 | 0 | 4 | 2 |
| [ ] | `ide/src/features/preconditions/modal/AddPreconditionModal.tsx` | 4 | 0 | 0 | 4 | 0 |
| [ ] | `ide/src/features/export/ExportDialog.tsx` | 7 | 0 | 0 | 3 | 4 |
| [ ] | `ide/src/features/tck-dashboard/forms/ChipFields.tsx` | 7 | 0 | 0 | 3 | 4 |
| [ ] | `ide/src/features/project-explorer/contextMenu/ExplorerContextMenuParts.tsx` | 6 | 0 | 0 | 3 | 3 |
| [ ] | `ide/src/features/export/ExportDialogParts.tsx` | 5 | 0 | 0 | 3 | 2 |
| [ ] | `ide/src/features/execution/ExecutionPanel.tsx` | 4 | 0 | 0 | 3 | 1 |
| [ ] | `ide/src/layout/topbar/controls/CompileButton.tsx` | 4 | 0 | 0 | 3 | 1 |
| [ ] | `ide/src/layout/topbar/controls/BackendSettings.tsx` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/features/block-editor/ui/ValidationPanel.tsx` | 8 | 0 | 0 | 2 | 6 |
| [ ] | `ide/src/features/tck-dashboard/forms/FormFields.tsx` | 6 | 0 | 0 | 2 | 4 |
| [ ] | `ide/src/shared/ui/ServiceDialog/ServiceDialog.tsx` | 6 | 0 | 0 | 2 | 4 |
| [ ] | `ide/src/shared/ui/ConfirmDialog/ConfirmDialog.tsx` | 5 | 0 | 0 | 2 | 3 |
| [ ] | `ide/src/shared/ui/PreconditionsDialog/PreconditionsDialog.tsx` | 5 | 0 | 0 | 2 | 3 |
| [ ] | `ide/src/shared/ui/SchemaDownloadDialog/SchemaDownloadDialog.tsx` | 5 | 0 | 0 | 2 | 3 |
| [ ] | `ide/src/shared/ui/VariableEditorDialog/VariableEditorDialog.tsx` | 5 | 0 | 0 | 2 | 3 |
| [ ] | `ide/src/app/App.tsx` | 4 | 0 | 0 | 2 | 2 |
| [ ] | `ide/src/App.tsx` | 4 | 0 | 0 | 2 | 2 |
| [ ] | `ide/src/features/environment-editor/services/FieldWithToggle.tsx` | 3 | 0 | 0 | 2 | 1 |
| [ ] | `ide/src/features/environment-editor/variables/VariableRow.tsx` | 3 | 0 | 0 | 2 | 1 |
| [ ] | `ide/src/features/environment-editor/variables/VariablesSection.tsx` | 3 | 0 | 0 | 2 | 1 |
| [ ] | `ide/src/features/block-editor/blocks/path/modal/PathBuilderModal.tsx` | 3 | 0 | 0 | 2 | 1 |
| [ ] | `ide/src/shared/ui/AppErrorBoundary/AppErrorBoundary.tsx` | 3 | 0 | 0 | 2 | 1 |
| [ ] | `ide/src/features/block-editor/BlockEditorErrorBoundary.tsx` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `ide/src/features/yaml-editor/VariablePicker/VariablePicker.tsx` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `ide/src/features/environment-editor/services/ServiceCard.tsx` | 9 | 0 | 0 | 1 | 8 |
| [ ] | `ide/src/layout/panels/PanelControls.tsx` | 9 | 0 | 0 | 1 | 8 |
| [ ] | `ide/src/store/project/useProjectStore.ts` | 8 | 0 | 0 | 1 | 7 |
| [ ] | `ide/src/features/block-editor/blocks/registration/assertions/assertionBlocks.ts` | 14 | 0 | 0 | 0 | 14 |
| [ ] | `ide/src/shared/ui/ServiceDialog/ServiceListPanel.tsx` | 5 | 0 | 0 | 1 | 4 |
| [ ] | `ide/src/features/tck-dashboard/pipeline/TestPipelineTable.tsx` | 4 | 0 | 0 | 1 | 3 |
| [ ] | `ide/src/layout/status/NotificationBar.tsx` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/features/preconditions/list/PreconditionsList.tsx` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/features/project-explorer/contextMenu/ExplorerContextMenu.tsx` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/panels/StageListSidebar.tsx` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/common/outputDispenser.ts` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/json/modal/JsonEditorModal.tsx` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/layout/panels/EditableFileName.tsx` | 3 | 0 | 0 | 1 | 2 |
| [ ] | `ide/src/features/environment-editor/services/ServicesSection.tsx` | 2 | 0 | 0 | 1 | 1 |
| [ ] | `ide/src/features/project-explorer/tree/TreeRow.tsx` | 2 | 0 | 0 | 1 | 1 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/panels/AnnotationsBar.tsx` | 2 | 0 | 0 | 1 | 1 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/panels/NodeDetailPanel.tsx` | 2 | 0 | 0 | 1 | 1 |
| [ ] | `ide/src/features/block-editor/fields/templateString/FieldTemplateString.ts` | 2 | 0 | 0 | 1 | 1 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/PipelineGraphView.tsx` | 2 | 0 | 0 | 1 | 1 |
| [ ] | `ide/src/services/project/projectFilePersistence.ts` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/preconditions/rules/ConstraintRow.tsx` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/panels/MetadataEditor.tsx` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/services/project/projectImportTransforms.ts` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/block-editor/BlocklyWorkspace.tsx` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/block-editor/blocks/json/modal/useJsonEditor.ts` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/block-editor/blocks/path/schema/SchemaTree.tsx` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/block-editor/blocks/registration/assertions/assertionBlockResolvers.ts` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/block-editor/config/blockDefinitions.ts` | 10 | 0 | 0 | 0 | 10 |
| [ ] | `ide/src/features/block-editor/fields/templateString/templateStringParser.ts` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/block-editor/serialization/populate/modelToWorkspace.ts` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/sequence-view/SequenceDiagram.tsx` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/features/environment-editor/preview/yamlPreview.ts` | 8 | 0 | 0 | 0 | 8 |
| [ ] | `ide/src/features/block-editor/blocks/registration/steps/registerParamField.ts` | 7 | 0 | 0 | 0 | 7 |
| [ ] | `ide/src/features/block-editor/serialization/serialize/validation/validateBlockFlattener.ts` | 5 | 0 | 0 | 0 | 5 |
| [ ] | `ide/src/layout/topbar/TopBar.tsx` | 5 | 0 | 0 | 0 | 5 |
| [ ] | `ide/src/features/block-editor/blocks/registration/utility/utilityBlocks.ts` | 5 | 0 | 0 | 0 | 5 |
| [ ] | `ide/src/layout/topbar/TopBarExampleMenu.tsx` | 5 | 0 | 0 | 0 | 5 |
| [ ] | `ide/src/shared/ui/VariableEditorDialog/TckVariableTable.tsx` | 5 | 0 | 0 | 0 | 5 |
| [ ] | `ide/src/features/project-explorer/actions/ExplorerActions.tsx` | 4 | 0 | 0 | 0 | 4 |
| [ ] | `ide/src/__tests__/store/notificationStore.test.ts` | 4 | 0 | 0 | 0 | 4 |
| [ ] | `ide/src/features/project-explorer/ProjectExplorer.tsx` | 3 | 0 | 0 | 0 | 3 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/panels/VariablesOverview.tsx` | 3 | 0 | 0 | 0 | 3 |
| [ ] | `ide/src/features/block-editor/blocks/registration/structure/rootBlocks.ts` | 3 | 0 | 0 | 0 | 3 |
| [ ] | `ide/src/features/block-editor/serialization/serialize/writer/policySerializers.ts` | 3 | 0 | 0 | 0 | 3 |
| [ ] | `ide/src/shared/ui/ServiceDialog/ServiceForm.tsx` | 3 | 0 | 0 | 0 | 3 |
| [ ] | `ide/src/features/environment-editor/EnvironmentEditor.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/yaml-editor/VariablePicker/useVariableScopes.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/layout/status/StatusBar.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/populate/assertions/assertionGrouping.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/populate/assertions/assertionNormalization.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/graph/PipelineEdge.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/graph/PipelineGraphCanvas.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/services/project/exampleProjectLoader.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/__tests__/store/projectStore.test.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/policy/policyBlocks.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/structure/authBlocks.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/structure/filterExpressionBlock.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/structure/preconditionBlocks.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/structure/structuralBlocks.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/blocks/registration/values/literalValueBlocks.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/hooks/useModelSync.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/serializationParts/structuralBlockBuilders.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/serializationParts/workspaceBlockFactory.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/serialize/validation/validationBlockReaders.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/serialization/serialize/writer/preconditionSerializers.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/ui/WarningTooltip.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/layout/WelcomeScreen/WelcomeCards.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/layout/status/useSaveIndicator.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/layout/topbar/ContextBarIcons.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/layout/topbar/TopBarButtons.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/shared/ui/VariableEditorDialog/VariableRow.tsx` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/models/environment.ts` | 2 | 0 | 0 | 0 | 2 |
| [ ] | `ide/src/features/block-editor/hooks/useWorkspaceInit.helpers.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/hooks/useBlocklyInit.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/tck-dashboard/dataflow/panels/MetadataSummary.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/yaml-editor/editors/MonacoEditor.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/blocks/json/modal/HighlightedEditor.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/blocks/path/schema/schemaResolver.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/hooks/useWorkspaceInit.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/serialization/serializationParts/valueBlockBuilders.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/serialization/unsupportedStepPayload.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/block-editor/sync/workspaceListeners.ts` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/features/execution/StepCard.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/layout/topbar/TopBarHamburgerMenu.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/shared/ui/PreconditionsDialog/ConstraintRow.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/shared/ui/PreconditionsDialog/PolicySection.tsx` | 1 | 0 | 0 | 0 | 1 |
| [ ] | `ide/src/store/project/projectAssetActions.ts` | 1 | 0 | 0 | 0 | 1 |

### Stylesheets (SCSS) (30 files, 84 issues, 0 blocker+critical)

| Done | File | Total | B | C | Ma | Mi |
|:----:|------|:-----:|:-:|:-:|:--:|:--:|
| [ ] | `ide/src/assets/styles/features/_pipeline-detail-panel.scss` | 7 | 0 | 0 | 7 | 0 |
| [ ] | `ide/src/assets/styles/components/_tck-variable-table.scss` | 5 | 0 | 0 | 5 | 0 |
| [ ] | `ide/src/assets/styles/features/_execution-panel.scss` | 5 | 0 | 0 | 5 | 0 |
| [ ] | `ide/src/assets/styles/features/_json-editor-modal.scss` | 5 | 0 | 0 | 5 | 0 |
| [ ] | `ide/src/assets/styles/features/_metadata-editor.scss` | 5 | 0 | 0 | 5 | 0 |
| [ ] | `ide/src/assets/styles/features/_path-builder-modal.scss` | 5 | 0 | 0 | 5 | 0 |
| [ ] | `ide/src/assets/styles/features/_graph-info-panel.scss` | 4 | 0 | 0 | 4 | 0 |
| [ ] | `ide/src/assets/styles/features/_metadata-summary.scss` | 4 | 0 | 0 | 4 | 0 |
| [ ] | `ide/src/assets/styles/features/_preconditions-panel.scss` | 4 | 0 | 0 | 4 | 0 |
| [ ] | `ide/src/assets/styles/layout/_notification-bar.scss` | 4 | 0 | 0 | 4 | 0 |
| [ ] | `ide/src/assets/styles/features/_environment-editor.scss` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/assets/styles/features/_schema-tree.scss` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/assets/styles/features/_tck-dashboard.scss` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/assets/styles/features/_validation-panel.scss` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/assets/styles/features/_variable-picker.scss` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/assets/styles/layout/_app-shell.scss` | 3 | 0 | 0 | 3 | 0 |
| [ ] | `ide/src/assets/styles/base/_global.scss` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `ide/src/assets/styles/features/_environment-variables-table.scss` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `ide/src/assets/styles/layout/_bottom-panel.scss` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `ide/src/assets/styles/layout/_network-tab.scss` | 2 | 0 | 0 | 2 | 0 |
| [ ] | `ide/src/assets/styles/components/_app-error-boundary.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/components/_preconditions-dialog.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/features/_api-path-builder-modal.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/features/_chip-fields.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/features/_environment-service-card.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/features/_graph-node-types.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/features/_step-card.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/layout/_execution-controls.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/layout/_network-detail-overlay.scss` | 1 | 0 | 0 | 1 | 0 |
| [ ] | `ide/src/assets/styles/layout/_topbar.scss` | 1 | 0 | 0 | 1 | 0 |

### Mockups (HTML) (6 files, 143 issues, 2 blocker+critical)

| Done | File | Total | B | C | Ma | Mi |
|:----:|------|:-----:|:-:|:-:|:--:|:--:|
| [ ] | `ide/mockups/edc-shortcut-blocks-mockup.html` | 44 | 0 | 0 | 22 | 22 |
| [ ] | `ide/mockups/bottom-panel.html` | 31 | 0 | 1 | 11 | 19 |
| [ ] | `ide/mockups/variable-output-discovery-mockup.html` | 28 | 0 | 0 | 18 | 10 |
| [ ] | `ide/mockups/variables-editor-mockup.html` | 26 | 0 | 0 | 16 | 10 |
| [ ] | `ide/mockups/preconditions-panel-mockup.html` | 12 | 0 | 1 | 4 | 7 |
| [ ] | `ide/mockups/yaml-syntax-comparison.html` | 2 | 0 | 0 | 2 | 0 |

---

## Detailed Findings (BLOCKER + CRITICAL files only)

<details>
<summary><b>ide/src/features/block-editor/blocks/common/catalog/catalogLoader.ts</b> — 4 issues (4 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S2004` | Refactor this code to not nest functions more than 4 levels deep. |
| ? | CRITICAL | `typescript:S2004` | Refactor this code to not nest functions more than 4 levels deep. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed. |

</details>

<details>
<summary><b>tests/test_test_runner.py</b> — 4 issues (4 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `python:S5443` | Make sure publicly writable directories are used safely here. |
| ? | CRITICAL | `python:S5443` | Make sure publicly writable directories are used safely here. |
| ? | CRITICAL | `python:S5443` | Make sure publicly writable directories are used safely here. |
| ? | CRITICAL | `python:S5443` | Make sure publicly writable directories are used safely here. |

</details>

<details>
<summary><b>ide/src/services/yaml/yamlToModel.ts</b> — 88 issues (3 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MINOR | `typescript:S1128` | Remove this unused import of 'VariableDefinition'. |
| ? | MINOR | `typescript:S6551` | 'metadata.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'raw.id ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'raw.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.id' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.namespace' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.testlab' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.dataspace_version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.dataspace_version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'metadata.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'raw.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'raw.id ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.id' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.namespace' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.testlab' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.license' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.dataspace_version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.dataspace_version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.dataspace_version' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'metadata.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'raw.description' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since the receiver accepts the original type of the expression. |
| ? | MINOR | `typescript:S6551` | 'obj.id ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.uses ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'obj.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'obj.if' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.id ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.uses ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'obj.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.uses ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'obj.id ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'obj.version' will use Object's default stringification format ('[object Object]') when stringified. |

</details>

<details>
<summary><b>ide/src/features/block-editor/blocks/json/modal/jsonVarRefs.ts</b> — 11 issues (3 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |

</details>

<details>
<summary><b>stubs/ccm-sut/management.py</b> — 3 issues (3 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | BLOCKER | `python:S8411` | Add path parameter "asset_id" to the function signature. |
| ? | BLOCKER | `python:S8411` | Add path parameter "policy_id" to the function signature. |
| ? | BLOCKER | `python:S8411` | Add path parameter "contract_id" to the function signature. |

</details>

<details>
<summary><b>ide/src/features/block-editor/serialization/populate/assertions/assertionPopulators.ts</b> — 5 issues (2 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed. |
| ? | MINOR | `typescript:S6551` | 'normalized.output ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'normalized.type ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'r.output ?? "?"' will use Object's default stringification format ('[object Object]') when stringified. |

</details>

<details>
<summary><b>ide/src/features/block-editor/blocks/registration/steps/catalogBlocks.ts</b> — 5 issues (2 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 30 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MINOR | `typescript:S3863` | 'blockly' imported multiple times. |
| ? | MINOR | `typescript:S3863` | 'blockly' imported multiple times. |

</details>

<details>
<summary><b>ide/src/services/project/projectImportExport.ts</b> — 2 issues (2 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed. |

</details>

<details>
<summary><b>src/tractusx_testlab/compiler/_ir_helpers.py</b> — 2 issues (2 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `python:S3776` | Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed. |
| ? | CRITICAL | `python:S3776` | Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed. |

</details>

<details>
<summary><b>ide/src/features/block-editor/sync/phaseEnforcement.ts</b> — 2 issues (2 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed. |
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed. |

</details>

<details>
<summary><b>ide/mockups/bottom-panel.html</b> — 31 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `javascript:S3776` | Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed. |
| ? | MAJOR | `css:S7924` | Text does not meet the minimal contrast requirement with its background. |
| ? | MAJOR | `css:S7924` | Text does not meet the minimal contrast requirement with its background. |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <tr> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <tr> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <tr> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <tr> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <tr> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <span> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <span> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <span> tag. |
| ? | MINOR | `javascript:S1313` | Make sure using a hardcoded IP address 10.0.2.15 is safe here. |
| ? | MINOR | `javascript:S7773` | Prefer `Number.parseInt` over `parseInt`. |
| ? | MINOR | `javascript:S2486` | Handle this exception or don't catch it at all. |
| ? | MINOR | `javascript:S7735` | Unexpected negated condition. |
| ? | MINOR | `javascript:S7773` | Prefer `Number.isNaN` over `isNaN`. |

</details>

<details>
<summary><b>ide/src/layout/panels/EditorPanels.tsx</b> — 19 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed. |
| ? | MAJOR | `typescript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MAJOR | `typescript:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `typescript:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MINOR | `typescript:S3863` | '@/features/block-editor' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/features/yaml-editor' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/store' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/features/block-editor' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/store' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/store' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/features/yaml-editor' imported multiple times. |
| ? | MINOR | `typescript:S6759` | Mark the props of the component as read-only. |
| ? | MINOR | `typescript:S7764` | Prefer `globalThis` over `window`. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |
| ? | MINOR | `typescript:S1082` | Visible, non-interactive elements with click handlers must have at least one keyboard listener. |
| ? | MINOR | `typescript:S1082` | Visible, non-interactive elements with click handlers must have at least one keyboard listener. |

</details>

<details>
<summary><b>ide/mockups/preconditions-panel-mockup.html</b> — 12 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `javascript:S3776` | Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed. |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `Web:S6848` | Avoid non-native interactive elements. If using native HTML is not possible, add an appropriate role and support for tab |
| ? | MAJOR | `javascript:S3358` | Extract this nested ternary operation into an independent statement. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `Web:MouseEventWithoutKeyboardEquivalentCheck` | Add a 'onKeyPress/onKeyDown/onKeyUp' attribute to this <div> tag. |
| ? | MINOR | `javascript:S7781` | Prefer `String#replaceAll()` over `String#replace()`. |
| ? | MINOR | `javascript:S7781` | Prefer `String#replaceAll()` over `String#replace()`. |
| ? | MINOR | `javascript:S7781` | Prefer `String#replaceAll()` over `String#replace()`. |
| ? | MINOR | `javascript:S6644` | Unnecessary use of conditional expression for default assignment. |

</details>

<details>
<summary><b>ide/src/services/sequence/modelToSequence.ts</b> — 11 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 26 to the 15 allowed. |
| ? | MINOR | `typescript:S6594` | Use the "RegExp.exec()" method instead. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\W' instead of '[^a-zA-Z0-9_]'. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |
| ? | MINOR | `typescript:S7778` | Do not call `Array#push()` multiple times. |

</details>

<details>
<summary><b>ide/src/features/preconditions/list/PreconditionEditor.tsx</b> — 8 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 33 to the 15 allowed. |
| ? | MAJOR | `typescript:S6853` | A form label must be associated with a control. |
| ? | MAJOR | `typescript:S6853` | A form label must be associated with a control. |
| ? | MAJOR | `typescript:S4624` | Refactor this code to not use nested template literals. |
| ? | MAJOR | `typescript:S6819` | Use <input type="button">, <input type="image">, <input type="reset">, <input type="submit">, or <button> instead of the |
| ? | MINOR | `typescript:S6551` | 'v' may use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'wv' may use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'val ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |

</details>

<details>
<summary><b>ide/src/features/block-editor/serialization/populate/populateTest.ts</b> — 7 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 62 to the 15 allowed. |
| ? | MINOR | `typescript:S6551` | 'step.with.file' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'exportVar' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'varName' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'step.with.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'step.with.path' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S6551` | 'step.with.name // "schema_var"' will use Object's default stringification format ('[object Object]') when stringified. |

</details>

<details>
<summary><b>ide/src/shared/ui/VariableEditorDialog/TestOverridesPanel.tsx</b> — 5 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S2871` | Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically. |
| ? | MINOR | `typescript:S7744` | The empty object is useless. |
| ? | MINOR | `typescript:S6759` | Mark the props of the component as read-only. |
| ? | MINOR | `typescript:S7735` | Unexpected negated condition. |
| ? | MINOR | `typescript:S6551` | 'currentWith[varName] ?? ""' will use Object's default stringification format ('[object Object]') when stringified. |

</details>

<details>
<summary><b>ide/src/features/block-editor/blocks/common/fields/dropdownProviders.ts</b> — 4 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |
| ? | MINOR | `typescript:S1128` | Remove this unused import of 'useServiceStore'. |
| ? | MINOR | `typescript:S3863` | '@/store' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '@/store' imported multiple times. |

</details>

<details>
<summary><b>ide/src/features/tck-dashboard/dataflow/builder/dataFlowBuilder.ts</b> — 4 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 69 to the 15 allowed. |
| ? | MINOR | `typescript:S6551` | 'step.with.name' will use Object's default stringification format ('[object Object]') when stringified. |
| ? | MINOR | `typescript:S4158` | Review this usage of "sourceEdges" as it can only be empty here. |
| ? | MINOR | `typescript:S6353` | Use concise character class syntax '\w' instead of '[a-zA-Z0-9_]'. |

</details>

<details>
<summary><b>ide/src/services/graph/modelToGraph.ts</b> — 4 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 70 to the 15 allowed. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |
| ? | MINOR | `typescript:S7754` | Prefer `.some(���)` over `.find(���)`. |

</details>

<details>
<summary><b>ide/src/services/yaml/yamlLineMap.ts</b> — 4 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed. |
| ? | MINOR | `typescript:S6594` | Use the "RegExp.exec()" method instead. |
| ? | MINOR | `typescript:S6594` | Use the "RegExp.exec()" method instead. |
| ? | MINOR | `typescript:S6594` | Use the "RegExp.exec()" method instead. |

</details>

<details>
<summary><b>ide/src/services/project/projectDocumentParser.ts</b> — 3 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |

</details>

<details>
<summary><b>ide/src/features/block-editor/fields/wrappedText/FieldWrappedText.ts</b> — 3 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed. |
| ? | MAJOR | `typescript:S7762` | Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |

</details>

<details>
<summary><b>ide/src/features/block-editor/blocks/registration/values/pathValueBlocks.ts</b> — 3 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed. |
| ? | MINOR | `typescript:S3863` | 'blockly' imported multiple times. |
| ? | MINOR | `typescript:S3863` | 'blockly' imported multiple times. |

</details>

<details>
<summary><b>ide/src/features/block-editor/toolbox/toolboxBuilder.ts</b> — 3 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed. |
| ? | MINOR | `typescript:S3863` | '../blocks' imported multiple times. |
| ? | MINOR | `typescript:S3863` | '../blocks' imported multiple times. |

</details>

<details>
<summary><b>tests/test_mock_server_integration.py</b> — 3 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `python:S5443` | Make sure publicly writable directories are used safely here. |
| ? | MINOR | `python:S7504` | Remove this unnecessary `list()` call on an already iterable object. |
| ? | MINOR | `python:S7504` | Remove this unnecessary `list()` call on an already iterable object. |

</details>

<details>
<summary><b>ide/src/features/block-editor/fields/wrappedText/bubblePatch.ts</b> — 2 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed. |
| ? | MAJOR | `typescript:S7761` | Prefer `.dataset` over `getAttribute(���)`. |

</details>

<details>
<summary><b>ide/src/features/yaml-editor/editors/TestdataEditor.tsx</b> — 2 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |

</details>

<details>
<summary><b>ide/src/features/block-editor/blocks/path/core/pathBuilder.ts</b> — 2 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 47 to the 15 allowed. |
| ? | MINOR | `typescript:S7780` | `String.raw` should be used to avoid escaping `\`. |

</details>

<details>
<summary><b>ide/src/services/validation/validator.ts</b> — 2 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |
| ? | MINOR | `typescript:S4325` | This assertion is unnecessary since it does not change the type of the expression. |

</details>

<details>
<summary><b>ide/src/features/block-editor/blocks/common/contextMenu/spawnOutputsMenu.ts</b> — 1 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed. |

</details>

<details>
<summary><b>ide/src/features/block-editor/toolbox/connectorCategory.ts</b> — 1 issues (1 blocker/critical)</summary>

| Line | Severity | Rule | Message |
|------|----------|------|---------|
| ? | CRITICAL | `typescript:S3776` | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |

</details>
