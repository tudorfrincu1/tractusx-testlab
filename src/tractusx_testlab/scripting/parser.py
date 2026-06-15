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
from tractusx_testlab.syntax.keys import TEST as _TEST_KEY

from tractusx_testlab.models import (
    SdkCallMode,
)
from tractusx_testlab.models.authoring.definitions import (
    ImportDefinition,
    ScriptDefinition,
    ServiceDefinition,
    TckDefinition,
)
from tractusx_testlab.models.authoring.infrastructure import (
    DataspaceContext,
    InfrastructureConfig,
)
from tractusx_testlab.models.primitives.enums import ScriptKind, ServiceType

from tractusx_testlab.scripting._builders import (
    parse_step,
    parse_variables,
)

_INCLUDE_PREFIX = "!include "


def _parse_dataspace(data: dict) -> Optional[DataspaceContext]:
    """Parse the ADR-0019 ``dataspace`` block, if present."""
    raw = data.get(keys.DATASPACE)
    return DataspaceContext.model_validate(raw) if isinstance(raw, dict) else None


def _parse_infrastructure(data: dict) -> Optional[InfrastructureConfig]:
    """Parse the ADR-0019 ``infrastructure`` block, if present."""
    raw = data.get(keys.INFRASTRUCTURE)
    return InfrastructureConfig.model_validate(raw) if isinstance(raw, dict) else None


def _parse_service(raw: dict) -> ServiceDefinition:
    """Parse a single service dict into a local ServiceDefinition with extended ServiceType."""
    raw_type = raw.get(keys.TYPE, defaults.SERVICE_TYPE)
    return ServiceDefinition(
        name=raw.get(keys.NAME, defaults.NAME),
        type=ServiceType(raw_type.upper() if isinstance(raw_type, str) else raw_type),
        base_url=raw.get(keys.BASE_URL, defaults.BASE_URL),
        auth=raw.get(keys.AUTH, {}),
        params=raw.get(keys.PARAMS),
    )


class YamlParser:
    """Parses YAML test scripts and TCK manifests into definition models."""

    @staticmethod
    def parse_script(path: Path) -> ScriptDefinition:
        data = YamlParser._load_yaml(path)
        return YamlParser._build_script(data)

    @staticmethod
    def parse_tck(path: Path) -> TckDefinition:
        data = YamlParser._load_yaml(path)
        return YamlParser._build_tck(data, base_dir=path.parent)

    @staticmethod
    def parse_script_from_dict(data: dict) -> ScriptDefinition:
        return YamlParser._build_script(data)

    @staticmethod
    def parse_tck_from_dict(data: dict, base_dir: Optional[Path] = None) -> TckDefinition:
        return YamlParser._build_tck(data, base_dir=base_dir)

    @staticmethod
    def _load_yaml(path: Path) -> dict:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not isinstance(data, dict):
            raise ValueError(f"Expected YAML mapping at top level in {path}")
        return data

    @staticmethod
    def _build_tck(data: dict, base_dir: Optional[Path] = None) -> TckDefinition:
        shared_vars = parse_variables(data.get(keys.VARIABLES, {}))

        tests_raw = data.get(keys.TESTS, [])
        tests = [YamlParser._resolve_test_entry(entry, base_dir) for entry in tests_raw]

        imports = [
            ImportDefinition(**imp) if isinstance(imp, dict) else ImportDefinition(import_ref=imp)
            for imp in data.get(keys.IMPORTS, [])
        ]

        return TckDefinition(
            kind=ScriptKind.TCK,
            name=data.get(keys.NAME, defaults.NAME),
            version=data.get(keys.VERSION, defaults.VERSION),
            description=data.get(keys.DESCRIPTION),
            dataspace=_parse_dataspace(data),
            infrastructure=_parse_infrastructure(data),
            shared_variables=shared_vars or None,
            tests=tests,
            imports=imports,
        )

    @staticmethod
    def _resolve_test_entry(entry, base_dir: Optional[Path]):
        """Resolve a single test entry (string or dict) into a parsed test or path."""
        if isinstance(entry, str):
            return YamlParser._resolve_string_test_entry(entry, base_dir)
        if isinstance(entry, dict):
            return YamlParser._resolve_dict_test_entry(entry, base_dir)
        return entry

    @staticmethod
    def _resolve_string_test_entry(entry: str, base_dir: Optional[Path]):
        """Resolve a string-typed test entry (include or file path)."""
        if entry.startswith(_INCLUDE_PREFIX):
            rel_path = entry[len(_INCLUDE_PREFIX):].strip()
            if not base_dir:
                raise ValueError(f"Cannot resolve include path without base_dir: {entry}")
            script_path = (base_dir / rel_path).resolve()
            return YamlParser.parse_script(script_path)

        if base_dir:
            script_path = (base_dir / entry).resolve()
            if script_path.exists():
                return YamlParser.parse_script(script_path)
        return entry

    @staticmethod
    def _resolve_dict_test_entry(entry: dict, base_dir: Optional[Path]):
        """Resolve a dict-typed test entry (test key reference or inline script)."""
        if _TEST_KEY in entry:
            rel_path = entry[_TEST_KEY]
            if base_dir:
                script_path = (base_dir / rel_path).resolve()
                if script_path.exists():
                    return YamlParser.parse_script(script_path)
            return rel_path
        return YamlParser._build_script(entry, base_dir=base_dir)

    @staticmethod
    def _build_script(data: dict, base_dir: Optional[Path] = None) -> ScriptDefinition:
        base_def = YamlParser._resolve_import(data, base_dir)

        variables = parse_variables(data.get(keys.VARIABLES, {}))
        setup = [parse_step(step_data).model_dump() for step_data in data.get(keys.SETUP, [])]
        steps = [parse_step(step_data).model_dump() for step_data in data.get(keys.STEPS, [])]
        teardown = [parse_step(step_data).model_dump() for step_data in data.get(keys.TEARDOWN, [])]
        services = [_parse_service(service_data) for service_data in data.get(keys.SERVICES, [])]
        dataspace = _parse_dataspace(data)
        infrastructure = _parse_infrastructure(data)

        return YamlParser._merge_with_base(
            data, base_def, variables, setup, steps, teardown, services,
            dataspace, infrastructure,
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
        teardown: list,
        services: list,
        dataspace: Optional[DataspaceContext] = None,
        infrastructure: Optional[InfrastructureConfig] = None,
    ) -> ScriptDefinition:
        """Build a ScriptDefinition using parsed fields, falling back to base_def when importing."""
        get = YamlParser._field_or_base
        import_path = data.get(keys.IMPORT)

        sdk_calls = (
            SdkCallMode(data[keys.ALLOW_SDK_CALLS])
            if keys.ALLOW_SDK_CALLS in data
            else get(data, "allow_sdk_calls", base_def, SdkCallMode.ALLOWLIST)
        )

        # ADR-0019: when a `dataspace` block is present its version is the single
        # source of the dataspace version; the legacy `dataspace_version` field
        # remains a backward-compatible fallback (defaulting to "saturn").
        effective_dataspace = dataspace or (base_def.dataspace if base_def else None)
        dataspace_version = (
            effective_dataspace.version
            if effective_dataspace is not None
            else get(data, keys.DATASPACE_VERSION, base_def, defaults.DATASPACE_VERSION)
        )

        return ScriptDefinition(
            kind=ScriptKind.TEST,
            name=get(data, keys.NAME, base_def, defaults.NAME),
            version=get(data, keys.VERSION, base_def, defaults.VERSION),
            dataspace_version=dataspace_version,
            dataspace=effective_dataspace,
            infrastructure=infrastructure or (base_def.infrastructure if base_def else None),
            description=get(data, keys.DESCRIPTION, base_def, None),
            import_from=import_path,
            allow_sdk_calls=sdk_calls,
            outputs=get(data, keys.OUTPUTS, base_def, {}),
            variables=variables or get(data, "variables", base_def, {}),
            services=services or get(data, "services", base_def, []),
            setup=setup or get(data, "setup", base_def, []),
            steps=steps or get(data, "steps", base_def, []),
            teardown=teardown or get(data, "teardown", base_def, []),
        )
