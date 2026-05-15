<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

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

# Services

Services represent the external systems your test interacts with — EDC connectors, Digital Twin Registries, and discovery services. You must configure at least one service before using blocks that depend on it.

## Opening the Service Dialog

Click the **Add/Remove Services** button in the Block Editor toolbar to open the Service Dialog.

## Adding a Service

1. In the Service Dialog, click one of the service type buttons on the left panel:

    | Service Type | Description |
    |-------------|-------------|
    | **Connector Consumer** | EDC connector acting as data consumer |
    | **Connector Provider** | EDC connector acting as data provider |
    | **DSP Consumer** | DSP-protocol consumer endpoint |
    | **DSP Provider** | DSP-protocol provider endpoint |
    | **DTR** | Digital Twin Registry (AAS) |

2. A new service is created with a default name (e.g., `connector_consumer_1`)
3. The service editor form opens on the right panel

## Configuring a Service

Fill in the form fields for your service:

| Field | Description |
|-------|-------------|
| **Name** | A unique identifier for this service (used in block dropdowns) |
| **Base URL** | The management API endpoint (e.g., `https://connector.example.com/management`) |
| **Auth Type** | Authentication method — `NONE`, `API_KEY`, `BEARER`, etc. |
| **API Key / Token** | Credentials (masked as password fields) |
| **Config** | Additional key-value configuration parameters |

!!! tip "Service names matter"
    The service name you set here appears in block dropdowns throughout the editor. Choose descriptive names like `provider_alice` or `consumer_bob` to keep your test readable.

## Editing a Service

Click any service in the left panel to select it. The form on the right updates with the current values. Make your changes and they save automatically.

## Deleting a Service

Click the delete button next to a service in the left panel. A confirmation prompt appears before removal.

!!! warning "Blocks reference services"
    If you delete a service that blocks reference, those blocks will show a warning. Either reconfigure the blocks to use a different service or add the service back.

## How Services Affect the Toolbox

Some block categories are **service-gated** — they only appear in the toolbox when a matching service is configured:

| Service Type | Unlocked Categories |
|-------------|-------------------|
| Connector Consumer / Provider | EDC Connector |
| DTR | Digital Twin Registry |
| Discovery Finder | Discovery Finder |

This keeps the toolbox clean — you only see blocks that are relevant to your configured infrastructure.

## Services in YAML

Services are serialized into the `services:` section of your test YAML:

```yaml
services:
  - name: provider_alice
    type: edc_connector
    config:
      base_url: https://alice.example.com/management
      auth_type: API_KEY
      auth_key: password
```

Blocks reference services by name using the `service:` field in their parameters.
