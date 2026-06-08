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

"""Runtime wrappers around parsed definitions with execution helpers."""

from __future__ import annotations

from pathlib import Path

from tractusx_testlab.models import (
    ScriptDefinition as SdkScriptDefinition,
    TckDefinition as SdkTckDefinition,
)
from tractusx_testlab.models.authoring.definitions import (
    ScriptDefinition,
    TckDefinition,
)


class TestScript:
    """Runtime wrapper for a single script definition."""

    __slots__ = ("definition",)

    def __init__(self, definition: ScriptDefinition):
        """Initialize with a parsed script definition."""
        self.definition = definition

    @property
    def name(self) -> str:
        """Script name from the definition."""
        return self.definition.name

    @property
    def dataspace_version(self) -> str:
        """Target dataspace version (e.g. 'jupiter', 'saturn')."""
        return self.definition.dataspace_version

    @property
    def steps(self):
        """List of step definitions for the main execution phase."""
        return self.definition.steps

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
        """Service declarations required by this script."""
        return self.definition.services

    @property
    def variables(self):
        """Variable declarations defined in the script."""
        return self.definition.variables

    @property
    def depends_on(self) -> list[str]:
        """List of dependency file paths this script depends on."""
        raw = getattr(self.definition, "depends_on", None) or []
        return [
            dep if isinstance(dep, str) else dep.file
            for dep in raw
        ]

    @property
    def outputs(self) -> dict[str, str]:
        """Declared output variable mappings."""
        return self.definition.outputs

    def step_count(self) -> int:
        """Return the number of main execution steps."""
        return len(self.definition.steps)


class Tck:
    """Runtime wrapper for a TCK definition."""

    __slots__ = ("definition", "_scripts", "base_dir")

    def __init__(self, definition: TckDefinition | SdkTckDefinition, base_dir: Path | None = None):
        """Initialize with a TCK definition and optional base directory for file resolution."""
        self.definition = definition
        self.base_dir = base_dir
        self._scripts: list[TestScript] = []
        for test_definition in definition.tests:
            if isinstance(test_definition, (ScriptDefinition, SdkScriptDefinition)):
                self._scripts.append(TestScript(test_definition))

    @property
    def name(self) -> str:
        """TCK package name."""
        return self.definition.name

    @property
    def version(self) -> str:
        """TCK version string."""
        return self.definition.version

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
