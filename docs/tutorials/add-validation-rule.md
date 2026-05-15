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

# How to Add a New Validation Rule

Validation runs in real-time as the user edits, showing errors and warnings in the status bar and as Monaco editor squiggles.

## IDE validation (TypeScript)

Open `ide/src/models/validator.ts`:

```typescript
// Inside the validate() function, add your rule:

// Example: warn if step timeout is unreasonably high
if (step.timeout_s && step.timeout_s > 300) {
  errors.push({
    path: `steps[${i}].timeout_s`,
    message: `Timeout of ${step.timeout_s}s is very high. Consider a shorter value.`,
    severity: "warning",
  });
}
```

The `path` field is a JSON path that `yamlLineMap.ts` uses to highlight the correct line in Monaco.

## Python validation (compiler)

Open `src/tractusx_testlab/compiler/validator.py` and add to the `ScriptValidator.validate()` method:

```python
# Example: error if step type is unknown
if step.type not in self._known_types:
    result.add_error(
        path=f"steps[{i}].type",
        message=f"Unknown step type: {step.type}",
    )
```
