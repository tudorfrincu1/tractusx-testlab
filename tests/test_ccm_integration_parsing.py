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

"""Integration tests: CCM YAML parsing, index, assertions, registry, and services."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

import tractusx_testlab.steps  # noqa: F401 — trigger @step registrations
from tractusx_testlab.models.enums import AssertionType, ServiceType
from tractusx_testlab.scripting import StepRegistry
from tractusx_testlab.scripting._builders import parse_assertion, parse_service

CCM_DIR = Path(__file__).resolve().parent.parent / "ide" / "public" / "examples" / "certificate-management-v2.0"
CCM_TESTS_DIR = CCM_DIR / "tests"

_CCM_TEST_FILES = {
    "available_notification.yaml": 4,
    "catalog_policy_validation.yaml": 1,
    "certificate_asset_validation.yaml": 3,
    "error_handling.yaml": 4,
    "expose_testlab_asset.yaml": 4,
    "push_certificate.yaml": 4,
    "request_certificate.yaml": 3,
    "send_feedback.yaml": 4,
    "validate_payload.yaml": 2,
}

_CCM_STEP_TYPES = [
    "create_asset", "create_contract_definition", "create_policy",
    "delete_asset", "delete_policy",
    "export_variable", "generate_uuid", "http_call_dataplane",
    "import_variable", "load_schema", "mock_endpoint",
    "pull_data_filtered_from_precondition", "query_catalog_with_filters",
    "wait_for_call",
]

_CCM_STEP_TYPES_UNREGISTERED = [
    "delete_contract_def",
]


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
    def test_ccm_index_parses_as_tck(self) -> None:

        index_path = CCM_DIR / "index.yaml"
        with open(index_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        assert data["kind"] == "tck"
        assert data["name"] == "certificate-management"
        tests = data.get("tests", [])
        assert len(tests) == 9, f"Expected 9 tests, got {len(tests)}"
        for entry in tests:
            assert "test" in entry, f"Each test entry must have a 'test' key, got {entry}"


class TestCompactAssertionParsing:
    def test_ccm_compact_assertions_parse_correctly(self) -> None:

        yaml_path = CCM_TESTS_DIR / "request_certificate.yaml"
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        all_assertions = []
        for step_raw in data.get("steps", []):
            for expect_raw in step_raw.get("validate", []):
                all_assertions.append(parse_assertion(expect_raw))

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
