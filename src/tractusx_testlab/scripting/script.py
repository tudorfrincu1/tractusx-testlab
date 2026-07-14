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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""Runtime wrappers around parsed definitions with execution helpers."""

from __future__ import annotations

from pathlib import Path

from tractusx_testlab.models.authoring.definitions import (
    ScriptDefinitionV2,
    TckDefinitionV2,
)


class TestScript:
    """Runtime wrapper for a single script definition."""

    __test__ = False  # Prevent pytest from collecting this class
    __slots__ = ("definition",)

    def __init__(self, definition: ScriptDefinitionV2):
        """Initialize with a parsed script definition."""
        self.definition = definition

    @property
    def name(self) -> str:
        """Script name from the definition metadata."""
        return self.definition.metadata.name

    @property
    def dataspace_version(self) -> str:
        """Target dataspace version — resolved from the script definition (default: 'saturn')."""
        return self.definition.dataspace_version

    @property
    def steps(self):
        """List of step definitions for the main execution phase."""
        return self.definition.execution

    @property
    def setup(self):
        """List of setup step definitions."""
        return self.definition.setup

    @property
    def teardown(self):
        """List of teardown step definitions."""
        return self.definition.teardown

    @property
    def services(self):
        """Service declarations (resolved from TCK env in v2)."""
        return []

    @property
    def variables(self):
        """Variable declarations (resolved from TCK env in v2)."""
        return {}

    @property
    def depends_on(self) -> list[str]:
        """Dependency list — not used in v2 scripts."""
        return []

    @property
    def outputs(self) -> dict[str, str]:
        """Declared output variable mappings — not used in v2 scripts."""
        return {}

    def step_count(self) -> int:
        """Return the number of main execution steps."""
        return len(self.definition.execution)

    @property
    def definition_version(self) -> str:
        """Test suite version from metadata."""
        return self.definition.metadata.version


class Tck:
    """Runtime wrapper for a TCK definition."""

    __slots__ = ("definition", "_scripts", "base_dir")

    def __init__(self, definition: TckDefinitionV2, base_dir: Path | None = None):
        """Initialize with a TCK definition and optional base directory."""
        self.definition = definition
        self.base_dir = base_dir
        self._scripts: list[TestScript] = []

    @property
    def name(self) -> str:
        """TCK package name."""
        return self.definition.metadata.name

    @property
    def version(self) -> str:
        """TCK version string."""
        return self.definition.metadata.version

    @property
    def scripts(self) -> list[TestScript]:
        """List of wrapped test scripts in this TCK."""
        return self._scripts

    def script_count(self) -> int:
        """Return the number of scripts in this TCK."""
        return len(self._scripts)

    def total_steps(self) -> int:
        """Return the total step count across all scripts."""
        return sum(script.step_count() for script in self._scripts)

    @classmethod
    def from_single_script(
        cls, script_def: ScriptDefinitionV2, base_dir: Path | None = None,
    ) -> "Tck":
        """Wrap a single ScriptDefinitionV2 in a minimal TckDefinitionV2 and return a Tck."""
        from tractusx_testlab.models.authoring.definitions import (
            TckDefinitionV2,
            TckMetadataDefinition,
        )
        tck_def = TckDefinitionV2(
            kind="tck",
            syntax="v2",
            id=script_def.id,
            metadata=TckMetadataDefinition(
                name=script_def.metadata.name,
                description=script_def.metadata.description,
                version=script_def.metadata.version,
            ),
            tests=[],
        )
        instance = cls(tck_def, base_dir=base_dir)
        instance._scripts = [TestScript(script_def)]
        return instance
