#################################################################################
# Eclipse Tractus-X - Software Development KIT
#
# Copyright (c) 2026 Catena-X Autonomotive Network e.V.
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). 
## It was reviewed and tested by a human committer.

"""YAML parser with safe loading and string-based file inclusion."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional, Union

import yaml

from tractusx_sdk.extensions.testlab.syntax import defaults, keys, patterns

from tractusx_sdk.extensions.testlab.models import (
    Assertion,
    AssertionType,
    AssertionSeverity,
    DependencyRef,
    FailurePolicy,
    ImportDefinition,
    ListenerDefinition,
    ScriptDefinition,
    ScriptKind,
    ServiceDefinition,
    ServiceType,
    SdkCallMode,
    StepDefinition,
    TestCaseDefinition,
    ValueSource,
    VariableDefinition,
)

_INCLUDE_PREFIX = "!include "


class YamlParser:
    """Parses YAML test scripts and test-case manifests into definition models."""

    @staticmethod
    def parse_script(path: Path) -> ScriptDefinition:
        data = YamlParser._load_yaml(path)
        return YamlParser._build_script(data)

    @staticmethod
    def parse_test_case(path: Path) -> TestCaseDefinition:
        data = YamlParser._load_yaml(path)
        return YamlParser._build_test_case(data, base_dir=path.parent)

    @staticmethod
    def parse_script_from_dict(data: dict) -> ScriptDefinition:
        return YamlParser._build_script(data)

    @staticmethod
    def parse_test_case_from_dict(data: dict, base_dir: Optional[Path] = None) -> TestCaseDefinition:
        return YamlParser._build_test_case(data, base_dir=base_dir)

    @staticmethod
    def _load_yaml(path: Path) -> dict:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not isinstance(data, dict):
            raise ValueError(f"Expected YAML mapping at top level in {path}")
        return data

    @staticmethod
    def _build_test_case(data: dict, base_dir: Optional[Path] = None) -> TestCaseDefinition:
        shared_vars = YamlParser._parse_variables(data.get(keys.VARIABLES, {}))

        tests_raw = data.get(keys.TESTS, [])
        tests = []
        for entry in tests_raw:
            if isinstance(entry, str):
                if entry.startswith(_INCLUDE_PREFIX):
                    # "!include path/to/file.yaml" — load tests from the referenced file
                    rel_path = entry[len(_INCLUDE_PREFIX):].strip()
                    if base_dir:
                        script_path = (base_dir / rel_path).resolve()
                        tests.append(YamlParser.parse_script(script_path))
                    else:
                        raise ValueError(f"Cannot resolve include path without base_dir: {entry}")
                elif base_dir:
                    # Plain file reference — resolve relative to the test case file
                    script_path = (base_dir / entry).resolve()
                    if script_path.exists():
                        tests.append(YamlParser.parse_script(script_path))
                        continue
                    tests.append(entry)
                else:
                    tests.append(entry)
            elif isinstance(entry, dict):
                tests.append(YamlParser._build_script(entry, base_dir=base_dir))

        imports = [
            ImportDefinition(**imp) if isinstance(imp, dict) else ImportDefinition(import_ref=imp)
            for imp in data.get(keys.IMPORTS, [])
        ]

        tests = YamlParser._resolve_file_dependencies(tests, base_dir)

        # Auto-infer depends_on from ${!test_name:output} variable references
        YamlParser._infer_output_dependencies(tests)

        return TestCaseDefinition(
            kind=ScriptKind.TEST_CASE,
            name=data.get(keys.NAME, defaults.NAME),
            version=data.get(keys.VERSION, defaults.VERSION),
            description=data.get(keys.DESCRIPTION),
            shared_variables=shared_vars or None,
            tests=tests,
            imports=imports,
        )

    @staticmethod
    def _build_script(data: dict, base_dir: Optional[Path] = None) -> ScriptDefinition:
        base_def = YamlParser._resolve_import(data, base_dir)

        variables = YamlParser._parse_variables(data.get(keys.VARIABLES, {}))
        setup = [YamlParser._parse_step(step_data) for step_data in data.get(keys.SETUP, [])]
        steps = [YamlParser._parse_step(step_data) for step_data in data.get(keys.STEPS, [])]
        cleanup = [YamlParser._parse_step(step_data) for step_data in data.get(keys.CLEANUP, [])]
        services = [YamlParser._parse_service(service_data) for service_data in data.get(keys.SERVICES, [])]
        listeners = [
            ListenerDefinition(**listener_entry) if isinstance(listener_entry, dict) else ListenerDefinition(name=str(listener_entry), path=str(listener_entry))
            for listener_entry in data.get(keys.LISTEN, [])
        ]

        return YamlParser._merge_with_base(
            data, base_def, variables, setup, steps, cleanup, services, listeners,
        )

    @staticmethod
    def _resolve_import(data: dict, base_dir: Optional[Path]) -> Optional[ScriptDefinition]:
        """Load the base script definition from an ``import`` path, if specified."""
        import_path = data.get(keys.IMPORT)
        if not import_path or not base_dir:
            return None

        file_path = (base_dir / import_path).resolve()
        if not file_path.exists():
            raise ValueError(f"Import file not found: {import_path}")

        return YamlParser.parse_script(file_path)

    @staticmethod
    def _field_or_base(data: dict, key: str, base_def: Optional[ScriptDefinition], fallback: Any) -> Any:
        """Return ``data[key]`` if present, else the base_def attribute, else fallback."""
        if key in data:
            return data[key]
        if base_def is not None:
            return getattr(base_def, key, fallback)
        return fallback

    @staticmethod
    def _merge_with_base(
        data: dict,
        base_def: Optional[ScriptDefinition],
        variables: dict,
        setup: list,
        steps: list,
        cleanup: list,
        services: list,
        listeners: list,
    ) -> ScriptDefinition:
        """Build a ScriptDefinition using parsed fields, falling back to base_def when importing."""
        get = YamlParser._field_or_base
        import_path = data.get(keys.IMPORT)

        sdk_calls = (
            SdkCallMode(data[keys.ALLOW_SDK_CALLS])
            if keys.ALLOW_SDK_CALLS in data
            else get(data, "allow_sdk_calls", base_def, SdkCallMode.ALLOWLIST)
        )

        return ScriptDefinition(
            kind=ScriptKind.TEST,
            name=get(data, keys.NAME, base_def, defaults.NAME),
            version=get(data, keys.VERSION, base_def, defaults.VERSION),
            dataspace_version=get(data, keys.DATASPACE_VERSION, base_def, defaults.DATASPACE_VERSION),
            description=get(data, keys.DESCRIPTION, base_def, None),
            import_from=import_path,
            allow_sdk_calls=sdk_calls,
            depends_on=YamlParser._parse_depends_on(data.get(keys.DEPENDS_ON, [])) or get(data, "depends_on", base_def, []),
            outputs=get(data, keys.OUTPUTS, base_def, {}),
            variables=variables or get(data, "variables", base_def, {}),
            services=services or get(data, "services", base_def, []),
            listen=listeners or get(data, "listen", base_def, []),
            setup=setup or get(data, "setup", base_def, []),
            steps=steps or get(data, "steps", base_def, []),
            cleanup=cleanup or get(data, "cleanup", base_def, []),
        )

    @staticmethod
    def _parse_variables(raw: dict) -> dict[str, VariableDefinition]:
        result = {}
        for name, spec in raw.items():
            if isinstance(spec, dict):
                result[name] = VariableDefinition(name=name, **spec)
            else:
                result[name] = VariableDefinition(name=name, default=spec)
        return result

    @staticmethod
    def _parse_step(raw: dict) -> StepDefinition:
        expect_raw = raw.get(keys.EXPECT, [])
        expectations = [YamlParser._parse_assertion(assertion_data) for assertion_data in expect_raw]

        return StepDefinition(
            type=raw.get(keys.TYPE, defaults.NAME),
            name=raw.get(keys.NAME, raw.get(keys.TYPE, defaults.NAME)),
            params=raw.get(keys.PARAMS, {}),
            on_failure=FailurePolicy(raw[keys.ON_FAILURE]) if keys.ON_FAILURE in raw else FailurePolicy.ABORT,
            timeout_s=raw.get(keys.TIMEOUT_S),
            expect=expectations,
            store_in_memory=raw.get(keys.STORE_IN_MEMORY),
            if_condition=raw.get(keys.IF),
        )

    @staticmethod
    def _parse_assertion(raw: dict) -> Assertion:
        return Assertion(
            type=AssertionType(raw.get(keys.TYPE, defaults.ASSERTION_TYPE)),
            severity=AssertionSeverity(raw.get(keys.SEVERITY, defaults.ASSERTION_SEVERITY)),
            source=ValueSource(raw.get(keys.SOURCE, defaults.VALUE_SOURCE)),
            value=raw.get(keys.VALUE),
            path=raw.get(keys.PATH),
            description=raw.get(keys.DESCRIPTION),
        )

    @staticmethod
    def _parse_service(raw: dict) -> ServiceDefinition:
        raw_type = raw.get(keys.TYPE, defaults.SERVICE_TYPE)
        return ServiceDefinition(
            name=raw.get(keys.NAME, defaults.NAME),
            type=ServiceType(raw_type.upper() if isinstance(raw_type, str) else raw_type),
            base_url=raw.get(keys.BASE_URL, defaults.BASE_URL),
            auth=raw.get(keys.AUTH, {}),
            params=raw.get(keys.PARAMS),
        )

    @staticmethod
    def _parse_depends_on(raw: list) -> list[Union[str, DependencyRef]]:
        """Parse ``depends_on`` entries — strings or file-reference dicts."""
        result: list[Union[str, DependencyRef]] = []
        for entry in raw:
            if isinstance(entry, str):
                result.append(entry)
            elif isinstance(entry, dict) and keys.FILE in entry:
                result.append(DependencyRef(
                    file=entry[keys.FILE],
                    outputs=entry.get(keys.OUTPUTS, []),
                ))
            else:
                raise ValueError(f"Invalid depends_on entry: {entry}")
        return result

    @staticmethod
    def _resolve_file_dependencies(
        tests: list[Union[ScriptDefinition, str]],
        base_dir: Optional[Path],
    ) -> list[Union[ScriptDefinition, str]]:
        """Resolve ``DependencyRef`` entries by loading tests from external files.

        Loaded tests are prepended to the test list. Their ``outputs`` are
        filtered to only include the outputs selected by the consumers.
        """
        if not base_dir:
            return tests

        loaded_tests, output_selections = YamlParser._collect_file_dependencies(tests, base_dir)
        if not loaded_tests:
            return tests

        YamlParser._validate_selected_outputs(loaded_tests, output_selections)
        YamlParser._filter_outputs_to_selected(loaded_tests, output_selections)
        YamlParser._replace_dependency_refs_with_names(tests, loaded_tests, base_dir)

        existing_names = {test.name for test in tests if isinstance(test, ScriptDefinition)}
        new_tests = [definition for definition in loaded_tests.values() if definition.name not in existing_names]
        return new_tests + tests

    @staticmethod
    def _resolve_dependency_path(base_dir: Path, file_ref: str) -> Path:
        """Resolve a dependency file path relative to the base directory."""
        file_path = (base_dir / file_ref).resolve()
        if file_path.exists():
            return file_path
        raise ValueError(f"Dependency file not found: {file_ref}")

    @staticmethod
    def _collect_file_dependencies(
        tests: list[Union[ScriptDefinition, str]],
        base_dir: Path,
    ) -> tuple[dict[str, ScriptDefinition], dict[str, set[str]]]:
        """Load all file-based dependencies and collect their selected outputs."""
        loaded: dict[str, ScriptDefinition] = {}
        output_selections: dict[str, set[str]] = {}

        for test in tests:
            if not isinstance(test, ScriptDefinition):
                continue
            for dep in test.depends_on:
                if not isinstance(dep, DependencyRef):
                    continue

                file_path = YamlParser._resolve_dependency_path(base_dir, dep.file)
                path_key = str(file_path)

                if path_key not in loaded:
                    loaded[path_key] = YamlParser.parse_script(file_path)

                if dep.outputs:
                    test_name = loaded[path_key].name
                    output_selections.setdefault(test_name, set()).update(dep.outputs)

        return loaded, output_selections

    @staticmethod
    def _validate_selected_outputs(
        loaded: dict[str, ScriptDefinition],
        output_selections: dict[str, set[str]],
    ) -> None:
        """Raise ValueError if any selected outputs don't exist in the loaded test."""
        for test_name, selected in output_selections.items():
            test_def = next(test for test in loaded.values() if test.name == test_name)
            available = set(test_def.outputs.keys())
            invalid = selected - available
            if invalid:
                raise ValueError(
                    f"Test '{test_name}' does not export: {', '.join(sorted(invalid))}. "
                    f"Available outputs: {', '.join(sorted(available)) or '(none)'}"
                )

    @staticmethod
    def _filter_outputs_to_selected(
        loaded: dict[str, ScriptDefinition],
        output_selections: dict[str, set[str]],
    ) -> None:
        """Restrict each loaded test's outputs to just the selected subset."""
        for test_def in loaded.values():
            if test_def.name in output_selections:
                selected = output_selections[test_def.name]
                test_def.outputs = {output_name: output_value for output_name, output_value in test_def.outputs.items() if output_name in selected}

    @staticmethod
    def _replace_dependency_refs_with_names(
        tests: list[Union[ScriptDefinition, str]],
        loaded: dict[str, ScriptDefinition],
        base_dir: Path,
    ) -> None:
        """Replace DependencyRef entries with the resolved test name string."""
        path_to_name: dict[str, str] = {path: definition.name for path, definition in loaded.items()}
        all_definitions = [test for test in tests if isinstance(test, ScriptDefinition)] + list(loaded.values())

        for test in all_definitions:
            resolved_deps: list[Union[str, DependencyRef]] = []
            for dep in test.depends_on:
                if isinstance(dep, DependencyRef):
                    file_path = YamlParser._resolve_dependency_path(base_dir, dep.file)
                    resolved_deps.append(path_to_name[str(file_path)])
                else:
                    resolved_deps.append(dep)
            test.depends_on = resolved_deps

    @staticmethod
    def _infer_output_dependencies(
        tests: list[Union[ScriptDefinition, str]],
    ) -> None:
        """Scan variable defaults and step params for ``${!test_name:output}``
        references and auto-append inferred dependencies.
        """
        test_names = {
            test.name for test in tests if isinstance(test, ScriptDefinition)
        }

        def _collect_refs(obj: Any, test_name: str) -> set[str]:
            """Find all ``${!test:output}`` references in strings/dicts."""
            found: set[str] = set()
            if isinstance(obj, str):
                for match in patterns.OUTPUT_REF.finditer(obj):
                    ref_test = match.group(1)
                    if ref_test not in test_names:
                        raise ValueError(
                            f"Reference '${{{match.group(0)[2:]}}}' in test "
                            f"'{test_name}' references unknown test '{ref_test}'"
                        )
                    found.add(ref_test)
            elif isinstance(obj, dict):
                for value in obj.values():
                    found.update(_collect_refs(value, test_name))
            return found

        for test in tests:
            if not isinstance(test, ScriptDefinition):
                continue
            inferred: set[str] = set()
            # Scan variable defaults
            for _var_name, var_def in test.variables.items():
                if isinstance(var_def.default, str):
                    inferred.update(_collect_refs(var_def.default, test.name))
            # Scan step params
            for step in test.steps:
                inferred.update(_collect_refs(step.params, test.name))
            # Add inferred dependencies that aren't already declared
            existing = {
                dep if isinstance(dep, str) else dep.file
                for dep in test.depends_on
            }
            for dep_name in sorted(inferred):
                if dep_name not in existing:
                    test.depends_on.append(dep_name)
