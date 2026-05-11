# Overview

Tractus-X TestLab is a visual test authoring tool for Eclipse Tractus-X dataspaces.

## Architecture

TestLab has two components:

1. **IDE** — A browser-based block editor (React + Blockly) that generates YAML test definitions
2. **Python Library** — Compiles, validates, and runs YAML tests against real or mocked connectors

## How It Works

1. Drag blocks in the visual editor to describe your test scenario
2. The IDE generates a YAML test definition in real-time
3. Run the test with `testlab run my-test.yaml`
4. TestLab executes each step, manages mock services, and reports results
