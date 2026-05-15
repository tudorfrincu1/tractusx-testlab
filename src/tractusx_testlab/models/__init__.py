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

"""
Testlab data models package.

Re-exports all public symbols so that ``from tractusx_testlab.models import X``
continues to work unchanged.
"""

from tractusx_testlab.models.definitions import (
    DependencyRef,
    ImportDefinition,
    ListenerDefinition,
    ServiceDefinition,
    TckDefinition,
    VariableDefinition,
)
from tractusx_testlab.models.definitions import (  # local overrides
    Assertion,       # adds schema_ref, min, max fields
    ScriptDefinition,  # adds preconditions field
    StepDefinition,    # no name field
)
from tractusx_testlab.models.enums import (
    AssertionSeverity,
    FailurePolicy,
    JobStatus,
    PackageFormat,
    ScriptStatus,
    SdkCallMode,
    ServiceState,
    StepStatus,
    ValueSource,
)
from tractusx_testlab.models.enums import AssertionType  # local override — adds typed assertion types
from tractusx_testlab.models.enums import ScriptKind  # local override — adds TCK
from tractusx_testlab.models.enums import ServiceType  # local override — adds EDC connector types
from tractusx_testlab.models.enums import StepPhase  # local override — adds PRECONDITION
from tractusx_testlab.models.exceptions import (
    DuplicateServiceError,
    ServiceInitError,
    ServiceNotFoundError,
    ServiceNotReadyError,
    ServiceTypeMismatchError,
    StepConfigError,
)
from tractusx_testlab.models.jobs import (
    Job,
    JobEvent,
    JobMemory,
)
from tractusx_testlab.models.preconditions import (
    PreconditionLog,
    PreconditionLogCategory,
    PreconditionLogType,
)
from tractusx_testlab.models.results import StepResult  # local override — adds precondition_logs
from tractusx_testlab.models.results import (
    AssertionResult,
    AssertionSummary,
    CallbackResult,
    HttpRequest,
    HttpResponse,
    ScriptResult,
    TckResult,
)
from tractusx_testlab.models.security import (
    Base64Bytes,
    EncryptedKeyBlock,
    PackageManifest,
    SecurityBlock,
)
from tractusx_testlab.models.server import (
    UploadedPackage,
    VaultConfig,
)

__all__ = [
    # enums
    "AssertionSeverity",
    "AssertionType",
    "FailurePolicy",
    "JobStatus",
    "PackageFormat",
    "ScriptKind",
    "ScriptStatus",
    "SdkCallMode",
    "ServiceState",
    "ServiceType",
    "StepPhase",
    "StepStatus",
    "ValueSource",
    # definitions
    "Assertion",
    "DependencyRef",
    "ImportDefinition",
    "ListenerDefinition",
    "ScriptDefinition",
    "ServiceDefinition",
    "StepDefinition",
    "TckDefinition",
    "VariableDefinition",
    # security
    "Base64Bytes",
    "EncryptedKeyBlock",
    "PackageManifest",
    "SecurityBlock",
    # server
    "UploadedPackage",
    "VaultConfig",
    # preconditions
    "PreconditionLog",
    "PreconditionLogCategory",
    "PreconditionLogType",
    # results
    "AssertionResult",
    "AssertionSummary",
    "CallbackResult",
    "HttpRequest",
    "HttpResponse",
    "ScriptResult",
    "StepResult",
    "TckResult",
    # jobs
    "Job",
    "JobEvent",
    "JobMemory",
    # exceptions
    "DuplicateServiceError",
    "ServiceInitError",
    "ServiceNotFoundError",
    "ServiceNotReadyError",
    "ServiceTypeMismatchError",
    "StepConfigError",
]
