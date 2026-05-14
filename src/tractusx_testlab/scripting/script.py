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

from tractusx_testlab.models import (
    ScriptDefinition,
    TestCaseDefinition,
)


class TestScript:
    """Runtime wrapper for a single script definition."""

    __slots__ = ("definition",)

    def __init__(self, definition: ScriptDefinition):
        self.definition = definition

    @property
    def name(self) -> str:
        return self.definition.name

    @property
    def dataspace_version(self) -> str:
        return self.definition.dataspace_version

    @property
    def steps(self):
        return self.definition.steps

    @property
    def setup(self):
        return self.definition.setup

    @property
    def cleanup(self):
        return self.definition.cleanup

    @property
    def services(self):
        return self.definition.services

    @property
    def variables(self):
        return self.definition.variables

    @property
    def depends_on(self) -> list[str]:
        return [
            dep if isinstance(dep, str) else dep.file
            for dep in self.definition.depends_on
        ]

    @property
    def outputs(self) -> dict[str, str]:
        return self.definition.outputs

    def step_count(self) -> int:
        return len(self.definition.steps)


class TestCase:
    """Runtime wrapper for a test case definition."""

    __slots__ = ("definition", "_scripts")

    def __init__(self, definition: TestCaseDefinition):
        self.definition = definition
        self._scripts: list[TestScript] = []
        for test_definition in definition.tests:
            if isinstance(test_definition, ScriptDefinition):
                self._scripts.append(TestScript(test_definition))

    @property
    def name(self) -> str:
        return self.definition.name

    @property
    def version(self) -> str:
        return self.definition.version

    @property
    def scripts(self) -> list[TestScript]:
        return self._scripts

    def script_count(self) -> int:
        return len(self._scripts)

    def total_steps(self) -> int:
        return sum(script.step_count() for script in self._scripts)
