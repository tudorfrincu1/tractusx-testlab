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

"""Tests for ScriptValidator — precondition validation rules."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from tractusx_testlab.compiler.validation.validator import ScriptValidator, ValidationResult
from tractusx_testlab.models.definitions import ScriptDefinition

from factories import create_script_with_preconditions, create_step_definition


@pytest.fixture()
def validator() -> ScriptValidator:
    return ScriptValidator()


# ---------------------------------------------------------------------------
# Precondition validation
# ---------------------------------------------------------------------------


class TestValidatorAcceptsValidPreconditions:
    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_accepts_valid_precondition_step(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        mock_registry.get.return_value = MagicMock()
        mock_registry.list_step_types.return_value = ["precondition_asset_config"]

        step = create_step_definition(type="precondition_asset_config")
        script = create_script_with_preconditions(preconditions=[step])

        result = validator.validate(script)
        assert result.valid

    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_accepts_empty_preconditions(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        script = create_script_with_preconditions(preconditions=[])
        result = validator.validate(script)
        assert result.valid


class TestValidatorRejectsInvalidPreconditions:
    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_rejects_non_prefixed_step_type(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        mock_registry.get.return_value = MagicMock()
        mock_registry.list_step_types.return_value = ["http_request"]

        step = create_step_definition(type="http_request")
        script = create_script_with_preconditions(preconditions=[step])

        result = validator.validate(script)
        errors = [i for i in result.issues if i.level == "error"]
        assert len(errors) >= 1
        assert "precondition_" in errors[0].message

    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_rejects_unknown_step_type(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        mock_registry.get.return_value = None
        mock_registry.list_step_types.return_value = []

        step = create_step_definition(type="precondition_unknown")
        script = create_script_with_preconditions(preconditions=[step])

        result = validator.validate(script)
        errors = [i for i in result.issues if i.level == "error"]
        assert any("Unknown" in e.message for e in errors)


class TestValidatorPreconditionWarnings:
    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_warns_if_precondition_references_service(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        mock_registry.get.return_value = MagicMock()
        mock_registry.list_step_types.return_value = ["precondition_asset_config"]

        step = create_step_definition(
            type="precondition_asset_config",
            params={"service": "edc-provider"},
        )
        script = create_script_with_preconditions(preconditions=[step])

        result = validator.validate(script)
        warnings = [i for i in result.issues if i.level == "warning"]
        assert any("service" in w.message for w in warnings)


class TestValidatorPreconditionVarsDeclared:
    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_precondition_store_in_memory_declares_vars(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        """Vars stored by precondition steps should be visible in setup."""
        mock_registry.get.return_value = MagicMock()
        mock_registry.list_step_types.return_value = [
            "precondition_asset_config",
            "create_asset",
        ]

        pre_step = create_step_definition(
            type="precondition_asset_config",
            params={},
            store_in_memory={"asset_log": "."},
        )
        setup_step = create_step_definition(
            type="create_asset",
            params={"ref": "${asset_log}"},
        )
        script = create_script_with_preconditions(
            preconditions=[pre_step],
            setup=[setup_step],
        )

        result = validator.validate(script)
        # No warning about asset_log being undeclared
        ref_warnings = [
            i for i in result.issues
            if "asset_log" in i.message and i.level == "warning"
        ]
        assert len(ref_warnings) == 0

    @patch("tractusx_testlab.compiler.validation.validator.StepRegistry")
    def test_phase_is_precondition_in_issues(
        self, mock_registry: MagicMock, validator: ScriptValidator,
    ) -> None:
        mock_registry.get.return_value = MagicMock()
        mock_registry.list_step_types.return_value = ["precondition_asset_config"]

        step = create_step_definition(type="bad_type")
        script = create_script_with_preconditions(preconditions=[step])

        result = validator.validate(script)
        errors = [i for i in result.issues if i.level == "error"]
        assert any(i.phase == "precondition" for i in errors)
