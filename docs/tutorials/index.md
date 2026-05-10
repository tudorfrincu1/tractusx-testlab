# Tutorials

Step-by-step guides for common TestLab tasks — IDE blocks, Python step executors, services, and more.

## Getting Started

### 1. Install the Python package

```bash
pip install tractusx-testlab
```

### 2. Write your first test

Create `my-test.yaml`:

```yaml
name: My First Test
version: "1.0"
dataspace: saturn

connectors:
  provider:
    url: http://localhost:8080
    api_key: my-api-key

steps:
  - type: http_request
    name: Health Check
    inputs:
      method: GET
      url: http://localhost:8080/api/check/health
    expect:
      - type: STATUS_CODE
        value: 200
```

### 3. Validate

```bash
testlab validate my-test.yaml
```

### 4. Run

```bash
testlab run my-test.yaml
```

## Using the Visual IDE

### 1. Start the IDE

```bash
cd ide && npm install && npm run dev
```

### 2. Build your test

- Drag a **Test Root** block into the workspace
- Fill in the test name, connector URLs, and API keys
- Add steps from the toolbox categories (Simulate → Prepare → Discover → Exchange)
- Attach **Check** blocks to verify results

### 3. Export

The YAML preview panel shows your test definition in real-time. Copy it to a `.yaml` file.

## Using Mock Services

Mocks let you test without real infrastructure:

```yaml
mocks:
  - type: dtr
    name: mock_dtr

steps:
  - type: register_twin
    name: Register Twin
    inputs:
      dtr_url: "@mock_dtr_url"
      id_short: "MyTwin"
    expect:
      - type: STATUS_CODE
        value: 201
```

TestLab starts a local HTTP server for each mock, registers default endpoints, and injects the URL as `@{mock_name}_url`.

## All Tutorials

### IDE (Blocks & Components)

- [Create a New Block](create-block.md) — Add a visual block by writing a single JSON file
- [Create a New Block Category](create-block-category.md) — Group blocks into a new toolbox section
- [Add a New Assertion Type](add-assertion-type.md) — Extend the assertion system (IDE + Python)
- [Add a New Component](add-component.md) — Build a new React component for the IDE
- [Add a New Example Project](add-example-project.md) — Bundle an example for the Welcome Screen
- [Add a New Template](add-template.md) — Create reusable step sequences

### Python (Runtime & Steps)

- [Create a New Step Executor](create-step-executor.md) — Write the Python code that runs a block
- [Add a New Service Type](add-service-type.md) — Register a new external service integration
- [Add a New Validation Rule](add-validation-rule.md) — Add real-time validation in IDE and compiler

### Architecture & Workflow

- [Modify the Sync Flow](modify-sync-flow.md) — Understand and extend the blocks ↔ YAML sync loop
- [Development Workflow](development-workflow.md) — IDE, Python, and docs dev commands
- [Debugging Common Issues](debugging.md) — Troubleshoot blocks, YAML sync, variables, and runtime

### Reference

- [Quick Reference: File Locations](quick-reference.md) — Which files to modify for each task
