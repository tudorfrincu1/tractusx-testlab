# Certificate Management — Documentation

For documentation on the Certificate Management (CX-0135) test suite, see the audience-specific guides:

- **[Business Guide](ccm-business-guide.md)** — For product managers, certification officers, and business stakeholders
- **[Developer Guide](ccm-developer-guide.md)** — For developers running and debugging tests
- **[Architecture Guide](ccm-architecture-guide.md)** — For architects designing test suites and integrations

For the detailed test reference, see [CCM Conformity Testing](ccm-conformity-testing.md).

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

