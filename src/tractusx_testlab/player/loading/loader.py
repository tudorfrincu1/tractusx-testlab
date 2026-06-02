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

"""Loader — resolves YAML files and .stck archives into Tck objects."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import yaml

from tractusx_testlab.compiler.packager import Packager
from tractusx_testlab.models import (
    TckDefinition as TckDefinition,
)
from tractusx_testlab.scripting.script import Tck as Tck
from tractusx_testlab.models.primitives.enums import ScriptKind
from tractusx_testlab.player.loading._parser import (
    build_script,
    build_test_case,
)

logger = logging.getLogger(__name__)


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
                "Use kind: tck for manifests that group multiple tests."
            )
        if kind == ScriptKind.TCK and not has_tests_key:
            raise ValueError(
                "YAML declares kind: tck but is missing the 'tests' key. "
                "A TCK must list its tests under the 'tests' key."
            )
        return kind

    return ScriptKind.TCK if has_tests_key else ScriptKind.TEST


class Loader:
    """Loads a TCK from a YAML file or a .stck encrypted archive."""

    __slots__ = ()

    def load(
        self,
        path: Path,
        player_private_key: Optional[bytes] = None,
        compiler_public_key: Optional[bytes] = None,
    ) -> Tck:
        """Load a TCK from *path*.

        Uses the local parser to support testlab-extended enum values
        (assertion types, service types) that the SDK parser rejects.
        """
        if path.suffix == ".stck":
            return self._load_package(path, player_private_key, compiler_public_key)

        return self._load_yaml(path)

    def _load_package(
        self,
        path: Path,
        player_private_key: Optional[bytes],
        compiler_public_key: Optional[bytes],
    ) -> Tck:
        """Load and verify a .stck archive."""
        if player_private_key is None or compiler_public_key is None:
            raise ValueError(
                "player_private_key and compiler_public_key are required "
                "to load .stck files"
            )
        yaml_bytes = Packager.extract_and_verify(
            path, player_private_key, compiler_public_key,
        )
        data = yaml.safe_load(yaml_bytes)
        return self._parse_data(data, base_dir=path.parent)

    def _load_yaml(self, path: Path) -> Tck:
        """Load a plain YAML file."""
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return self._parse_data(data, base_dir=path.parent)

    def _parse_data(self, data: object, base_dir: Path) -> Tck:
        """Parse raw YAML data into a Tck runtime object."""
        kind = _detect_kind(data) if isinstance(data, dict) else ScriptKind.TEST

        if kind == ScriptKind.TCK:
            definition = build_test_case(data, base_dir=base_dir)
        else:
            script_def = build_script(data)
            definition = TckDefinition.model_construct(
                name=script_def.name,
                tests=[script_def],
                imports=[],
            )

        return Tck(definition, base_dir=base_dir)
