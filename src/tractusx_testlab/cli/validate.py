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

"""CLI command for YAML test-script validation."""

from __future__ import annotations

from pathlib import Path

import typer

from tractusx_testlab.cli import app


@app.command()
def validate(
    script: Path = typer.Argument(..., help="Path to the YAML test script."),
    verbose: bool = typer.Option(False, "--verbose", help="Enable verbose output."),
) -> None:
    """Validate a YAML test script."""
    from tractusx_testlab.compiler.yaml_compiler import compile_yaml
    from tractusx_testlab.exceptions import CompilationError, ValidationError

    if not script.exists():
        typer.echo(f"Error: file not found: {script}", err=True)
        raise typer.Exit(1)

    try:
        test = compile_yaml(script)
        typer.echo(f"Valid: {test.name}")
        raise typer.Exit(0)
    except (CompilationError, ValidationError) as exc:
        typer.echo(f"Error: {exc}", err=True)
        raise typer.Exit(1)
