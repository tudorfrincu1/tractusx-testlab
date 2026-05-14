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

"""Dependency resolution helpers for YAML test-case file references and output inference."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional, Union

from tractusx_testlab.syntax import patterns

from tractusx_testlab.models import (
    DependencyRef,
    ScriptDefinition,
)


def resolve_file_dependencies(
    tests: list[Union[ScriptDefinition, str]],
    base_dir: Optional[Path],
    parse_script_fn: Any,
) -> list[Union[ScriptDefinition, str]]:
    """Resolve ``DependencyRef`` entries by loading tests from external files.

    Loaded tests are prepended to the test list. Their ``outputs`` are
    filtered to only include the outputs selected by the consumers.
    """
    if not base_dir:
        return tests

    loaded_tests, output_selections = _collect_file_dependencies(tests, base_dir, parse_script_fn)
    if not loaded_tests:
        return tests

    _validate_selected_outputs(loaded_tests, output_selections)
    _filter_outputs_to_selected(loaded_tests, output_selections)
    _replace_dependency_refs_with_names(tests, loaded_tests, base_dir)

    existing_names = {test.name for test in tests if isinstance(test, ScriptDefinition)}
    new_tests = [definition for definition in loaded_tests.values() if definition.name not in existing_names]
    return new_tests + tests


def resolve_dependency_path(base_dir: Path, file_ref: str) -> Path:
    """Resolve a dependency file path relative to the base directory."""
    file_path = (base_dir / file_ref).resolve()
    if file_path.exists():
        return file_path
    raise ValueError(f"Dependency file not found: {file_ref}")


def infer_output_dependencies(
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


def _collect_file_dependencies(
    tests: list[Union[ScriptDefinition, str]],
    base_dir: Path,
    parse_script_fn: Any,
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

            file_path = resolve_dependency_path(base_dir, dep.file)
            path_key = str(file_path)

            if path_key not in loaded:
                loaded[path_key] = parse_script_fn(file_path)

            if dep.outputs:
                test_name = loaded[path_key].name
                output_selections.setdefault(test_name, set()).update(dep.outputs)

    return loaded, output_selections


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


def _filter_outputs_to_selected(
    loaded: dict[str, ScriptDefinition],
    output_selections: dict[str, set[str]],
) -> None:
    """Restrict each loaded test's outputs to just the selected subset."""
    for test_def in loaded.values():
        if test_def.name in output_selections:
            selected = output_selections[test_def.name]
            test_def.outputs = {
                output_name: output_value
                for output_name, output_value in test_def.outputs.items()
                if output_name in selected
            }


def _replace_dependency_refs_with_names(
    tests: list[Union[ScriptDefinition, str]],
    loaded: dict[str, ScriptDefinition],
    base_dir: Path,
) -> None:
    """Replace DependencyRef entries with the resolved test name string."""
    path_to_name: dict[str, str] = {
        path: definition.name for path, definition in loaded.items()
    }
    all_definitions = [
        test for test in tests if isinstance(test, ScriptDefinition)
    ] + list(loaded.values())

    for test in all_definitions:
        resolved_deps: list[Union[str, DependencyRef]] = []
        for dep in test.depends_on:
            if isinstance(dep, DependencyRef):
                file_path = resolve_dependency_path(base_dir, dep.file)
                resolved_deps.append(path_to_name[str(file_path)])
            else:
                resolved_deps.append(dep)
        test.depends_on = resolved_deps
