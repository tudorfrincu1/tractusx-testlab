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

"""YAML field-key constants used when reading/writing test documents."""

# -- Document header ----------------------------------------------------------
NAME = "name"
VERSION = "version"
DESCRIPTION = "description"
DATASPACE_VERSION = "dataspace_version"
KIND = "kind"
TYPE = "type"

# -- Script structure ---------------------------------------------------------
IMPORT = "import"
IMPORTS = "imports"
VARIABLES = "variables"
SETUP = "setup"
STEPS = "steps"
CLEANUP = "cleanup"
SERVICES = "services"
LISTEN = "listen"

# -- Test case ----------------------------------------------------------------
TESTS = "tests"
DEPENDS_ON = "depends_on"
OUTPUTS = "outputs"

# -- Step fields --------------------------------------------------------------
ALLOW_SDK_CALLS = "allow_sdk_calls"
PARAMS = "params"
EXPECT = "expect"
ON_FAILURE = "on_failure"
TIMEOUT_S = "timeout_s"
STORE_IN_MEMORY = "store_in_memory"
IF = "if"

# -- Service fields -----------------------------------------------------------
BASE_URL = "base_url"
AUTH = "auth"

# -- Assertion fields ---------------------------------------------------------
VALUE = "value"
PATH = "path"
SOURCE = "source"
SEVERITY = "severity"
OUTPUT = "output"

# -- Assertion type keys (compact format) ------------------------------------
NOT_NULL = "not_null"
NOT_EMPTY = "not_empty"
EQUALS = "equals"
CONTAINS_KEY = "contains"

# -- Service config -----------------------------------------------------------
CONFIG = "config"
MANAGEMENT_URL = "management_url"

# -- Step output definitions --------------------------------------------------
OUTPUT_DEFINITIONS = "output_definitions"

# -- Variable fields ----------------------------------------------------------
RUNTIME = "runtime"

# -- Test case entry ----------------------------------------------------------
TEST = "test"

# -- Dependency ref -----------------------------------------------------------
FILE = "file"
