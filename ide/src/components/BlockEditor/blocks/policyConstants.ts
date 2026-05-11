/********************************************************************************
 * Eclipse Tractus-X - Tractus-X TestLab
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
// It was reviewed and tested by a human committer.

/**
 * Saturn (CX-0152) ODRL constraint left-operand and operator options.
 * Used by policy blocks — single source of truth for dropdown values.
 */

type DropdownOption = [string, string];

export const SATURN_LEFT_OPERANDS: DropdownOption[] = [
  ["Membership", "Membership"],
  ["BusinessPartnerNumber", "BusinessPartnerNumber"],
  ["FrameworkAgreement", "FrameworkAgreement"],
  ["BusinessPartnerGroup", "BusinessPartnerGroup"],
  ["UsagePurpose", "UsagePurpose"],
  ["ContractReference", "ContractReference"],
  ["AffiliatesRegion", "AffiliatesRegion"],
  ["AffiliatesBpnl", "AffiliatesBpnl"],
  ["DataFrequency", "DataFrequency"],
  ["VersionChanges", "VersionChanges"],
  ["ContractTermination", "ContractTermination"],
  ["ConfidentialInformationMeasures", "ConfidentialInformationMeasures"],
  ["ConfidentialInformationSharing", "ConfidentialInformationSharing"],
  ["ExclusiveUsage", "ExclusiveUsage"],
  ["Warranty", "Warranty"],
  ["WarrantyDurationMonths", "WarrantyDurationMonths"],
  ["WarrantyDefinition", "WarrantyDefinition"],
  ["Liability", "Liability"],
  ["JurisdictionLocation", "JurisdictionLocation"],
  ["JurisdictionLocationReference", "JurisdictionLocationReference"],
  ["Precedence", "Precedence"],
  ["DataUsageEndDate", "DataUsageEndDate"],
  ["DataUsageEndDurationDays", "DataUsageEndDurationDays"],
  ["DataUsageEndDefinition", "DataUsageEndDefinition"],
  ["DataProvisioningEndDate", "DataProvisioningEndDate"],
  ["DataProvisioningEndDurationDays", "DataProvisioningEndDurationDays"],
  ["UsageRestriction", "UsageRestriction"],
  ["custom...", "__CUSTOM__"],
];

export const SATURN_OPERATORS: DropdownOption[] = [
  ["eq", "eq"],
  ["neq", "neq"],
  ["in", "in"],
  ["isAnyOf", "isAnyOf"],
  ["isAllOf", "isAllOf"],
  ["isNoneOf", "isNoneOf"],
  ["isPartOf", "isPartOf"],
];

/** All valid leftOperand values (excluding the __CUSTOM__ sentinel). */
export const KNOWN_LEFT_OPERANDS: readonly string[] = SATURN_LEFT_OPERANDS
  .map(([, value]) => value)
  .filter((v) => v !== "__CUSTOM__");
