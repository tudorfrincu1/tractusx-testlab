###############################################################
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
###############################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Tests for Pydantic models."""

import pytest

from tractusx_testlab.models.test_models import (
    Assertion,
    AssertionType,
    ConnectorConfig,
    InputVariable,
    MockConfig,
    MockEndpointConfig,
    Severity,
    Step,
    Test,
)


class TestModelsCreation:
    """Test that models can be instantiated with valid data."""

    def test_create_minimal_test(self) -> None:
        test = Test(name="Minimal Test")
        assert test.name == "Minimal Test"
        assert test.version == "1.0"
        assert test.dataspace == "saturn"
        assert test.steps == []
        assert test.mocks == []
        assert test.auto_cleanup is True

    def test_create_full_test(self) -> None:
        test = Test(
            name="Full Test",
            version="2.0",
            dataspace="jupiter",
            description="A comprehensive test",
            connectors={
                "provider": ConnectorConfig(url="http://localhost:8080", api_key="key1"),
                "consumer": ConnectorConfig(url="http://localhost:9090", api_key="key2"),
            },
            inputs={
                "asset_name": InputVariable(type="string", default="Test Asset"),
            },
            mocks=[
                MockConfig(type="dtr", name="mock_dtr"),
            ],
            steps=[
                Step(
                    type="create_asset",
                    name="Create Asset",
                    inputs={"name": "@asset_name"},
                    validate=[
                        Assertion(type=AssertionType.STATUS_CODE, value=200),
                    ],
                ),
            ],
        )
        assert test.name == "Full Test"
        assert len(test.connectors) == 2
        assert len(test.steps) == 1
        assert test.steps[0].validate[0].type == AssertionType.STATUS_CODE

    def test_assertion_defaults(self) -> None:
        assertion = Assertion(type=AssertionType.CONTAINS, value="data")
        assert assertion.severity == Severity.HARD
        assert assertion.negate is False
        assert assertion.path is None

    def test_step_defaults(self) -> None:
        step = Step(type="http_request", name="GET Something")
        assert step.inputs == {}
        assert step.outputs == {}
        assert step.validate == []
        assert step.timeout == 30

    def test_mock_endpoint_defaults(self) -> None:
        ep = MockEndpointConfig(path="/test")
        assert ep.method == "GET"
        assert ep.status == 200
        assert ep.body is None


class TestModelsFrozen:
    """Verify that models are immutable (frozen)."""

    def test_test_is_frozen(self) -> None:
        test = Test(name="Frozen Test")
        with pytest.raises(Exception):
            test.name = "Changed"  # type: ignore[misc]

    def test_assertion_is_frozen(self) -> None:
        assertion = Assertion(type=AssertionType.STATUS_CODE, value=200)
        with pytest.raises(Exception):
            assertion.value = 500  # type: ignore[misc]

    def test_step_is_frozen(self) -> None:
        step = Step(type="http_request", name="Frozen Step")
        with pytest.raises(Exception):
            step.name = "Changed"  # type: ignore[misc]


class TestModelsValidation:
    """Test model validation from raw dicts (like YAML parsing)."""

    def test_model_validate_from_dict(self) -> None:
        data = {
            "name": "Dict Test",
            "steps": [
                {
                    "type": "http_request",
                    "name": "Request",
                    "inputs": {"url": "http://example.com"},
                    "validate": [
                        {"type": "STATUS_CODE", "value": 200},
                    ],
                }
            ],
        }
        test = Test.model_validate(data)
        assert test.name == "Dict Test"
        assert len(test.steps) == 1
        assert test.steps[0].validate[0].type == AssertionType.STATUS_CODE

    def test_schema_alias(self) -> None:
        data = {"type": "SCHEMA", "schema": {"type": "object"}}
        assertion = Assertion.model_validate(data)
        assert assertion.schema_def == {"type": "object"}
