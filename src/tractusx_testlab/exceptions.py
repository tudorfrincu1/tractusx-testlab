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

"""Domain-specific exception hierarchy for TestLab."""

from __future__ import annotations


class TestLabError(Exception):
    """Base exception for all TestLab errors."""


class CompilationError(TestLabError):
    """Raised when a YAML test file cannot be parsed or validated."""

    def __init__(self, message: str, *, source: str | None = None) -> None:
        self.source = source
        super().__init__(f"{message}" + (f" (source: {source})" if source else ""))


class ValidationError(TestLabError):
    """Raised when a test model fails semantic validation."""

    def __init__(self, message: str, *, field: str | None = None) -> None:
        self.field = field
        super().__init__(f"{message}" + (f" (field: {field})" if field else ""))


class ExecutionError(TestLabError):
    """Raised when a step fails during test execution."""

    def __init__(
        self, message: str, *, step_name: str | None = None, step_type: str | None = None
    ) -> None:
        self.step_name = step_name
        self.step_type = step_type
        detail = f" [step: {step_name}, type: {step_type}]" if step_name else ""
        super().__init__(f"{message}{detail}")


class MockServerError(TestLabError):
    """Raised when a mock server fails to start, stop, or handle a request."""
