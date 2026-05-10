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

"""CLI entry point — testlab validate | compile | run."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import typer

from tractusx_testlab import __version__
from tractusx_testlab.compiler.yaml_compiler import compile_yaml
from tractusx_testlab.exceptions import CompilationError, TestLabError, ValidationError
from tractusx_testlab.runner.test_runner import TestReport, run_test

app = typer.Typer(
    name="testlab",
    help="Tractus-X TestLab — visual test authoring for Eclipse Tractus-X dataspaces.",
    add_completion=False,
)


def _configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


# ── Commands ───────────────────────────────────────────────────────────────────


@app.command()
def validate(
    file: Path = typer.Argument(..., help="Path to the YAML test file."),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable debug logging."),
) -> None:
    """Parse and validate a YAML test file without executing it."""
    _configure_logging(verbose)
    try:
        test = compile_yaml(file)
        typer.echo(f"✓ Valid: '{test.name}' — {len(test.steps)} steps, {len(test.mocks)} mocks")
    except (CompilationError, ValidationError) as exc:
        typer.echo(f"✗ {exc}", err=True)
        raise typer.Exit(code=1) from exc


@app.command()
def compile(
    file: Path = typer.Argument(..., help="Path to the YAML test file."),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable debug logging."),
) -> None:
    """Parse, validate, and output the compiled model as JSON."""
    _configure_logging(verbose)
    try:
        test = compile_yaml(file)
        output = test.model_dump(mode="json", by_alias=True)
        typer.echo(json.dumps(output, indent=2))
    except (CompilationError, ValidationError) as exc:
        typer.echo(f"✗ {exc}", err=True)
        raise typer.Exit(code=1) from exc


@app.command()
def run(
    file: Path = typer.Argument(..., help="Path to the YAML test file."),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable debug logging."),
) -> None:
    """Execute a YAML test file and display results."""
    _configure_logging(verbose)
    try:
        test = compile_yaml(file)
        report = run_test(test)
        _print_report(report)
        if not report.is_passed:
            raise typer.Exit(code=1)
    except TestLabError as exc:
        typer.echo(f"✗ {exc}", err=True)
        raise typer.Exit(code=1) from exc


@app.command()
def version() -> None:
    """Show the TestLab version."""
    typer.echo(f"tractusx-testlab {__version__}")


# ── Report printer ─────────────────────────────────────────────────────────────


def _print_report(report: TestReport) -> None:
    """Pretty-print a test execution report."""
    icon = "✓" if report.is_passed else "✗"
    typer.echo(f"\n{icon} Test: {report.test_name}")

    if report.error:
        typer.echo(f"  Error: {report.error}")
        return

    for step in report.steps:
        step_icon = "✓" if step.is_passed else "✗"
        typer.echo(f"  {step_icon} {step.name} ({step.step_type})")

        if step.error:
            typer.echo(f"    Error: {step.error}")

        for ar in step.assertion_results:
            ar_icon = "✓" if ar.is_passed else "✗"
            severity_tag = f"[{ar.assertion.severity.value}]"
            typer.echo(f"    {ar_icon} {ar.assertion.type.value} {severity_tag}")
            if not ar.is_passed and ar.message:
                typer.echo(f"      → {ar.message}")

    passed = sum(1 for s in report.steps if s.is_passed)
    total = len(report.steps)
    typer.echo(f"\n  {passed}/{total} steps passed")


def main() -> None:
    """Entry point for the CLI."""
    app()


if __name__ == "__main__":
    main()
