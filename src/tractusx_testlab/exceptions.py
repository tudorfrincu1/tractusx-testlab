#################################################################################
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
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Sonnet 4.6).
## It was reviewed and tested by a human committer.

"""Domain exception hierarchy for tractusx-testlab."""

from __future__ import annotations


class TestlabError(Exception):
    """Base exception for all testlab errors."""


class CompilationError(TestlabError):
    """Raised when a YAML script cannot be parsed or structurally compiled."""


class ValidationError(TestlabError):
    """Raised when a compiled script fails semantic validation."""


class ExecutionError(TestlabError):
    """Raised when a step fails during execution."""


class MockServerError(TestlabError):
    """Raised when mock server operations fail."""
