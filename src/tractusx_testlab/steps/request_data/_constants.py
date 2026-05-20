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

"""Constants for pull_data shortcut step executors."""

from __future__ import annotations

# -- Catalog strategy identifiers ---------------------------------------------
CATALOG_MULTI_FILTER = "multi_filter"

# -- Selection strategy identifiers -------------------------------------------
SELECT_BY_INDEX = "by_index"
SELECT_BY_POLICY = "by_policy"
SELECT_BY_PRECONDITION = "by_precondition"

# -- Default values -----------------------------------------------------------
DEFAULT_FILTER_KEY = "dct:type"
DEFAULT_DATASET_INDEX = 0
DEFAULT_TRANSFER_TYPE = "HttpData-PULL"
DEFAULT_MAX_WAIT = 60
DEFAULT_POLL_INTERVAL = 2

# -- All 3 step type strings --------------------------------------------------
STEP_TYPES: list[str] = [
    "request_data_filtered",
    "request_data_filtered_by_policy",
    "pull_data_filtered_from_precondition",
]

# -- Step type → configuration mapping ----------------------------------------
# Each entry: (catalog_strategy, selection_strategy)
STEP_CONFIG: dict[str, tuple[str, str]] = {
    "request_data_filtered": (CATALOG_MULTI_FILTER, SELECT_BY_INDEX),
    "request_data_filtered_by_policy": (CATALOG_MULTI_FILTER, SELECT_BY_POLICY),
    "pull_data_filtered_from_precondition": (CATALOG_MULTI_FILTER, SELECT_BY_PRECONDITION),
}
