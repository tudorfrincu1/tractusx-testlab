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

"""
Testlab CLI — compile, encrypt, validate, and run test cases from the command line.

Install the SDK and use the ``testlab`` command::

    pip install tractusx-sdk
    testlab --help
    testlab keygen --out-dir .keys
    testlab compile script.yaml --keys-dir .keys
    testlab run test_case.yaml
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Optional

import typer

app = typer.Typer(
    name="testlab",
    help="Tractus-X Testlab CLI — compile, encrypt, validate, and run test cases.",
    add_completion=False,
)


# ============================================================================
# keygen — generate compiler + player key pairs
# ============================================================================


@app.command()
def keygen(
    out_dir: Path = typer.Option(
        Path(".keys"),
        "--out-dir", "-o",
        help="Directory to write key pairs into.",
    ),
    label: str = typer.Option(
        "default",
        "--label", "-l",
        help="Label prefix for the key files (e.g. 'compiler', 'player').",
    ),
    override_keys: bool = typer.Option(
        False,
        "--override-keys",
        help="Regenerate keys even if they already exist.",
    ),
) -> None:
    """Generate RSA (encryption) + Ed25519 (signing) key pairs for a player identity."""
    from tractusx_sdk.extensions.testlab.security.trust.identity import PlayerIdentity

    key_dir = out_dir / label
    if not override_keys and key_dir.is_dir() and any(key_dir.iterdir()):
        identity = PlayerIdentity.load(key_dir)
        typer.echo(f"Reusing existing keys in {key_dir}/")
    else:
        identity = PlayerIdentity.generate()
        identity.save(key_dir)
        typer.echo(f"Keys saved to {key_dir}/")

    typer.echo(f"  encryption.pem / encryption.pub  (RSA-4096)")
    typer.echo(f"  signing.pem    / signing.pub     (Ed25519)")
    typer.echo(f"  Encryption fingerprint: {identity.encryption.fingerprint[:32]}...")
    typer.echo(f"  Signing    fingerprint: {identity.signing.fingerprint[:32]}...")


# ============================================================================
# validate — static validation of a YAML script
# ============================================================================


@app.command()
def validate(
    script: Path = typer.Argument(..., help="Path to the YAML test script."),
    version: Optional[str] = typer.Option(
        None, "--version", "-v",
        help="Connector version for version-specific validation (e.g. 'saturn').",
    ),
) -> None:
    """Validate a YAML test script without compiling."""
    from tractusx_sdk.extensions.testlab.compiler.compiler import Compiler

    compiler = Compiler()
    result = compiler.validate(script, version=version)

    if not result.issues:
        typer.echo(f"OK — {script.name} is valid (no issues)")
        raise typer.Exit(0)

    for issue in result.issues:
        prefix = "ERROR" if issue.level == "error" else "WARN "
        loc = f" (step {issue.step_index})" if issue.step_index is not None else ""
        typer.echo(f"  [{prefix}]{loc} {issue.message}")

    if result.valid:
        typer.echo(f"\nValid with {len(result.issues)} warning(s)")
        raise typer.Exit(0)
    else:
        errors = sum(1 for issue in result.issues if issue.level == "error")
        typer.echo(f"\nInvalid — {errors} error(s)")
        raise typer.Exit(1)


# ============================================================================
# compile — validate + encrypt + sign → .testpkg
# ============================================================================


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


# ============================================================================
# info — inspect a .testpkg manifest
# ============================================================================


@app.command()
def info(
    package: Path = typer.Argument(..., help="Path to a .testpkg archive."),
) -> None:
    """Display the manifest of a compiled .testpkg package."""
    from tractusx_sdk.extensions.testlab.compiler.packager import Packager

    manifest = Packager.read_manifest(package)
    typer.echo(json.dumps(json.loads(manifest.model_dump_json()), indent=2))


# ============================================================================
# decompile — decrypt a .testpkg back to YAML
# ============================================================================


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


# ============================================================================
# run — execute a test case (YAML or .testpkg)
# ============================================================================


@app.command()
def run(
    target: Path = typer.Argument(..., help="Test case manifest (.yaml) or package (.testpkg)."),
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c",
        help="YAML config file with variable overrides (e.g. saturn_tck_int.yaml).",
    ),
    player_keys: Optional[Path] = typer.Option(
        None, "--player-keys", "-k",
        help="Directory with the player identity (required for .testpkg files).",
    ),
    compiler_pub: Optional[Path] = typer.Option(
        None, "--compiler-pub",
        help="Path to the compiler's signing.pub (required for .testpkg files).",
    ),
    var: Optional[list[str]] = typer.Option(
        None, "--var",
        help="Runtime variable override as KEY=VALUE. Can be repeated.",
    ),
    logs_dir: Optional[Path] = typer.Option(
        None, "--logs-dir", "-l",
        help="Directory for log output. Defaults to ./logs in the current directory.",
    ),
) -> None:
    """Load and execute a test case, printing results to stdout."""
    from tractusx_sdk.extensions.testlab.config.settings import TestlabConfig
    from tractusx_sdk.extensions.testlab.models import ScriptStatus, StepStatus
    from tractusx_sdk.extensions.testlab.player.execution.player import TestlabPlayer

    runtime_vars = _build_runtime_vars(config_file, var)

    if target.suffix == ".testpkg" and (player_keys is None or compiler_pub is None):
        typer.echo(
            "Error: --player-keys and --compiler-pub are required for .testpkg files.",
            err=True,
        )
        raise typer.Exit(1)

    config = TestlabConfig(logs_dir=logs_dir or Path.cwd() / "logs")
    player = TestlabPlayer(config=config)

    test_case = _load_test_case(target, player_keys, compiler_pub)
    total_steps = test_case.total_steps()

    _print_run_header(target, config_file, config, runtime_vars, total_steps)

    result = _execute_with_progress(player, test_case, runtime_vars, total_steps)

    _print_run_results(result, StepStatus, ScriptStatus)


def _build_runtime_vars(
    config_file: Optional[Path],
    var_overrides: Optional[list[str]],
) -> dict[str, str]:
    """Merge variables from config file (lower priority) and --var flags (higher priority)."""
    import yaml as _yaml

    runtime_vars: dict[str, str] = {}

    if config_file is not None:
        if not config_file.exists():
            typer.echo(f"Error: config file not found: {config_file}", err=True)
            raise typer.Exit(1)
        with open(config_file, "r", encoding="utf-8") as config_handle:
            config_data = _yaml.safe_load(config_handle) or {}
        variables = config_data.get("variables", {})
        for var_name, var_def in variables.items():
            if isinstance(var_def, dict) and var_def.get("default") is not None:
                runtime_vars[var_name] = str(var_def["default"])
            elif not isinstance(var_def, dict):
                runtime_vars[var_name] = str(var_def)

    if var_overrides:
        for entry in var_overrides:
            if "=" not in entry:
                typer.echo(f"Invalid --var format (expected KEY=VALUE): {entry}", err=True)
                raise typer.Exit(1)
            key, value = entry.split("=", 1)
            runtime_vars[key] = value

    return runtime_vars


def _load_test_case(
    target: Path,
    player_keys: Optional[Path],
    compiler_pub: Optional[Path],
):
    """Load a test case from YAML or encrypted .testpkg."""
    from tractusx_sdk.extensions.testlab.player.loading.loader import Loader

    loader = Loader()

    if target.suffix == ".testpkg":
        from tractusx_sdk.extensions.testlab.security.crypto.keygen import load_private_key, load_public_key

        priv = load_private_key(player_keys / "encryption.pem")
        pub = load_public_key(compiler_pub)
        return loader.load(target, player_private_key=priv, compiler_public_key=pub)

    return loader.load(target)


def _print_run_header(
    target: Path,
    config_file: Optional[Path],
    config,
    runtime_vars: dict[str, str],
    total_steps: int,
) -> None:
    """Print the banner with run configuration details."""
    width = 76
    typer.echo()
    typer.echo("=" * width)
    typer.echo(f"  Testlab Runner — {target.name}")
    typer.echo("=" * width)
    typer.echo(f"  Target:   {target}")
    if config_file:
        typer.echo(f"  Config:   {config_file}")
    typer.echo(f"  Logs dir: {config.logs_dir}")
    if runtime_vars:
        typer.echo(f"  Vars:     {', '.join(runtime_vars.keys())}")
    typer.echo(f"  Steps:    {total_steps}")
    typer.echo()


def _execute_with_progress(player, test_case, runtime_vars: dict[str, str], total_steps: int):
    """Run the test case with a rich progress bar and return the result."""
    from rich.progress import (
        BarColumn,
        Progress,
        SpinnerColumn,
        TaskProgressColumn,
        TextColumn,
        TimeElapsedColumn,
    )

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
    ) as progress:
        task_id = progress.add_task("Starting...", total=total_steps)

        def _on_progress(event: str, payload: dict) -> None:
            if event == "step.started":
                step_type = payload.get("step_type", "")
                progress.update(task_id, description=f"  Running: {step_type}")
            elif event == "step.completed":
                status = payload.get("status", "")
                name = payload.get("step_name", "")
                icon = "[green]✓" if status == "passed" else "[red]✗"
                progress.update(task_id, advance=1, description=f"  {icon} {name}")
            elif event == "script.started":
                script = payload.get("script", "")
                progress.update(task_id, description=f"  Script: {script}")

        player.monitor.add_callback(_on_progress)
        return asyncio.run(
            player.run_test_case(test_case, runtime_vars=runtime_vars or None)
        )


def _print_run_results(result, StepStatus, ScriptStatus) -> None:
    """Print per-script step results and the final summary line."""
    width = 76

    for script in result.scripts:
        typer.echo(f"  Script: {script.script_name}")
        typer.echo(f"  Status: {script.status.value}")
        if script.total_duration_s is not None:
            typer.echo(f"  Duration: {script.total_duration_s:.1f}s")
        typer.echo()

        for step in script.steps:
            icon = "PASS" if step.status == StepStatus.PASSED else "FAIL"
            duration = f"{step.duration_s:.2f}s" if step.duration_s else "---"
            typer.echo(f"    [{icon}] {step.step_name:<50} {duration}")
            if step.error:
                typer.echo(f"           Error: {step.error}")

        if script.assertion_summary:
            s = script.assertion_summary
            typer.echo(
                f"\n    Assertions: {s.total} total, "
                f"{s.passed} passed, "
                f"{s.failed_hard} hard-failed, "
                f"{s.failed_soft} soft-failed"
            )

    status_label = "PASS" if result.status == ScriptStatus.COMPLETED else "FAIL"
    typer.echo()
    typer.echo("-" * width)
    if result.duration_ms:
        typer.echo(
            f"  RESULT: {status_label}  |  "
            f"{result.passed} passed  "
            f"{result.total - result.passed} failed  |  "
            f"Duration: {result.duration_ms:.0f}ms"
        )
    else:
        typer.echo(f"  RESULT: {status_label}")
    typer.echo("=" * width)
    typer.echo()

    raise typer.Exit(0 if result.status == ScriptStatus.COMPLETED else 1)


def main() -> None:
    """Entry point for the ``testlab`` console script."""
    app()


if __name__ == "__main__":
    main()
