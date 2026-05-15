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
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Haiku 4.5). -->
<!-- It was reviewed and tested by a human committer. -->

# UX Proposal: Certificate Management Workflow

**Phase 1.2 Deliverable** — Designed for non-technical domain experts to author certificate validation tests without SDK knowledge.

---

## Executive Summary

The proposal uses a **hybrid discovery model**: (1) new "Certificate Management" block category for power users and testing, (2) pre-made certificate test templates for guided onboarding, and (3) input simplification that shows only 3-4 essential fields per block with advanced options hidden behind "▼ More".

**Key design goals:**
- Non-SDK users see domain labels ("Request a certificate"), not code
- Minimum viable form reduces cognitive load
- Safe defaults auto-populate from `test_root` config
- Workflow dependencies are enforced by template sequencing, not UI locks
- Output variables auto-link downstream (existing pattern)

---

## 1. Capability Picker Mockup

### Recommendation: **Hybrid A+C**

**Two complementary discovery paths:**

1. **Block Category Path** (Option A) — "Certificate Management" category in the toolbox
   - Power users and test debugging
   - Allows free composition of cert blocks with other workflow blocks
   - Discoverable via search

2. **Template Path** (Option C) — Pre-made templates on welcome screen + new test dialog
   - Guided onboarding for first-time users
   - Pre-wired setup/execution/teardown
   - Low friction: "Create a Certificate Validation Test"

---

### 1.1 Toolbox: "Certificate Management" Category

**Mockup of Toolbox:**

```
┌─ Toolbox ─────────────────────────┐
│                                    │
│  📦 Mock                           │
│  ⏱️  Wait                           │
│  ⚙️  Function                       │
│  🔄 Flow                           │
│  🔌 EDC Connector                  │
│  🏛️  Digital Twin Registry          │
│  🔍 Discovery Finder               │
│  🌐 HTTP                           │
│  📢 Notification                   │
│  ✓ Validation                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ✅ Certificate Management (NEW)    │
│                                    │
└────────────────────────────────────┘
```

**When user clicks "Certificate Management":**

```
┌─ Certificate Management ─────────────────────┐
│                                              │
│  📋 Request a Certificate                    │
│     Send a certificate request to a          │
│     Certificate Authority (CA)               │
│                                              │
│  📤 Send Certificate Feedback                │
│     Return feedback to the provider          │
│     (approval, rejection, or revision)       │
│                                              │
│  ✓ Validate Certificate Payload              │
│     Verify structure, signatures, and        │
│     compliance with Catena-X schema          │
│                                              │
└──────────────────────────────────────────────┘
```

**What user sees:**
- Category title: "Certificate Management"
- 3 sub-cards, each showing:
  - Icon + domain label (not code)
  - One-line description
  - User drags card to workspace

**Design rationale:**
- Matches existing notification/validation category pattern
- Reduces visual clutter: one "fold" to expand
- Discoverable by users who know they need certs

---

### 1.2 Welcome Screen: Certificate Test Templates

**New section added to Welcome Screen:**

```
┌─ Welcome Screen ───────────────────────────────────┐
│                                                    │
│  Use Cases                                         │
│  ┌─────────────┬─────────────┬─────────────┐     │
│  │ Traceability│ Certificate │ Special     │     │
│  │Notification │ Management  │Characteristics│   │
│  │             │             │             │     │
│  │ [LOAD]      │ [LOAD]      │ [LOAD]      │     │
│  └─────────────┴─────────────┴─────────────┘     │
│                                                    │
│  [NEW] Start New Certificate Test               │
│  ┌─────────────────────────────────────────┐    │
│  │ 🎯 Request & Validate Certificate       │    │
│  │    Complete workflow: request → approve │    │
│  │    → validate payload                   │    │
│  │                                         │    │
│  │    [Use Template]                       │    │
│  │                                         │    │
│  │ 🎯 Simple Certificate Lookup            │    │
│  │    Just check if a cert exists          │    │
│  │                                         │    │
│  │    [Use Template]                       │    │
│  │                                         │    │
│  │ 🎯 Certificate Authority Mock           │    │
│  │    Test your own CA endpoint             │    │
│  │                                         │    │
│  │    [Use Template]                       │    │
│  └─────────────────────────────────────────┘    │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Click "Use Template" → User gets:**

1. Pre-configured TCK with:
   - Services wired (EDC consumer, EDC provider, mock CA)
   - Setup phase: mock endpoints registered
   - Execution phase: 3 blocks already connected in order
   - Teardown phase: export results template

2. Fields pre-filled with sensible defaults:
   - Consumer BPN = `@test_root.consumer_bpn`
   - Provider BPN = `@test_root.provider_bpn`
   - Certificate type = first option (ISO 9001)
   - Timeout = 30 seconds

3. User edits only what they need:
   - Change certificate type (dropdown)
   - Override BPNs if test_root isn't available
   - Add validation rules

---

## 2. Input Simplification

### Design: "Progressive Disclosure" — Essential → Optional

Each block shows **3–4 essential fields** on the visible surface. Advanced options live behind "▼ More Options".

---

### 2.1 RequestCertificate Block

**Block visual (compact form shown by default):**

```
┌─ Request a Certificate ──────────────────────────┐
│                                                  │
│  Consumer EDC Service    [Dropdown ▼]           │
│  ⓘ Which connector will send the request?        │
│                                                  │
│  Certificate Type        [ISO 9001 ▼]           │
│  ⓘ What standard? (ISO 9001, IATF 16949, etc.)   │
│                                                  │
│  Location BPNs           [+] Add locations       │
│  ⓘ Where should certs apply?                     │
│  [BPN-1234] [✕]                                  │
│  [BPN-5678] [✕]                                  │
│                                                  │
│  ▼ More Options                                  │
│                                                  │
│  [✓] Auto-generate request ID                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**When user clicks "▼ More Options":**

```
│                                                  │
│  ▲ More Options                                  │
│                                                  │
│  Request Timeout (sec)  [30]                    │
│  Retry Attempts        [3]                      │
│  Custom Headers        [+ Add]                  │
│  Request ID (optional) [Leave blank for UUID]   │
│  Metadata Tags         [+ Add]                  │
│                                                  │
│  [Collapse]                                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Why these 3 essential fields?**

| Field | Rationale | Type | Auto-fill |
|-------|-----------|------|-----------|
| **Consumer EDC Service** | Users must know who sends; required for routing | `service_ref` dropdown | No (user picks from config) |
| **Certificate Type** | Domain-critical; different validation rules apply | `dropdown` | Yes (default: ISO 9001) |
| **Location BPNs** | Where the certs apply; the "scope" of validation | `array` | Partial (can add template with suggestion) |

**What's hidden (in "More Options"):**
- Request timeout (safe default: 30s)
- Retry attempts (safe default: 3)
- Custom headers (advanced users only)
- Request ID (auto-UUID if empty)

**How the form feels to users:**
- First impression: 3 simple questions
- Quick to fill: one dropdown, one dropdown, one text array
- Looks complete and ready to go
- If needed: one click reveals depth

---

### 2.2 SendCertificateFeedback Block

**Essential form (visible by default):**

```
┌─ Send Certificate Feedback ──────────────────────┐
│                                                  │
│  Provider EDC Service    [Dropdown ▼]           │
│  ⓘ Which connector will send the feedback?       │
│                                                  │
│  Request ID              [@request_id ▼]        │
│  ⓘ From the previous request (auto-linked)       │
│                                                  │
│  Decision                [Approve ▼]            │
│  ⓘ Approve / Reject / Request Revision           │
│                                                  │
│  ▼ More Options                                  │
│                                                  │
│  [✓] Include document review notes              │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Advanced options:**

```
│  ▲ More Options                                  │
│                                                  │
│  Custom Feedback Notes  [Large text area]        │
│  Reviewer ID            [Auto: @test_root.user] │
│  Approval Code          [Optional text]          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Auto-linking magic:**
- When user places this block after RequestCertificate, the `@request_id` field **automatically populates** with the upstream output
- Dropdown shows: `@request_id` (from previous step)
- User sees the variable name, confirming the link

---

### 2.3 ValidateCertificatePayload Block

**Essential form:**

```
┌─ Validate Certificate Payload ──────────────────┐
│                                                  │
│  Certificate Data        [@cert_payload ▼]      │
│  ⓘ The cert from previous steps (auto-linked)    │
│                                                  │
│  Validation Type         [Schema ▼]             │
│  ⓘ Validate structure, signatures, or rules      │
│                                                  │
│  Required Fields         [✓] Serial Number      │
│  (checkboxes)            [✓] Issuer Name        │
│                          [✓] Expiry Date        │
│                          [  ] Chain Verification│
│                                                  │
│  ▼ More Options                                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Advanced options:**

```
│  ▲ More Options                                  │
│                                                  │
│  Custom Schema Path      [/schemas/cert.json]   │
│  Allowed Issuers         [+ Add whitelist]       │
│  Max Age (days)          [365]                   │
│  Signature Algorithm     [RS256 ▼]              │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 3. Output Visualization

### Existing Pattern: Auto-Appear as Variables

Certificate blocks follow the **same pattern** as Query Catalog and other existing blocks.

**When RequestCertificate executes:**

```
Workspace before:
┌──────────────────────────┐
│ Request a Certificate    │ --outputs→ [@request_id, @cert_payload, @request_status]
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ Validate Certificate ...?│  (no variables available yet)
└──────────────────────────┘


Workspace after step executes:
┌──────────────────────────┐
│ Request a Certificate    │ --outputs→ [@request_id, @cert_payload, @request_status]
└──────────────────────────┘  Completed ✓
       ↓
┌──────────────────────────┐
│ Validate Certificate ...?│  NOW shows dropdown: [@request_id ▼] [@cert_payload ▼] [@request_status ▼]
└──────────────────────────┘
```

**User experience:**
1. Drag first block (RequestCertificate) into workspace
2. Fill in the 3 required fields
3. (Optional: view outputs by hovering on block → "Outputs: request_id, cert_payload, request_status")
4. Drag second block (ValidateCertificatePayload) below
5. Click the `Certificate Data` field → **dropdown automatically shows** `@request_id`, `@cert_payload`, `@request_status`
6. Click `@cert_payload` to auto-link
7. Done — no manual variable syntax

**No new UI needed** — reuse existing auto-linking infrastructure.

**Output preview UI (optional enhancement):**

If toolbox shows a small info icon on the block, hovering reveals:

```
┌─ RequestCertificate Outputs ─────────┐
│                                      │
│ @request_id (string)                │
│   Unique request identifier          │
│   Used in feedback step              │
│                                      │
│ @cert_payload (json)                │
│   Full certificate document          │
│   Used in validation step            │
│                                      │
│ @request_status (string)             │
│   Status code: pending, approved,    │
│   rejected, etc.                     │
│                                      │
└──────────────────────────────────────┘
```

This is **informational only** — doesn't block workflow, just helps user understand what outputs are available.

---

## 4. Workflow Sequencing UI

### Recommendation: **Option B (Warn but Allow) + Sequence Diagram**

**Design principle:** Trust domain experts to understand flow, but make dependencies visible and warn about violations.

---

### 4.1 Dependency Visualization in Block Editor

**Current problem:** User can drag blocks in any order. Certificate workflow requires:
```
RequestCertificate → ValidateCertificatePayload → SendCertificateFeedback
```

**Solution: Visual Prerequisite Markers**

```
┌─ Block Editor Workspace ──────────────────────────┐
│                                                   │
│  ┌──────────────────────────────────────┐        │
│  │ Request a Certificate                │        │
│  │ Consumer EDC: EDC-Consumer-1         │        │
│  │ Certificate Type: ISO 9001           │        │
│  └──────────────────────────────────────┘        │
│           ↓                                       │
│           ⚠️  EXPECTED: Validate next              │
│           ↓                                       │
│  ┌──────────────────────────────────────┐        │
│  │ Validate Certificate Payload         │        │
│  │ Certificate Data: [@cert_payload]    │        │
│  │ Validation Type: Schema              │        │
│  └──────────────────────────────────────┘        │
│           ↓                                       │
│  ┌──────────────────────────────────────┐        │
│  │ Send Certificate Feedback            │        │
│  │ Provider EDC: EDC-Provider-1         │        │
│  │ Decision: Approve                    │        │
│  └──────────────────────────────────────┘        │
│                                                   │
└───────────────────────────────────────────────────┘

Tooltip (on hover of ⚠️ icon):
"This step expects a ValidateCertificatePayload to run first.
If missing, the request_id may not be available."
```

**Behavior:**
- ✅ **Blocks in correct order** — Green checkmark, no warning
- ⚠️ **Blocks out of order** — Yellow warning icon, tooltip explains why, BUT user can still run (we trust them)
- ❌ **Missing prerequisite** — Red error icon, step **cannot** execute (no upstream output available)

**Why this approach?**
- Respects user expertise: they can override if they know why
- Catches mistakes: warnings are hard to miss
- Fails safely: actual prerequisites (missing variables) prevent broken execution
- Matches existing patterns: similar to how Blockly shows type mismatches

---

### 4.2 Sequence Diagram View (Enhanced Graph View)

**Current IDE has a "Graph View"** that shows test flow visually. Enhance it for cert workflows:

```
┌─ Graph View ───────────────────────────────────────┐
│                                                    │
│   Certificate Request Workflow                     │
│                                                    │
│   ┌──────────────┐                                │
│   │ Setup Phase  │                                │
│   ├──────────────┤                                │
│   │ • Mock CA    │                                │
│   │ • Mock CB    │                                │
│   └──────────────┘                                │
│        ↓                                          │
│   ┌──────────────────────────────────────┐       │
│   │ Execution Phase                      │       │
│   ├──────────────────────────────────────┤       │
│   │ 1. Request a Certificate             │       │
│   │    (Provider sends request to CA)     │       │
│   │                 ↓                    │       │
│   │ 2. Validate Certificate Payload      │       │
│   │    (Check structure & signature)     │       │
│   │                 ↓                    │       │
│   │ 3. Send Certificate Feedback         │       │
│   │    (Provider approves or rejects)    │       │
│   └──────────────────────────────────────┘       │
│        ↓                                          │
│   ┌──────────────┐                                │
│   │ Teardown     │                                │
│   ├──────────────┤                                │
│   │ • Export     │                                │
│   │ • Cleanup    │                                │
│   └──────────────┘                                │
│                                                    │
│ [Legend] Prerequisite: → | Optional: ⤳ | Parallel: ↔ │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Benefits:**
- Shows the happy path at a glance
- No need for visual locks (trusts user judgment)
- Helps onboard non-SDK users: "Here's the flow"
- Same view works for all test workflows (not cert-specific)

---

## 5. Setup/Teardown Harmonization

### Recommendation: **Option C (Pre-made Templates) + Explicit Setup Blocks**

Certificate tests require specific preconditions. Instead of auto-magic, make setup **visible but pre-configured**.

---

### 5.1 Setup Phase (Visible in TCK)

When user creates a certificate test (via template or manual), they get a **Setup phase** with these elements **already defined**:

```
┌─ Setup Phase ──────────────────────────────────────┐
│                                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ Mock Consumer Feedback Endpoint            │   │
│ │                                            │   │
│ │ Endpoint URL: http://localhost:9999/...   │   │
│ │ Port: [9999]                              │   │
│ │ Path: [/certificate-feedback]             │   │
│ │                                            │   │
│ │ ▼ More Options                             │   │
│ │ [✓] Enable logging                        │   │
│ │ [  ] Require auth token                   │   │
│ └────────────────────────────────────────────┘   │
│         ↓                                         │
│ ┌────────────────────────────────────────────┐   │
│ │ Register EDC Consumer Connector            │   │
│ │                                            │   │
│ │ Service: EDC-Consumer-1                   │   │
│ │ Endpoint: [Auto: @test_root.consumer_url] │   │
│ │ API Key: [Auto: @test_root.consumer_api]  │   │
│ │                                            │   │
│ │ ▼ More Options                             │   │
│ │ [✓] Auto-verify connection                │   │
│ └────────────────────────────────────────────┘   │
│         ↓                                         │
│ ┌────────────────────────────────────────────┐   │
│ │ Register EDC Provider Connector            │   │
│ │                                            │   │
│ │ Service: EDC-Provider-1                   │   │
│ │ Endpoint: [Auto: @test_root.provider_url] │   │
│ │ API Key: [Auto: @test_root.provider_api]  │   │
│ │                                            │   │
│ │ ▼ More Options                             │   │
│ │ [✓] Auto-verify connection                │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Design philosophy:**
- ✅ Setup blocks are **visible** (users see what's being set up)
- ✅ Setup blocks are **pre-filled** (from test_root or sensible defaults)
- ✅ Setup blocks are **editable** (advanced users can customize)
- ✅ Setup blocks are **optional to understand** (beginners can ignore and just run)

**User experience for first-time users:**
1. Click "Use Certificate Test Template"
2. Template loads with setup already wired
3. Edit the 3 certificate fields (request, validate, feedback)
4. Click "Run Test"
5. Setup runs automatically (no special action needed)

**User experience for advanced users:**
1. Open setup phase
2. Edit mock endpoint port if needed
3. Add custom headers or auth
4. Adjust retry logic
5. Run test

---

### 5.2 Teardown Phase (Always Present)

```
┌─ Teardown Phase ───────────────────────────────────┐
│                                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ Export Test Results                        │   │
│ │                                            │   │
│ │ Export to: [results.json ▼]               │   │
│ │ Include: [✓] Step logs                    │   │
│ │          [✓] Request/response bodies      │   │
│ │          [✓] Certificate payload          │   │
│ │          [  ] Performance metrics         │   │
│ │                                            │   │
│ │ ▼ More Options                             │   │
│ │ [✓] Compress to ZIP                       │   │
│ │ Upload to: [Leave blank]                  │   │
│ └────────────────────────────────────────────┘   │
│         ↓                                         │
│ ┌────────────────────────────────────────────┐   │
│ │ Cleanup Mock Endpoints                     │   │
│ │                                            │   │
│ │ [✓] Stop mock CA server                   │   │
│ │ [✓] Stop mock CB server                   │   │
│ │ [✓] Clear temporary data                  │   │
│ │                                            │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 5.3 Service Configuration UI (Test Root)

Before a certificate test can run, services must be configured. This happens **once** in Test Root, then all tests use it.

**Mockup of "Configure Services" dialog:**

```
┌─ Test Root Configuration ──────────────────────────┐
│                                                    │
│  EDC Connector Services                            │
│  ┌────────────────────────────────────────────┐  │
│  │ Consumer Connector                         │  │
│  │ Name: EDC-Consumer-1                       │  │
│  │ URL: http://localhost:8080                 │  │
│  │ API Key: ***hidden***  [Show]              │  │
│  │ [Edit] [Remove]                            │  │
│  │                                            │  │
│  │ Provider Connector                         │  │
│  │ Name: EDC-Provider-1                       │  │
│  │ URL: http://localhost:8090                 │  │
│  │ API Key: ***hidden***  [Show]              │  │
│  │ [Edit] [Remove]                            │  │
│  │                                            │  │
│  │ [+ Add Connector]                          │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  Mock Server Configuration                        │
│  ┌────────────────────────────────────────────┐  │
│  │ Mock Port Range: 9000-9100                 │  │
│  │ [Edit]                                     │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  BPN and Organization IDs                         │
│  ┌────────────────────────────────────────────┐  │
│  │ Consumer BPN: BPN-123                      │  │
│  │ Provider BPN: BPN-456                      │  │
│  │ Your Company ID: ACME-Inc                  │  │
│  │ [Edit]                                     │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│                                 [Cancel] [Save]  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**How it wires to certificate blocks:**

When the user selects "Consumer EDC Service" in a RequestCertificate block:

```
[Consumer EDC Service Dropdown ▼]
    ↓
Shows list of configured services:
  • EDC-Consumer-1 (http://localhost:8080)
  • EDC-Consumer-2 (http://localhost:8091)
    
User clicks "EDC-Consumer-1" → block auto-fills URL from test_root
```

**Result:** Users don't type URLs or API keys — they select from a curated list.

---

## 6. Error Handling and Validation

### Clear, Context-Rich Error Messages

**Scenario: User tries to run SendCertificateFeedback without RequestCertificate:**

```
┌─ Compilation Error ────────────────────────────────┐
│                                                    │
│ ⛔ Step "Send Certificate Feedback" cannot run     │
│                                                    │
│ MISSING PREREQUISITE:                             │
│ This step expects @request_id from a previous     │
│ "Request a Certificate" step, but none was found. │
│                                                    │
│ FIX:                                              │
│ 1. Add a "Request a Certificate" block before     │
│    this step                                      │
│ 2. Or, provide @request_id from another source    │
│                                                    │
│ LOCATION:                                         │
│ Test: certificate_validation_001                  │
│ Step: 7 (Send Certificate Feedback)               │
│ File: certificate_validation_001.yaml             │
│                                                    │
│                      [View in Editor] [Dismiss]  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Scenario: Invalid certificate type selected:**

```
┌─ Validation Error ─────────────────────────────────┐
│                                                    │
│ ⚠️  Unknown certificate type: "CUSTOM_CERT"       │
│                                                    │
│ ALLOWED TYPES:                                    │
│ • ISO 9001 (Quality Management)                   │
│ • IATF 16949 (Automotive)                         │
│ • ISO 14001 (Environmental)                       │
│ • ISO 45001 (Occupational Health)                 │
│ • ISO 13485 (Medical Devices)                     │
│                                                    │
│ LOCATION:                                         │
│ Test: certificate_validation_001                  │
│ Step: 3 (Request a Certificate)                   │
│ Field: Certificate Type                           │
│                                                    │
│                      [Fix] [Learn More]           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Message structure (always includes):**
1. What failed (clear, not technical)
2. Why it failed (context)
3. How to fix it (actionable steps)
4. Where it failed (test name, step #, file)
5. Links (to docs, to editor, etc.)

---

## 7. Verification Checklist

### Can a domain expert create a cert test without developer help?

**✅ YES — Using the template path:**

1. Click "Certificate Management" example on Welcome Screen
2. Choose "Request & Validate Certificate" template
3. Change certificate type (dropdown)
4. Add location BPNs (array input)
5. Click "Run Test"
6. See PASS/FAIL results

**Time estimate: 5 minutes for first test, 2 minutes after.**

---

### Are error messages clear if something fails?

**✅ YES — Every error includes:**
- What broke (simple language)
- Why it broke (domain context)
- How to fix it (step-by-step)
- Where it broke (test + step + file)

Examples in **Section 6** show typical errors and how they're surfaced.

---

### Does visual flow match the logical flow?

**✅ YES — Three mechanisms ensure alignment:**

1. **Block order** — Blocks are stacked top→bottom, matches execution order
2. **Visual warnings** — Out-of-order blocks show ⚠️ icon with explanation
3. **Sequence diagram** — Graph View shows the flow with phases and dependencies

Users see the same flow in three ways:
- Block editor (detailed, editable)
- Sequence diagram (conceptual, read-only)
- YAML output (canonical, debuggable)

---

## 8. Implementation Roadmap

### Phase 1.2.1 (Foundation)
- [ ] Add "Certificate Management" category to `public/blocks/index.json`
- [ ] Create 3 block definitions:
  - `certificate/request_certificate.json`
  - `certificate/send_certificate_feedback.json`
  - `certificate/validate_certificate_payload.json`
- [ ] Add certificate example templates to `public/examples/`

### Phase 1.2.2 (UI Integration)
- [ ] Add "Certificate Management" to toolbox (automatic from index.json)
- [ ] Create template cards on Welcome Screen
- [ ] Implement "Use Template" flow (new test dialog)

### Phase 1.2.3 (Input Simplification)
- [ ] Add "More Options" toggle to block UI component
- [ ] Implement progressive disclosure in block panels
- [ ] Add field descriptions and tooltips

### Phase 1.2.4 (Workflow Sequencing)
- [ ] Add prerequisite metadata to block definitions
- [ ] Implement warning icons for out-of-order blocks
- [ ] Enhance Graph View to show sequence for cert workflows

### Phase 1.2.5 (Setup/Teardown)
- [ ] Create setup and teardown block templates
- [ ] Wire Test Root config to service dropdowns
- [ ] Implement mock server auto-registration

---

## 9. Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Hybrid discovery (blocks + templates)** | Power users get composability; beginners get guided path; both coexist |
| **3–4 essential fields per block** | Reduces cognitive load; advanced users find depth in "More Options" |
| **Auto-linking reuses existing pattern** | No new variables UI; familiar to users of other blocks |
| **Warn but allow out-of-order** | Trusts domain expertise; relies on hard prerequisites for safety |
| **Visible but pre-configured setup** | Transparency (users see what's set up) + simplicity (defaults provided) |
| **Service refs via test_root** | No URL typing; users select from curated list |
| **Sequence diagram in Graph View** | Non-technical visualization of the flow; no new metaphor |
| **Rich error messages with context** | Fail loudly and helpful; non-SDK users can debug independently |

---

## 10. Next Steps (Phase 2)

Once this UX proposal is approved:

1. **Backend team (testlab-master)** designs YAML schema for certificate steps
2. **Test engineer** defines test matrix (happy path, error cases, edge cases)
3. **IDE team (testlab-ide-master)** implements blocks and UI
4. **Docs team** writes user guide with examples

All phases run in parallel where possible.

