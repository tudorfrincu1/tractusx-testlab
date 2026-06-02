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

"""Local YAML parser that creates testlab model instances with extended types.

The SDK parser rejects testlab-extended enum values (e.g. ``NOT_NULL``,
``EDC_CONNECTOR_SATURN``) because its Pydantic models validate against the
SDK's narrower enums.  This parser reads YAML and builds our local model
instances directly, then wraps them in SDK-compatible runtime objects using
``model_construct()`` to bypass Pydantic validation where needed.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Union

import yaml

from tractusx_testlab.models import (
    TckDefinition as SdkTckDefinition,
)

try:
    from tractusx_testlab.models import (
        FailurePolicy, ImportDefinition, SdkCallMode,
    )
except ImportError:
    from enum import Enum as _Enum
    from pydantic import BaseModel as _FB
    class FailurePolicy(str, _Enum):  # type: ignore[no-redef]
        ABORT = "ABORT"; CONTINUE = "CONTINUE"; SKIP = "SKIP"  # noqa: E702
    class SdkCallMode(str, _Enum):  # type: ignore[no-redef]
        ALLOWLIST = "ALLOWLIST"; BLOCKLIST = "BLOCKLIST"; NONE = "NONE"  # noqa: E702
    class ImportDefinition(_FB):  # type: ignore[no-redef]
        import_ref: str; override: dict | None = None  # noqa: E702

try:
    from tractusx_testlab.models.authoring.definitions import (
        ScriptDefinition as SdkScriptDefinition,
    )
except ImportError:
    from pydantic import BaseModel as _SFB
    class SdkScriptDefinition(_SFB, extra="allow"): pass  # type: ignore[no-redef,call-arg]

from tractusx_testlab.models.authoring.definitions import (
    Assertion,
    ScriptDefinition,
    ServiceDefinition,
    StepDefinition,
    VariableDefinition,
)
from tractusx_testlab.models.primitives.enums import (
    AssertionSeverity,
    AssertionType,
    ScriptKind,
    ServiceType,
    ValueSource,
)
from tractusx_testlab.player.loading import _constants as C

logger = logging.getLogger(__name__)

def parse_variables(raw: dict) -> dict[str, VariableDefinition]:
    """Parse a variables mapping into VariableDefinition instances."""
    result: dict[str, VariableDefinition] = {}
    for name, spec in raw.items():
        if isinstance(spec, dict):
            result[name] = VariableDefinition(name=name, **spec)
        else:
            result[name] = VariableDefinition(name=name, default=spec)
    return result


def parse_assertion(raw: dict) -> Assertion:
    """Parse a single assertion dict into a local Assertion model."""
    output_val = raw.get("output")
    path_val = raw.get(C.K_PATH)
    if output_val and path_val:
        combined_path = f"{output_val}.{path_val}"
    else:
        combined_path = output_val or path_val

    return Assertion(
        type=AssertionType(raw.get(C.K_TYPE, C.DEFAULT_ASSERTION_TYPE)),
        severity=AssertionSeverity(raw.get(C.K_SEVERITY, C.DEFAULT_ASSERTION_SEVERITY)),
        source=ValueSource(raw.get(C.K_SOURCE, C.DEFAULT_ASSERTION_SOURCE)),
        value=raw.get(C.K_VALUE),
        path=combined_path,
        description=raw.get(C.K_DESCRIPTION),
        schema_ref=raw.get("schema"),
        min=raw.get("min"),
        max=raw.get("max"),
        operator=raw.get("operator"),
        expected=raw.get("expected"),
    )


def parse_step(raw: dict) -> StepDefinition:
    """Parse a single step dict into a local StepDefinition."""
    expectations = [parse_assertion(a) for a in raw.get(C.K_EXPECT, [])]
    params = dict(raw.get(C.K_PARAMS, {}))

    store_in_var = raw.get("store_in_variable") or params.pop("store_in_variable", None)
    if store_in_var:
        store_in_memory = {store_in_var: "."}
    else:
        store_in_memory = raw.get(C.K_STORE_IN_MEMORY)

    return StepDefinition(
        type=raw.get(C.K_TYPE, C.DEFAULT_NAME),
        name=raw.get(C.K_NAME, raw.get(C.K_TYPE, C.DEFAULT_NAME)),
        description=raw.get(C.K_DESCRIPTION),
        params=params,
        on_failure=FailurePolicy(raw[C.K_ON_FAILURE]) if C.K_ON_FAILURE in raw else FailurePolicy.ABORT,
        timeout_s=raw.get(C.K_TIMEOUT_S),
        validate=expectations,
        store_in_memory=store_in_memory,
        store_in_variable=store_in_var,
        if_condition=raw.get(C.K_IF),
    )


def _resolve_service_type(raw_type: str) -> ServiceType:
    """Map a YAML service type string to an SDK ServiceType enum value."""
    normalised = raw_type.upper() if isinstance(raw_type, str) else raw_type
    resolved = C.SERVICE_TYPE_ALIASES.get(normalised, normalised)
    if resolved != normalised:
        logger.warning(
            "Deprecated service type '%s' mapped to '%s'. "
            "Use one of: %s",
            raw_type, resolved,
            ", ".join(e.value for e in ServiceType),
        )
    return ServiceType(resolved)


def parse_service(raw: dict) -> ServiceDefinition:
    """Parse a single service dict into a local ServiceDefinition."""
    raw_type = raw.get(C.K_TYPE, C.DEFAULT_SERVICE_TYPE)
    return ServiceDefinition(
        name=raw.get(C.K_NAME, C.DEFAULT_NAME),
        type=_resolve_service_type(raw_type),
        base_url=raw.get(C.K_BASE_URL, C.DEFAULT_BASE_URL),
        auth=raw.get(C.K_AUTH, {}),
        params=raw.get(C.K_PARAMS),
    )


def build_script(data: dict) -> SdkScriptDefinition:
    """Build a ScriptDefinition from a YAML dict using local extended models.

    Returns an SDK ScriptDefinition created via ``model_construct()`` to
    bypass Pydantic validation of extended enum values.

    Args:
        data: Parsed YAML dictionary.
    """
    variables = parse_variables(data.get(C.K_VARIABLES, {}))
    services = [parse_service(s) for s in data.get(C.K_SERVICES, [])]
    setup = [parse_step(s) for s in data.get(C.K_SETUP, [])]
    steps = [parse_step(s) for s in data.get(C.K_STEPS, [])]
    teardown = [parse_step(s) for s in data.get(C.K_TEARDOWN, [])]
    outputs = data.get(C.K_OUTPUTS, {})

    raw_kind = data.get(C.K_KIND, "test")
    sdk_kind = _to_sdk_script_kind(raw_kind)

    return SdkScriptDefinition.model_construct(
        kind=sdk_kind,
        name=data.get(C.K_NAME, C.DEFAULT_NAME),
        version=data.get(C.K_VERSION, C.DEFAULT_VERSION),
        dataspace_version=data.get(C.K_DATASPACE_VERSION, "saturn"),
        description=data.get(C.K_DESCRIPTION),
        import_from=data.get(C.K_IMPORT),
        allow_sdk_calls=SdkCallMode(data.get(C.K_ALLOW_SDK_CALLS, "ALLOWLIST")),
        outputs=outputs,
        variables=variables,
        services=services,
        setup=setup,
        steps=steps,
        teardown=teardown,
    )


def parse_script_file(path: Path) -> SdkScriptDefinition:
    """Load and parse a single script YAML file."""
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Expected a YAML dict in {path}, got {type(data).__name__}")
    return build_script(data)


def build_test_case(
    data: dict,
    base_dir: Optional[Path] = None,
) -> SdkTckDefinition:
    """Build a TckDefinition from a YAML dict.

    Handles the IDE's ``{test: path, description: str}`` test entry format
    as well as the SDK's plain path strings and inline script dicts.
    """
    shared_vars = parse_variables(data.get(C.K_VARIABLES, {}))

    tests_raw = data.get(C.K_TESTS, [])
    tests: list[Union[SdkScriptDefinition, str]] = []
    for entry in tests_raw:
        tests.append(_resolve_test_entry(entry, base_dir))

    imports = [
        ImportDefinition(**imp) if isinstance(imp, dict) else ImportDefinition(import_ref=imp)
        for imp in data.get(C.K_IMPORTS, [])
    ]

    return SdkTckDefinition.model_construct(
        kind=_to_sdk_script_kind("tck"),
        name=data.get(C.K_NAME, C.DEFAULT_NAME),
        version=data.get(C.K_VERSION, C.DEFAULT_VERSION),
        description=data.get(C.K_DESCRIPTION),
        shared_variables=shared_vars or None,
        tests=tests,
        imports=imports,
    )

def _to_sdk_script_kind(raw: str):
    """Convert a raw kind string to the SDK ScriptKind enum."""
    try:
        from tractusx_testlab.models.primitives.enums import ScriptKind as SdkScriptKind
        return {"test": SdkScriptKind.TEST, "tck": SdkScriptKind.TCK}.get(raw, SdkScriptKind.TEST)
    except ImportError:
        return raw


def _resolve_test_entry(
    entry: Union[str, dict], base_dir: Optional[Path],
) -> Union[SdkScriptDefinition, str]:
    """Resolve a single test entry to a ScriptDefinition or path string."""
    if isinstance(entry, str):
        if base_dir:
            script_path = (base_dir / entry).resolve()
            if script_path.exists():
                return parse_script_file(script_path)
        return entry
    if isinstance(entry, dict) and "test" in entry:
        rel_path = entry["test"]
        if base_dir:
            script_path = (base_dir / rel_path).resolve()
            return parse_script_file(script_path)
        return rel_path
    if isinstance(entry, dict):
        return build_script(entry)
    return str(entry)
