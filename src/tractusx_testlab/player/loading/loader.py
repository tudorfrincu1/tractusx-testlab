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

"""Loader — resolves YAML files and .testpkg archives into TestCase objects."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import yaml

from tractusx_testlab.compiler.packager import Packager
from tractusx_testlab.models import ScriptKind, TestCaseDefinition
from tractusx_testlab.scripting.parser import YamlParser
from tractusx_testlab.scripting.script import TestCase


def _detect_kind(data: dict) -> ScriptKind:
    """Detect the kind of a YAML document.

    Priority: explicit ``kind`` field → structural heuristic (``tests`` key).
    Raises ``ValueError`` if ``kind`` contradicts the document structure.
    """
    explicit = data.get("kind")
    has_tests_key = "tests" in data

    if explicit is not None:
        kind = ScriptKind(explicit)
        if kind == ScriptKind.TEST and has_tests_key:
            raise ValueError(
                "YAML declares kind: test but contains a 'tests' key. "
                "Use kind: test-case for manifests that group multiple tests."
            )
        if kind == ScriptKind.TEST_CASE and not has_tests_key:
            raise ValueError(
                "YAML declares kind: test-case but is missing the 'tests' key. "
                "A test case must list its tests under the 'tests' key."
            )
        return kind

    # Fallback: infer from structure (backward compatible)
    return ScriptKind.TEST_CASE if has_tests_key else ScriptKind.TEST


class Loader:
    """Loads a test case from a YAML file or a .testpkg archive."""

    __slots__ = ("_parser",)

    def __init__(self) -> None:
        self._parser = YamlParser()

    def load(
        self,
        path: Path,
        player_private_key: Optional[bytes] = None,
        compiler_public_key: Optional[bytes] = None,
    ) -> TestCase:
        """Load a test case from *path*.

        For ``.testpkg`` files the archive is decrypted and verified first.
        For ``.yaml`` / ``.yml`` files the YAML is parsed directly.
        """
        if path.suffix == ".testpkg":
            if player_private_key is None or compiler_public_key is None:
                raise ValueError(
                    "player_private_key and compiler_public_key are required to load .testpkg files"
                )
            yaml_bytes = Packager.extract_and_verify(path, player_private_key, compiler_public_key)
            # Parse from in-memory YAML
            data = yaml.safe_load(yaml_bytes)
            kind = _detect_kind(data) if isinstance(data, dict) else ScriptKind.TEST
            if kind == ScriptKind.TEST_CASE:
                definition = self._parser.parse_test_case_from_dict(data, base_dir=path.parent)
            else:
                script_def = self._parser.parse_script_from_dict(data)
                definition = TestCaseDefinition(name=script_def.name, tests=[script_def])
            return TestCase(definition)

        # Plain YAML — detect type via ``kind`` field or structural heuristic
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        kind = _detect_kind(data) if isinstance(data, dict) else ScriptKind.TEST
        if kind == ScriptKind.TEST_CASE:
            definition = self._parser.parse_test_case(path)
        else:
            script_def = self._parser.parse_script(path)
            resolved = YamlParser._resolve_file_dependencies(
                [script_def], base_dir=path.parent,
            )
            definition = TestCaseDefinition(name=script_def.name, tests=resolved)

        return TestCase(definition)
