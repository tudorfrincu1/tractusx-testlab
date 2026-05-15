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

"""Static validation of test scripts before compilation."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from tractusx_testlab.models import ScriptDefinition, StepDefinition
from tractusx_testlab.scripting.registry import StepRegistry
from tractusx_testlab.syntax import defaults


@dataclass(slots=True)
class ValidationIssue:
    """A single validation finding."""
    level: str  # "error" | "warning"
    message: str
    step_index: Optional[int] = None
    field: Optional[str] = None
    phase: Optional[str] = None


@dataclass(slots=True)
class ValidationResult:
    """Aggregated validation outcome."""
    issues: list[ValidationIssue] = field(default_factory=list)

    @property
    def valid(self) -> bool:
        return not any(issue.level == "error" for issue in self.issues)

    def add_error(self, msg: str, **kw) -> None:
        self.issues.append(ValidationIssue(level="error", message=msg, **kw))

    def add_warning(self, msg: str, **kw) -> None:
        self.issues.append(ValidationIssue(level="warning", message=msg, **kw))


_VAR_REF = re.compile(r"\$\{(\w+)}")


class ScriptValidator:
    """Validates a ScriptDefinition for correctness before execution."""

    def validate(self, script: ScriptDefinition, version: Optional[str] = None) -> ValidationResult:
        result = ValidationResult()
        declared_vars: set[str] = set()

        # Collect variables declared in the script header
        for var_name in script.variables:
            declared_vars.add(var_name)

        # Validate precondition steps
        for idx, step_def in enumerate(script.preconditions):
            self._validate_precondition(step_def, idx, declared_vars, version, result)

        # Validate setup steps
        for idx, step_def in enumerate(script.setup):
            self._validate_step(step_def, idx, declared_vars, version, result, phase="setup")

        # Validate each step
        for idx, step_def in enumerate(script.steps):
            self._validate_step(step_def, idx, declared_vars, version, result)

        return result

    def _validate_precondition(
        self,
        step_def: StepDefinition,
        idx: int,
        declared_vars: set[str],
        version: Optional[str],
        result: ValidationResult,
    ) -> None:
        """Validate a single precondition step."""
        # Rule 1: type must start with "precondition_"
        if not step_def.type.startswith("precondition_"):
            result.add_error(
                f"Precondition step type '{step_def.type}' must start with 'precondition_'",
                step_index=idx,
                field="type",
                phase="precondition",
            )

        # Rule 2: type must exist in the step registry
        effective_version = version or defaults.DATASPACE_VERSION
        step_cls = StepRegistry.get(step_def.type, effective_version)
        if step_cls is None and step_def.type not in StepRegistry.list_step_types():
            result.add_error(
                f"Unknown precondition step type '{step_def.type}'",
                step_index=idx,
                field="type",
                phase="precondition",
            )

        # Rule 3: warn if precondition references a service
        service_param = step_def.params.get("service")
        if service_param:
            result.add_warning(
                f"Precondition step '{step_def.type}' references service '{service_param}'; "
                "preconditions should not require live connectors",
                step_index=idx,
                phase="precondition",
            )

        # Rule 4: declare store_in_memory variables for downstream phases
        if step_def.store_in_memory:
            for var_name in step_def.store_in_memory:
                declared_vars.add(var_name)

        # Check variable references in params
        self._check_var_refs(step_def.params, idx, declared_vars, result)

    def _validate_step(
        self,
        step_def: StepDefinition,
        idx: int,
        declared_vars: set[str],
        version: Optional[str],
        result: ValidationResult,
        phase: str = "main",
    ) -> None:
        effective_version = version or defaults.DATASPACE_VERSION

        # Check step type is registered
        step_cls = StepRegistry.get(step_def.type, effective_version)
        if step_cls is None:
            # Maybe it's in the global registry
            if step_def.type not in StepRegistry.list_step_types():
                result.add_error(
                    f"Unknown step type '{step_def.type}'",
                    step_index=idx,
                    field="type",
                    phase=phase,
                )
            elif version:
                result.add_warning(
                    f"Step '{step_def.type}' has no version-specific implementation for '{version}'",
                    step_index=idx,
                    phase=phase,
                )

        # Check variable references in params resolve
        self._check_var_refs(step_def.params, idx, declared_vars, result)

        # If store_in_memory is set, auto-declare the variables
        if step_def.store_in_memory:
            for var_name in step_def.store_in_memory:
                declared_vars.add(var_name)

    def _check_var_refs(
        self, params: dict, step_idx: int, declared: set[str], result: ValidationResult
    ) -> None:
        for key, value in params.items():
            if isinstance(value, str):
                for match in _VAR_REF.finditer(value):
                    var_name = match.group(1)
                    if var_name not in declared:
                        result.add_warning(
                            f"Variable '${{{var_name}}}' referenced in param '{key}' "
                            f"is not declared in this script's variables block at step {step_idx} "
                            f"(may be provided via shared_variables, runtime_vars, or output propagation)",
                            step_index=step_idx,
                            field=key,
                        )
            elif isinstance(value, dict):
                self._check_var_refs(value, step_idx, declared, result)
