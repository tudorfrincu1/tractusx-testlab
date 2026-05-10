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

"""Tests for the CLI commands."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from typer.testing import CliRunner

from tractusx_testlab.cli import app

runner = CliRunner()


_VALID_YAML = """\
name: CLI Test
version: "1.0"
dataspace: saturn
steps: []
"""

_INVALID_YAML = "{{not valid yaml"

_BAD_STEP_YAML = """\
name: Bad Step
steps:
  - type: totally_unknown_step
    name: Nope
"""


@pytest.fixture()
def valid_yaml_file(tmp_path: Path) -> Path:
    f = tmp_path / "valid.yaml"
    f.write_text(_VALID_YAML)
    return f


@pytest.fixture()
def invalid_yaml_file(tmp_path: Path) -> Path:
    f = tmp_path / "invalid.yaml"
    f.write_text(_INVALID_YAML)
    return f


@pytest.fixture()
def bad_step_yaml_file(tmp_path: Path) -> Path:
    f = tmp_path / "bad_step.yaml"
    f.write_text(_BAD_STEP_YAML)
    return f


class TestValidateCommand:
    def test_validate_valid_file(self, valid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["validate", str(valid_yaml_file)])
        assert result.exit_code == 0
        assert "Valid" in result.stdout
        assert "CLI Test" in result.stdout

    def test_validate_invalid_yaml(self, invalid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["validate", str(invalid_yaml_file)])
        assert result.exit_code == 1

    def test_validate_bad_step(self, bad_step_yaml_file: Path) -> None:
        result = runner.invoke(app, ["validate", str(bad_step_yaml_file)])
        assert result.exit_code == 1

    def test_validate_nonexistent_file(self) -> None:
        result = runner.invoke(app, ["validate", "/nonexistent/path.yaml"])
        assert result.exit_code != 0

    def test_validate_verbose(self, valid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["validate", "--verbose", str(valid_yaml_file)])
        assert result.exit_code == 0
        assert "Valid" in result.stdout


class TestCompileCommand:
    def test_compile_valid_file(self, valid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["compile", str(valid_yaml_file)])
        assert result.exit_code == 0
        # Extract JSON from output (skip any logging lines before the JSON)
        lines = result.stdout.strip().split("\n")
        json_start = next(i for i, line in enumerate(lines) if line.strip().startswith("{"))
        json_text = "\n".join(lines[json_start:])
        output = json.loads(json_text)
        assert output["name"] == "CLI Test"

    def test_compile_invalid_yaml(self, invalid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["compile", str(invalid_yaml_file)])
        assert result.exit_code == 1

    def test_compile_verbose(self, valid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["compile", "--verbose", str(valid_yaml_file)])
        assert result.exit_code == 0


class TestRunCommand:
    def test_run_no_steps_passes(self, valid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["run", str(valid_yaml_file)])
        assert result.exit_code == 0
        assert "CLI Test" in result.stdout
        assert "0/0 steps passed" in result.stdout

    def test_run_invalid_yaml(self, invalid_yaml_file: Path) -> None:
        result = runner.invoke(app, ["run", str(invalid_yaml_file)])
        assert result.exit_code == 1


class TestVersionCommand:
    def test_version(self) -> None:
        result = runner.invoke(app, ["version"])
        assert result.exit_code == 0
        assert "tractusx-testlab" in result.stdout
        assert "0.1.0" in result.stdout


class TestPrintReport:
    def test_print_report_with_error(self, tmp_path: Path) -> None:
        """Test report with a step that has an error."""
        yaml_content = """\
name: Error Test
steps:
  - type: http_request
    name: Bad Request
    inputs:
      url: "http://127.0.0.1:1/nonexistent"
    expect:
      - type: STATUS_CODE
        value: 200
"""
        f = tmp_path / "error.yaml"
        f.write_text(yaml_content)
        result = runner.invoke(app, ["run", str(f)])
        assert result.exit_code == 1

    def test_print_report_with_assertions(self, tmp_path: Path) -> None:
        """Test report printing with step that uses noop executor and assertions."""
        yaml_content = """\
name: Noop Test
steps:
  - type: register_twin
    name: Register
    expect:
      - type: STATUS_CODE
        value: 200
        severity: HARD
"""
        f = tmp_path / "noop.yaml"
        f.write_text(yaml_content)
        result = runner.invoke(app, ["run", str(f)])
        # noop returns status 200, so STATUS_CODE 200 should pass
        assert "Register" in result.stdout
