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

"""Tests for precondition models — PreconditionLog, enums, and integration with StepResult."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from tractusx_testlab.models.definitions import ScriptDefinition, StepDefinition
from tractusx_testlab.models.enums import StepPhase
from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.models.results import StepResult

from factories import create_precondition_log, create_step_definition


# ---------------------------------------------------------------------------
# PreconditionLogCategory enum
# ---------------------------------------------------------------------------


class TestPreconditionLogCategory:
    def test_has_edc_policy(self) -> None:
        assert PreconditionLogCategory.EDC_POLICY == "EDC_POLICY"

    def test_has_edc_asset(self) -> None:
        assert PreconditionLogCategory.EDC_ASSET == "EDC_ASSET"

    def test_has_edc_contract(self) -> None:
        assert PreconditionLogCategory.EDC_CONTRACT == "EDC_CONTRACT"

    def test_string_representation(self) -> None:
        assert PreconditionLogCategory.EDC_ASSET.value == "EDC_ASSET"


# ---------------------------------------------------------------------------
# PreconditionLogType enum
# ---------------------------------------------------------------------------


class TestPreconditionLogType:
    def test_has_config(self) -> None:
        assert PreconditionLogType.CONFIG == "CONFIG"

    def test_has_request(self) -> None:
        assert PreconditionLogType.REQUEST == "REQUEST"


# ---------------------------------------------------------------------------
# PreconditionLog model
# ---------------------------------------------------------------------------


class TestPreconditionLog:
    def test_create_minimal(self) -> None:
        log = create_precondition_log()
        assert log.category == PreconditionLogCategory.EDC_ASSET
        assert log.log_type == PreconditionLogType.CONFIG
        assert log.message == "Test precondition log"
        assert log.data == {}
        assert log.input_type is None
        assert log.variable is None

    def test_create_full(self) -> None:
        log = create_precondition_log(
            category=PreconditionLogCategory.EDC_POLICY,
            log_type=PreconditionLogType.REQUEST,
            message="Provide access policy",
            data={"policy_type": "access"},
            input_type="json",
            variable="access_policy",
        )
        assert log.category == PreconditionLogCategory.EDC_POLICY
        assert log.input_type == "json"
        assert log.variable == "access_policy"

    def test_create_with_nested_data(self) -> None:
        nested = {"outer": {"inner": [1, 2, 3]}}
        log = create_precondition_log(data=nested)
        assert log.data["outer"]["inner"] == [1, 2, 3]

    def test_missing_required_field_category(self) -> None:
        with pytest.raises(ValidationError):
            PreconditionLog(
                log_type=PreconditionLogType.CONFIG,
                message="no category",
            )  # type: ignore[call-arg]

    def test_missing_required_field_log_type(self) -> None:
        with pytest.raises(ValidationError):
            PreconditionLog(
                category=PreconditionLogCategory.EDC_ASSET,
                message="no log_type",
            )  # type: ignore[call-arg]

    def test_missing_required_field_message(self) -> None:
        with pytest.raises(ValidationError):
            PreconditionLog(
                category=PreconditionLogCategory.EDC_ASSET,
                log_type=PreconditionLogType.CONFIG,
            )  # type: ignore[call-arg]

    def test_invalid_category_value(self) -> None:
        with pytest.raises(ValidationError):
            PreconditionLog(
                category="INVALID",
                log_type=PreconditionLogType.CONFIG,
                message="bad cat",
            )  # type: ignore[arg-type]

    def test_round_trip_serialization(self) -> None:
        log = create_precondition_log(data={"key": "value"}, variable="v")
        dumped = log.model_dump()
        restored = PreconditionLog.model_validate(dumped)
        assert restored == log

    def test_frozen_model_rejects_mutation(self) -> None:
        log = create_precondition_log()
        with pytest.raises(ValidationError):
            log.message = "changed"  # type: ignore[misc]


# ---------------------------------------------------------------------------
# StepPhase enum
# ---------------------------------------------------------------------------


class TestStepPhase:
    def test_precondition_exists(self) -> None:
        assert StepPhase.PRECONDITION == "PRECONDITION"

    def test_all_phases_present(self) -> None:
        names = {p.value for p in StepPhase}
        assert names == {"PRECONDITION", "SETUP", "MAIN", "CLEANUP"}


# ---------------------------------------------------------------------------
# StepResult.precondition_logs integration
# ---------------------------------------------------------------------------


class TestStepResultPreconditionLogs:
    def test_defaults_empty(self) -> None:
        result = StepResult(step_name="s1")
        assert result.precondition_logs == []

    def test_accepts_logs(self) -> None:
        log = create_precondition_log(message="attached")
        result = StepResult(step_name="s1", precondition_logs=[log])
        assert len(result.precondition_logs) == 1
        assert result.precondition_logs[0].message == "attached"

    def test_serializes_with_logs(self) -> None:
        log = create_precondition_log(data={"k": "v"})
        result = StepResult(step_name="s1", precondition_logs=[log])
        dumped = result.model_dump()
        assert len(dumped["precondition_logs"]) == 1
        assert dumped["precondition_logs"][0]["data"] == {"k": "v"}


# ---------------------------------------------------------------------------
# ScriptDefinition.preconditions integration
# ---------------------------------------------------------------------------


class TestScriptDefinitionPreconditions:
    def test_defaults_empty(self) -> None:
        script = ScriptDefinition(name="Empty")
        assert script.preconditions == []

    def test_accepts_step_definitions(self) -> None:
        step = create_step_definition(type="precondition_policy_config")
        script = ScriptDefinition(name="With Pre", preconditions=[step])
        assert len(script.preconditions) == 1
        assert script.preconditions[0].type == "precondition_policy_config"
