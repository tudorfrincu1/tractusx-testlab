################################################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2026 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""TCK manifest and test file validation against JSON schemas."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

logger = logging.getLogger(__name__)

_SCHEMAS_DIR = Path(__file__).parent.parent / "schemas"


def _load_schema(schema_name: str) -> dict[str, Any]:
    """Load a JSON schema from the schemas directory."""
    schema_path = _SCHEMAS_DIR / schema_name
    return json.loads(schema_path.read_text(encoding="utf-8"))


def _collect_errors(
    validator: Draft202012Validator,
    data: dict[str, Any],
    source_label: str,
) -> list[str]:
    """Collect all validation errors with human-readable messages."""
    errors: list[str] = []
    for error in validator.iter_errors(data):
        path = ".".join(str(p) for p in error.absolute_path) if error.absolute_path else ""
        if path:
            location = f"'{path}' in {source_label}"
        else:
            location = source_label
        errors.append(f"{error.message} (at {location})")
    return errors


def validate_tck_manifest(
    manifest_data: dict[str, Any],
    base_dir: Path,
) -> None:
    """Validate TCK manifest and all referenced test files.

    Raises:
        ValueError: If validation errors are found. Message lists ALL errors.
    """
    all_errors: list[str] = []

    # Validate the index manifest
    index_schema = _load_schema("tck_index.schema.json")
    index_validator = Draft202012Validator(index_schema)
    all_errors.extend(_collect_errors(index_validator, manifest_data, "index.yaml"))

    # Validate referenced file existence
    all_errors.extend(_validate_file_refs(manifest_data, base_dir))

    # Validate each test file
    tests = manifest_data.get("tests", [])
    test_schema = _load_schema("tck_test.schema.json")
    test_validator = Draft202012Validator(test_schema)

    for test_entry in tests:
        test_file = test_entry if isinstance(test_entry, str) else test_entry.get("file", "")
        if not test_file:
            continue
        test_path = base_dir / "tests" / test_file
        if not test_path.is_file():
            all_errors.append(f"Referenced test file not found: tests/{test_file}")
            continue
        test_data = yaml.safe_load(test_path.read_text(encoding="utf-8"))
        if not isinstance(test_data, dict):
            all_errors.append(f"Test file 'tests/{test_file}' is not a valid YAML mapping")
            continue
        all_errors.extend(
            _collect_errors(test_validator, test_data, f"tests/{test_file}")
        )

    if all_errors:
        error_list = "\n  - ".join(all_errors)
        raise ValueError(
            f"TCK validation failed with {len(all_errors)} error(s):\n  - {error_list}"
        )

    logger.info("TCK manifest validation passed")


def _validate_file_refs(
    manifest_data: dict[str, Any],
    base_dir: Path,
) -> list[str]:
    """Validate that all referenced schema and testdata files exist."""
    errors: list[str] = []
    env = manifest_data.get("env", {})

    schemas = env.get("schemas", {})
    for name, entry in schemas.items():
        if isinstance(entry, dict) and "file" in entry:
            path = base_dir / "schemas" / entry["file"]
            if not path.is_file():
                errors.append(
                    f"Referenced schema file not found: schemas/{entry['file']} "
                    f"(env.schemas.{name})"
                )

    testdata = env.get("testdata", {})
    for name, entry in testdata.items():
        if isinstance(entry, dict) and "file" in entry:
            path = base_dir / "testdata" / entry["file"]
            if not path.is_file():
                errors.append(
                    f"Referenced testdata file not found: testdata/{entry['file']} "
                    f"(env.testdata.{name})"
                )

    return errors
