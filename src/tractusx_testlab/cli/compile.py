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

"""CLI commands for compiling, decompiling, and inspecting .testpkg archives."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import typer

from tractusx_testlab.cli import app


@app.command()
def compile(
    script: Path = typer.Argument(..., help="Path to the YAML test script to compile."),
    compiler_keys: Path = typer.Option(
        ..., "--compiler-keys", "-c",
        help="Directory containing the compiler identity (signing.pem, encryption.*).",
    ),
    player_pub: list[Path] = typer.Option(
        ..., "--player-pub", "-p",
        help="Path(s) to player RSA public key(s) (encryption.pub). Can be repeated.",
    ),
    output: Optional[Path] = typer.Option(
        None, "--output", "-o",
        help="Output .testpkg path. Defaults to <script_name>.testpkg.",
    ),
    version: Optional[str] = typer.Option(
        None, "--version", "-v",
        help="Connector version for version-specific validation.",
    ),
) -> None:
    """Compile a YAML test script into an encrypted, signed .testpkg archive."""
    from tractusx_sdk.extensions.testlab.compiler.compiler import Compiler
    from tractusx_sdk.extensions.testlab.security.trust.identity import PlayerIdentity
    from tractusx_sdk.extensions.testlab.security.crypto.keygen import _fingerprint

    # Load compiler identity
    compiler_identity = PlayerIdentity.load(compiler_keys)

    # Load recipient public keys
    recipient_keys: dict[str, bytes] = {}
    for pub_path in player_pub:
        pub_bytes = pub_path.read_bytes()
        fingerprint = _fingerprint(pub_bytes)
        recipient_keys[fingerprint] = pub_bytes
        typer.echo(f"  Authorized player: {pub_path.name} ({fingerprint[:16]}...)")

    compiler = Compiler()
    out = output or script.with_suffix(".testpkg")

    # Detect whether input is a test case manifest or a single test
    import yaml as _yaml
    from tractusx_sdk.extensions.testlab.player.loading.loader import _detect_kind
    from tractusx_sdk.extensions.testlab.models import ScriptKind
    with open(script, "r", encoding="utf-8") as script_handle:
        raw = _yaml.safe_load(script_handle)
    is_test_case = isinstance(raw, dict) and _detect_kind(raw) == ScriptKind.TEST_CASE

    try:
        if is_test_case:
            manifest, validation = compiler.compile_test_case(
                manifest_path=script,
                compiler_identity=compiler_identity,
                recipient_keys=recipient_keys,
                output_path=out,
                version=version,
            )
        else:
            manifest, validation = compiler.compile(
                script_path=script,
                compiler_identity=compiler_identity,
                recipient_keys=recipient_keys,
                output_path=out,
                version=version,
            )
    except (ValueError, FileNotFoundError) as exc:
        typer.echo(f"Compilation failed: {exc}", err=True)
        raise typer.Exit(1)

    typer.echo(f"\nCompiled → {out}")
    typer.echo(f"  Checksum : {manifest.checksum[:32]}...")
    typer.echo(f"  Signed by: {manifest.security.compiler_id[:32]}...")
    typer.echo(f"  Players  : {len(manifest.security.authorized_players)}")

    if validation.issues:
        for issue in validation.issues:
            prefix = "WARN " if issue.level == "warning" else "ERROR"
            typer.echo(f"  [{prefix}] {issue.message}")


@app.command()
def info(
    package: Path = typer.Argument(..., help="Path to a .testpkg archive."),
) -> None:
    """Display the manifest of a compiled .testpkg package."""
    from tractusx_sdk.extensions.testlab.compiler.packager import Packager

    manifest = Packager.read_manifest(package)
    typer.echo(json.dumps(json.loads(manifest.model_dump_json()), indent=2))


@app.command()
def decompile(
    package: Path = typer.Argument(..., help="Path to the .testpkg archive to decompile."),
    player_keys: Path = typer.Option(
        ..., "--player-keys", "-k",
        help="Directory containing the player identity (encryption.pem).",
    ),
    compiler_pub: Path = typer.Option(
        ..., "--compiler-pub", "-c",
        help="Path to the compiler's signing public key (signing.pub).",
    ),
    output: Optional[Path] = typer.Option(
        None, "--output", "-o",
        help="Output path for the decrypted YAML. Defaults to <package_name>.yaml.",
    ),
    stdout: bool = typer.Option(
        False, "--stdout",
        help="Print decrypted YAML to stdout instead of writing a file.",
    ),
) -> None:
    """Decrypt and verify an encrypted .testpkg, extracting the original YAML."""
    from tractusx_sdk.extensions.testlab.compiler.packager import Packager
    from tractusx_sdk.extensions.testlab.security.crypto.keygen import load_private_key, load_public_key

    priv_key_path = player_keys / "encryption.pem"
    if not priv_key_path.exists():
        typer.echo(f"Error: player private key not found: {priv_key_path}", err=True)
        raise typer.Exit(1)

    if not compiler_pub.exists():
        typer.echo(f"Error: compiler public key not found: {compiler_pub}", err=True)
        raise typer.Exit(1)

    priv_key = load_private_key(priv_key_path)
    pub_key = load_public_key(compiler_pub)

    try:
        plaintext = Packager.extract_and_verify(package, priv_key, pub_key)
    except ValueError as exc:
        typer.echo(f"Decompilation failed: {exc}", err=True)
        raise typer.Exit(1)

    if stdout:
        typer.echo(plaintext.decode("utf-8"))
    else:
        out_path = output or package.with_suffix(".yaml")
        out_path.write_bytes(plaintext)
        manifest = Packager.read_manifest(package)
        typer.echo(f"Decompiled → {out_path}")
        typer.echo(f"  Package  : {manifest.name} v{manifest.version}")
        typer.echo(f"  Checksum : {manifest.checksum[:32]}...")
        typer.echo(f"  Verified : signature OK")
