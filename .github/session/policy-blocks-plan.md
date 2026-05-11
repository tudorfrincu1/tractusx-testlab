# Policy Blocks & Versioning — Implementation Plan

## CX-0152 Saturn Policy Structure

```
Policy
├── @context: [odrl.jsonld, context.jsonld]
├── @type: "Set"
├── @id: "policy-id"
├── permission[]: Rule (action: "use"|"access")
│   └── constraint[]: AtomicConstraint | LogicalConstraint
├── prohibition[]: Rule (action: "use") — Usage only
│   └── constraint[]: AtomicConstraint | LogicalConstraint
└── obligation[]: Rule (action: "use") — Usage only
    └── constraint[]: AtomicConstraint | LogicalConstraint

AtomicConstraint = { leftOperand, operator, rightOperand }
LogicalConstraint = { and: [...] } or { or: [...] }
```

## Saturn Atomic Constraint Types (leftOperand)

### Access Permission:
- Membership (eq, "active")
- BusinessPartnerNumber (isAnyOf/isNoneOf, BPNL[])
- FrameworkAgreement (eq, "DataExchangeGovernance:1.0")
- BusinessPartnerGroup (isAnyOf, string[])

### Usage Permission (all of above plus):
- UsagePurpose (isAnyOf, string[])
- ContractReference (isAllOf, string[])
- AffiliatesRegion (isAnyOf, string[])
- AffiliatesBpnl (isAnyOf, BPNL[])
- DataFrequency (eq, string)
- VersionChanges (eq, string)
- ContractTermination (eq, string)
- ConfidentialInformationMeasures (eq, string)
- ConfidentialInformationSharing (isAnyOf, string[])
- ExclusiveUsage (eq, string)
- Warranty (eq, string)
- WarrantyDurationMonths (eq, string)
- WarrantyDefinition (eq, string)
- Liability (eq, string)
- JurisdictionLocation (isAnyOf, string[])
- JurisdictionLocationReference (eq, string)
- Precedence (eq, string)
- DataUsageEndDate (eq, datetime)
- DataUsageEndDurationDays (eq, number)
- DataUsageEndDefinition (eq, string)

### Prohibition:
- UsageRestriction (isAllOf, string[])
- AffiliatesRegion (isAnyOf, string[])
- AffiliatesBpnl (isAnyOf, BPNL[])

### Obligation:
- DataProvisioningEndDate (eq, datetime)
- DataProvisioningEndDurationDays (eq, number)

## Blockly Block Design

### New/Modified Blocks:
1. `odrl_permission` (UPDATE) — action: use|access, constraints statement input
2. `odrl_prohibition` (NEW) — action: use, constraints statement input
3. `odrl_obligation` (NEW) — action: use, constraints statement input
4. `odrl_logical_constraint` (NEW) — operator: and|or, nested constraints input
5. `odrl_constraint` (UPDATE) — expanded leftOperand options, Saturn operators

### Type System:
- All rule blocks (permission/prohibition/obligation) accept `"odrl_constraint_item"` in constraints
- Both `odrl_constraint` and `odrl_logical_constraint` have type `"odrl_constraint_item"`
- `odrl_logical_constraint` also accepts `"odrl_constraint_item"` (recursive nesting)

## Versioning System

### Approach:
- Add `dataspace_versions?: string[]` to block catalog category type
- Map service types to versions: edc_connector_saturn→saturn, edc_connector_jupiter→jupiter
- If omitted, block works with all versions
- Toolbox filters structural blocks based on declared service versions

### Service → Version Mapping:
```typescript
const SERVICE_TO_VERSION: Record<string, string> = {
  edc_connector_saturn: "saturn",
  edc_connector_jupiter: "jupiter",
};
```
