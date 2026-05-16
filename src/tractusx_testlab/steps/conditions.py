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

"""Evaluates ``if`` conditions on step definitions.

Condition expressions follow a syntax inspired by GitHub Actions:

Expressions are wrapped in ``${{ }}`` (the wrapper is optional for
backward compatibility).

Status functions
    ``${{ success() }}``   — true when all previous steps passed (default).
    ``${{ failure() }}``   — true when at least one previous step failed.
    ``${{ always() }}``    — always true; the step runs regardless of status.

Step outcome references
    ``${{ steps.<name>.outcome == 'success' }}``
    ``${{ steps.<name>.outcome == 'failure' }}``
    ``${{ steps.<name>.outcome == 'skipped' }}``

Variable comparisons
    ``${{ vars.<name> == 'value' }}``   — equals.
    ``${{ vars.<name> != 'value' }}``   — not equals.

Truthy check
    ``${{ vars.<name> }}``              — true when the variable is truthy.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any, Optional

from tractusx_testlab.models.enums import StepStatus

if TYPE_CHECKING:
    from tractusx_testlab.models.results import StepResult
    from tractusx_testlab.player.execution.context import StepContext

# ---------------------------------------------------------------------------
# Regex patterns for parsing condition expressions
# ---------------------------------------------------------------------------

# ${{ ... }} wrapper — captures inner expression
_EXPRESSION_RE = re.compile(r"^\$\{\{\s*(.*?)\s*\}\}$")

# Status functions: success(), failure(), always()
_STATUS_FN_RE = re.compile(r"^(success|failure|always)\(\)$")

# Step outcome: steps.<name>.outcome == 'value'
_STEP_OUTCOME_RE = re.compile(
    r"^steps\.([^\s.]+)\.outcome\s*(==|!=)\s*'([^']*)'$"
)

# Variable comparison: vars.<name> == 'value' (quoted) or vars.<name> == value (unquoted)
_VARS_COMPARISON_RE = re.compile(
    r"^vars\.([^\s=!]+)\s*(==|!=)\s*(?:'([^']*)'|(\S+))$"
)

# Variable truthy: vars.<name>
_VARS_TRUTHY_RE = re.compile(r"^vars\.([^\s]+)$")

# Legacy ${var} comparison (backward compat)
_LEGACY_COMPARISON_RE = re.compile(
    r"^\$\{([^}]+)\}\s*(==|!=)\s*(?:'([^']*)'|(\S+))$"
)

# Legacy ${var} truthy (backward compat)
_LEGACY_TRUTHY_RE = re.compile(r"^\$\{([^}]+)\}$")


class ConditionEvaluator:
    """Evaluates ``if`` condition strings against runtime state."""

    @staticmethod
    def should_run(
        condition: Optional[str],
        previous_results: list["StepResult"],
        context: "StepContext",
    ) -> bool:
        """Return ``True`` if the step should execute.

        Args:
            condition: The raw ``if`` expression string, or ``None`` (always run).
            previous_results: Results of all steps executed so far in the script.
            context: The current execution context (for variable lookups).

        Returns:
            ``True`` if the condition is met (step should run),
            ``False`` if the step should be skipped.
        """
        if condition is None:
            return True

        expr = condition.strip()
        if not expr:
            return True

        # Strip ${{ }} wrapper if present
        m = _EXPRESSION_RE.match(expr)
        if m:
            expr = m.group(1).strip()

        if not expr:
            return True

        # --- Status functions: success(), failure(), always() ----------------
        m = _STATUS_FN_RE.match(expr)
        if m:
            return _evaluate_status_fn(m.group(1), previous_results)

        # --- Step outcome: steps.<name>.outcome == 'value' -------------------
        m = _STEP_OUTCOME_RE.match(expr)
        if m:
            step_name = m.group(1)
            operator = m.group(2)
            expected = m.group(3)
            return _evaluate_step_outcome(step_name, operator, expected, previous_results)

        # --- Variable comparison: vars.<name> == 'value' ---------------------
        m = _VARS_COMPARISON_RE.match(expr)
        if m:
            var_name = m.group(1)
            operator = m.group(2)
            expected = m.group(3) if m.group(3) is not None else m.group(4)
            return _evaluate_comparison(var_name, operator, expected, context)

        # --- Variable truthy: vars.<name> ------------------------------------
        m = _VARS_TRUTHY_RE.match(expr)
        if m:
            return _evaluate_truthy(m.group(1), context)

        # --- Legacy: ${var} == 'value' (backward compat) ---------------------
        m = _LEGACY_COMPARISON_RE.match(expr)
        if m:
            var_name = m.group(1)
            operator = m.group(2)
            expected = m.group(3) if m.group(3) is not None else m.group(4)
            return _evaluate_comparison(var_name, operator, expected, context)

        # --- Legacy: ${var} (backward compat) --------------------------------
        m = _LEGACY_TRUTHY_RE.match(expr)
        if m:
            return _evaluate_truthy(m.group(1), context)

        # Unrecognised expression → do not skip (safe default)
        return True


# ---------------------------------------------------------------------------
# Internal evaluation helpers
# ---------------------------------------------------------------------------

_OUTCOME_MAP = {
    StepStatus.PASSED: "success",
    StepStatus.FAILED: "failure",
    StepStatus.SKIPPED: "skipped",
}


def _evaluate_status_fn(fn_name: str, previous_results: list["StepResult"]) -> bool:
    """Evaluate a status function against previous step results."""
    if fn_name == "always":
        return True

    has_failure = any(r.status == StepStatus.FAILED for r in previous_results)

    if fn_name == "failure":
        return has_failure
    # success — true only when no previous step failed
    return not has_failure


def _evaluate_step_outcome(
    step_name: str,
    operator: str,
    expected: str,
    previous_results: list["StepResult"],
) -> bool:
    """Evaluate ``steps.<name>.outcome == 'success'``."""
    # Find the step result by matching the step definition name.
    # step_result.step_name contains the full qualified name like
    # "script[0]:step_type", but the user references the human-readable
    # name from the YAML ``name:`` field.  We also store step_name as-is
    # and try a suffix match for the qualified format.
    result = _find_step_result(step_name, previous_results)

    if result is None:
        # Step not found → outcome is implicitly "skipped"
        actual_outcome = "skipped"
    else:
        actual_outcome = _OUTCOME_MAP.get(result.status, str(result.status.value).lower())

    if operator == "==":
        return actual_outcome == expected
    return actual_outcome != expected


def _find_step_result(name: str, results: list["StepResult"]) -> Optional["StepResult"]:
    """Find a step result by name (exact or suffix match)."""
    for r in reversed(results):
        # Exact match on step_name
        if r.step_name == name:
            return r
        # Match on the human-readable name portion after the last ':'
        parts = r.step_name.rsplit(":", 1)
        if len(parts) == 2 and parts[1] == name:
            return r
    # Substring match: step_name contains the requested name
    for r in reversed(results):
        if name in r.step_name:
            return r
    return None


def _evaluate_comparison(
    var_name: str,
    operator: str,
    expected: str,
    context: "StepContext",
) -> bool:
    """Evaluate ``vars.<name> == 'value'`` or ``vars.<name> != 'value'``."""
    actual = context.get_variable(var_name)
    actual_str = _to_comparable(actual)

    if operator == "==":
        return actual_str == expected
    return actual_str != expected


def _evaluate_truthy(var_name: str, context: "StepContext") -> bool:
    """Return ``True`` when the variable exists and is truthy."""
    value = context.get_variable(var_name)
    return bool(value)


def _to_comparable(value: Any) -> str:
    """Coerce a runtime value to a string for comparison.

    Booleans are lowercased (``true``/``false``) to match YAML conventions.
    """
    if value is None:
        return ""
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)
