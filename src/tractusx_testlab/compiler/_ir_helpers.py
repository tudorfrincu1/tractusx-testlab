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

"""IR Builder helpers — instruction compilation and symbol table construction."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import yaml

from tractusx_testlab.compiler._expressions import resolve_expression


def build_instructions(
    test_data: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Build the flattened instructions list and collect step symbols.

    Returns:
        (instructions, step_symbols) where step_symbols is a list of
        {id, field, type, class, produced_by, source} dicts.
    """
    setup_steps = test_data.get("setup", [])
    main_steps = test_data.get("steps", [])
    teardown_steps = test_data.get("teardown", [])

    instructions: list[dict[str, Any]] = []
    step_symbols: list[dict[str, Any]] = []
    global_index = 0

    for phase, steps in [("setup", setup_steps), ("steps", main_steps), ("teardown", teardown_steps)]:
        for phase_index, step in enumerate(steps):
            instruction = _build_instruction(step, global_index, phase, phase_index)
            instructions.append(instruction)

            # Collect step output symbols
            returns = step.get("returns", {})
            if phase == "setup":
                source = "setup_output"
            elif phase == "teardown":
                source = "teardown_output"
            else:
                source = "step_output"
            for field_name, field_def in returns.items():
                step_symbols.append({
                    "id": step.get("id", ""),
                    "field": field_name,
                    "type": field_def.get("type", "string") if isinstance(field_def, dict) else "string",
                    "class": field_def.get("class", "") if isinstance(field_def, dict) else "",
                    "produced_by": global_index,
                    "source": source,
                })

            # Auto-add "exported" symbol for util/export_env steps
            if step.get("uses") == "util/export_env" and not returns:
                step_symbols.append({
                    "id": step.get("id", ""),
                    "field": "exported",
                    "type": "string",
                    "class": "",
                    "produced_by": global_index,
                    "source": source,
                })

            global_index += 1

    return instructions, step_symbols


def _build_instruction(
    step: dict[str, Any], index: int, phase: str, phase_index: int,
) -> dict[str, Any]:
    """Build a single instruction entry from a step definition."""
    with_block = step.get("with", {})
    resolved_with = resolve_expression(with_block)

    returns = step.get("returns", {})
    resolved_returns: dict[str, Any] = {}
    for field_name, field_def in returns.items():
        if isinstance(field_def, dict):
            resolved_returns[field_name] = {
                k: v for k, v in field_def.items()
                if k in ("type", "class")
            }
        else:
            resolved_returns[field_name] = {"type": "string"}

    validate = _build_validate_block(step)
    on_failure = "continue" if phase == "teardown" else step.get("on_failure", "abort")

    return {
        "index": index,
        "id": step.get("id", ""),
        "uses": step.get("uses", ""),
        "name": step.get("name", ""),
        "with": resolved_with,
        "returns": resolved_returns,
        "validate": validate,
        "phase": phase,
        "phase_index": phase_index,
        "on_failure": on_failure,
    }


def _build_validate_block(step: dict[str, Any]) -> list[dict[str, Any]]:
    """Build the validate array from step's validate block or inline assertion."""
    validate_raw = step.get("validate", [])
    validations: list[dict[str, Any]] = [
        {"uses": v.get("uses", "validate/assert"), "with": resolve_expression(v.get("with", {}))}
        for v in validate_raw
    ]
    # For assert steps, also include the step itself as a validation
    uses = step.get("uses", "")
    if uses.startswith("validate/") and not validate_raw:
        validations.append({"uses": uses, "with": resolve_expression(step.get("with", {}))})

    return validations


def build_global_symbols(
    env_raw: dict[str, Any],
    preconditions_raw: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build the global_symbols dict for all env-level symbols.

    Contains variables, services, schemas, testdata, and precondition outputs.
    No `produced_by` field — globals are always available.
    """
    symbols: dict[str, Any] = {}

    # env.variables — each gets a "default" field
    variables = env_raw.get("variables", {})
    for name, val in variables.items():
        symbols[f"env.{name}"] = {
            "source": "env.variables",
            "type": _infer_type(val),
            "default": val,
        }

    # env.services
    services = env_raw.get("services", [])
    for svc in services:
        svc_name = svc.get("name", "")
        returns = svc.get("returns", {})
        if returns:
            for field_name, field_def in returns.items():
                entry: dict[str, Any] = {
                    "source": "env.services",
                    "type": field_def.get("type", "class") if isinstance(field_def, dict) else "string",
                }
                if isinstance(field_def, dict) and "class" in field_def:
                    entry["class"] = field_def["class"]
                symbols[f"env.services.{svc_name}.{field_name}"] = entry
        else:
            symbols[f"env.services.{svc_name}.service"] = {
                "source": "env.services",
                "type": "class",
                "class": _service_class_from_uses(svc.get("uses", "")),
            }

    # env.schemas
    schemas = env_raw.get("schemas", {})
    for name in schemas:
        symbols[f"env.schemas.{name}"] = {
            "source": "env.schemas",
            "type": "object",
        }

    # env.testdata
    testdata = env_raw.get("testdata", {})
    for name in testdata:
        symbols[f"env.testdata.{name}"] = {
            "source": "env.testdata",
            "type": "object",
        }

    # env.preconditions
    for pc in preconditions_raw:
        pc_id = pc.get("id", "")
        returns = pc.get("returns", {})
        for field_name, field_def in returns.items():
            entry = {
                "source": "env.preconditions",
                "type": field_def.get("type", "string") if isinstance(field_def, dict) else "string",
            }
            if isinstance(field_def, dict) and "class" in field_def:
                entry["class"] = field_def["class"]
            symbols[f"env.preconditions.{pc_id}.{field_name}"] = entry

        # Apply seed mappings to env variables
        seed = pc.get("seed", {})
        for env_var, returns_key in seed.items():
            env_symbol_key = f"env.{env_var}"
            if env_symbol_key in symbols:
                symbols[env_symbol_key]["seeded_by"] = f"{pc_id}.{returns_key}"

    return symbols


def build_test_symbols(step_symbols: list[dict[str, Any]]) -> dict[str, Any]:
    """Build per-test symbol_table containing ONLY step/setup/teardown outputs."""
    symbols: dict[str, Any] = {}

    for sym in step_symbols:
        if sym["source"] == "setup_output":
            prefix = "setup"
        elif sym["source"] == "teardown_output":
            prefix = "teardown"
        else:
            prefix = "steps"
        key = f"{prefix}.{sym['id']}.{sym['field']}"
        entry: dict[str, Any] = {
            "source": sym["source"],
            "produced_by": sym["produced_by"],
            "type": sym["type"],
        }
        if sym.get("class"):
            entry["class"] = sym["class"]
        symbols[key] = entry

    return symbols


def _service_class_from_uses(uses: str) -> str:
    """Derive a class name from a service 'uses' identifier.

    E.g. 'service/connector_service' -> 'ConnectorService'
    """
    parts = uses.rsplit("/", 1)
    raw_name = parts[-1] if parts else uses
    return "".join(word.capitalize() for word in raw_name.split("_"))


def resolve_test_path(file_ref: str, base_dir: Path) -> Path:
    """Resolve a test file reference to an absolute path."""
    test_path = base_dir / file_ref
    if test_path.exists():
        return test_path
    test_path = base_dir / "tests" / file_ref
    if test_path.exists():
        return test_path
    raise FileNotFoundError(f"Referenced test file not found: {file_ref}")


def load_test_file(test_path: Path) -> dict[str, Any]:
    """Load a test YAML file."""
    with open(test_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Expected YAML mapping in {test_path}")
    return data


def compute_source_hash(path: Path) -> str:
    """Compute blake2b-256 hash of a file's contents."""
    content = path.read_bytes()
    digest = hashlib.blake2b(content, digest_size=32).hexdigest()
    return f"blake2b:{digest}"


def _infer_type(value: Any) -> str:
    """Infer the IR type string from a Python value."""
    match value:
        case bool(): return "boolean"
        case int(): return "integer"
        case float(): return "number"
        case list(): return "array"
        case dict(): return "object"
        case _: return "string"


def infer_testdata_type(filename: str) -> str:
    """Infer MIME type from a testdata filename."""
    ext_map = {".json": "application/json", ".pdf": "application/pdf", ".xml": "application/xml"}
    return ext_map.get(Path(filename).suffix, "application/octet-stream")
