#################################################################################
# Eclipse Tractus-X - Tractus-X TestLab
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
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""CLI command for inspecting .tck and .stck package metadata without executing."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer

from tractusx_testlab.cli import app


@app.command()
def inspect(
    package: Path = typer.Argument(..., help="Path to a .tck or .stck package."),
    player_keys: Optional[Path] = typer.Option(
        None, "--player-keys", "-k",
        help="Directory with the player identity (encryption.pem). Required for .stck files.",
    ),
    compiler_pub: Optional[Path] = typer.Option(
        None, "--compiler-pub", "-c",
        help="Path to the compiler's signing public key (signing.pub). Required for .stck files.",
    ),
    as_json: bool = typer.Option(
        False, "--json",
        help="Output inspection result as JSON.",
    ),
) -> None:
    """Inspect metadata of a .tck or .stck package without executing it."""
    if not package.exists():
        typer.echo(f"Error: package not found: {package}", err=True)
        raise typer.Exit(1)

    if package.suffix == ".stck":
        _require_keys(player_keys, compiler_pub)

    tck = _load_tck(package, player_keys, compiler_pub)
    result = tck.inspect()

    if as_json:
        typer.echo(result.model_dump_json(indent=2))
        return

    _print_inspection(package, result)


def _require_keys(player_keys: Optional[Path], compiler_pub: Optional[Path]) -> None:
    """Validate that decryption keys are present for encrypted packages."""
    if player_keys is None:
        typer.echo("Error: --player-keys is required for encrypted .stck files.", err=True)
        raise typer.Exit(1)
    if compiler_pub is None:
        typer.echo("Error: --compiler-pub is required for encrypted .stck files.", err=True)
        raise typer.Exit(1)


def _load_tck(
    package: Path,
    player_keys: Optional[Path],
    compiler_pub: Optional[Path],
) -> object:
    """Load a .tck or .stck package into a Tck object."""
    from tractusx_testlab.player.loading.loader import Loader

    loader = Loader()

    if package.suffix == ".stck":
        from tractusx_testlab.security.crypto.keygen import load_private_key, load_public_key

        priv = load_private_key(player_keys / "encryption.pem")  # type: ignore[operator]
        pub = load_public_key(compiler_pub)  # type: ignore[arg-type]
        return loader.load(package, player_private_key=priv, compiler_public_key=pub)

    return loader.load(package)


def _print_inspection(package: Path, result: object) -> None:
    """Print a human-readable inspection report."""
    from tractusx_testlab.models.runtime.inspection import TckInspectionResult

    r: TckInspectionResult = result  # type: ignore[assignment]
    width = 72

    typer.echo()
    typer.echo("=" * width)
    typer.echo(f"  Testlab Inspect — {package.name}")
    typer.echo("=" * width)
    typer.echo(f"  Name             : {r.name}")
    typer.echo(f"  Total Steps      : {r.total_steps}")
    typer.echo(f"  Total Validations: {r.total_validations}")
    typer.echo(f"  Scripts          : {len(r.scripts)}")
    typer.echo()

    for script in r.scripts:
        typer.echo(f"  Script: {script.name}")
        typer.echo(f"  {'Step Name':<40} {'Uses':<35} {'Phase':<10} {'Validations'}")
        typer.echo(f"  {'-'*40} {'-'*35} {'-'*10} {'-'*11}")

        for step in script.steps:
            phase_label = step.phase.value.title()
            name_col = step.step_name[:39]
            uses_col = step.uses[:34]
            typer.echo(
                f"  {name_col:<40} {uses_col:<35} {phase_label:<10} {step.validation_count}"
            )

        typer.echo()

    typer.echo("=" * width)
    typer.echo()
