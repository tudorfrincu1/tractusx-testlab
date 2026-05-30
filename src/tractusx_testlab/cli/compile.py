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

"""CLI commands for compiling, decompiling, and inspecting .tck archives."""

from __future__ import annotations

import json
import tempfile
import zipfile
from pathlib import Path
from typing import Optional

import typer

from tractusx_testlab.cli import app


def _create_tck_archive(source_dir: Path, archive_path: Path) -> None:
    """Create a .tck ZIP archive from the compiled output directory."""
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in sorted(source_dir.rglob("*")):
            if file_path.is_file():
                arcname = file_path.relative_to(source_dir).as_posix()
                zf.write(file_path, arcname)


@app.command()
def compile(
    script: Path = typer.Argument(..., help="Path to the YAML test script to compile."),
    compiler_keys: Optional[Path] = typer.Option(
        None, "--compiler-keys", "-c",
        help="Directory containing the compiler identity (signing.pem, encryption.*).",
    ),
    player_pub: Optional[list[Path]] = typer.Option(
        None, "--player-pub", "-p",
        help="Path(s) to player RSA public key(s) (encryption.pub). Can be repeated.",
    ),
    output: Optional[Path] = typer.Option(
        None, "--output", "-o",
        help="Output path. Directory for --plain, .tck file otherwise.",
    ),
    version: Optional[str] = typer.Option(
        None, "--version", "-v",
        help="Connector version for version-specific validation.",
    ),
    plain: bool = typer.Option(
        False, "--plain",
        help="Output loose files (manifest.yaml, tck-execution.json, assets/). For development.",
    ),
    encrypt: bool = typer.Option(
        False, "--encrypt",
        help="Encrypt the .tck package. Requires --compiler-keys and --player-pub.",
    ),
) -> None:
    """Compile a YAML test script into a .tck archive."""
    from tractusx_testlab.compiler.compiler import Compiler

    compiler = Compiler()

    if plain:
        out = output or script.parent / "plain"
        try:
            manifest_dict, _ = compiler.compile_plain(manifest_path=script, output_path=out, version=version)
        except (ValueError, FileNotFoundError) as exc:
            typer.echo(f"Compilation failed: {exc}", err=True)
            raise typer.Exit(1)
        typer.echo(f"\nCompiled (plain) → {out}/manifest.yaml")
        typer.echo(f"                 → {out}/tck-execution.json")
        typer.echo(f"                 → {out}/assets/")
        typer.echo("")
        typer.echo(f"  Package checksum : {manifest_dict['package']['checksum']}")
        typer.echo(f"  Fingerprint digest: {manifest_dict['compilation']['fingerprint']['digest']}")
        return

    if encrypt:
        # Encrypted mode requires keys
        if not compiler_keys:
            typer.echo("Error: --compiler-keys is required for encrypted compilation.", err=True)
            raise typer.Exit(1)
        if not player_pub:
            typer.echo("Error: --player-pub is required for encrypted compilation.", err=True)
            raise typer.Exit(1)

        _compile_encrypted(script, compiler_keys, player_pub, output, version, compiler)
        return

    # Default: unencrypted .tck ZIP archive
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        try:
            manifest_dict, _ = compiler.compile_plain(manifest_path=script, output_path=tmp_path, version=version)
        except (ValueError, FileNotFoundError) as exc:
            typer.echo(f"Compilation failed: {exc}", err=True)
            raise typer.Exit(1)

        tck_id = manifest_dict["tck"]["id"]
        if output and output.is_dir():
            tck_path = output / f"{tck_id}.tck"
        else:
            tck_path = output or (script.parent / f"{tck_id}.tck")
        if tck_path.suffix != ".tck":
            tck_path = tck_path.with_suffix(".tck")
        tck_path.parent.mkdir(parents=True, exist_ok=True)
        _create_tck_archive(tmp_path, tck_path)

    typer.echo(f"\nCompiled → {tck_path}")
    typer.echo(f"  Package checksum : {manifest_dict['package']['checksum']}")
    typer.echo(f"  Fingerprint digest: {manifest_dict['compilation']['fingerprint']['digest']}")


def _compile_encrypted(
    script: Path,
    compiler_keys: Path,
    player_pub: list[Path],
    output: Optional[Path],
    version: Optional[str],
    compiler: object,
) -> None:
    """Run encrypted .stck compilation with signing and encryption."""
    from tractusx_testlab.security.trust.identity import PlayerIdentity
    from tractusx_testlab.security.crypto.keygen import _fingerprint

    # Load compiler identity
    compiler_identity = PlayerIdentity.load(compiler_keys)

    # Load recipient public keys
    recipient_keys: dict[str, bytes] = {}
    for pub_path in player_pub:
        pub_bytes = pub_path.read_bytes()
        fingerprint = _fingerprint(pub_bytes)
        recipient_keys[fingerprint] = pub_bytes
        typer.echo(f"  Authorized player: {pub_path.name} ({fingerprint[:16]}...)")

    out = output or script.with_suffix(".stck")

    # Detect whether input is a TCK manifest or a single test
    import yaml as _yaml
    from tractusx_testlab.player.loading.loader import _detect_kind
    from tractusx_testlab.models.enums import ScriptKind
    with open(script, "r", encoding="utf-8") as script_handle:
        raw = _yaml.safe_load(script_handle)
    is_tck = isinstance(raw, dict) and _detect_kind(raw) == ScriptKind.TCK

    try:
        if is_tck:
            manifest, validation = compiler.compile_tck(
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

    typer.echo(f"\nCompiled (encrypted) → {out}")
    typer.echo(f"  Checksum : {manifest.checksum[:32]}...")
    typer.echo(f"  Signed by: {manifest.security.compiler_id[:32]}...")
    typer.echo(f"  Players  : {len(manifest.security.authorized_players)}")

    if validation.issues:
        for issue in validation.issues:
            prefix = "WARN " if issue.level == "warning" else "ERROR"
            typer.echo(f"  [{prefix}] {issue.message}")


@app.command()
def info(
    package: Path = typer.Argument(..., help="Path to a .tck archive."),
) -> None:
    """Display the manifest of a compiled .tck package."""
    from tractusx_testlab.compiler.packager import Packager

    manifest = Packager.read_manifest(package)
    typer.echo(json.dumps(json.loads(manifest.model_dump_json()), indent=2))


@app.command()
def decompile(
    package: Path = typer.Argument(..., help="Path to the .tck archive to decompile."),
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
    """Decrypt and verify an encrypted .stck, extracting the original YAML."""
    from tractusx_testlab.compiler.packager import Packager
    from tractusx_testlab.security.crypto.keygen import load_private_key, load_public_key

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
        typer.echo("  Verified : signature OK")
