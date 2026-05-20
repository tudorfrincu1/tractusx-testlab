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

"""Tests for Pydantic definition models (ScriptDefinition, StepDefinition, etc.)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from tractusx_testlab.models.definitions import (
    Assertion,
    ScriptDefinition,
    ServiceDefinition,
    StepDefinition,
    TckDefinition,
    VariableDefinition,
)
from tractusx_testlab.models.enums import (
    AssertionType,
    FailurePolicy,
    ScriptKind,
    ServiceType,
)


class TestStepDefinition:
    """Tests for StepDefinition model validation."""

    def test_minimal_step_only_requires_type(self) -> None:
        step = StepDefinition(type="create_asset")
        assert step.type == "create_asset"
        assert step.params == {}
        assert step.validate == []

    def test_step_with_all_fields(self) -> None:
        step = StepDefinition(
            type="http_request",
            name="Call API",
            description="Calls an external API",
            params={"url": "http://example.com"},
            on_failure=FailurePolicy.CONTINUE,
            timeout_s=30.0,
        )
        assert step.name == "Call API"
        assert step.on_failure == FailurePolicy.CONTINUE
        assert step.timeout_s == 30.0

    def test_step_default_failure_policy_is_abort(self) -> None:
        step = StepDefinition(type="any_step")
        assert step.on_failure == FailurePolicy.ABORT

    def test_step_with_assertions(self) -> None:
        step = StepDefinition(
            type="http_request",
            validate=[
                Assertion(type=AssertionType.STATUS_CODE, value=200),
                Assertion(type=AssertionType.NOT_NULL, path="body"),
            ],
        )
        assert len(step.validate) == 2
        assert step.validate[0].type == AssertionType.STATUS_CODE


class TestScriptDefinition:
    """Tests for ScriptDefinition model validation."""

    def test_minimal_script_requires_name(self) -> None:
        script = ScriptDefinition(name="My Test")
        assert script.name == "My Test"
        assert script.kind == ScriptKind.TEST
        assert script.version == "1.0"

    def test_script_with_steps(self) -> None:
        script = ScriptDefinition(
            name="With Steps",
            steps=[StepDefinition(type="create_asset")],
        )
        assert len(script.steps) == 1

    def test_script_with_services(self) -> None:
        svc = ServiceDefinition(
            name="provider",
            type=ServiceType.CONNECTOR_PROVIDER,
            base_url="http://provider:8080",
        )
        script = ScriptDefinition(name="Svc Test", services=[svc])
        assert script.services[0].name == "provider"

    def test_script_with_variables(self) -> None:
        script = ScriptDefinition(
            name="Vars",
            variables={"my_var": VariableDefinition(name="my_var", type="str", default="hello")},
        )
        assert script.variables["my_var"].default == "hello"

    def test_script_missing_name_raises(self) -> None:
        with pytest.raises(ValidationError):
            ScriptDefinition()  # type: ignore[call-arg]

    def test_script_all_phases(self) -> None:
        script = ScriptDefinition(
            name="Full",
            preconditions=[StepDefinition(type="precondition_asset_config")],
            setup=[StepDefinition(type="create_asset")],
            steps=[StepDefinition(type="http_request")],
            teardown=[StepDefinition(type="delete_asset")],
        )
        assert len(script.preconditions) == 1
        assert len(script.setup) == 1
        assert len(script.steps) == 1
        assert len(script.teardown) == 1


class TestServiceDefinition:
    """Tests for ServiceDefinition model validation."""

    def test_service_requires_name_type_url(self) -> None:
        svc = ServiceDefinition(
            name="consumer",
            type=ServiceType.CONNECTOR_CONSUMER,
            base_url="http://localhost:9090",
        )
        assert svc.name == "consumer"
        assert svc.type == ServiceType.CONNECTOR_CONSUMER

    def test_service_missing_fields_raises(self) -> None:
        with pytest.raises(ValidationError):
            ServiceDefinition(name="bad")  # type: ignore[call-arg]


class TestTckDefinition:
    """Tests for TckDefinition model."""

    def test_tck_minimal(self) -> None:
        tck = TckDefinition(name="CCM TCK")
        assert tck.kind == ScriptKind.TCK
        assert tck.name == "CCM TCK"
