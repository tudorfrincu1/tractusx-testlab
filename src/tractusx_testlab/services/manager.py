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

"""ServiceManager — creates, caches, and tears down SDK service instances.

Uses the SDK's ServiceFactory for version-aware connector creation and
lazily instantiates AAS / Notification services from script definitions.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from tractusx_sdk.extensions.testlab.models import (
    ServiceNotFoundError,
    ServiceState,
)
from tractusx_sdk.extensions.testlab.syntax import defaults

from tractusx_testlab.models.definitions import ServiceDefinition
from tractusx_testlab.models.enums import ServiceType

logger = logging.getLogger(__name__)

# Extended types that are compatible with connector consumer/provider roles.
_CONNECTOR_COMPATIBLE_TYPES: frozenset[str] = frozenset({
    "CONNECTOR_CONSUMER", "CONNECTOR_PROVIDER",
    "EDC_CONNECTOR", "EDC_CONNECTOR_SATURN", "EDC_CONNECTOR_JUPITER",
})

# Generic connector types that don't specify a consumer/provider role.
_GENERIC_CONNECTOR_TYPES: frozenset[str] = frozenset({
    "EDC_CONNECTOR", "EDC_CONNECTOR_SATURN", "EDC_CONNECTOR_JUPITER",
})

# Types that map to DTR / AAS service.
_DTR_COMPATIBLE_TYPES: frozenset[str] = frozenset({"DTR", "DIGITAL_TWIN_REGISTRY"})

# Inferred dataspace version from extended type names.
_VERSION_FROM_TYPE: dict[str, str] = {
    "EDC_CONNECTOR_SATURN": "saturn",
    "EDC_CONNECTOR_JUPITER": "jupiter",
}


def _is_type_compatible(actual: ServiceType, expected: ServiceType) -> bool:
    """Check if *actual* service type is compatible with *expected* role."""
    actual_val = actual.value
    expected_val = expected.value
    if actual_val == expected_val:
        return True
    if actual_val in _CONNECTOR_COMPATIBLE_TYPES and expected_val in _CONNECTOR_COMPATIBLE_TYPES:
        return True
    if actual_val in _DTR_COMPATIBLE_TYPES and expected_val in _DTR_COMPATIBLE_TYPES:
        return True
    return False


class ServiceManager:
    """Lifecycle manager for SDK service instances referenced by test scripts.

    Services are declared in the YAML script ``services:`` block, then initialised
    lazily on first access and cached for the lifetime of the execution.
    """

    __slots__ = ("_definitions", "_instances", "_states")

    def __init__(self) -> None:
        self._definitions: dict[str, ServiceDefinition] = {}
        self._instances: dict[str, Any] = {}
        self._states: dict[str, ServiceState] = {}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(self, definition: ServiceDefinition) -> None:
        """Register a service definition from the script."""
        self._definitions[definition.name] = definition
        self._states[definition.name] = ServiceState.DECLARED

    def register_all(self, definitions: list[ServiceDefinition]) -> None:
        for definition in definitions:
            self.register(definition)

    # ------------------------------------------------------------------
    # Retrieval (lazy init)
    # ------------------------------------------------------------------

    def get(self, name: str, expected_type: Optional[ServiceType] = None) -> Any:
        """Return a live service instance, initialising it if necessary."""
        if name not in self._definitions:
            raise ServiceNotFoundError(name)

        service_definition = self._definitions[name]
        if expected_type and not _is_type_compatible(service_definition.type, expected_type):
            raise ValueError(
                f"Service '{name}' is {service_definition.type.value}, expected {expected_type.value}"
            )

        cache_key = self._cache_key(name, service_definition, expected_type)
        if cache_key in self._instances:
            return self._instances[cache_key]

        instance = self._create_instance(service_definition, expected_type)
        self._instances[cache_key] = instance
        self._states[name] = ServiceState.READY
        return instance

    def get_provider(self, name: str) -> Any:
        return self.get(name, expected_type=ServiceType.CONNECTOR_PROVIDER)

    def get_consumer(self, name: str) -> Any:
        return self.get(name, expected_type=ServiceType.CONNECTOR_CONSUMER)

    def get_dtr(self, name: str) -> Any:
        return self.get(name, expected_type=ServiceType.DTR)

    def get_dsp_consumer(self, name: str) -> Any:
        return self.get(name, expected_type=ServiceType.DSP_CONSUMER)

    def get_dsp_provider(self, name: str) -> Any:
        return self.get(name, expected_type=ServiceType.DSP_PROVIDER)

    # ------------------------------------------------------------------
    # Factory
    # ------------------------------------------------------------------

    @staticmethod
    def _cache_key(
        name: str, definition: ServiceDefinition, expected_type: Optional[ServiceType],
    ) -> str:
        """Return cache key — compound for generic connector types."""
        if expected_type and definition.type.value in _GENERIC_CONNECTOR_TYPES:
            return f"{name}:{expected_type.value}"
        return name

    def _create_instance(self, service_definition: ServiceDefinition, expected_type: Optional[ServiceType] = None) -> Any:
        """Create a live SDK service from a ServiceDefinition."""
        logger.info("Initialising service '%s' (%s)", service_definition.name, service_definition.type.value)
        self._states[service_definition.name] = ServiceState.INITIALIZING

        stype_val = service_definition.type.value

        if stype_val in _CONNECTOR_COMPATIBLE_TYPES:
            return self._create_connector_service(service_definition, expected_type)
        if stype_val in _DTR_COMPATIBLE_TYPES:
            return self._create_aas_service(service_definition)
        if stype_val == "DSP_CONSUMER":
            return self._create_dsp_consumer_service(service_definition)
        if stype_val == "DSP_PROVIDER":
            return self._create_dsp_provider_service(service_definition)

        raise ServiceNotFoundError(service_definition.name)

    @staticmethod
    def _create_connector_service(
        service_definition: ServiceDefinition, expected_type: Optional[ServiceType] = None,
    ) -> Any:
        from tractusx_sdk.dataspace.services.connector.service_factory import ServiceFactory

        auth = service_definition.auth
        params = service_definition.params or {}
        stype_val = service_definition.type.value
        version = params.get("version") or _VERSION_FROM_TYPE.get(stype_val, defaults.DATASPACE_VERSION)
        dma_path = params.get("dma_path", defaults.DMA_PATH)

        headers: dict[str, str] = {}
        if auth.get("api_key"):
            headers["x-api-key"] = auth["api_key"]

        # Explicit CONNECTOR_PROVIDER type or expected_type determines the role.
        is_provider = (
            stype_val == "CONNECTOR_PROVIDER"
            or (expected_type is not None and expected_type.value == "CONNECTOR_PROVIDER")
        )

        if is_provider:
            return ServiceFactory.get_connector_provider_service(
                dataspace_version=version,
                base_url=service_definition.base_url,
                dma_path=dma_path,
                headers=headers or None,
            )
        return ServiceFactory.get_connector_consumer_service(
            dataspace_version=version,
            base_url=service_definition.base_url,
            dma_path=dma_path,
            headers=headers or None,
        )

    @staticmethod
    def _create_aas_service(service_definition: ServiceDefinition) -> Any:
        from tractusx_sdk.industry.services.aas_service import AasService

        params = service_definition.params or {}
        return AasService(
            base_url=service_definition.base_url,
            base_lookup_url=params.get("base_lookup_url", service_definition.base_url),
            api_path=params.get("api_path", defaults.AAS_API_PATH),
        )

    @staticmethod
    def _create_dsp_consumer_service(service_definition: ServiceDefinition) -> Any:
        from tractusx_sdk.dataspace.services.dsp import DspServiceFactory

        auth = service_definition.auth
        params = service_definition.params or {}
        version = params.get("version", defaults.DATASPACE_VERSION)

        headers: dict[str, str] = {}
        if auth.get("api_key"):
            headers["x-api-key"] = auth["api_key"]
        if auth.get("bearer_token"):
            headers["Authorization"] = f"Bearer {auth['bearer_token']}"

        return DspServiceFactory.get_dsp_consumer_service(
            dataspace_version=version,
            base_url=service_definition.base_url,
            headers=headers or None,
            timeout=params.get("timeout", 30.0),
        )

    @staticmethod
    def _create_dsp_provider_service(service_definition: ServiceDefinition) -> Any:
        from tractusx_sdk.dataspace.services.dsp import DspServiceFactory

        auth = service_definition.auth
        params = service_definition.params or {}
        version = params.get("version", defaults.DATASPACE_VERSION)

        headers: dict[str, str] = {}
        if auth.get("api_key"):
            headers["x-api-key"] = auth["api_key"]
        if auth.get("bearer_token"):
            headers["Authorization"] = f"Bearer {auth['bearer_token']}"

        return DspServiceFactory.get_dsp_provider_service(
            dataspace_version=version,
            base_url=service_definition.base_url,
            headers=headers or None,
            timeout=params.get("timeout", 30.0),
        )

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def state(self, name: str) -> ServiceState:
        return self._states.get(name, ServiceState.DECLARED)

    def teardown(self) -> None:
        """Release all service instances."""
        self._instances.clear()
        for name in self._states:
            self._states[name] = ServiceState.STOPPED
        logger.info("All services torn down")

    @property
    def service_names(self) -> list[str]:
        return list(self._definitions.keys())
