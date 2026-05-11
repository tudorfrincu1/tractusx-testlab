<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2025 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License, Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 SPDX-License-Identifier: Apache-2.0
-->
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->

# How to Create a New Step Executor (Python)

A step executor is the Python code that runs when a block is executed at runtime. Every block type needs a corresponding step executor.

## Step 1 — Decide the location

Step executors live under `src/tractusx_testlab/steps/`:

```
steps/
├── connector/     # EDC connector steps (DSP, dataplane, provision, consume)
├── industry/      # Industry layer steps (DTR, notifications, submodels)
├── base.py        # BaseStep abstract class
├── assertions.py  # Assertion evaluation engine
└── conditions.py  # Conditional execution ("if" expressions)
```

For our "Check Health" example, we'll put it in a new file since it's a general HTTP step.

## Step 2 — Create the step file

Create `src/tractusx_testlab/steps/health.py`:

```python
################################################################################
# Eclipse Tractus-X - Tractus-X TestLab
#
# Copyright (c) 2025 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
################################################################################
"""Step executor for health check HTTP requests."""

import logging

import httpx

from tractusx_sdk.extensions.testlab.models.definitions import StepDefinition
from tractusx_sdk.extensions.testlab.player.execution.context import StepContext

from tractusx_testlab.steps.base import BaseStep, StepOutput, HttpRequest, HttpResponse
from tractusx_testlab.scripting.registry import step

logger = logging.getLogger(__name__)


@step("check_health")
class CheckHealthStep(BaseStep):
    """Send a GET request to a health endpoint and return status + body.

    Params:
        url (str): Health endpoint URL.
        expected_status (int, optional): Expected HTTP status code (default 200).
        timeout_s (int, optional): Request timeout in seconds (default 10).
    """

    async def execute(
        self,
        params: dict,
        context: StepContext,
        definition: StepDefinition,
    ) -> StepOutput:
        url = params["url"]
        timeout_s = params.get("timeout_s", 10)

        async with httpx.AsyncClient(timeout=timeout_s) as client:
            resp = await client.get(url)

        body = resp.text
        try:
            body = resp.json()
        except Exception:
            pass

        logger.info("Health check %s → %d", url, resp.status_code)

        return StepOutput(
            value={"status_code": resp.status_code, "response_body": body},
            request=HttpRequest(method="GET", url=url),
            response=HttpResponse(
                status_code=resp.status_code,
                headers=dict(resp.headers),
                body=body,
            ),
        )
```

**Key rules:**

1. **Class extends `BaseStep`** — implement the `async execute()` method
2. **Decorate with `@step("type_name")`** — the string must match the block JSON's `type` field exactly
3. **Return `StepOutput`** — with `value` (dict matching your `outputs`), `request`, and `response`
4. **Use `logging`** — never `print()`
5. **Access services via `context`** — e.g., `context.get_consumer_service(name)` for EDC connectors

## Step 3 — Register the module for auto-import

The step registry uses the `@step` decorator, but the module must be imported for the decorator to run. Open `src/tractusx_testlab/steps/__init__.py` and add:

```python
from tractusx_testlab.steps import health  # noqa: F401
```

## Step 4 — Dataspace-version-specific steps

If your step behaves differently on Jupiter vs Saturn, register with a version constraint:

```python
@step("check_health", dataspace_version="saturn")
class CheckHealthSaturnStep(BaseStep):
    """Saturn-specific implementation."""
    ...

@step("check_health", dataspace_version="jupiter")
class CheckHealthJupiterStep(BaseStep):
    """Jupiter-specific implementation."""
    ...
```

Version-specific registrations take priority over global ones at runtime.

## Step 5 — Write a test

Create `tests/test_check_health.py`:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tractusx_testlab.steps.health import CheckHealthStep


@pytest.mark.asyncio
async def test_check_health_returns_status_and_body():
    """CheckHealthStep returns status_code and response_body from GET."""
    step = CheckHealthStep()
    params = {"url": "https://example.com/health", "timeout_s": 5}
    context = MagicMock()
    definition = MagicMock()

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = '{"status": "UP"}'
    mock_response.json.return_value = {"status": "UP"}
    mock_response.headers = {"content-type": "application/json"}

    with patch("tractusx_testlab.steps.health.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__ = AsyncMock(return_value=mock_client.return_value)
        mock_client.return_value.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value.get = AsyncMock(return_value=mock_response)

        result = await step.execute(params, context, definition)

    assert result.value["status_code"] == 200
    assert result.value["response_body"] == {"status": "UP"}
    assert result.request.method == "GET"
    assert result.request.url == "https://example.com/health"
```

## Step 6 — Run the test

```bash
cd /path/to/tractusx-testlab
pytest tests/test_check_health.py -v
```
