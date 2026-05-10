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

# How to Add a New Assertion Type

Assertions validate step outputs. The IDE and Python runtime both need to know about new assertion types.

## Step 1 — Add the assertion block in the IDE

Open `ide/src/components/BlockEditor/blocks/assertionBlocks.ts`. Add a new block registration inside `registerAssertionBlocks()`:

```typescript
Blockly.Blocks["assert_my_check"] = {
  init(this: Block) {
    this.appendDummyInput()
      .appendField("assert my check:");

    this.appendDummyInput()
      .appendField("output:")
      .appendField(
        new Blockly.FieldDropdown(outputDropdown as () => Array<[string, string]>),
        "OUTPUT"
      );

    this.appendValueInput("THRESHOLD")
      .appendField("threshold:")
      .setCheck("param_value");

    this.setPreviousStatement(true, "assertion");
    this.setNextStatement(true, "assertion");
    this.setColour(blockColors.Assertions);
    this.setTooltip("Custom assertion description");
  },
};
```

## Step 2 — Handle serialization (workspace → model)

In `ide/src/components/BlockEditor/serialization/workspaceToModel.ts`, find the assertion reading section in `readAssertionChain` (in `helpers.ts`) and add a case for your new block type:

```typescript
case "assert_my_check": {
  const output = readDropdownValue(block, "OUTPUT");
  const threshold = readValueBlockAsString(block, "THRESHOLD");
  assertions.push({ output, my_check: threshold });
  break;
}
```

## Step 3 — Handle deserialization (model → workspace)

In `ide/src/components/BlockEditor/serialization/populateTest.ts`, find the assertion population switch and add:

```typescript
case "my_check":
  ab = makeBlock(ws, "assert_my_check");
  setDropdownValue(ab, "OUTPUT", output);
  connectValue(ab, "THRESHOLD", createValueBlockFromString(ws, String(val ?? "")));
  break;
```

## Step 4 — Add the assertion type in Python

In `src/tractusx_testlab/steps/assertions.py`, add the evaluation logic in `AssertionEngine.evaluate()`:

```python
elif assertion_type == "my_check":
    threshold = assertion_value
    actual = extract_output(output, output_name)
    passed = actual >= threshold  # your custom logic
    results.append(AssertionResult(
        output=output_name,
        type="my_check",
        expected=threshold,
        actual=actual,
        passed=passed,
    ))
```

## Step 5 — Verify

1. Reload the IDE — the new assertion block should appear in the "Assertions" toolbox category
2. Drag it under a step's `expect:` section
3. Check the YAML preview — it should serialize as `my_check: <value>`
4. Run `pytest` to verify the Python assertion engine handles it correctly
