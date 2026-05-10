# Tutorials

Step-by-step guides for common TestLab tasks.

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
