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

# How to Add a New Service Type

Service types control which block categories are visible and how the runtime connects to external systems.

## Step 1 — Define the service type in Python

In `src/tractusx_testlab/models/enums.py` (or equivalent), add the new service type:

```python
class ServiceType(str, enum.Enum):
    EDC_CONNECTOR_SATURN = "edc_connector_saturn"
    EDC_CONNECTOR_JUPITER = "edc_connector_jupiter"
    AAS = "aas"
    DISCOVERY_FINDER = "discovery_finder"
    MY_SERVICE = "my_service"  # ← add this
```

## Step 2 — Add the service schema in the IDE

Open `ide/src/store/useServiceStore.ts` and add your service to the `SERVICE_SCHEMAS` constant:

```typescript
my_service: {
  label: "My Service",
  fields: [
    { name: "base_url", label: "Base URL", type: "text", required: true },
    { name: "api_key", label: "API Key", type: "text", required: false, secret: true },
  ],
},
```

This schema drives the Service Dialog form. Each field renders as an input in the dialog.

## Step 3 — Wire the service in the runtime ServiceManager

In `src/tractusx_testlab/services/manager.py`, add a method to instantiate your service:

```python
def get_my_service(self, name: str) -> MyServiceClient:
    """Return a live MyService client instance."""
    definition = self._get_definition(name, ServiceType.MY_SERVICE)
    config = definition.config
    return MyServiceClient(
        base_url=config["base_url"],
        api_key=config.get("api_key"),
    )
```

## Step 4 — Gate block categories to the service

See [How to Create a New Block Category](create-block-category.md), step 3 — use `"service_type": "my_service"` in `index.json`.
