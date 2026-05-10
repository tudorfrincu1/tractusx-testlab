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

# How to Run the Full Development Workflow

## IDE development

```bash
cd ide
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npx tsc --noEmit         # Type check (run before committing)
npx vite build           # Production build (run before PR)
```

## Python development

```bash
# Create a virtual environment (if not done)
python3.12 -m venv .venv
source .venv/bin/activate

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest -v

# Run the CLI
testlab validate examples/connector-ping-v1.0/tests/ping_test.yaml
testlab compile examples/connector-ping-v1.0/tests/ping_test.yaml
```

## Documentation

```bash
pip install mkdocs-material
mkdocs serve             # http://localhost:8000
mkdocs build             # Build static site
```
