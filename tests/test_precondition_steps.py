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

"""Tests for asset precondition step executor."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.steps.precondition.asset_config import AssetConfigStep


# ---------------------------------------------------------------------------
# AssetConfigStep
# ---------------------------------------------------------------------------


class TestAssetConfigStep:
    @pytest.mark.asyncio
    async def test_produces_config_log(self, mock_context: MagicMock) -> None:
        step = AssetConfigStep()
        output = await step.execute(
            {"dct_type": "cx-taxo:CertificateManagement"},
            mock_context,
            MagicMock(),
        )
        logs = output.value
        assert len(logs) == 1
        assert isinstance(logs[0], PreconditionLog)
        assert logs[0].log_type == PreconditionLogType.CONFIG

    @pytest.mark.asyncio
    async def test_category_is_edc_asset(self, mock_context: MagicMock) -> None:
        step = AssetConfigStep()
        output = await step.execute(
            {"dct_type": "cx-taxo:CertificateManagement"},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].category == PreconditionLogCategory.EDC_ASSET

    @pytest.mark.asyncio
    async def test_data_contains_dct_type(self, mock_context: MagicMock) -> None:
        step = AssetConfigStep()
        output = await step.execute(
            {"dct_type": "cx-taxo:CertificateManagement"},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["dct_type"] == "cx-taxo:CertificateManagement"

    @pytest.mark.asyncio
    async def test_data_contains_properties(self, mock_context: MagicMock) -> None:
        step = AssetConfigStep()
        props = {"key": "value"}
        output = await step.execute(
            {"dct_type": "cx-taxo:Test", "properties": props},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["properties"] == {"key": "value"}

    @pytest.mark.asyncio
    async def test_empty_properties_default(self, mock_context: MagicMock) -> None:
        step = AssetConfigStep()
        output = await step.execute(
            {"dct_type": "cx-taxo:Test"},
            mock_context,
            MagicMock(),
        )
        assert output.value[0].data["properties"] == {}

    @pytest.mark.asyncio
    async def test_stores_variable_in_context(self, mock_context: MagicMock) -> None:
        step = AssetConfigStep()
        await step.execute(
            {"dct_type": "cx-taxo:Test", "variable": "asset_log"},
            mock_context,
            MagicMock(),
        )
        mock_context.set_variable.assert_called_once()
        call_args = mock_context.set_variable.call_args
        assert call_args[0][0] == "asset_log"
        assert isinstance(call_args[0][1], PreconditionLog)

    @pytest.mark.asyncio
    async def test_no_variable_skips_context_set(
        self, mock_context: MagicMock,
    ) -> None:
        step = AssetConfigStep()
        await step.execute(
            {"dct_type": "cx-taxo:Test"},
            mock_context,
            MagicMock(),
        )
        mock_context.set_variable.assert_not_called()
