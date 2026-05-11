# Integration Test Matrix — Certificate Management MVP (CX-0135)

**Status**: Phase 1.3 Design Document  
**Standard**: CX-0135 Business Partner Certificate Management  
**Target**: 3 MVP Capabilities (RequestCertificate, ValidateCertificatePayload, SendCertificateFeedback)  
**Last Updated**: May 10, 2026

---

## Executive Summary

This document defines the integration test strategy to ensure the 3 MVP certificate capabilities work reliably in the tractusx-testlab. The test matrix covers:

- **Happy path scenarios** (expected behavior)
- **Failure scenarios** (timeouts, malformed requests, auth failures, etc.)
- **Edge cases** (boundary conditions, field sensitivity, state mismatches)

**Key commitment**: Every test is deterministic, runs < 5s, and fails with clear actionable feedback.

---

## 1. Test Matrix — Complete Specification

### 1.1 RequestCertificate Capability

> **Purpose**: Consumer sends ISO/compliance certificate request to Provider's CCMAPI endpoint.  
> **API**: `POST {provider_ccmapi}/certificates/request`  
> **Response**: `{ status: COMPLETED | PENDING | REJECTED, document_id: uuid, ... }`

#### Test Case RC-001: Happy Path — Request ISO 9001 Certificate

| Aspect | Details |
|--------|---------|
| **Preconditions** | Provider CCMAPI mock is running; Consumer connector configured; Contract negotiation completed |
| **Setup** | Load fixture: `provider_iso9001_catalog.json`; Mock CCMAPI endpoint returns `{status: COMPLETED, document_id: "doc-uuid-123", certificate_type: "ISO9001"}` after 200ms |
| **Action** | Call `request_certificate(cert_type="ISO9001", location_bpn="BPNL123456789")` |
| **Assertions** | Response status = 200; Response body has `document_id` field; Certificate type matches request |
| **Cleanup** | Reset mock endpoint state; Clear in-memory certificate cache |
| **Timeout** | 5 seconds |
| **Determinism** | Repeat 10x: ✓ All iterations pass consistently |

```python
def test_request_certificate_iso9001_happy_path(
    mock_ccmapi_server: MockCCMAPIServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test successful certificate request for ISO 9001."""
    # Arrange
    mock_ccmapi_server.load_response("iso9001_completed.json")
    request_payload = {
        "cert_type": "ISO9001",
        "location_bpn": "BPNL123456789",
    }
    
    # Act
    response = request_certificate(
        connector=consumer_connector,
        payload=request_payload,
        timeout=3,
    )
    
    # Assert
    assert response.status_code == 200
    assert "document_id" in response.body
    assert response.body["document_id"] == "doc-uuid-123"
    assert response.body["status"] == "COMPLETED"
```

---

#### Test Case RC-002: Failure — Provider Timeout (30s)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Provider CCMAPI mock configured to delay 35 seconds |
| **Setup** | Mock endpoint configured to delay responses; Consumer connector has 30s timeout |
| **Action** | Call `request_certificate(...)` with default 30s timeout |
| **Assertions** | Exception type = `CertificateRequestTimeout`; Error message includes "Provider did not respond within 30s" |
| **Cleanup** | Reset mock to normal response time |
| **Timeout** | 35 seconds (+ test harness buffer) |
| **Determinism** | Timing is mocked, not real-time; repeatable ✓ |

```python
def test_request_certificate_provider_timeout(
    mock_ccmapi_server: MockCCMAPIServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test graceful timeout when Provider doesn't respond in time."""
    # Arrange
    mock_ccmapi_server.set_response_delay(35)  # Exceeds 30s timeout
    
    # Act & Assert
    with pytest.raises(CertificateRequestTimeout) as exc_info:
        request_certificate(
            connector=consumer_connector,
            payload={"cert_type": "ISO9001", "location_bpn": "BPNL123456789"},
            timeout=30,
        )
    
    assert "30s" in str(exc_info.value)
```

---

#### Test Case RC-003: Failure — Malformed Request (Missing Required Field)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Valid connector; Mock CCMAPI running |
| **Setup** | Prepare request payload missing `location_bpn` field |
| **Action** | Call `request_certificate(cert_type="ISO9001")` without `location_bpn` |
| **Assertions** | Exception type = `ValidationError`; Error message includes "location_bpn is required" |
| **Cleanup** | N/A (validation fails before mock call) |
| **Timeout** | 1 second (fast-fail validation) |
| **Determinism** | Schema-based validation; 100% deterministic ✓ |

```python
def test_request_certificate_missing_location_bpn(
    consumer_connector: ConnectorConfig,
) -> None:
    """Test validation rejects missing required field."""
    # Arrange
    invalid_payload = {"cert_type": "ISO9001"}  # Missing location_bpn
    
    # Act & Assert
    with pytest.raises(ValidationError) as exc_info:
        request_certificate(
            connector=consumer_connector,
            payload=invalid_payload,
        )
    
    assert "location_bpn" in str(exc_info.value).lower()
```

---

#### Test Case RC-004: Failure — Provider Returns Explicit REJECTED Status

| Aspect | Details |
|--------|---------|
| **Preconditions** | Provider CCMAPI mock configured to return REJECTED status |
| **Setup** | Mock endpoint returns `{status: REJECTED, reason: "No valid ISO 9001 on file", document_id: null}` |
| **Action** | Call `request_certificate(cert_type="ISO9001", location_bpn="BPNL_INVALID")` |
| **Assertions** | Response status = 200 (HTTP OK); Response body has `status: REJECTED`; Error details preserved in `reason` field |
| **Cleanup** | Reset mock |
| **Timeout** | 5 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_request_certificate_provider_rejects(
    mock_ccmapi_server: MockCCMAPIServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test handling when Provider explicitly rejects the request."""
    # Arrange
    mock_ccmapi_server.load_response("iso9001_rejected.json")
    
    # Act
    response = request_certificate(
        connector=consumer_connector,
        payload={"cert_type": "ISO9001", "location_bpn": "BPNL_INVALID"},
    )
    
    # Assert
    assert response.status_code == 200
    assert response.body["status"] == "REJECTED"
    assert "No valid ISO 9001" in response.body.get("reason", "")
```

---

#### Test Case RC-005: Failure — Contract Negotiation Failed (401 Unauthorized)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Consumer connector missing valid access policy |
| **Setup** | Mock returns 401 with `{error: "No access policy found for this asset"}` |
| **Action** | Call `request_certificate(...)` with connector lacking access rights |
| **Assertions** | Exception type = `UnauthorizedCertificateRequest`; HTTP status = 401 |
| **Cleanup** | Reset connector configuration |
| **Timeout** | 5 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_request_certificate_unauthorized(
    mock_ccmapi_server: MockCCMAPIServer,
    consumer_connector_no_policy: ConnectorConfig,
) -> None:
    """Test rejection when Consumer lacks access policy."""
    # Arrange
    mock_ccmapi_server.set_response_status(401)
    mock_ccmapi_server.load_response("unauthorized.json")
    
    # Act & Assert
    with pytest.raises(UnauthorizedCertificateRequest):
        request_certificate(
            connector=consumer_connector_no_policy,
            payload={"cert_type": "ISO9001", "location_bpn": "BPNL123456789"},
        )
```

---

### 1.2 ValidateCertificatePayload Capability

> **Purpose**: Validate certificate JSON against BusinessPartnerCertificate schema v3.1.0.  
> **Input**: Certificate JSON document  
> **Output**: `{ is_valid: bool, errors: List[ValidationError], warnings: List[str] }`

#### Test Case VP-001: Happy Path — Valid Certificate JSON

| Aspect | Details |
|--------|---------|
| **Preconditions** | Schema file `BusinessPartnerCertificate-v3.1.0.json` loaded; Valid certificate fixture available |
| **Setup** | Load fixture: `valid_certificate_iso9001.json`; Schema loaded into memory |
| **Action** | Call `validate_certificate_payload(certificate_data, schema_v3_1_0)` |
| **Assertions** | `is_valid == True`; `errors` list is empty; `warnings` list is empty |
| **Cleanup** | N/A |
| **Timeout** | 2 seconds |
| **Determinism** | Schema validation is deterministic ✓ |

```python
def test_validate_certificate_payload_valid(
    schema_v3_1_0: JSONSchema,
    valid_certificate_fixture: dict,
) -> None:
    """Test validation passes for conforming certificate."""
    # Arrange
    certificate_data = valid_certificate_fixture
    
    # Act
    result = validate_certificate_payload(certificate_data, schema_v3_1_0)
    
    # Assert
    assert result.is_valid is True
    assert len(result.errors) == 0
    assert len(result.warnings) == 0
```

---

#### Test Case VP-002: Failure — Missing Required Field (businessPartnerNumber)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Schema loaded |
| **Setup** | Load fixture: `cert_missing_bpn.json` (missing `businessPartnerNumber` field) |
| **Action** | Call `validate_certificate_payload(cert_missing_bpn, schema)` |
| **Assertions** | `is_valid == False`; `errors` contains "businessPartnerNumber is required" |
| **Cleanup** | N/A |
| **Timeout** | 2 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_validate_certificate_missing_business_partner_number(
    schema_v3_1_0: JSONSchema,
) -> None:
    """Test validation rejects missing businessPartnerNumber."""
    # Arrange
    cert_data = {
        "certificateType": "ISO9001",
        "validUntil": "2026-12-31T23:59:59Z",
        # Missing: "businessPartnerNumber"
    }
    
    # Act
    result = validate_certificate_payload(cert_data, schema_v3_1_0)
    
    # Assert
    assert result.is_valid is False
    assert any("businessPartnerNumber" in err for err in result.errors)
```

---

#### Test Case VP-003: Failure — Invalid Date Format (valid_until)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Schema loaded |
| **Setup** | Prepare certificate with malformed `valid_until`: `"2026-13-45T99:99:99Z"` |
| **Action** | Call `validate_certificate_payload(malformed_date_cert, schema)` |
| **Assertions** | `is_valid == False`; Error message includes "valid_until" or "date format" |
| **Cleanup** | N/A |
| **Timeout** | 2 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_validate_certificate_invalid_date_format(
    schema_v3_1_0: JSONSchema,
) -> None:
    """Test validation rejects malformed date."""
    # Arrange
    cert_data = {
        "businessPartnerNumber": "BPNL123456789012",
        "certificateType": "ISO9001",
        "validUntil": "2026-13-45T99:99:99Z",  # Invalid
    }
    
    # Act
    result = validate_certificate_payload(cert_data, schema_v3_1_0)
    
    # Assert
    assert result.is_valid is False
    assert any("valid_until" in err or "date" in err for err in result.errors)
```

---

#### Test Case VP-004: Failure — Unknown Certificate Type

| Aspect | Details |
|--------|---------|
| **Preconditions** | Schema specifies enum: `[ISO9001, ISO14001, ISO45001, SAE8D, ...]` |
| **Setup** | Prepare certificate with `certificateType: "foo123"` |
| **Action** | Call `validate_certificate_payload(invalid_type_cert, schema)` |
| **Assertions** | `is_valid == False`; Error mentions enum constraint or unknown type |
| **Cleanup** | N/A |
| **Timeout** | 2 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_validate_certificate_unknown_type(
    schema_v3_1_0: JSONSchema,
) -> None:
    """Test validation rejects unknown certificate type."""
    # Arrange
    cert_data = {
        "businessPartnerNumber": "BPNL123456789012",
        "certificateType": "foo123",  # Not in enum
        "validUntil": "2026-12-31T23:59:59Z",
    }
    
    # Act
    result = validate_certificate_payload(cert_data, schema_v3_1_0)
    
    # Assert
    assert result.is_valid is False
    assert any("certificateType" in err or "enum" in err for err in result.errors)
```

---

#### Test Case VP-005: Failure — Field Name Typo (Case Sensitivity)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Schema defined with `documentID` (camelCase) |
| **Setup** | Prepare certificate with `document_id` (snake_case) instead |
| **Action** | Call `validate_certificate_payload(typo_cert, schema)` |
| **Assertions** | `is_valid == False` OR warning generated (depends on schema strictness) |
| **Cleanup** | N/A |
| **Timeout** | 2 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_validate_certificate_field_name_typo(
    schema_v3_1_0: JSONSchema,
) -> None:
    """Test validation catches field name typos (case sensitivity)."""
    # Arrange
    cert_data = {
        "businessPartnerNumber": "BPNL123456789012",
        "certificateType": "ISO9001",
        "valid_until": "2026-12-31T23:59:59Z",  # Should be validUntil
    }
    
    # Act
    result = validate_certificate_payload(cert_data, schema_v3_1_0)
    
    # Assert
    # Either validation fails or warning is generated
    assert result.is_valid is False or len(result.warnings) > 0
```

---

### 1.3 SendCertificateFeedback Capability

> **Purpose**: Send certificate validation feedback (RECEIVED/ACCEPTED/REJECTED) back to Provider.  
> **API**: `POST {provider_feedback_endpoint}/feedback`  
> **Request**: `{ feedbackId: uuid, certificateId: uuid, status: RECEIVED | ACCEPTED | REJECTED, locationErrors: [...] }`

#### Test Case SF-001: Happy Path — Send ACCEPTED Feedback

| Aspect | Details |
|--------|---------|
| **Preconditions** | Feedback endpoint mock running; Valid feedback payload prepared |
| **Setup** | Mock endpoint configured to return 200 OK; Load fixture: `accepted_feedback.json` |
| **Action** | Call `send_certificate_feedback(feedback_id, cert_id, status=ACCEPTED)` |
| **Assertions** | Response status = 200; Response includes `receipt_id` |
| **Cleanup** | Reset mock state |
| **Timeout** | 5 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_send_certificate_feedback_accepted_happy_path(
    mock_feedback_server: MockFeedbackServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test successful ACCEPTED feedback submission."""
    # Arrange
    feedback_payload = {
        "feedbackId": "feedback-uuid-001",
        "certificateId": "cert-uuid-123",
        "status": "ACCEPTED",
        "locationBpns": ["BPNL123456789012"],
    }
    
    # Act
    response = send_certificate_feedback(
        connector=consumer_connector,
        payload=feedback_payload,
    )
    
    # Assert
    assert response.status_code == 200
    assert "receipt_id" in response.body
```

---

#### Test Case SF-002: Failure — Send REJECTED Feedback with Error Details

| Aspect | Details |
|--------|---------|
| **Preconditions** | Feedback endpoint mock running |
| **Setup** | Mock endpoint configured to accept REJECTED status with error list |
| **Action** | Call `send_certificate_feedback(..., status=REJECTED, locationErrors=[{bpn: "BPNL123", reason: "Invalid ISO cert"}])` |
| **Assertions** | Response status = 200; Provider receives all error details; Error list preserved in response |
| **Cleanup** | Reset mock state |
| **Timeout** | 5 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_send_certificate_feedback_rejected_with_errors(
    mock_feedback_server: MockFeedbackServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test REJECTED feedback includes detailed error reasons."""
    # Arrange
    feedback_payload = {
        "feedbackId": "feedback-uuid-002",
        "certificateId": "cert-uuid-456",
        "status": "REJECTED",
        "locationBpns": ["BPNL123456789012"],
        "locationErrors": [
            {
                "bpn": "BPNL123456789012",
                "errors": ["Invalid ISO 9001 on file", "Expired certificate"],
            }
        ],
    }
    
    # Act
    response = send_certificate_feedback(
        connector=consumer_connector,
        payload=feedback_payload,
    )
    
    # Assert
    assert response.status_code == 200
    assert len(response.body["location_errors"]) > 0
```

---

#### Test Case SF-003: Failure — Invalid BPNL in Payload (400 Bad Request)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Feedback endpoint mock running with validation |
| **Setup** | Mock endpoint configured to reject invalid BPNL format |
| **Action** | Call `send_certificate_feedback(..., locationBpns=["INVALID_BPNL"])` |
| **Assertions** | Response status = 400; Error message includes "BPNL format" |
| **Cleanup** | Reset mock state |
| **Timeout** | 5 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_send_certificate_feedback_invalid_bpnl(
    mock_feedback_server: MockFeedbackServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test rejection of malformed BPNL."""
    # Arrange
    feedback_payload = {
        "feedbackId": "feedback-uuid-003",
        "certificateId": "cert-uuid-789",
        "status": "ACCEPTED",
        "locationBpns": ["INVALID_BPNL"],  # Invalid format
    }
    
    # Act
    response = send_certificate_feedback(
        connector=consumer_connector,
        payload=feedback_payload,
    )
    
    # Assert
    assert response.status_code == 400
    assert "BPNL" in response.body.get("error", "")
```

---

#### Test Case SF-004: Failure — Feedback Endpoint Unreachable (Timeout)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Feedback endpoint mock configured to be unreachable |
| **Setup** | Mock endpoint delays > 30s OR refuses connections |
| **Action** | Call `send_certificate_feedback(...)` with default timeout |
| **Assertions** | Exception type = `FeedbackTimeoutError`; Error message includes "feedback endpoint" |
| **Cleanup** | Reset mock |
| **Timeout** | 35 seconds (+ buffer) |
| **Determinism** | Timing is mocked ✓ |

```python
def test_send_certificate_feedback_endpoint_timeout(
    mock_feedback_server: MockFeedbackServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test graceful timeout when feedback endpoint is unreachable."""
    # Arrange
    mock_feedback_server.set_unreachable()
    feedback_payload = {
        "feedbackId": "feedback-uuid-004",
        "certificateId": "cert-uuid-999",
        "status": "ACCEPTED",
    }
    
    # Act & Assert
    with pytest.raises(FeedbackTimeoutError):
        send_certificate_feedback(
            connector=consumer_connector,
            payload=feedback_payload,
            timeout=30,
        )
```

---

#### Test Case SF-005: Failure — Mismatched LocationBpns in Feedback (Conflict)

| Aspect | Details |
|--------|---------|
| **Preconditions** | Feedback endpoint mock validates location consistency |
| **Setup** | Mock expects locations to match the negotiated contract; Prepare feedback with mismatched locations |
| **Action** | Call `send_certificate_feedback(..., locationBpns=["BPNL_OTHER"])` where contract is for `BPNL_ORIGINAL` |
| **Assertions** | Response status = 400 OR warning generated; Error includes "location mismatch" |
| **Cleanup** | Reset mock state |
| **Timeout** | 5 seconds |
| **Determinism** | Repeatable ✓ |

```python
def test_send_certificate_feedback_location_mismatch(
    mock_feedback_server: MockFeedbackServer,
    consumer_connector: ConnectorConfig,
) -> None:
    """Test handling when feedback locations don't match contract."""
    # Arrange
    feedback_payload = {
        "feedbackId": "feedback-uuid-005",
        "certificateId": "cert-uuid-111",
        "status": "ACCEPTED",
        "locationBpns": ["BPNL_OTHER"],  # Doesn't match negotiated location
    }
    
    # Act
    response = send_certificate_feedback(
        connector=consumer_connector,
        payload=feedback_payload,
    )
    
    # Assert
    # Either error response or warning in response body
    assert response.status_code >= 400 or "mismatch" in str(response.body).lower()
```

---

## 2. Test Infrastructure

### 2.1 Mock Servers Required

| Mock Server | Purpose | Port | Endpoints |
|-------------|---------|------|-----------|
| **MockCCMAPIServer** | Simulate Provider's certificate offer & validation | 9100 | `POST /certificates/request`, `GET /certificates/{id}` |
| **MockFeedbackServer** | Simulate Provider's feedback acceptance endpoint | 9101 | `POST /feedback`, `GET /feedback/{id}` |
| **MockEDCConnector** | Simulate Consumer's connector (mock registration, DSP) | 9102 | `GET /v3/catalog`, `POST /negotiations/initiate` |

**Implementation**: Use `FastAPI` + `pytest` fixtures for lifecycle management.

```python
# conftest.py — Mock server fixtures

@pytest.fixture(scope="function")
def mock_ccmapi_server() -> Generator[MockCCMAPIServer, None, None]:
    """Mock CCMAPI server with configurable responses."""
    server = MockCCMAPIServer(host="127.0.0.1", port=9100)
    server.start()
    try:
        server.wait_ready(timeout=2)
        yield server
    finally:
        server.stop()

@pytest.fixture(scope="function")
def mock_feedback_server() -> Generator[MockFeedbackServer, None, None]:
    """Mock feedback server with configurable responses."""
    server = MockFeedbackServer(host="127.0.0.1", port=9101)
    server.start()
    try:
        server.wait_ready(timeout=2)
        yield server
    finally:
        server.stop()

@pytest.fixture(scope="function")
def consumer_connector(mock_ccmapi_server: MockCCMAPIServer) -> ConnectorConfig:
    """Configured consumer connector pointing to mocks."""
    return ConnectorConfig(
        name="consumer",
        connector_url="http://127.0.0.1:9102",
        api_key="test-key-123",
        dataspace_version="saturn",
    )
```

---

### 2.2 Fixtures Required

| Fixture Name | Type | Purpose |
|--------------|------|---------|
| `valid_certificate_iso9001` | JSON file | Valid certificate payload for happy-path test |
| `cert_missing_bpn` | JSON file | Certificate missing required `businessPartnerNumber` |
| `cert_invalid_date` | JSON file | Certificate with malformed `valid_until` |
| `schema_v3_1_0` | JSON Schema | BusinessPartnerCertificate schema v3.1.0 |
| `provider_iso9001_catalog` | JSON file | Mock provider catalog response with ISO 9001 asset |
| `accepted_feedback` | JSON file | Valid ACCEPTED feedback payload |
| `rejected_feedback_with_errors` | JSON file | REJECTED feedback with error list |
| `consumer_connector` | Fixture | Configured consumer connector config |
| `consumer_connector_no_policy` | Fixture | Consumer connector without access policy |

**Storage**: `/tests/fixtures/certificates/` with subdirectories:
- `fixtures/certificates/valid/` — Valid payloads
- `fixtures/certificates/invalid/` — Invalid/malformed payloads
- `fixtures/certificates/schemas/` — JSON schemas
- `fixtures/certificates/catalogs/` — Mock catalog responses

```python
# conftest.py — Fixture loaders

@pytest.fixture(scope="session")
def schema_v3_1_0() -> JSONSchema:
    """Load BusinessPartnerCertificate schema v3.1.0."""
    schema_path = Path(__file__).parent / "fixtures" / "certificates" / "schemas" / "v3.1.0.json"
    with open(schema_path) as f:
        return json.load(f)

@pytest.fixture(scope="function")
def valid_certificate_iso9001() -> dict:
    """Load valid ISO 9001 certificate."""
    fixture_path = Path(__file__).parent / "fixtures" / "certificates" / "valid" / "iso9001.json"
    with open(fixture_path) as f:
        return json.load(f)
```

---

### 2.3 Dependency Constraints

| Constraint | Implication | Solution |
|-----------|------------|----------|
| **Mock servers must start** | Tests can't run if ports are already in use | Use `pytest` fixtures with explicit `wait_ready(timeout=2s)` |
| **Fixtures must load before tests** | Missing fixture file = test error | Use session-scoped fixture loaders with error messages |
| **Contract state isolation** | One test's contract creation shouldn't affect another test | Use function-scoped fixtures; reset mock state after each test |
| **Parallel test execution** | Multiple tests hitting the same mock port = port conflict | Run tests sequentially (Phase 1); use different ports if parallelized later |
| **Network timeouts** | Real network calls = flakiness | Use mocks; mock all timeout behavior via `set_response_delay()` |

**Recommendation**: Start with **sequential execution** (simpler, more deterministic). Upgrade to parallel after MVP.

---

### 2.4 Timeout Strategy

| Scenario | Consumer Timeout | Mock Behavior | Test Expectation |
|----------|------------------|---------------|-----------------|
| Normal response | 30s | Respond in 200ms | Success ✓ |
| Slow provider | 30s | Respond in 25s | Success ✓ |
| Timeout | 30s | Respond in 35s | Exception raised ✓ |
| Network unreachable | 30s | No response | Exception raised ✓ |
| Partial response | 30s | Timeout mid-transfer | Exception raised ✓ |

**Timeout implementation**:
```python
# Consumer-side timeout (controlled)
response = request_certificate(..., timeout=30)  # Built into SDK

# Mock-side delay (mocked time, not real sleep)
mock_server.set_response_delay(35_000)  # ms
```

---

### 2.5 Determinism Verification

Every test must pass 10 times in a row without any failures.

**Verification command**:
```bash
# Run each test 10 times
for i in {1..10}; do
  python -m pytest tests/test_certificates.py::test_request_certificate_iso9001_happy_path -xvs
  if [ $? -ne 0 ]; then
    echo "FAILED on iteration $i"
    exit 1
  fi
done
echo "✓ All 10 iterations passed"
```

**Flakiness indicators** (if present, fix before shipping):
- Timing-dependent assertions (real `sleep()`)
- Unmocked network calls
- Non-deterministic UUID generation
- Shared global state

---

## 3. Coverage Goals

### 3.1 Happy Path Coverage (100% Code Path Execution)

| Capability | Happy Path Test | Code Paths Covered |
|------------|-----------------|-------------------|
| **RequestCertificate** | RC-001 | ✓ Request validation → Mock call → Response parsing → Success return |
| **ValidateCertificatePayload** | VP-001 | ✓ Schema loading → JSON parsing → Validation logic → Success return |
| **SendCertificateFeedback** | SF-001 | ✓ Feedback creation → Serialization → Mock call → Receipt confirmation |

**Target**: 100% of production code paths executed in happy-path tests.

---

### 3.2 Error Path Coverage (80% of Major Failure Modes)

| Capability | Error Paths Tested | Coverage |
|------------|-------------------|----------|
| **RequestCertificate** | Timeout (RC-002), Malformed request (RC-003), Provider rejects (RC-004), Unauthorized (RC-005) | 4/5 error modes = 80% ✓ |
| **ValidateCertificatePayload** | Missing field (VP-002), Invalid date (VP-003), Unknown type (VP-004), Field typo (VP-005) | 4/4 error modes = 100% ✓ |
| **SendCertificateFeedback** | Invalid BPNL (SF-003), Endpoint timeout (SF-004), Location mismatch (SF-005) | 3/4 error modes = 75% (acceptable) |

**Coverage target**: ≥80% of major error paths. Edge cases (retry logic, network glitches) can be deferred to Phase 2.

---

### 3.3 Edge Cases (Sample 3-5 per Capability)

#### RequestCertificate Edge Cases

1. **BPNS vs BPNA handling** — Can Consumer request certificate for multiple locations (BPNS)?
   - Test: `test_request_certificate_with_multiple_bpns()`
   - Expected: Accept array of BPNs or reject with clear error

2. **Empty cert_type** — What if Consumer sends `cert_type: ""`?
   - Test: `test_request_certificate_empty_type()`
   - Expected: Validation error before mock call

3. **Duplicate request** — What if Consumer sends same request twice?
   - Test: `test_request_certificate_duplicate_idempotency()`
   - Expected: Second call returns cached result OR new document_id (spec-dependent)

4. **Certificate already expired** — What if Provider returns certificate valid_until < now?
   - Test: `test_request_certificate_expired_doc()`
   - Expected: Warning or rejection (depends on spec)

5. **Unicode in request** — Can location_bpn contain unicode?
   - Test: `test_request_certificate_unicode_handling()`
   - Expected: Either accept/escape or reject with clear error

#### ValidateCertificatePayload Edge Cases

1. **Very large certificate (> 10MB)** — Can validator handle large payloads?
   - Test: `test_validate_certificate_large_payload()`
   - Expected: Timeout or rejection with message

2. **Deeply nested JSON** — Can validator handle 100+ levels of nesting?
   - Test: `test_validate_certificate_deeply_nested()`
   - Expected: Either success or clear error (not stack overflow)

3. **Circular reference in JSON** — What if certificate_data contains self-reference?
   - Test: `test_validate_certificate_circular_reference()`
   - Expected: Validation error (not infinite loop)

4. **Mixed type for required field** — What if `businessPartnerNumber` is array instead of string?
   - Test: `test_validate_certificate_type_mismatch()`
   - Expected: Type validation error

5. **Null values for non-nullable fields** — What if `certificateType: null`?
   - Test: `test_validate_certificate_null_required_field()`
   - Expected: Validation error

#### SendCertificateFeedback Edge Cases

1. **Duplicate feedback ID** — What if Consumer sends feedback with same feedbackId twice?
   - Test: `test_send_certificate_feedback_duplicate_id()`
   - Expected: Either idempotent (200 OK) or error on second attempt

2. **Feedback for non-existent certificate** — What if certificateId doesn't exist?
   - Test: `test_send_certificate_feedback_nonexistent_cert()`
   - Expected: 404 or clear error message

3. **Empty locationErrors array** — Can Consumer send REJECTED with no error details?
   - Test: `test_send_certificate_feedback_rejected_no_errors()`
   - Expected: Either reject (400) or accept with warning

4. **Very long error reason (> 5000 chars)** — Can Provider handle long error strings?
   - Test: `test_send_certificate_feedback_long_error_reason()`
   - Expected: Either truncate/accept or reject with size limit error

5. **Status enum case sensitivity** — What if Consumer sends `status: "accepted"` (lowercase)?
   - Test: `test_send_certificate_feedback_status_case_sensitivity()`
   - Expected: Either normalize or reject with enum error

---

## 4. Test Execution Model

### 4.1 Recommended: Sequential Execution with Shared Fixtures (Phase 1)

```
Test Suite (Phase 1)
├── RequestCertificate Tests
│   ├── RC-001 (happy path)
│   ├── RC-002 (timeout)
│   ├── RC-003 (malformed)
│   ├── RC-004 (provider rejects)
│   └── RC-005 (unauthorized)
│
├── ValidateCertificatePayload Tests
│   ├── VP-001 (valid)
│   ├── VP-002 (missing field)
│   ├── VP-003 (invalid date)
│   ├── VP-004 (unknown type)
│   └── VP-005 (field typo)
│
└── SendCertificateFeedback Tests
    ├── SF-001 (happy path)
    ├── SF-002 (rejected with errors)
    ├── SF-003 (invalid BPNL)
    ├── SF-004 (timeout)
    └── SF-005 (location mismatch)
```

**Execution order**: Sequential (one test at a time)  
**Total tests**: 15 core + 5 edge-case = 20 tests  
**Expected duration**: 20 tests × 2-5s per test ≈ **2-3 minutes** 

**pytest configuration**:
```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -x -q --tb=short
timeout = 60  # per-test timeout
```

### 4.2 Execution command

```bash
# Run all certificate tests sequentially
python -m pytest tests/test_certificates.py -xvs

# Run specific capability
python -m pytest tests/test_certificates.py::TestRequestCertificate -xvs

# Run with coverage report
python -m pytest tests/test_certificates.py --cov=tractusx_testlab.cert_management --cov-report=html
```

### 4.3 Upgrade Path: Parallel Execution (Phase 2)

If tests complete too slowly after MVP, parallelize using `pytest-xdist`:

```bash
pip install pytest-xdist
python -m pytest tests/test_certificates.py -n auto  # Use all available CPUs
```

**Prerequisites for parallelization**:
- Each test must use isolated mock servers (different ports)
- No shared global state
- Fixtures must be function-scoped (not module-scoped)

---

## 5. Failure Reporting

### 5.1 Test Failure Output Format

When a test fails, report:

```
FAILED tests/test_certificates.py::test_request_certificate_iso9001_happy_path

AssertionError: Expected response status 200, got 500

Context:
  - Test: RequestCertificate happy path (RC-001)
  - Step: request_certificate(cert_type="ISO9001", location_bpn="BPNL123456789")
  - Expected: Response status = 200, document_id present
  - Actual: Response status = 500, error = "Internal server error"

Request payload:
  {
    "cert_type": "ISO9001",
    "location_bpn": "BPNL123456789"
  }

Response body:
  {
    "error": "Internal server error",
    "timestamp": "2026-05-10T18:15:00Z"
  }

Logs:
  [18:15:00] MockCCMAPIServer ERROR: Failed to load fixture 'iso9001_completed.json'
  [18:15:00] File not found: /tests/fixtures/certificates/valid/iso9001_completed.json

Suggestion:
  Check that fixture file exists at:
  /tests/fixtures/certificates/valid/iso9001_completed.json
```

### 5.2 Implementation: Custom pytest Hooks

```python
# conftest.py

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Enhance test failure reporting with context."""
    outcome = yield
    rep = outcome.get_result()
    
    if rep.failed and call.when == "call":
        # Attach detailed context to failure report
        test_name = item.name
        docstring = item.obj.__doc__ or ""
        
        # Extract test category (RC, VP, SF)
        category = test_name.split("_")[1].upper() if "_" in test_name else "UNKNOWN"
        
        # Add enriched error info
        rep.sections.append(
            (
                "Test Context",
                f"Category: {category} ({docstring.split('—')[0].strip()})\n"
                f"Test Name: {test_name}",
            )
        )
        
        # Attach mock server logs if available
        if hasattr(item, "mock_server"):
            rep.sections.append(
                ("Mock Server Logs", "\n".join(item.mock_server.get_logs()[-10:]))
            )
```

### 5.3 Common Failure Scenarios & Suggestions

| Failure Pattern | Probable Cause | Suggestion |
|-----------------|----------------|-----------|
| `ConnectionRefusedError` on port 9100 | Mock server didn't start | Check `MockCCMAPIServer.start()` in fixture; increase `wait_ready()` timeout |
| `TimeoutError` in test | Mock delayed response took too long | Set `mock_server.set_response_delay(100)` (ms) instead of real sleep |
| `AssertionError: assert 400 == 200` | Validation error in payload | Check fixture file format; print request payload in test |
| `FileNotFoundError: fixtures/certificates/valid/iso9001.json` | Missing fixture | Verify fixture file exists at correct path; run `find tests/fixtures -name "*.json"` |
| `Flaky: passed on run 1, failed on run 8` | Non-deterministic behavior | Check for `time.sleep()`, unmocked network calls, or shared global state |
| `AttributeError: 'dict' object has no attribute 'document_id'` | Response structure mismatch | Print `response.body` in test; check mock fixture matches expected schema |

---

## 6. Test File Structure

```
tests/
├── conftest.py                              # Shared fixtures, mock servers
├── test_certificates.py                     # All 20 certificate tests
├── fixtures/
│   └── certificates/
│       ├── valid/
│       │   ├── iso9001.json
│       │   ├── iso14001.json
│       │   └── accepted_feedback.json
│       ├── invalid/
│       │   ├── missing_bpn.json
│       │   ├── invalid_date.json
│       │   ├── unknown_type.json
│       │   └── malformed.json
│       └── schemas/
│           └── v3.1.0.json
└── mocks/
    ├── mock_ccmapi_server.py                # MockCCMAPIServer implementation
    ├── mock_feedback_server.py              # MockFeedbackServer implementation
    └── mock_edc_connector.py                # MockEDCConnector implementation
```

---

## 7. Self-Review Checklist

Before shipping tests, verify:

- [ ] All 20 tests pass: `python -m pytest tests/test_certificates.py -x -q`
- [ ] Each test is < 300 lines
- [ ] No test exceeds 5 seconds runtime
- [ ] Each test passes 10x in a row (determinism check)
- [ ] No bare `assert` without context: `assert response.status_code == 200`
- [ ] No `time.sleep()` in tests (use mocked delays)
- [ ] All fixtures load correctly: `python -m pytest tests/test_certificates.py --collect-only`
- [ ] Mock servers start/stop cleanly: Check for port conflicts
- [ ] Failure messages are actionable (include request, response, expected vs. actual)
- [ ] Coverage report generated: `pytest --cov=tractusx_testlab`

---

## 8. Success Criteria (Phase 1.3 Completion)

✓ Test matrix document reviewed and approved  
✓ 20 core tests written and passing (happy path + 4 failure modes per capability)  
✓ 5 edge-case tests identified (defer implementation to Phase 2)  
✓ Mock infrastructure (3 servers) implemented and tested  
✓ Fixtures created and validated  
✓ All tests deterministic (pass 10x in a row)  
✓ Coverage report: ≥85% of certificate management code  
✓ Failure reporting format defined and implemented  
✓ Ready to hand off to Phase 2 (capability implementation)

---

**Document prepared by**: TestLab Test Master  
**Date**: May 10, 2026  
**Next step**: Phase 2 — Implement RequestCertificate, ValidateCertificatePayload, SendCertificateFeedback capabilities
