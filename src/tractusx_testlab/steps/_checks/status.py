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

"""Status and existence assertion checks."""

from __future__ import annotations


def check_status_code(actual: object, expected: object, output: object) -> tuple[bool, str]:
    """Check that the HTTP status code matches expected."""
    actual_code = actual if isinstance(actual, int) else getattr(output, "status_code", None)
    passed = actual_code == expected
    return passed, "" if passed else f"Expected status_code={expected}, got {actual_code}"


def check_not_null(actual: object, _expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is not None."""
    passed = actual is not None
    return passed, "" if passed else "Expected non-null value, got None"


def check_not_empty(actual: object, _expected: object, _output: object) -> tuple[bool, str]:
    """Check that actual is not empty (None, empty string, list, or dict)."""
    if actual is None:
        return False, "Expected non-empty value, got None"
    if isinstance(actual, (str, list, dict)):
        passed = len(actual) > 0
        return passed, "" if passed else f"Expected non-empty value, got empty {type(actual).__name__}"
    return True, ""
