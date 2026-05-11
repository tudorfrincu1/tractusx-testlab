###############################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2025 Contributors to the Eclipse Foundation
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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4).
## It was reviewed and tested by a human committer.

"""Integration tests proving the CCM example YAML files work with the backend."""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import pytest
import yaml

import tractusx_testlab.steps  # noqa: F401 — trigger @step registrations
from tractusx_testlab.models.enums import AssertionType, ServiceType
from tractusx_testlab.scripting import StepRegistry
from tractusx_testlab.scripting._builders import parse_assertion, parse_service
from tractusx_testlab.steps.connector.extract import ExtractDatasetStep
from tractusx_testlab.steps.industry.semantic import ValidateSemanticSchemaStep
from tractusx_testlab.steps.utility.json_extract import JsonPathExtractStep
from tractusx_testlab.steps.utility.uuid_gen import GenerateUuidStep

CCM_DIR = Path(__file__).resolve().parent.parent / "ide" / "public" / "examples" / "certificate-management-v1.0"
CCM_TESTS_DIR = CCM_DIR / "tests"

_CCM_TEST_FILES = {
    "request_certificate.yaml": 5,
    "validate_payload.yaml": 3,
    "await_feedback_callback.yaml": 5,
    "send_feedback.yaml": 9,
    "expose_testlab_asset.yaml": 5,
}

# All step types referenced across CCM YAML files
_CCM_STEP_TYPES = [
    "query_catalog", "extract_dataset", "negotiate", "initiate_transfer",
    "http_call", "validate_semantic_schema", "json_path_extract",
    "mock_endpoint", "wait_for_call", "generate_uuid", "send_notification",
    "create_asset", "create_policy", "create_contract_def",
]

def _make_mock_context(**variables: Any) -> MagicMock:
    """Create a mock StepContext with preset variables."""
    ctx = MagicMock()
    ctx.get_variable = MagicMock(side_effect=lambda name, default=None: variables.get(name, default))
    return ctx

def _make_step_definition(**overrides: Any) -> Any:
    """Create a minimal StepDefinition for step execution tests."""
    from tractusx_sdk.extensions.testlab.models import StepDefinition
    defaults = {"type": "test", "params": {}, "expect": []}
    defaults.update(overrides)
    return StepDefinition(**defaults)

class TestCcmYamlParsing:
    @pytest.mark.parametrize("filename,expected_steps", list(_CCM_TEST_FILES.items()))
    def test_ccm_yaml_parses_successfully(self, filename: str, expected_steps: int) -> None:

        yaml_path = CCM_TESTS_DIR / filename
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        raw_steps = data.get("steps", [])

        assert len(raw_steps) == expected_steps, (
            f"{filename}: expected {expected_steps} steps, got {len(raw_steps)}"
        )
        assert data.get("kind", "test") == "test", f"{filename} kind should be 'test'"
        for i, step_raw in enumerate(raw_steps):
            assert "type" in step_raw, f"Step {i} in {filename} missing 'type'"
            step_type = step_raw["type"]
            assert StepRegistry.has(step_type, "saturn"), (
                f"Step type '{step_type}' in {filename} is not registered"
            )

class TestCcmIndexParsing:
    def test_ccm_index_parses_as_test_case(self) -> None:

        index_path = CCM_DIR / "index.yaml"
        with open(index_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        assert data["kind"] == "test-case"
        assert data["name"] == "certificate-management"
        tests = data.get("tests", [])
        assert len(tests) == 5, f"Expected 5 tests, got {len(tests)}"
        for entry in tests:
            assert "test" in entry, f"Each test entry must have a 'test' key, got {entry}"

class TestCompactAssertionParsing:
    def test_ccm_compact_assertions_parse_correctly(self) -> None:

        # Arrange — use request_certificate.yaml which has all compact assertion types
        yaml_path = CCM_TESTS_DIR / "request_certificate.yaml"
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        # Act — collect all assertions from all steps via the builder
        all_assertions = []
        for step_raw in data.get("steps", []):
            for expect_raw in step_raw.get("expect", []):
                all_assertions.append(parse_assertion(expect_raw))

        # Assert — verify we got assertions and they have correct types
        assert len(all_assertions) > 0, "Expected at least one assertion"
        assertion_types_found = {a.type for a in all_assertions}
        assert AssertionType.NOT_NULL in assertion_types_found, "Expected NOT_NULL assertion type"
        assert AssertionType.EQUALS in assertion_types_found, "Expected EQUALS assertion type"
        for assertion in all_assertions:
            assert assertion.path is not None, "Compact assertions must set path from 'output' field"

class TestCcmStepRegistry:
    @pytest.mark.parametrize("step_type", _CCM_STEP_TYPES)
    def test_ccm_step_types_all_registered(self, step_type: str) -> None:

        step_cls = StepRegistry.get(step_type, "saturn")

        assert step_cls is not None, f"Step type '{step_type}' is not registered for dataspace 'saturn'"

class TestCcmServiceParsing:
    def test_ccm_service_type_edc_connector_accepted(self) -> None:

        yaml_path = CCM_TESTS_DIR / "request_certificate.yaml"
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        services = [parse_service(s) for s in data.get("services", [])]

        assert len(services) == 1, "Expected exactly one service definition"
        svc = services[0]
        assert svc.name == "provider_edc"
        assert svc.type == ServiceType.EDC_CONNECTOR_SATURN

class TestGenerateUuidStep:
    @pytest.mark.asyncio
    async def test_generate_uuid_step_produces_valid_uuid(self) -> None:

        step_instance = GenerateUuidStep()
        ctx = _make_mock_context()
        definition = _make_step_definition(type="generate_uuid")

        output = await step_instance.execute({}, ctx, definition)

        assert output.value is not None, "StepOutput must have a value"
        parsed = uuid.UUID(output.value, version=4)
        assert str(parsed) == output.value, "Output must be a valid UUID v4 string"

    @pytest.mark.asyncio
    async def test_generate_uuid_with_prefix(self) -> None:

        step_instance = GenerateUuidStep()
        ctx = _make_mock_context()
        definition = _make_step_definition(type="generate_uuid")

        output = await step_instance.execute({"prefix": "urn:uuid:"}, ctx, definition)

        assert output.value.startswith("urn:uuid:"), "UUID should be prefixed"
        uuid_part = output.value[len("urn:uuid:"):]
        uuid.UUID(uuid_part, version=4)  # must not raise

class TestJsonPathExtractStep:
    @pytest.mark.asyncio
    async def test_json_path_extract_step(self) -> None:

        data = {"a": {"b": [{"id": "found-it"}]}}
        ctx = _make_mock_context(source_data=data)
        step_instance = JsonPathExtractStep()
        definition = _make_step_definition(type="json_path_extract")

        output = await step_instance.execute(
            {"source": "source_data", "path": "a.b.0.id"}, ctx, definition,
        )

        assert output.value == "found-it"

    @pytest.mark.asyncio
    async def test_json_path_extract_missing_source_raises(self) -> None:

        ctx = _make_mock_context()
        step_instance = JsonPathExtractStep()
        definition = _make_step_definition(type="json_path_extract")

        with pytest.raises(KeyError, match="not found"):
            await step_instance.execute(
                {"source": "nonexistent", "path": "any"}, ctx, definition,
            )

class TestExtractDatasetStep:
    @pytest.mark.asyncio
    async def test_extract_dataset_step(self) -> None:

        catalog = {
            "dcat:dataset": [
                {
                    "@id": "asset-ccm",
                    "edc:id": "asset-ccm-edc",
                    "dct:type": {"@id": "https://w3id.org/catenax/taxonomy#CCMAPI"},
                    "odrl:hasPolicy": {"@id": "offer-123"},
                },
                {
                    "@id": "asset-other",
                    "dct:type": {"@id": "https://w3id.org/catenax/taxonomy#OTHER"},
                },
            ]
        }
        ctx = _make_mock_context(catalog=catalog)
        step_instance = ExtractDatasetStep()
        definition = _make_step_definition(type="extract_dataset")

        output = await step_instance.execute(
            {"source": "catalog", "dct_type": "https://w3id.org/catenax/taxonomy#CCMAPI"},
            ctx, definition,
        )

        result = output.value
        assert len(result["datasets"]) == 1, "Should match exactly one dataset"
        assert result["asset_id"] == "asset-ccm-edc"
        assert result["offer_id"] == "offer-123"

    @pytest.mark.asyncio
    async def test_extract_dataset_no_match_returns_empty(self) -> None:

        catalog = {"dcat:dataset": []}
        ctx = _make_mock_context(catalog=catalog)
        step_instance = ExtractDatasetStep()
        definition = _make_step_definition(type="extract_dataset")

        output = await step_instance.execute(
            {"source": "catalog", "dct_type": "https://nonexistent"}, ctx, definition,
        )

        assert output.value["datasets"] == []
        assert output.value["offer_id"] is None
        assert output.value["asset_id"] is None

class TestValidateSemanticSchemaStep:
    @pytest.mark.asyncio
    async def test_validate_semantic_schema_valid_payload(self) -> None:

        payload = {"catenaXId": "urn:uuid:123", "childItems": []}
        ctx = _make_mock_context(payload=payload)
        step_instance = ValidateSemanticSchemaStep()
        definition = _make_step_definition(type="validate_semantic_schema")

        output = await step_instance.execute(
            {"source": "payload", "schema_ref": "CX-0135"}, ctx, definition,
        )

        assert output.value["is_valid"] is True, "Valid payload should pass validation"
        assert output.value["missing_keys"] == []

    @pytest.mark.asyncio
    async def test_validate_semantic_schema_invalid_payload(self) -> None:

        payload = {"someOtherKey": "value"}
        ctx = _make_mock_context(payload=payload)
        step_instance = ValidateSemanticSchemaStep()
        definition = _make_step_definition(type="validate_semantic_schema")

        output = await step_instance.execute(
            {"source": "payload", "schema_ref": "CX-0135"}, ctx, definition,
        )

        assert output.value["is_valid"] is False, "Invalid payload should fail validation"
        assert "catenaXId" in output.value["missing_keys"]
        assert "childItems" in output.value["missing_keys"]

    @pytest.mark.asyncio
    async def test_validate_semantic_schema_custom_keys(self) -> None:

        payload = {"myKey": "present"}
        ctx = _make_mock_context(payload=payload)
        step_instance = ValidateSemanticSchemaStep()
        definition = _make_step_definition(type="validate_semantic_schema")

        output = await step_instance.execute(
            {"source": "payload", "schema_ref": "CUSTOM", "required_keys": ["myKey"]},
            ctx, definition,
        )

        assert output.value["is_valid"] is True
        assert output.value["schema_ref"] == "CUSTOM"
