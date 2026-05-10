# Certificate Management Test Cases in the IDE — Step-by-Step Guide

This guide walks you through creating certificate management test cases using the TestLab IDE. By the end, you'll be able to create and run tests that validate the complete certificate exchange workflow (request → validate → feedback).

## Prerequisites

- TestLab IDE running (http://localhost:5173)
- Understanding of BPNs (Business Partner Numbers)
- Access to a test environment with Provider and Consumer EDC connectors
- Test certificates in PDF format (sample provided in fixtures)

## Conceptual Overview

Certificate management involves **three steps** working together:

```
Step 1: Request Certificate
  ↓ (outputs: request_id, document_id)
Step 2: Validate Payload
  ↓ (outputs: validation_status, errors)
Step 3: Send Feedback
```

Each step depends on the output of the previous step. The IDE automatically links them.

---

## Step 1: Create a New Certificate Test Case

### 1.1 Welcome Screen → New Test Case

1. **Open IDE** → You see the Welcome Screen
2. **Click "New Test Case"** (big blue button)
3. **Name it**: `Certificate_ISO9001_Validation` (use underscores, no spaces)
4. **Pick a template**: Select **"Certificate Management (CX-0135)"**
   - The IDE pre-fills setup/teardown blocks
   - You only configure the 3 main steps

### 1.2 Understand the Pre-Filled Setup

The template includes:

```
SETUP (automatic):
  ├─ Initialize CCMAPI Mock Server (port 9100)
  ├─ Initialize Consumer Feedback Endpoint (port 9101)
  └─ Load Test Certificates from Fixtures

STEPS (you configure these):
  ├─ Step 1: Request Certificate
  ├─ Step 2: Validate Certificate
  └─ Step 3: Send Feedback

TEARDOWN (automatic):
  └─ Stop Mock Servers & Export Results
```

**Important**: You don't need to touch setup/teardown. They run automatically. You only edit the **STEPS**.

---

## Step 2: Configure Step 1 — Request Certificate

### 2.1 Drag Request Certificate Block

1. **Open Block Palette** (right side of editor)
2. **Find "Certificate Management"** category (or search for "request")
3. **Drag "Request Certificate"** block onto the canvas
4. **Drop it in the STEPS section** (below setup)

### 2.2 Configure Inputs

When you drop the block, you see a form:

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Provider EDC Endpoint** | URL to Provider's DSP endpoint | `https://provider-edc.example.com:8282/api/v1/dsp` |
| **Provider BPN** | Provider's BPNL | `BPNL00000003AZQP` |
| **Consumer BPN** | Your company's BPNL | `BPNL00000001SQRN` |
| **Certificate Type** | Dropdown: ISO 9001, IATF 16949, ISO 14001, ... | `ISO 9001` |
| **Locations** | Which of your sites need this cert | `BPNS000000000001` (click "+" to add more) |

### 2.3 Auto-Fill from Test Config

**Shortcut**: Instead of typing BPNs manually, use variables:

1. **Click the variable icon** (looks like `@` symbol) next to Provider BPN
2. **Select from dropdown**: 
   - `@test_root.providers.iso_certifier.bpnl` (predefined provider)
   - `@my_test_config.consumer_bpn` (your test config)
3. **IDE auto-fills** the value

**Why?** Reuse test data. If Provider BPN changes, it updates everywhere.

### 2.4 View Outputs

After you fill in inputs, the block shows outputs below:

```
Outputs:
  ├─ request_id (string)
  ├─ request_status (COMPLETED | IN_PROGRESS | REJECTED)
  └─ document_id (string)
```

**These are variables you'll use in Step 2.** The IDE shows them as `@step_1.request_id`, etc.

---

## Step 3: Configure Step 2 — Validate Certificate

### 3.1 Drag Validate Block

1. **Open Block Palette** → "Certificate Management"
2. **Drag "Validate Certificate Payload"** onto the canvas
3. **Drop it BELOW Step 1** (the IDE will auto-connect them)

### 3.2 Configure Inputs — Auto-Linking

When you drop the block near Step 1, the IDE shows a popup:

```
Auto-link outputs from previous step?
  ☑ @step_1.document_id → (Input: Certificate Data)
  ☑ @step_1.request_id → (Input: Request ID for Reference)
  [Auto-Link] or [Skip]
```

**Click "Auto-Link"**. The IDE wires them automatically. No manual work!

### 3.3 Simple Configuration

The form now shows:

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Certificate Data** | *(already auto-linked from Step 1)* | `@step_1.document_id` |
| **Semantic Model** | *(pre-filled, read-only)* | `urn:samm:io.catenax.business_partner_certificate:3.1.0` |
| **Strictness** | How strict? | `High` (check all required fields) |

**That's it!** The validator runs the certificate through the CX-0135 schema automatically.

### 3.4 View Validation Outputs

```
Outputs:
  ├─ validation_status (VALID | INVALID)
  ├─ validation_errors (if INVALID)
  └─ validated_cert_id (reference)
```

---

## Step 4: Configure Step 3 — Send Feedback

### 4.1 Drag Send Feedback Block

1. **Open Block Palette** → "Certificate Management"
2. **Drag "Send Certificate Feedback"** onto the canvas
3. **Drop it BELOW Step 2** → Auto-link popup appears again

### 4.2 Auto-Linking (Again)

The IDE suggests:

```
Auto-link outputs?
  ☑ @step_1.request_id → Request ID
  ☑ @step_1.document_id → Document ID
  ☑ @step_2.validation_status → Determines feedback type
  [Auto-Link] or [Skip]
```

**Click "Auto-Link"** again. All wired!

### 4.3 Simple Configuration

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Feedback Type** | RECEIVED, ACCEPTED, or REJECTED | *Usually auto-chosen based on validation* |
| **Include Errors** | If REJECTED, include error details? | `Yes` (helps Provider debug) |

**Smart default**: If `@step_2.validation_status == VALID`, automatically send `ACCEPTED`. Otherwise, send `REJECTED`.

---

## Step 5: Add Assertions (Verify Results)

### 5.1 What Are Assertions?

Assertions are **checks** that verify the test passed. Example:

```
✓ "Certificate request must succeed"
✓ "Validation must pass"
✓ "Feedback must be sent"
```

### 5.2 Add Assertion Blocks

1. **Open Block Palette** → "Validation" category
2. **Drag "Assert" block** onto the canvas (below the 3 steps)
3. **Fill in the assertion**:

**Example Assertion 1**:
```
Description: Request succeeds
Condition: @step_1.request_status == "COMPLETED"
Severity: Error (if fails, test fails)
```

**Example Assertion 2**:
```
Description: Certificate is valid
Condition: @step_2.validation_status == "VALID"
Severity: Error
```

**Example Assertion 3**:
```
Description: Feedback sent successfully
Condition: @step_3.feedback_status == "SENT"
Severity: Error
```

---

## Step 6: Preview YAML

### 6.1 See the Generated YAML

1. **Click "YAML Editor"** tab (right panel)
2. **See the generated YAML** that corresponds to your blocks
3. **Verify it looks right** (or edit directly if you prefer)

**Example output**:
```yaml
steps:
  - name: request_iso9001
    type: request_certificate
    inputs:
      provider_bpn: @test_root.providers.iso_certifier.bpnl
      certificate_type: iso9001
    outputs:
      - request_id
      - document_id
```

### 6.2 Edit YAML Directly (Optional)

If you prefer code:

1. **Click in the YAML editor**
2. **Edit the YAML directly** (like the examples in `examples/certificates/`)
3. **Blocks auto-update** in the visual editor

---

## Step 7: Run the Test

### 7.1 Save & Export

1. **Click "File" → "Export"**
2. **Choose format**: YAML or ZIP
3. **Save** to your computer

### 7.2 Run from CLI

```bash
# Compile the test
testlab compile cert-management-validation.yaml

# Run it
testlab run cert-management-validation.yaml --verbose
```

### 7.3 Monitor Execution

The IDE shows:

```
Status: Running...

SETUP
  ✓ Initialize CCMAPI Mock Server
  ✓ Initialize Consumer Feedback Endpoint

STEPS
  ✓ Step 1: Request Certificate → request_id = abc-123
  ✓ Step 2: Validate Certificate Payload → validation_status = VALID
  ✓ Step 3: Send Feedback → feedback_status = SENT

ASSERTIONS
  ✓ Request succeeds
  ✓ Certificate is valid
  ✓ Feedback sent

TEARDOWN
  ✓ Stop Mock Servers & Export Results

Result: PASSED ✓
Duration: 45 seconds
```

---

## Troubleshooting

### "Provider not reachable" Error

**Problem**: Step 1 times out.

**Solution**:
1. Check Provider EDC endpoint URL is correct
2. Verify Provider is running (`curl https://provider-edc.example.com:8282/health`)
3. Increase timeout in Step 1 configuration (default 60s)

### "Validation failed" Error

**Problem**: Step 2 finds invalid certificate.

**Check**:
1. Certificate has all required fields (businessPartnerNumber, type, validFrom, validUntil, etc.)
2. Dates are ISO 8601 format: `2026-01-24`
3. Certificate type is lowercase: `iso9001` (not `ISO9001`)
4. BPNL/BPNS format is correct: `BPNL` (12 chars) or `BPNS` (10 chars)

See error details in **YAML Output** or **Execution Logs**.

### "Feedback endpoint not reachable" Error

**Problem**: Step 3 fails to send feedback.

**Solution**:
1. Verify Consumer feedback endpoint is running (setup should handle this)
2. Check Provider feedback URL in certificate header: `senderFeedbackUrl`
3. Verify auth tokens are valid

---

## Next Steps

### Learn More

- **CX-0135 Standard**: https://catenax-ev.github.io/docs/next/standards/CX-0135-CompanyCertificateManagement
- **TestLab Product Scope**: See `docs/developer/product-scope.md`
- **YAML Specification**: See `docs/specification/`

### Create Your Own Test

1. **Customize the 3 certificates types**: Add IATF 16949, ISO 14001, etc.
2. **Add error scenarios**: Test rejected certificates, timeout handling
3. **Extend with more assertions**: Check response payloads, validate error messages

### Share Your Test

```bash
# Export as a project ZIP
testlab export cert-management-validation.yaml --format zip

# Share with team or submit for conformance testing
# They can import and run: testlab import cert-management-validation.zip
```

---

## Glossary

| Term | Meaning |
|------|---------|
| **BPNL** | Business Partner Number - Legal Entity (12 chars) |
| **BPNS** | Business Partner Number - Site (10 chars) |
| **DSP** | Dataspace Protocol (endpoint for EDC communication) |
| **CCMAPI** | Company Certificate Management API (standard endpoint) |
| **Semantic Model** | Data schema (CX-0135 defines BusinessPartnerCertificate) |
| **@variable** | Reference to a test variable or step output |
| **Auto-Link** | IDE automatically wires outputs from one step to inputs of next |

