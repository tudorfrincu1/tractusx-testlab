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

from tractusx_testlab.syntax import defaults, keys

from tractusx_testlab.models import (
    DependencyRef,
    ImportDefinition,
    ListenerDefinition,
    ScriptDefinition,
    ScriptKind,
    SdkCallMode,
    TestCaseDefinition,
)

from tractusx_testlab.scripting._builders import (
    parse_depends_on,
    parse_service,
    parse_step,
    parse_variables,
)
from tractusx_testlab.scripting._dependencies import (
    infer_output_dependencies,
    resolve_file_dependencies,
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
        shared_vars = parse_variables(data.get(keys.VARIABLES, {}))

        tests_raw = data.get(keys.TESTS, [])
        tests = []
        for entry in tests_raw:
            if isinstance(entry, str):
                if entry.startswith(_INCLUDE_PREFIX):
                    rel_path = entry[len(_INCLUDE_PREFIX):].strip()
                    if base_dir:
                        script_path = (base_dir / rel_path).resolve()
                        tests.append(YamlParser.parse_script(script_path))
                    else:
                        raise ValueError(f"Cannot resolve include path without base_dir: {entry}")
                elif base_dir:
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

        tests = resolve_file_dependencies(tests, base_dir, YamlParser.parse_script)
        infer_output_dependencies(tests)

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

        variables = parse_variables(data.get(keys.VARIABLES, {}))
        setup = [parse_step(step_data) for step_data in data.get(keys.SETUP, [])]
        steps = [parse_step(step_data) for step_data in data.get(keys.STEPS, [])]
        cleanup = [parse_step(step_data) for step_data in data.get(keys.CLEANUP, [])]
        services = [parse_service(service_data) for service_data in data.get(keys.SERVICES, [])]
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
            depends_on=parse_depends_on(data.get(keys.DEPENDS_ON, [])) or get(data, "depends_on", base_def, []),
            outputs=get(data, keys.OUTPUTS, base_def, {}),
            variables=variables or get(data, "variables", base_def, {}),
            services=services or get(data, "services", base_def, []),
            listen=listeners or get(data, "listen", base_def, []),
            setup=setup or get(data, "setup", base_def, []),
            steps=steps or get(data, "steps", base_def, []),
            cleanup=cleanup or get(data, "cleanup", base_def, []),
        )
