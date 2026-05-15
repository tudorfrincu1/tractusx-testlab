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

"""CLI command for executing TCKs."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

from tractusx_testlab.cli import app


@app.command()
def run(
    script: Path = typer.Argument(..., help="Test YAML script or TCK manifest to run."),
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c",
        help="YAML config file with variable overrides.",
    ),
    var: Optional[list[str]] = typer.Option(
        None, "--var",
        help="Runtime variable override as KEY=VALUE. Can be repeated.",
    ),
) -> None:
    """Run a YAML test script and print step results."""
    from tractusx_testlab.compiler.yaml_compiler import compile_yaml
    from tractusx_testlab.exceptions import CompilationError, ValidationError
    from tractusx_testlab.runner.test_runner import run_test

    if not script.exists():
        typer.echo(f"Error: file not found: {script}", err=True)
        raise typer.Exit(1)

    try:
        test = compile_yaml(script)
    except (CompilationError, ValidationError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(1)

    runtime_vars: dict[str, str] = {}
    if config_file is not None:
        import yaml as _yaml
        if not config_file.exists():
            typer.echo(f"Error: config file not found: {config_file}", err=True)
            raise typer.Exit(1)
        with open(config_file, "r", encoding="utf-8") as fh:
            config_data = _yaml.safe_load(fh) or {}
        variables = config_data.get("variables", {})
        for var_name, var_def in variables.items():
            if isinstance(var_def, dict) and var_def.get("default") is not None:
                runtime_vars[var_name] = str(var_def["default"])
            elif not isinstance(var_def, dict):
                runtime_vars[var_name] = str(var_def)

    if var:
        for entry in var:
            if "=" not in entry:
                typer.echo(f"Invalid --var format (expected KEY=VALUE): {entry}", err=True)
                raise typer.Exit(1)
            key, value = entry.split("=", 1)
            runtime_vars[key] = value

    report = run_test(test)
    total = len(report.steps)
    passed = sum(1 for s in report.steps if s.is_passed)
    typer.echo(f"Test: {report.test_name}")
    typer.echo(f"{passed}/{total} steps passed")

    for step in report.steps:
        status = "PASS" if step.is_passed else "FAIL"
        typer.echo(f"  [{status}] {step.name or '(unnamed)'}")
        if step.error:
            typer.echo(f"    Error: {step.error}")

    raise typer.Exit(0 if report.is_passed else 1)

