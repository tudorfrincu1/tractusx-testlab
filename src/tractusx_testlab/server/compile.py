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

"""YAML compile/validate endpoint — parse + validate without execution."""

from __future__ import annotations

import logging

import yaml
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from tractusx_testlab.compiler.validator import ScriptValidator
from tractusx_testlab.models.enums import ScriptKind
from tractusx_testlab.scripting.parser import YamlParser

_logger = logging.getLogger(__name__)
_validator = ScriptValidator()

compile_router = APIRouter(tags=["compile"])


def _error(path: str, message: str) -> dict[str, str]:
    """Build a single structured error entry."""
    return {"path": path, "message": message}


@compile_router.post("/compile")
async def compile_yaml(request: Request) -> JSONResponse:
    """Validate a raw YAML body and return structured errors or success.

    Always returns HTTP 200 — validation errors are application-level.
    """
    raw = await request.body()
    if not raw:
        return JSONResponse(content={
            "status": "error",
            "errors": [_error("", "Request body is empty")],
        })

    try:
        data = yaml.safe_load(raw)
    except yaml.YAMLError as exc:
        return JSONResponse(content={
            "status": "error",
            "errors": [_error("", f"Invalid YAML syntax: {exc}")],
        })

    if not isinstance(data, dict):
        return JSONResponse(content={
            "status": "error",
            "errors": [_error("", "YAML root must be a mapping")],
        })

    parser = YamlParser()
    kind_value = data.get("kind")
    has_tests = "tests" in data

    try:
        if kind_value:
            kind = ScriptKind(kind_value)
        elif has_tests:
            kind = ScriptKind.TCK
        else:
            kind = ScriptKind.TEST
    except ValueError:
        return JSONResponse(content={
            "status": "error",
            "errors": [_error("kind", f"Unknown script kind: {kind_value!r}")],
        })

    try:
        if kind == ScriptKind.TCK:
            parsed = parser.parse_tck_from_dict(data)
        else:
            parsed = parser.parse_script_from_dict(data)
    except ValidationError as exc:
        errors = [
            _error(
                ".".join(str(loc) for loc in e["loc"]),
                e["msg"],
            )
            for e in exc.errors()
        ]
        return JSONResponse(content={"status": "error", "errors": errors})
    except (ValueError, KeyError, TypeError) as exc:
        return JSONResponse(content={
            "status": "error",
            "errors": [_error("", f"Validation failed: {exc}")],
        })

    # --- Semantic validation (empty name, unknown steps, etc.) ---
    errors: list[dict[str, str]] = []

    if not parsed.name or not parsed.name.strip():
        errors.append(_error("name", "Script name is required and must not be empty"))

    if kind == ScriptKind.TEST:
        result = _validator.validate(parsed, version=parsed.dataspace_version)
        for issue in result.issues:
            path = issue.field or ""
            if issue.phase:
                path = f"{issue.phase}[{issue.step_index}].{path}" if path else f"{issue.phase}[{issue.step_index}]"
            elif issue.step_index is not None:
                path = f"steps[{issue.step_index}].{path}" if path else f"steps[{issue.step_index}]"
            errors.append(_error(path, issue.message))

    if errors:
        return JSONResponse(content={"status": "error", "errors": errors})

    _logger.debug("YAML compile OK (kind=%s)", kind.value)
    return JSONResponse(content={"status": "ok", "errors": []})
