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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Tests for the YAML compiler."""

from __future__ import annotations

import pytest

from tractusx_testlab.compiler.yaml_compiler import compile_yaml, compile_yaml_string
from tractusx_testlab.exceptions import CompilationError, ValidationError


_MINIMAL_YAML = """
name: Minimal Test
steps: []
"""

_FULL_YAML = """
name: Full Test
version: "1.0"
dataspace: saturn
description: A complete test

connectors:
  provider:
    url: http://localhost:8080
    api_key: test-key

inputs:
  part_id:
    type: string
    default: MPI-001

mocks:
  - type: dtr
    name: mock-dtr

steps:
  - type: create_asset
    inputs:
      name: "@part_id"
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD

auto_cleanup: true
"""

_INVALID_YAML = "{{{{not yaml at all"

_UNKNOWN_STEP_YAML = """
name: Bad Step Test
steps:
  - type: totally_fake_step
"""

_BAD_VAR_REF_YAML = """
name: Bad Var Test
steps:
  - type: http_request
    inputs:
      url: "@nonexistent_var"
"""


class TestCompileYaml:
    def test_compile_minimal(self) -> None:
        test = compile_yaml_string(_MINIMAL_YAML)
        assert test.name == "Minimal Test"
        assert test.steps == []

    def test_compile_full(self) -> None:
        test = compile_yaml_string(_FULL_YAML)
        assert test.name == "Full Test"
        assert len(test.connectors) == 1
        assert len(test.mocks) == 1
        assert len(test.steps) == 1
        assert test.steps[0].type == "create_asset"
        assert test.steps[0].expect[0].type.value == "STATUS_CODE"

    def test_compile_invalid_yaml_raises(self) -> None:
        with pytest.raises(CompilationError, match="Invalid YAML"):
            compile_yaml_string(_INVALID_YAML)

    def test_compile_unknown_step_raises(self) -> None:
        with pytest.raises(ValidationError, match="Unknown step type"):
            compile_yaml_string(_UNKNOWN_STEP_YAML)

    def test_compile_bad_variable_ref_raises(self) -> None:
        with pytest.raises(ValidationError, match="undefined variable"):
            compile_yaml_string(_BAD_VAR_REF_YAML)

    def test_compile_non_mapping_raises(self) -> None:
        with pytest.raises(CompilationError, match="Expected a YAML mapping"):
            compile_yaml_string("- just a list")
