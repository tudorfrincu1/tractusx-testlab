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

"""Tests for policy and contract precondition step executors."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from tractusx_testlab.models.runtime.preconditions import (
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.steps.precondition.contract_config import ContractConfigStep
from tractusx_testlab.steps.precondition.policy_config import PolicyConfigStep


# ---------------------------------------------------------------------------
# PolicyConfigStep — Jupiter
# ---------------------------------------------------------------------------


class TestPolicyConfigJupiter:
    @pytest.mark.asyncio
    async def test_produces_config_log(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        output = await step.execute(
            {"version": "jupiter", "policy_type": "access", "permissions": []},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].log_type == PreconditionLogType.CONFIG

    @pytest.mark.asyncio
    async def test_category_is_edc_policy(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        output = await step.execute(
            {"version": "jupiter", "policy_type": "usage", "permissions": []},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].category == PreconditionLogCategory.EDC_POLICY

    @pytest.mark.asyncio
    async def test_action_is_odrl_use(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        perms = [{"constraints": []}]
        output = await step.execute(
            {"version": "jupiter", "policy_type": "access", "permissions": perms},
            mock_context,
            MagicMock(),
        )
        data = output.value[0].data
        assert data["permissions"][0]["action"] == "odrl:use"

    @pytest.mark.asyncio
    async def test_bpn_constraint_uses_tx_prefix(
        self, mock_context: MagicMock,
    ) -> None:
        step = PolicyConfigStep()
        perms = [{"constraints": [
            {"leftOperand": "BusinessPartnerNumber", "rightOperand": "active"},
        ]}]
        output = await step.execute(
            {"version": "jupiter", "policy_type": "access", "permissions": perms},
            mock_context,
            MagicMock(),
        )
        constraint = output.value[0].data["permissions"][0]["constraints"][0]
        assert constraint["leftOperand"].startswith("tx:")

    @pytest.mark.asyncio
    async def test_membership_uses_cx_policy_prefix(
        self, mock_context: MagicMock,
    ) -> None:
        step = PolicyConfigStep()
        perms = [{"constraints": [
            {"leftOperand": "Membership", "rightOperand": "active"},
        ]}]
        output = await step.execute(
            {"version": "jupiter", "policy_type": "access", "permissions": perms},
            mock_context,
            MagicMock(),
        )
        constraint = output.value[0].data["permissions"][0]["constraints"][0]
        assert constraint["rightOperand"].startswith("cx-policy:")

    @pytest.mark.asyncio
    async def test_jupiter_has_no_prohibitions_or_obligations(
        self, mock_context: MagicMock,
    ) -> None:
        step = PolicyConfigStep()
        output = await step.execute(
            {"version": "jupiter", "policy_type": "access", "permissions": []},
            mock_context,
            MagicMock(),
        )
        data = output.value[0].data
        assert "prohibitions" not in data
        assert "obligations" not in data


# ---------------------------------------------------------------------------
# PolicyConfigStep — Saturn
# ---------------------------------------------------------------------------


class TestPolicyConfigSaturn:
    @pytest.mark.asyncio
    async def test_supports_use_action(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        perms = [{"action": "use", "constraints": []}]
        output = await step.execute(
            {"version": "saturn", "policy_type": "access", "permissions": perms},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["permissions"][0]["action"] == "use"

    @pytest.mark.asyncio
    async def test_supports_access_action(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        perms = [{"action": "access", "constraints": []}]
        output = await step.execute(
            {"version": "saturn", "policy_type": "access", "permissions": perms},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["permissions"][0]["action"] == "access"

    @pytest.mark.asyncio
    async def test_supports_prohibitions(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        output = await step.execute(
            {
                "version": "saturn",
                "policy_type": "usage",
                "permissions": [],
                "prohibitions": [{"action": "transfer"}],
            },
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["prohibitions"] == [{"action": "transfer"}]

    @pytest.mark.asyncio
    async def test_supports_obligations(self, mock_context: MagicMock) -> None:
        step = PolicyConfigStep()
        output = await step.execute(
            {
                "version": "saturn",
                "policy_type": "usage",
                "permissions": [],
                "obligations": [{"action": "delete"}],
            },
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["obligations"] == [{"action": "delete"}]

    @pytest.mark.asyncio
    async def test_no_prefix_on_constraint_keys(
        self, mock_context: MagicMock,
    ) -> None:
        step = PolicyConfigStep()
        perms = [{"action": "use", "constraints": [
            {"leftOperand": "Membership", "rightOperand": "active"},
        ]}]
        output = await step.execute(
            {"version": "saturn", "policy_type": "access", "permissions": perms},
            mock_context,
            MagicMock(),
        )
        constraint = output.value[0].data["permissions"][0]["constraints"][0]
        assert constraint["leftOperand"] == "Membership"
        assert constraint["rightOperand"] == "active"


# ---------------------------------------------------------------------------
# ContractConfigStep
# ---------------------------------------------------------------------------


class TestContractConfigStep:
    @pytest.mark.asyncio
    async def test_produces_config_log(self, mock_context: MagicMock) -> None:
        step = ContractConfigStep()
        output = await step.execute(
            {"asset_id": "a1", "access_policy_id": "ap1", "usage_policy_id": "up1"},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].log_type == PreconditionLogType.CONFIG

    @pytest.mark.asyncio
    async def test_category_is_edc_contract(self, mock_context: MagicMock) -> None:
        step = ContractConfigStep()
        output = await step.execute(
            {"asset_id": "a1", "access_policy_id": "ap1", "usage_policy_id": "up1"},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].category == PreconditionLogCategory.EDC_CONTRACT

    @pytest.mark.asyncio
    async def test_data_links_asset_and_policies(
        self, mock_context: MagicMock,
    ) -> None:
        step = ContractConfigStep()
        output = await step.execute(
            {"asset_id": "a1", "access_policy_id": "ap1", "usage_policy_id": "up1"},
            mock_context,
            MagicMock(),
        )
        data = output.value[0].data
        assert data["asset_id"] == "a1"
        assert data["access_policy_id"] == "ap1"
        assert data["usage_policy_id"] == "up1"

    @pytest.mark.asyncio
    async def test_data_contains_asset_selector(
        self, mock_context: MagicMock,
    ) -> None:
        step = ContractConfigStep()
        output = await step.execute(
            {"asset_id": "a1", "access_policy_id": "ap1", "usage_policy_id": "up1"},
            mock_context,
            MagicMock(),
        )
        selector = output.value[0].data["asset_selector"]
        assert selector["https://w3id.org/edc/v0.0.1/ns/id"] == "a1"

    @pytest.mark.asyncio
    async def test_missing_asset_id_raises(self, mock_context: MagicMock) -> None:
        step = ContractConfigStep()
        with pytest.raises(KeyError):
            await step.execute(
                {"access_policy_id": "ap1", "usage_policy_id": "up1"},
                mock_context,
                MagicMock(),
            )

    @pytest.mark.asyncio
    async def test_stores_variable(self, mock_context: MagicMock) -> None:
        step = ContractConfigStep()
        await step.execute(
            {
                "asset_id": "a1",
                "access_policy_id": "ap1",
                "usage_policy_id": "up1",
                "variable": "contract_log",
            },
            mock_context,
            MagicMock(),
        )
        mock_context.set_variable.assert_called_once()
        assert mock_context.set_variable.call_args[0][0] == "contract_log"
