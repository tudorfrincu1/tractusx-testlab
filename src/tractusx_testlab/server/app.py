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

"""FastAPI application factory for the Testlab server."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI

from tractusx_sdk.extensions.testlab.config.loader import ConfigLoader
from tractusx_sdk.extensions.testlab.config.settings import TestlabConfig
from tractusx_sdk.extensions.testlab.player.execution.player import TestlabPlayer
from tractusx_sdk.extensions.testlab.server.callbacks import CallbackManager
from tractusx_sdk.extensions.testlab.server.routes import router
from tractusx_sdk.extensions.testlab.server.storage import PackageStorage


def create_app(config: Optional[TestlabConfig] = None) -> FastAPI:
    """Build and return a fully-wired FastAPI application.

    Args:
        config: Optional pre-loaded configuration. Defaults to ``ConfigLoader.load()``.
    """
    if config is None:
        config = ConfigLoader.load()

    app = FastAPI(
        title="Tractus-X Testlab Player",
        version="0.7.1",
        description="Automated test execution for Tractus-X dataspace interoperability.",
    )

    # Shared instances — stored on app.state for FastAPI dependency injection
    app.state.player = TestlabPlayer(config=config)
    app.state.storage = PackageStorage(base_dir=Path(config.storage_dir) / "packages")
    app.state.callbacks = CallbackManager()

    app.include_router(router)

    return app
