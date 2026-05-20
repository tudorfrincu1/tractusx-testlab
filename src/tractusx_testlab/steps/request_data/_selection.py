#################################################################################
# Eclipse Tractus-X - Software Development KIT
#
# Copyright (c) 2026 Contributors to the Eclipse Foundation
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

"""Dataset selection strategies for pull_data shortcut blocks."""

from __future__ import annotations

import logging

from tractusx_testlab.steps.pull_data._constants import DEFAULT_DATASET_INDEX

logger = logging.getLogger(__name__)


class DatasetSelectionError(Exception):
    """No dataset matched the selection criteria."""

    def __init__(self, reason: str, available_count: int = 0):
        self.available_count = available_count
        super().__init__(
            f"Dataset selection failed: {reason} "
            f"(available datasets: {available_count})"
        )


def select_by_index(datasets: list[dict], index: int | None = None) -> dict:
    """Select a dataset by positional index.

    Args:
        datasets: List of datasets from catalog response.
        index: Zero-based index (defaults to 0).

    Returns:
        The selected dataset dict.

    Raises:
        DatasetSelectionError: If index is out of range or list is empty.
    """
    idx = index if index is not None else DEFAULT_DATASET_INDEX

    if not datasets:
        raise DatasetSelectionError(reason="no datasets in catalog result", available_count=0)
    if idx < 0 or idx >= len(datasets):
        raise DatasetSelectionError(
            reason=f"index {idx} out of range",
            available_count=len(datasets),
        )

    logger.debug("Selected dataset at index %d of %d", idx, len(datasets))
    return datasets[idx]


def select_by_policy_constraints(
    datasets: list[dict],
    constraints: list[dict],
) -> dict:
    """Select the first dataset whose policy matches ALL given constraints.

    Each constraint dict has: key, operator, value.
    A dataset matches if any of its odrl:hasPolicy entries satisfy all constraints.

    Args:
        datasets: List of datasets from catalog response.
        constraints: List of constraint dicts (key, operator, value).

    Returns:
        The first matching dataset dict.

    Raises:
        DatasetSelectionError: If no dataset matches all constraints.
    """
    if not datasets:
        raise DatasetSelectionError(reason="no datasets to match against", available_count=0)
    if not constraints:
        raise DatasetSelectionError(reason="no policy constraints provided", available_count=len(datasets))

    for dataset in datasets:
        policies = dataset.get("odrl:hasPolicy", [])
        if isinstance(policies, dict):
            policies = [policies]
        for policy in policies:
            if _policy_matches_constraints(policy, constraints):
                logger.debug("Found dataset matching %d constraints", len(constraints))
                return dataset

    raise DatasetSelectionError(
        reason=f"no dataset matched all {len(constraints)} constraints",
        available_count=len(datasets),
    )


def select_by_precondition_policy(
    datasets: list[dict],
    precondition_policy: dict,
) -> dict:
    """Select the dataset whose policy matches a precondition-defined policy reference.

    The precondition_policy is a full policy object (as produced by a precondition block).
    We match by policy @id if available, otherwise by structural equality of permissions.

    Args:
        datasets: List of datasets from catalog response.
        precondition_policy: Policy dict from a precondition step output.

    Returns:
        The first matching dataset dict.

    Raises:
        DatasetSelectionError: If no dataset matches the precondition policy.
    """
    if not datasets:
        raise DatasetSelectionError(reason="no datasets to match against", available_count=0)
    if not precondition_policy:
        raise DatasetSelectionError(reason="no precondition policy provided", available_count=len(datasets))

    target_id = precondition_policy.get("@id") or precondition_policy.get("id")

    for dataset in datasets:
        policies = dataset.get("odrl:hasPolicy", [])
        if isinstance(policies, dict):
            policies = [policies]
        for policy in policies:
            policy_id = policy.get("@id") or policy.get("id")
            if target_id and policy_id and policy_id == target_id:
                logger.debug("Matched dataset by policy @id=%s", target_id)
                return dataset
            if _policies_structurally_equal(policy, precondition_policy):
                logger.debug("Matched dataset by structural policy equality")
                return dataset

    raise DatasetSelectionError(
        reason="no dataset matched the precondition policy",
        available_count=len(datasets),
    )


def _policy_matches_constraints(policy: dict, constraints: list[dict]) -> bool:
    """Check if a policy satisfies all constraint requirements."""
    permissions = policy.get("odrl:permission", [])
    if isinstance(permissions, dict):
        permissions = [permissions]

    policy_constraints = []
    for perm in permissions:
        perm_constraints = perm.get("odrl:constraint", [])
        if isinstance(perm_constraints, dict):
            perm_constraints = [perm_constraints]
        policy_constraints.extend(perm_constraints)

    for required in constraints:
        req_key = required.get("key", "")
        req_op = required.get("operator", "eq")
        req_val = required.get("value", "")
        if not _has_matching_constraint(policy_constraints, req_key, req_op, req_val):
            return False
    return True


def _has_matching_constraint(
    policy_constraints: list[dict],
    key: str,
    operator: str,
    value: str,
) -> bool:
    """Check if any policy constraint matches the required key/op/value."""
    for pc in policy_constraints:
        left = pc.get("odrl:leftOperand", pc.get("leftOperand", ""))
        op = pc.get("odrl:operator", pc.get("operator", ""))
        right = pc.get("odrl:rightOperand", pc.get("rightOperand", ""))

        if isinstance(op, dict):
            op = op.get("@id", "")

        if _normalize_operand(left) == _normalize_operand(key):
            if _normalize_operator(op) == _normalize_operator(operator):
                if str(right) == str(value):
                    return True
    return False


def _normalize_operand(operand: str) -> str:
    """Strip common namespace prefixes for comparison."""
    for prefix in ("odrl:", "cx-policy:", "edc:"):
        if operand.startswith(prefix):
            return operand[len(prefix):]
    return operand


def _normalize_operator(op: str) -> str:
    """Normalize operator strings to a canonical form."""
    op_lower = op.lower().rstrip("/")
    mapping = {"=": "eq", "==": "eq", "eq": "eq", "neq": "neq", "!=": "neq"}
    return mapping.get(op_lower, op_lower.split("/")[-1] if "/" in op_lower else op_lower)


def _policies_structurally_equal(policy_a: dict, policy_b: dict) -> bool:
    """Compare two policies by their permission structure (best-effort)."""
    perms_a = policy_a.get("odrl:permission", [])
    perms_b = policy_b.get("odrl:permission", [])
    if isinstance(perms_a, dict):
        perms_a = [perms_a]
    if isinstance(perms_b, dict):
        perms_b = [perms_b]
    if len(perms_a) != len(perms_b):
        return False
    # Simple structural check: same number of constraints with same keys
    for pa, pb in zip(perms_a, perms_b):
        ca = pa.get("odrl:constraint", [])
        cb = pb.get("odrl:constraint", [])
        if isinstance(ca, dict):
            ca = [ca]
        if isinstance(cb, dict):
            cb = [cb]
        if len(ca) != len(cb):
            return False
    return True
