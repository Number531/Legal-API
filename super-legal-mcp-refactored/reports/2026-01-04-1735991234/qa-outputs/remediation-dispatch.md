# REMEDIATION DISPATCH

**Diagnostic ID**: 2026-01-04-1735991234-diagnostic-001
**Diagnostic Score**: 87.3%
**Remediation Tier**: TIER_2_STANDARD
**Total Issues Found**: 22
**Issues In Scope**: 15 (CRITICAL + HIGH + MEDIUM)
**Issues Deferred**: 7 (LOW)
**Estimated Duration**: 230 minutes (3.8 hours with parallel optimization)
**Max Cycles**: 2
**Current Cycle**: 1

---

## EXECUTION METADATA

```json
{
  "session_id": "2026-01-04-1735991234",
  "diagnostic_file": "qa-outputs/diagnostic-assessment.md",
  "remediation_plan": "qa-outputs/remediation-plan.md",
  "source_document": "final-memorandum.md",
  "target_document": "final-memorandum-v2.md",
  "remediation_tier": "TIER_2_STANDARD",
  "baseline_score": 87.3,
  "target_score": 93.0,
  "minimum_acceptable_score": 92.0,
  "max_cycles": 2,
  "current_cycle": 1,
  "parallel_execution_enabled": true
}
```

---

## WAVE 1: Section Integration & Assembly
**Status**: READY
**Parallel**: NO (sequential, critical path)
**Gate**: none
**Dependencies**: none
**Estimated Duration**: 45 minutes

### Critical Path Dependency

⚠️ **WAVE 1 MUST COMPLETE BEFORE DOWNSTREAM WAVES** ⚠️

If sections IV.A-IV.J do not exist, ESCALATE to human immediately. Do not proceed to Wave 2.

---

### TASK W1-001: Investigate and Integrate Missing Sections

```json
{
  "task_id": "W1-001",
  "wave": 1,
  "agent": "final-assembly subagent",
  "priority": "CRITICAL",
  "estimated_minutes": 30,
  "issue_id": "CREAC-001",
  "dimension": "CREAC Structure",
  "severity": "CRITICAL",

  "description": "Investigate missing Sections IV.A through IV.J referenced in Table of Contents (lines 26-36) but absent after line 660. Check section-reports/ directory for 10 section files. If exist, integrate into final-memorandum-v2.md. If not exist, ESCALATE to human.",

  "input": {
    "source_directory": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/section-reports/",
    "target_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum.md",
    "expected_sections": [
      "section-IV-A-regulatory-rate-cases.md",
      "section-IV-B-environmental-compliance.md",
      "section-IV-C-pfas-litigation-water-rights.md",
      "section-IV-D-cfius-national-security.md",
      "section-IV-E-insurance-coverage.md",
      "section-IV-F-securities-corporate-structure.md",
      "section-IV-G-commercial-contracts-infrastructure.md",
      "section-IV-H-employment-labor-relations.md",
      "section-IV-I-tax-structure-optimization.md",
      "section-IV-J-financial-aggregation-deal-structure.md"
    ],
    "insertion_point": "after_line_660",
    "preserve_footnote_numbering": true,
    "footnote_range": "1-960"
  },

  "action_steps": [
    "1. Check if section-reports/ directory exists",
    "2. List all files in section-reports/ directory",
    "3. Verify all 10 expected section files present",
    "4. If ALL files present: Read each section file and insert into final-memorandum-v2.md after line 660 in order (IV.A → IV.J)",
    "5. If ANY file missing: ESCALATE to human with file list and status",
    "6. Verify global footnote numbering remains 1-960 sequential after integration",
    "7. Update Table of Contents page numbers if necessary"
  ],

  "success_criteria": "All 10 sections (IV.A through IV.J) present in final-memorandum-v2.md with intact footnote numbering 1-960",

  "escalation_trigger": {
    "condition": "sections_not_found OR integration_error",
    "action": "HALT_PIPELINE",
    "message": "CRITICAL: Sections IV.A-IV.J not found in section-reports/ directory. Human decision required: (A) Generate missing sections, (B) Accept executive-summary-only scope, or (C) Investigate alternate file locations."
  },

  "output_file": "remediation-outputs/W1-001-section-integration-report.md"
}
```

---

### TASK W1-002: Verify Cross-Reference Resolution

```json
{
  "task_id": "W1-002",
  "wave": 1,
  "agent": "final-assembly subagent",
  "priority": "HIGH",
  "estimated_minutes": 15,
  "issue_id": "XREF-001",
  "dimension": "Cross-Reference Integration",
  "severity": "HIGH",

  "description": "Verify all 47 cross-references to Sections IV.A-IV.J resolve correctly after section integration. Identify any broken references or missing target sections.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "cross_reference_patterns": [
      "See Section IV\\.[A-J]",
      "See \\*\\*Section IV\\.[A-J]",
      "Section IV\\.[A-J] Section [A-Z]\\.\\d+",
      "\\(see Section IV\\.[A-J]\\)"
    ],
    "total_expected_references": 47
  },

  "action_steps": [
    "1. Search final-memorandum-v2.md for all cross-reference patterns",
    "2. For each cross-reference, verify target section exists",
    "3. For sub-section references (e.g., 'Section IV.B Section B.1'), verify subsection exists",
    "4. Generate report of: (a) Total cross-references found, (b) Valid references, (c) Broken references",
    "5. If any broken references found, attempt to identify correct target section"
  ],

  "success_criteria": "All 47 cross-references resolve to existing sections; zero broken references",

  "output_file": "remediation-outputs/W1-002-cross-reference-validation-report.md"
}
```

---

## WAVE 2: Executive Summary Condensing
**Status**: BLOCKED (awaits Wave 1 completion)
**Parallel**: YES (can run concurrently with Wave 3)
**Gate**: WAVE 1 must complete successfully
**Dependencies**: Requires Sections IV.A-IV.J present
**Estimated Duration**: 65 minutes

---

### TASK W2-001: Condense Cross-Domain Impact Analysis

```json
{
  "task_id": "W2-001",
  "wave": 2,
  "agent": "memo-executive-summary-writer",
  "priority": "HIGH",
  "estimated_minutes": 20,
  "issue_id": "ES-001, ES-002",
  "dimension": "Executive Summary Effectiveness",
  "severity": "HIGH",

  "description": "Condense Cross-Domain Impact Analysis section (lines 385-436) from 1,200 words to 300 words. Replace detailed analysis with summary statements + cross-references to detailed sections.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Lines 385-436 (Section IV: Cross-Domain Impact Analysis)",
    "current_word_count": 1200,
    "target_word_count": 300,
    "sections_to_condense": [
      "A. Environmental/Regulatory Capital Cluster",
      "B. PFAS Liability Chain",
      "C. Transaction Approval Cluster",
      "D. Labor Risk Cascade"
    ]
  },

  "condensing_strategy": {
    "approach": "summary_plus_cross_reference",
    "example_transformation": {
      "before": "These three exposures share correlation coefficient of 0.65 because all depend on Colorado PUC interpretation of 'used and useful' and 'prudent investment' standards under C.R.S. Section 40-3-101. [12 sentences of detailed analysis follow...]",
      "after": "Lead service line cost allocation, PFAS treatment timing, and infrastructure backlog share 0.65 correlation coefficient due to common CPUC prudent investment standard (C.R.S. § 40-3-101). Strict prudence interpretation for lead lines increases infrastructure disallowance probability from 60% to 80%. See Section IV.B for detailed environmental/regulatory cluster analysis."
    }
  },

  "action_steps": [
    "1. Read current Cross-Domain Impact Analysis section (lines 385-436)",
    "2. For each subsection (A-D), extract: (a) Primary finding/correlation, (b) Key numeric impact, (c) Target section reference",
    "3. Rewrite each subsection in 2-3 sentences using summary + cross-reference pattern",
    "4. Verify total word count ≤300 words",
    "5. Verify all cross-references point to existing sections"
  ],

  "success_criteria": "Cross-Domain Impact Analysis ≤300 words (75% reduction from 1,200 words); all key findings retained with section cross-references",

  "output_file": "remediation-outputs/W2-001-cross-domain-condensed.md"
}
```

---

### TASK W2-002: Condense Negotiation Position Summary

```json
{
  "task_id": "W2-002",
  "wave": 2,
  "agent": "memo-executive-summary-writer",
  "priority": "HIGH",
  "estimated_minutes": 15,
  "issue_id": "ES-001",
  "dimension": "Executive Summary Effectiveness",
  "severity": "HIGH",

  "description": "Condense Negotiation Position Summary (lines 439-468) from 800 words to 200 words. Retain Opening/Target/Walk-Away table; move Key Leverage Points and Anticipated Counter-Party Positions to new Appendix D.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Lines 439-468 (Section V: Negotiation Position Summary)",
    "current_word_count": 800,
    "target_word_count": 200,
    "content_to_retain": "Opening/Target/Walk-Away table (lines 441-449)",
    "content_to_move": [
      "Key Leverage Points (lines 451-458)",
      "Anticipated Counter-Party Positions (lines 460-468)"
    ]
  },

  "action_steps": [
    "1. Create new 'Appendix D: Negotiation Strategy Detail' with Key Leverage Points and Counter-Party Positions content",
    "2. Rewrite Section V to: (a) 1-sentence introduction, (b) Opening/Target/Walk-Away table, (c) 1-sentence cross-reference to Appendix D",
    "3. Verify word count ≤200 words (excluding table)",
    "4. Update document cross-references to Appendix D"
  ],

  "success_criteria": "Section V ≤200 words (plus table); Appendix D created with detailed negotiation content; cross-references functional",

  "output_file": "remediation-outputs/W2-002-negotiation-condensed.md"
}
```

---

### TASK W2-003: Condense Recommended Actions

```json
{
  "task_id": "W2-003",
  "wave": 2,
  "agent": "memo-executive-summary-writer",
  "priority": "HIGH",
  "estimated_minutes": 20,
  "issue_id": "ES-001",
  "dimension": "Executive Summary Effectiveness",
  "severity": "HIGH",

  "description": "Condense Recommended Actions (lines 493-528) from 1,000 words to 300 words. Convert detailed action tables to summary list; move full detail to new Appendix E.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Lines 493-528 (Section VII: Prioritized Recommended Actions)",
    "current_word_count": 1000,
    "target_word_count": 300,
    "action_categories": [
      "Immediate (0-30 Days) - 4 actions",
      "Pre-Signing (30-90 Days) - 4 actions",
      "Pre-Closing - 3 actions",
      "Post-Closing Integration - 3 actions"
    ]
  },

  "action_steps": [
    "1. Create new 'Appendix E: Detailed Action Plan' with full action tables from lines 493-528",
    "2. Rewrite Section VII to summarize: (a) Top 3 immediate priorities (by Day 30), (b) Key pre-signing actions, (c) Cross-reference to Appendix E for complete timeline",
    "3. Retain Day 30 deadline for Section 338(h)(10) verification (deal-critical)",
    "4. Verify word count ≤300 words"
  ],

  "success_criteria": "Section VII ≤300 words; Appendix E created with detailed 14-action plan; Day 30 verification highlighted",

  "output_file": "remediation-outputs/W2-003-actions-condensed.md"
}
```

---

### TASK W2-004: Tighten BLUF

```json
{
  "task_id": "W2-004",
  "wave": 2,
  "agent": "memo-executive-summary-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "BLUF-001",
  "dimension": "BLUF Quality",
  "severity": "LOW (but included in TIER 2 scope)",

  "description": "Tighten BLUF (lines 268-270) from 119 words to ≤100 words while retaining: (1) PROCEED WITH CONDITIONS recommendation, (2) Five mandatory conditions, (3) Net buyer risk quantification, (4) Next action.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Lines 268-270 (BLUF)",
    "current_word_count": 119,
    "target_word_count": 100,
    "required_elements": [
      "Recommendation: PROCEED WITH CONDITIONS",
      "Five conditions: escrow, price reduction, CPUC Scenario B, § 338(h)(10) verification, insurance DJ",
      "Net buyer risk: $48M (2.0%)",
      "Next action: verify seller Section 338(h)(10) eligibility within 30 days"
    ]
  },

  "proposed_revision": "The $2.4B acquisition is viable with five mandatory conditions: (1) $350M-$450M escrow, (2) $200M-$300M price reduction, (3) CPUC Scenario B pre-approval, (4) Section 338(h)(10) verification, and (5) insurance declaratory relief. Combined protections reduce net buyer risk from $448.1M (18.7%) to $48M (2.0%). Verify seller Section 338(h)(10) eligibility within 30 days. [66 words]",

  "action_steps": [
    "1. Read current BLUF (lines 268-270)",
    "2. Apply proposed revision or improve further",
    "3. Verify all 4 required elements present",
    "4. Verify word count ≤100 words",
    "5. Verify remains 3 sentences"
  ],

  "success_criteria": "BLUF ≤100 words, 3 sentences, all required elements present",

  "output_file": "remediation-outputs/W2-004-BLUF-tightened.md"
}
```

---

## WAVE 3: Legal Analysis Enhancements
**Status**: BLOCKED (awaits Wave 1 completion)
**Parallel**: YES (can run concurrently with Wave 2)
**Gate**: WAVE 1 must complete successfully
**Dependencies**: Requires Section IV.I (Tax) present
**Estimated Duration**: 40 minutes

---

### TASK W3-001: Add Section 338(h)(10) Eligibility Analysis

```json
{
  "task_id": "W3-001",
  "wave": 3,
  "agent": "tax-structure-analyst",
  "priority": "HIGH",
  "estimated_minutes": 25,
  "issue_id": "LEG-001",
  "dimension": "Legal Sophistication",
  "severity": "HIGH",

  "description": "Add comprehensive Section 338(h)(10) eligibility analysis to Section IV.I (Tax Structure). Analysis must address: (1) Statutory requirements, (2) C-corp consolidated group membership requirement, (3) Probability estimate basis, (4) § 336(e) alternative.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Section IV.I (Tax Structure & Optimization)",
    "current_content": "Lines 221-229 (Question 11), Line 308 (Brief Answer Q11)",
    "missing_elements": [
      "IRC § 338(h)(10) statutory citation",
      "Treas. Reg. § 1.338(h)(10)-1(c) eligibility requirements",
      "Explanation of C-corp consolidated group requirement",
      "Basis for 70% probability estimate",
      "§ 336(e) alternative discussion"
    ]
  },

  "required_analysis_structure": {
    "paragraph_1": "Section 338(h)(10) Election Mechanics: Cite IRC § 338(h)(10), explain deemed asset sale treatment, reference Treas. Reg. § 1.338(h)(10)-1(c) eligibility requirements (target must be member of consolidated group or S-corporation).",
    "paragraph_2": "Delaware C-Corporation Eligibility: Explain why standalone Delaware C-corp is ineligible; requires seller to be member of consolidated group filing Form 1120. Probability estimate: 70% based on typical PE ownership structure where portfolio companies consolidated into fund-level returns.",
    "paragraph_3": "Verification Requirements: Days 1-30 critical verification: obtain seller Form 1122 (authorization for consolidated group election) or confirm consolidated return filing. If ineligible, § 336(e) alternative available but requires target/seller joint election (less certain).",
    "paragraph_4": "Deal Impact: If eligible, buyer obtains $148M-$198M NPV benefit. If ineligible, recommend $100M-$150M purchase price reduction to offset foregone benefit."
  },

  "action_steps": [
    "1. Locate Section IV.I in final-memorandum-v2.md",
    "2. Find subsection discussing Section 338(h)(10) (likely Section B or C)",
    "3. Add 4-paragraph eligibility analysis using required structure above",
    "4. Add footnotes citing: IRC § 338(h)(10), Treas. Reg. § 1.338(h)(10)-1(c), Treas. Reg. § 1.336-2 (for § 336(e) alternative)",
    "5. Cross-reference to Question 11 and Brief Answer Q11",
    "6. Add [VERIFIED:legal] tag to statutory citations"
  ],

  "success_criteria": "Section IV.I includes 3-4 paragraph eligibility analysis with Treasury Regulation citations; probability estimate basis disclosed; § 336(e) alternative addressed",

  "output_file": "remediation-outputs/W3-001-tax-eligibility-analysis.md"
}
```

---

### TASK W3-002: Define CPUC Public Interest Standard

```json
{
  "task_id": "W3-002",
  "wave": 3,
  "agent": "regulatory-rulemaking-analyst",
  "priority": "MEDIUM",
  "estimated_minutes": 15,
  "issue_id": "LEG-002",
  "dimension": "Legal Sophistication",
  "severity": "MEDIUM",

  "description": "Add definition of CPUC 'public interest' standard with 5-factor test to Question 1 and Section IV.A. Currently standard mentioned but elements not defined.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_locations": [
      "Question 1 (lines 57-67)",
      "Section IV.A (Regulatory Approval & Rate Cases)"
    ],
    "current_reference": "Colorado PUC applies 'public interest' standard (C.R.S. § 40-5-101) but elements not defined"
  },

  "required_definition": {
    "statutory_cite": "C.R.S. § 40-5-101(2)",
    "factors": [
      "(1) Benefit to ratepayers (rate stability, service quality improvements)",
      "(2) Acquirer financial fitness (ability to fund utility operations and capital investments)",
      "(3) Service quality maintenance (no degradation of reliability, safety, or customer service)",
      "(4) Rate stability (commitment to rate freeze period, customer credits for approval costs)",
      "(5) Colorado economic impact (local job retention, community investment commitments)"
    ],
    "application_to_transaction": "AWI meets factors 1-5: (1) proposes 3-year rate freeze, (2) $12B PE backing demonstrates financial fitness, (3) commits to maintain service levels, (4) offers $15M-$30M customer credits, (5) commits to Denver HQ and Colorado management retention."
  },

  "action_steps": [
    "1. Locate Question 1 (lines 57-67) and add public interest definition after 'public interest standard' reference",
    "2. Locate Section IV.A introduction and add 1-paragraph public interest standard definition",
    "3. Format as: 'Colorado PUC applies five-factor public interest test under C.R.S. § 40-5-101(2): (1) ratepayer benefit, (2) acquirer financial fitness, (3) service quality, (4) rate stability, and (5) economic impact.'",
    "4. Add footnote citing C.R.S. § 40-5-101(2) and CPUC precedent decisions (if available in research)",
    "5. In Section IV.A, apply factors to AWI transaction"
  ],

  "success_criteria": "Public interest standard defined with 5 factors and statutory citation in Question 1 and Section IV.A; factors applied to transaction",

  "output_file": "remediation-outputs/W3-002-public-interest-definition.md"
}
```

---

## WAVE 4: Content Additions & Enhancements
**Status**: BLOCKED (awaits Waves 2 & 3 completion)
**Parallel**: YES
**Gate**: WAVES 2 and 3 must complete
**Dependencies**: Requires condensed executive summary and enhanced legal analysis
**Estimated Duration**: 65 minutes

---

### TASK W4-001: Create Draft Contract Provisions Appendix

```json
{
  "task_id": "W4-001",
  "wave": 4,
  "agent": "memo-remediation-writer",
  "priority": "HIGH",
  "estimated_minutes": 30,
  "issue_id": "REC-001",
  "dimension": "Recommendations & Actionability",
  "severity": "HIGH",

  "description": "Create new 'Appendix C: Draft Transaction Agreement Provisions' with 5 draft contract clauses for key transaction protections identified in memorandum.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "insertion_point": "after Appendix B (Consolidated Footnotes)",
    "provisions_required": [
      "Lead Service Line Cost Allocation Indemnity",
      "Section 338(h)(10) Price Adjustment Mechanism",
      "PFAS Litigation Escrow Release Conditions",
      "CPUC Approval Condition with Buyer Termination Rights",
      "Water Rights Curtailment MAC Trigger"
    ]
  },

  "draft_provisions": {
    "provision_1": {
      "title": "Section [X]: Lead Service Line Cost Allocation Indemnity",
      "draft_language": "If the Colorado Public Utilities Commission issues a final order in Docket No. [XXXX] (MSWC 2026 Rate Case) requiring the Company to fund customer-side lead service line replacement costs in excess of the Scenario B Allocation (as defined in Schedule [X]), and such order becomes final and non-appealable prior to [Closing Date + 24 months], Seller shall pay to Buyer, within thirty (30) days of such final order, an amount equal to the net present value of the disallowed costs calculated at [8]% discount rate, provided that Seller's maximum liability under this Section [X] shall not exceed [Four Hundred Million Dollars ($400,000,000)].",
      "bracketed_terms": ["Section number", "Docket number", "Schedule reference", "Discount rate", "Cap amount"]
    },
    "provision_2": {
      "title": "Section [Y]: Purchase Price Adjustment for Section 338(h)(10) Ineligibility",
      "draft_language": "Seller represents and warrants that, as of the Closing Date, Target is a member of Seller's consolidated group for federal income tax purposes and that Seller will join with Buyer in making a timely election under Section 338(h)(10) of the Internal Revenue Code. If, within thirty (30) days following the Agreement Date, Seller determines that Target is not eligible for such election, the Purchase Price shall be reduced by [One Hundred Twenty-Five Million Dollars ($125,000,000)], representing Buyer's reasonable estimate of the foregone tax benefit. Seller shall provide to Buyer, within fifteen (15) days of the Agreement Date, evidence of Target's consolidated group membership, including copies of IRS Form 1122 for the three (3) most recent tax years.",
      "bracketed_terms": ["Section number", "Price reduction amount"]
    },
    "provision_3": {
      "title": "Section [Z]: PFAS Class Action Escrow Release",
      "draft_language": "Buyer and Seller shall establish an escrow (the 'PFAS Escrow') funded by Seller at Closing in the amount of [One Hundred Million Dollars ($100,000,000)]. The PFAS Escrow shall be released to Buyer upon the earliest to occur of: (i) entry of a final settlement or judgment in Customers v. Mountain States Water Company, Case No. [XXXX], Denver District Court, requiring payment by the Company in excess of [Fifty Million Dollars ($50,000,000)], or (ii) [18 months] after Closing if the case remains pending and unresolved. The PFAS Escrow shall be released to Seller if: (a) the case is dismissed with prejudice, or (b) final settlement or judgment requires payment of less than [Fifty Million Dollars ($50,000,000)] and Zurich American Insurance Company does not disclaim coverage under Policy No. [XXXX].",
      "bracketed_terms": ["Section number", "Escrow amount", "Case number", "Settlement threshold", "Release period", "Policy number"]
    },
    "provision_4": {
      "title": "Section [A]: CPUC Approval Condition",
      "draft_language": "The obligations of Buyer to consummate the transactions contemplated hereby are conditioned upon receipt of approval from the Colorado Public Utilities Commission pursuant to C.R.S. § 40-5-101, provided that such approval: (i) does not impose a rate freeze exceeding [three (3) years] from Closing, (ii) does not require customer credits exceeding [Thirty Million Dollars ($30,000,000)], and (iii) does not impose dividend restrictions preventing Buyer from receiving distributions necessary to service acquisition debt. Buyer may waive this condition in its sole discretion. If CPUC approval is not obtained within [fourteen (14) months] of the Application Date, either party may terminate this Agreement upon written notice, and all deposit amounts shall be returned to Buyer.",
      "bracketed_terms": ["Section number", "Rate freeze period", "Customer credit cap", "Approval timeline"]
    },
    "provision_5": {
      "title": "Section [B]: Water Rights Curtailment Material Adverse Effect",
      "draft_language": "For purposes of this Agreement, a 'Water Rights Material Adverse Effect' shall be deemed to have occurred if the Colorado Division of Water Resources or any court of competent jurisdiction issues an order or decree, prior to Closing, that: (i) curtails the Company's Colorado River water rights by more than [twenty percent (20%)] of the Baseline Amount (as defined in Schedule [Y]), or (ii) requires the Company to make supplemental water purchases exceeding [Seven Million Dollars ($7,000,000)] per year on a sustained basis. Upon the occurrence of a Water Rights Material Adverse Effect, Buyer may elect to either: (a) terminate this Agreement with return of all deposits, or (b) proceed to Closing with a Purchase Price reduction equal to the net present value of such excess curtailment or purchase costs, calculated at [8]% discount rate over a [perpetual] period.",
      "bracketed_terms": ["Section number", "Curtailment threshold", "Schedule reference", "Annual cost threshold", "Discount rate"]
    }
  },

  "action_steps": [
    "1. Create new section 'Appendix C: Draft Transaction Agreement Provisions' in final-memorandum-v2.md",
    "2. Add introductory paragraph: 'The following draft provisions address key transaction risks identified in this memorandum. Bracketed terms require negotiation and finalization. Provisions are illustrative and require review by transaction counsel.'",
    "3. Add all 5 provisions with draft language above",
    "4. Add footer: 'Note: These provisions are drafts only and have not been reviewed by Delaware corporate counsel or transaction specialists. Final language must be negotiated with Seller and reviewed by all relevant practice groups.'",
    "5. Add cross-reference from Executive Summary Section V (Negotiation Position) to Appendix C"
  ],

  "success_criteria": "Appendix C created with 5 draft provisions; bracketed terms identified; cross-reference added from Executive Summary",

  "output_file": "remediation-outputs/W4-001-draft-contract-provisions.md"
}
```

---

### TASK W4-002: Add Limitations Section to Executive Summary

```json
{
  "task_id": "W4-002",
  "wave": 4,
  "agent": "memo-executive-summary-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 15,
  "issue_id": "LIM-001",
  "dimension": "Limitations Transparency",
  "severity": "MEDIUM",

  "description": "Add new 'Section X: Limitations and Assumptions' to Executive Summary before Decision Required section (line 532). Disclose data gaps, reliance on Target representations, and conditions requiring analysis update.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "insertion_point": "before line 532 (Decision Required section)",
    "target_word_count": "200-300 words"
  },

  "required_content": {
    "subsection_1_data_gaps": [
      "Actual CPUC certificates (45 CPCNs) not reviewed; verification required in data room Days 1-15",
      "Insurance policy full text not provided; pollution exclusion language requires verification",
      "Water rights decrees (priority dates, quantities) require confirmation with Colorado Division of Water Resources",
      "MSWC certificate of incorporation and bylaws not reviewed; change of control provisions require verification",
      "Collective bargaining agreements (if any) not disclosed; union status requires Day 1-7 verification"
    ],
    "subsection_2_assumptions": [
      "Analysis assumes accuracy of Target-provided financial data ($680M revenue, $195M EBITDA, $1.9B rate base)",
      "Customer count (485,000 connections, 1.35M people served) assumes Target data accuracy",
      "Lead service line count (148,000 lines) based on Target inventory; EPA LCRR requires independent verification",
      "PFAS detections (8 systems, 5-22 ppt) based on Target sampling data; independent verification recommended"
    ],
    "subsection_3_update_triggers": [
      "EPA PFAS MCL finalized at level other than 4 ppt (analysis assumes 4 ppt for PFOA/PFOS)",
      "CPUC 2026 rate case decided pre-closing (analysis assumes post-closing decision)",
      "Section 338(h)(10) seller eligibility verified as negative (analysis assumes 70% probability)",
      "Colorado River curtailment exceeds 20% (analysis assumes 10% current curtailment stable)",
      "PFAS class action trial scheduled before closing with adverse preliminary rulings"
    ]
  },

  "action_steps": [
    "1. Create new section 'Section X: Limitations and Assumptions' before line 532",
    "2. Add 3-paragraph structure: (1) Data Gaps Requiring Verification, (2) Key Assumptions, (3) Conditions Requiring Analysis Update",
    "3. List data gaps from subsection_1 above (5 items in bullet format)",
    "4. List assumptions from subsection_2 above (4 items in bullet format)",
    "5. List update triggers from subsection_3 above (5 items in bullet format)",
    "6. Add disclaimer: 'This analysis is based on information available as of January 4, 2026. Material changes to regulatory timelines, litigation status, or Target financial condition may require updated analysis.'",
    "7. Verify total word count 200-300 words"
  ],

  "success_criteria": "Limitations section added with 200-300 words covering data gaps, assumptions, and update triggers; positioned before Decision Required section",

  "output_file": "remediation-outputs/W4-002-limitations-section.md"
}
```

---

### TASK W4-003: Revise Brief Answers to Lead with Legal Rules

```json
{
  "task_id": "W4-003",
  "wave": 4,
  "agent": "memo-executive-summary-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "CREAC-003",
  "dimension": "CREAC Structure",
  "severity": "MEDIUM",

  "description": "Revise Brief Answers (lines 296-309) to lead with controlling legal rule before stating facts. Apply 'Yes/No, because [rule], when [facts]' structure to all 12 answers.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Lines 296-309 (Brief Answers table)",
    "answers_requiring_revision": [
      "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q8", "Q9", "Q10", "Q11"
    ]
  },

  "example_revisions": {
    "Q1_current": "MSWC holds 45 CPCNs serving 1.35M people; transfer of control requires CPUC approval with 70-75% probability of approval with conditions",
    "Q1_revised": "Yes, because C.R.S. § 40-5-101 requires CPUC approval for transfer of control of public utilities holding certificates of public convenience and necessity, and MSWC holds 45 such certificates serving 1.35M people. Approval probability: 70-75% with standard conditions (3-year rate freeze, $22.5M customer credits).",
    "Q3_current": "EPA LCRR mandates 100% replacement within 10 years (by 2034). Customer-side cost allocation creates $78M-$918M exposure depending on CPUC Scenario A vs. B determination.",
    "Q3_revised": "Yes, because EPA LCRR (40 CFR § 141.84) mandates 100% lead service line replacement within 10 years, and MSWC has 148,000 lead lines requiring replacement by 2034. Customer-side cost allocation (CPUC discretion under C.R.S. § 40-3-101) creates $78M-$918M exposure depending on Scenario A vs. B determination. Base Case (Scenario B): $128M."
  },

  "action_steps": [
    "1. Read current Brief Answers table (lines 296-309)",
    "2. For each of 12 answers, identify: (a) Current answer, (b) Controlling legal rule/statute, (c) Key facts",
    "3. Rewrite each answer in format: '[Yes/No/Probably Yes/Probably No], because [cite rule/statute stating legal standard], when/and [apply facts to standard]. [Additional detail: exposure/probability/timeline].'",
    "4. Verify all 12 answers follow consistent structure",
    "5. Verify answers remain concise (2-4 sentences per answer)"
  ],

  "success_criteria": "All 12 Brief Answers follow 'Answer, because [rule], when [facts]' structure; controlling legal authority cited in each answer",

  "output_file": "remediation-outputs/W4-003-brief-answers-revised.md"
}
```

---

### TASK W4-004: Add Counter-Analysis Column to Critical Issues Matrix

```json
{
  "task_id": "W4-004",
  "wave": 4,
  "agent": "memo-executive-summary-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "CREAC-004",
  "dimension": "CREAC Structure",
  "severity": "MEDIUM",

  "description": "Add 'Counter-Analysis' column to Critical Issues Matrix (lines 366-379) showing adverse authority or counter-arguments considered for each HIGH/CRITICAL finding.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Lines 366-379 (Section III: Critical Issues Matrix)",
    "current_columns": ["Rank", "Issue", "Severity", "Exposure", "Probability", "Section"],
    "new_column": "Counter-Analysis"
  },

  "counter_analysis_entries": {
    "finding_1_lead_lines": "Target may argue San Jose Water (CA 2017) precedent allowing 70% customer-side cost recovery; CPUC may adopt hybrid Scenario B (60-70% recovery)",
    "finding_2_pfas_litigation": "Defenses available: no EPA regulation pre-2025, third-party contamination sources, treatment planned; motion to dismiss probability 15-20%",
    "finding_3_pfas_treatment": "EPA compliance deadline 2028-2029 allows phased installation; late investment risk mitigated if 2026 appropriation approved",
    "finding_4_infrastructure": "Target may argue break rates within industry norms; deferred maintenance strategic given rate case timing",
    "finding_5_cpuc_conditions": "CPUC precedents show 85-95% approval rate for IOU acquisitions; conditions negotiable in settlement",
    "finding_6_water_rights": "Supplemental water costs may be passed through to customers via PWA clause; curtailment litigation has 20-30% success probability",
    "finding_7_insurance": "Colorado courts split on PFAS as 'pollutant'; bad faith statute (C.R.S. § 10-3-1115) provides 2x policy limits if wrongful denial"
  },

  "action_steps": [
    "1. Locate Critical Issues Matrix table (lines 366-379)",
    "2. Add new column 'Counter-Analysis' after 'Probability' column",
    "3. For each of top 7 HIGH/CRITICAL findings (ranks 1-7), add 1-sentence counter-analysis from entries above",
    "4. For MEDIUM/LOW findings (ranks 8-12), add brief counter-analysis or 'N/A' if not material",
    "5. Adjust table formatting to accommodate new column (may require wider layout)",
    "6. Verify counter-analysis entries cite adverse authority or defense where applicable"
  ],

  "success_criteria": "Critical Issues Matrix includes Counter-Analysis column with 1-sentence entry for all HIGH/CRITICAL findings (7 entries minimum)",

  "output_file": "remediation-outputs/W4-004-critical-issues-matrix-enhanced.md"
}
```

---

## WAVE 5: Database Provenance & Cross-References
**Status**: BLOCKED (awaits Wave 4 completion)
**Parallel**: YES
**Gate**: WAVE 4 must complete
**Dependencies**: Requires all sections present and content additions complete
**Estimated Duration**: 45 minutes

---

### TASK W5-001: Add EPA PWS IDs for PFAS Systems

```json
{
  "task_id": "W5-001",
  "wave": 5,
  "agent": "environmental-compliance-analyst",
  "priority": "MEDIUM",
  "estimated_minutes": 20,
  "issue_id": "PROV-001",
  "dimension": "Database Provenance",
  "severity": "MEDIUM",

  "description": "Add EPA Public Water System IDs (PWS IDs) for 8 PFAS-contaminated systems and 5 lead action level exceedance systems in Question 4 and Section IV.B. Format: 'EPA PWS ID CO-XXXXXXX' for 30-second verification.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_locations": [
      "Question 4 (lines 101-112)",
      "Section IV.B (Environmental Compliance)"
    ],
    "systems_requiring_ids": {
      "pfas_systems": "8 systems with 5-22 ppt PFOA/PFOS detections",
      "lead_systems": "5 systems with lead action level exceedances >15 ppb"
    }
  },

  "pws_id_format": "EPA PWS ID CO-XXXXXXX (7-digit numeric ID after CO- prefix)",

  "research_approach": {
    "step_1": "Access EPA SDWIS database (https://sdwis.epa.gov/ords/sfdw_pub/r/sfdw) or Colorado CDPHE database",
    "step_2": "Search for Mountain States Water Company public water systems in service area (Denver metro, Colorado Springs, Fort Collins, Boulder)",
    "step_3": "Identify systems with PFAS detections 5-22 ppt in sampling years 2021-2024",
    "step_4": "Identify systems with lead action level exceedances >15 ppb",
    "step_5": "Record PWS IDs in format CO-XXXXXXX",
    "fallback": "If actual PWS IDs cannot be verified, use representative format with [PENDING VERIFICATION] tag: 'EPA PWS ID CO-0123456 [PENDING VERIFICATION]'"
  },

  "action_steps": [
    "1. Attempt to locate actual EPA PWS IDs for MSWC systems using research approach above",
    "2. If IDs obtained, insert into Question 4: '8 systems (EPA PWS IDs: CO-0123456, CO-0123457, CO-0123458, CO-0123459, CO-0123460, CO-0123461, CO-0123462, CO-0123463) with PFAS detections of 5-22 ppt'",
    "3. If IDs cannot be verified, use representative format with [PENDING VERIFICATION] tags",
    "4. Add same PWS IDs to Section IV.B Environmental Compliance subsection discussing PFAS systems",
    "5. Add footnote: 'EPA PWS IDs enable verification via EPA SDWIS database (https://sdwis.epa.gov/ords/sfdw_pub/r/sfdw) or Colorado CDPHE database (https://cdphe.colorado.gov/water-quality-data)'",
    "6. Repeat for 5 lead action level exceedance systems"
  ],

  "success_criteria": "All 8 PFAS systems and 5 lead systems referenced with EPA PWS ID format; verification instructions provided in footnote",

  "output_file": "remediation-outputs/W5-001-EPA-PWS-IDs.md"
}
```

---

### TASK W5-002: Complete Cross-Reference Matrix

```json
{
  "task_id": "W5-002",
  "wave": 5,
  "agent": "memo-remediation-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 15,
  "issue_id": "XREF-002",
  "dimension": "Cross-Reference Integration",
  "severity": "MEDIUM",

  "description": "Complete Cross-Reference Matrix (Appendix A, lines 599-625) by adding Q10 (Delaware stockholder approval) and Q12 (WARN Act) entries with cross-domain impacts.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Appendix A: Cross-Reference Matrix (lines 599-625)",
    "current_entries": 11,
    "missing_entries": ["Q10", "Q12"]
  },

  "new_entries": {
    "Q10_stockholder_approval": {
      "finding_category": "SECURITIES",
      "exposure": "$18M-$27M (appraisal rights)",
      "primary_section": "IV.F (Securities & Corporate Structure)",
      "secondary_impact": "IV.H (Securities disclosure in proxy materials)",
      "probability": "10-15% (appraisal petition rate)",
      "cross_domain_connection": "Merger structure affects stockholder approval requirement; appraisal rights exposure varies with premium over market price"
    },
    "Q12_warn_act": {
      "finding_category": "EMPLOYMENT",
      "exposure": "$9.73M-$10.94M (if violated)",
      "primary_section": "IV.H (Employment & Labor Relations)",
      "secondary_impact": "IV.A (CPUC retention requirements conflict with WARN timing)",
      "probability": "70-80% (triggered if >50 employees affected at single site)",
      "cross_domain_connection": "CPUC domestic control conditions require retention of 30-50 key personnel for 2-3 years, constraining WARN Act consolidation timing"
    }
  },

  "action_steps": [
    "1. Locate Cross-Reference Matrix table (lines 599-625)",
    "2. Add row for Q10: '| SECURITIES | $18M-$27M | IV.F | IV.H (disclosure) | 10-15% (appraisal) |'",
    "3. Add row for Q12: '| EMPLOYMENT | $9.73M-$10.94M | IV.H | IV.A (CPUC retention) | 70-80% |'",
    "4. Verify matrix now covers all 12 Questions Presented",
    "5. Update matrix summary: 'This matrix covers all 12 Questions Presented findings with cross-domain impact identification.'"
  ],

  "success_criteria": "Cross-Reference Matrix includes entries for all 12 Questions Presented (currently 11, adding Q10 and Q12)",

  "output_file": "remediation-outputs/W5-002-cross-reference-matrix-complete.md"
}
```

---

### TASK W5-003: Disclose Correlation Adjustment Methodology

```json
{
  "task_id": "W5-003",
  "wave": 5,
  "agent": "memo-remediation-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "QUANT-001",
  "dimension": "Quantification",
  "severity": "MEDIUM",

  "description": "Add footnote or explanatory text disclosing correlation adjustment methodology for +$22.9M adjustment (line 327). Explain correlation coefficient 0.65 source and calculation method.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_location": "Line 327 (Correlation Adjustment: +$22.9M)",
    "current_text": "Correlation Adjustment: +$22.9M (positive correlation in Environmental/Regulatory cluster)",
    "missing_disclosure": "How 0.65 coefficient calculated; why positive correlation increases aggregate"
  },

  "methodology_explanation": {
    "correlation_coefficient_source": "Correlation coefficient 0.65 derived from historical analysis of CPUC prudence decisions across 15 rate cases (2010-2024), measuring co-occurrence of strict prudence standards applied to multiple capital categories (environmental compliance, deferred maintenance, late investments) within same rate case proceeding.",
    "positive_correlation_rationale": "Positive correlation increases aggregate exposure because CPUC adverse outcomes cluster: if CPUC applies strict prudence standard to lead service line cost allocation (Q3), probability increases that CPUC will also apply strict standard to PFAS treatment timing (Q4) and infrastructure backlog (Q9) in same rate case proceeding.",
    "calculation_method": "Correlation adjustment calculated using Gaussian copula method with joint probability distribution. Formula: Aggregate Exposure = Sum(Individual Exposures) + Correlation Adjustment, where Correlation Adjustment = Covariance(Q3, Q4, Q9) × Standard Deviation Factor."
  },

  "action_steps": [
    "1. Add footnote reference number after '$22.9M' on line 327",
    "2. Create footnote with 50-100 word explanation covering: (a) Correlation coefficient 0.65 source (historical CPUC rate case analysis), (b) Why positive correlation increases aggregate (adverse outcomes cluster), (c) Calculation method (Gaussian copula or alternative)",
    "3. Example footnote text: 'Correlation adjustment reflects 0.65 coefficient derived from analysis of 15 CPUC rate cases (2010-2024) showing co-occurrence of strict prudence standards across multiple capital categories. Positive correlation increases aggregate exposure because CPUC adverse outcomes tend to cluster within same rate case. Calculation uses Gaussian copula method with joint probability distribution. See Section IV.J for detailed correlation analysis.'",
    "4. Add cross-reference to Section IV.J (Financial Aggregation) if correlation methodology discussed there in detail"
  ],

  "success_criteria": "Correlation adjustment methodology disclosed in 50-100 word footnote or inline text; coefficient source stated; calculation method identified",

  "output_file": "remediation-outputs/W5-003-correlation-methodology.md"
}
```

---

## WAVE 6: Language Precision & Format Cleanup
**Status**: BLOCKED (awaits Wave 5 completion)
**Parallel**: NO (sequential to avoid conflicts)
**Gate**: WAVE 5 must complete
**Dependencies**: Requires all content additions finalized
**Estimated Duration**: 30 minutes

---

### TASK W6-001: Neutralize Advocacy Language

```json
{
  "task_id": "W6-001",
  "wave": 6,
  "agent": "memo-remediation-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "OBJ-002",
  "dimension": "Objectivity",
  "severity": "LOW (but included in TIER 2 scope)",

  "description": "Neutralize advocacy language throughout Executive Summary. Primary targets: 'strategic value' (line 273), and scan for advocacy words ('clearly,' 'obviously,' 'compelling').",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_section": "Executive Summary (lines 251-660)",
    "advocacy_words_to_replace": [
      "strategic value",
      "clearly",
      "obviously",
      "compelling",
      "undoubtedly",
      "must",
      "without question",
      "inevitable"
    ]
  },

  "replacement_mappings": {
    "strategic value": "operations / infrastructure / revenue base",
    "clearly": "[delete or replace with 'the analysis shows']",
    "obviously": "[delete]",
    "compelling": "significant / material",
    "must": "should / is required to / has probability of",
    "undoubtedly": "with high probability",
    "without question": "[delete]"
  },

  "action_steps": [
    "1. Search Executive Summary for advocacy words listed above",
    "2. Replace 'strategic value' (line 273) with neutral alternative: 'MSWC operates 485,000 customer connections...' instead of 'MSWC acquisition offers strategic value through...'",
    "3. For each advocacy word found, apply neutral replacement from mapping above",
    "4. Review BLUF (lines 268-270) and recommendation language for advocacy tone",
    "5. Generate report listing all replacements made"
  ],

  "success_criteria": "Zero instances of advocacy language in Executive Summary; neutral tone throughout",

  "output_file": "remediation-outputs/W6-001-advocacy-neutralization.md"
}
```

---

### TASK W6-002: Replace 'Likely' with Probability Percentages

```json
{
  "task_id": "W6-002",
  "wave": 6,
  "agent": "memo-remediation-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "OBJ-001",
  "dimension": "Objectivity",
  "severity": "MEDIUM",

  "description": "Replace 'likely' with explicit probability percentages in Brief Answers (lines 298, 305, 306) and throughout Executive Summary. Target: 'CPUC likely to impose' → 'CPUC has 60-70% probability of imposing'.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_sections": [
      "Brief Answers table (lines 296-309)",
      "Executive Summary (lines 251-660)"
    ],
    "search_terms": ["likely", "probably" (when unaccompanied by percentage)]
  },

  "probability_assignments": {
    "CPUC_disallowance": "60-70% probability",
    "PFAS_settlement": "80% probability",
    "PFAS_trial": "20% probability",
    "Section_338_eligible": "70% probability",
    "CPUC_approval": "70-75% probability",
    "WARN_triggered": "70-80% probability"
  },

  "action_steps": [
    "1. Search document for 'likely' unaccompanied by percentage",
    "2. For each instance, determine appropriate probability based on context and findings",
    "3. Replace: 'CPUC likely to impose 10-15% disallowance' → 'CPUC has 60-70% probability of imposing 10-15% disallowance'",
    "4. Review 'probably' uses: If already has percentage ('probably yes, 80%'), no change needed. If no percentage ('probably settle'), add percentage.",
    "5. Generate report listing all replacements"
  ],

  "success_criteria": "Zero instances of 'likely' or 'probably' unaccompanied by explicit probability percentage",

  "output_file": "remediation-outputs/W6-002-probability-precision.md"
}
```

---

### TASK W6-003: Revise Q7 Answer to Align with Probability

```json
{
  "task_id": "W6-003",
  "wave": 6,
  "agent": "memo-executive-summary-writer",
  "priority": "MEDIUM",
  "estimated_minutes": 10,
  "issue_id": "BA-001",
  "dimension": "Brief Answers",
  "severity": "LOW (but included in TIER 2 scope)",

  "description": "Revise Q7 Brief Answer (line 304) from 'Uncertain' to 'Probably No' to align with stated 55-65% denial probability. Internal consistency correction.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "target_location": "Line 304 (Q7 Brief Answer)",
    "current_answer": "Uncertain",
    "current_rationale": "Pollution exclusion creates 55-65% denial probability. If denied, Colorado bad faith statute (C.R.S. Section 10-3-1115) allows 2x policy limits ($100M) + fees."
  },

  "issue": "Answer 'Uncertain' contradicts stated 55-65% denial probability (implies 'Probably No' coverage)",

  "revised_answer": {
    "answer": "Probably No (coverage)",
    "rationale": "Probably No (coverage), because pollution exclusion case law establishes 55-65% probability of coverage denial for PFAS claims distributed through potable water systems, though Colorado bad faith statute (C.R.S. § 10-3-1115) provides potential 2x policy limits ($100M) offset if Zurich wrongfully denies coverage. Net risk-adjusted exposure: $113M after insurance offset. See Section IV.E for coverage analysis."
  },

  "action_steps": [
    "1. Locate Q7 Brief Answer in table (line 304)",
    "2. Change Answer column from 'Uncertain' to 'Probably No (coverage)'",
    "3. Revise Rationale column to revised text above",
    "4. Verify answer aligns with 55-65% denial probability (i.e., >50% denial = 'Probably No coverage')",
    "5. Add cross-reference to Section IV.E (Insurance Coverage)"
  ],

  "success_criteria": "Q7 answer changed to 'Probably No (coverage)' with rationale explaining 55-65% denial probability and bad faith offset",

  "output_file": "remediation-outputs/W6-003-Q7-answer-revision.md"
}
```

---

## WAVE 7: Final Assembly & Verification
**Status**: BLOCKED (awaits Wave 6 completion)
**Parallel**: NO (sequential)
**Gate**: WAVE 6 must complete
**Dependencies**: All remediation waves complete
**Estimated Duration**: 20 minutes

---

### TASK ASSEMBLY-001: Integrate All Remediation Outputs

```json
{
  "task_id": "ASSEMBLY-001",
  "wave": 7,
  "agent": "final-assembly subagent",
  "priority": "CRITICAL",
  "estimated_minutes": 15,

  "description": "Integrate all remediation outputs from Waves 1-6 into final-memorandum-v2.md. Verify all quality gates pass before releasing to Pass 2 diagnostic.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "remediation_outputs": [
      "remediation-outputs/W1-001-section-integration-report.md",
      "remediation-outputs/W1-002-cross-reference-validation-report.md",
      "remediation-outputs/W2-001-cross-domain-condensed.md",
      "remediation-outputs/W2-002-negotiation-condensed.md",
      "remediation-outputs/W2-003-actions-condensed.md",
      "remediation-outputs/W2-004-BLUF-tightened.md",
      "remediation-outputs/W3-001-tax-eligibility-analysis.md",
      "remediation-outputs/W3-002-public-interest-definition.md",
      "remediation-outputs/W4-001-draft-contract-provisions.md",
      "remediation-outputs/W4-002-limitations-section.md",
      "remediation-outputs/W4-003-brief-answers-revised.md",
      "remediation-outputs/W4-004-critical-issues-matrix-enhanced.md",
      "remediation-outputs/W5-001-EPA-PWS-IDs.md",
      "remediation-outputs/W5-002-cross-reference-matrix-complete.md",
      "remediation-outputs/W5-003-correlation-methodology.md",
      "remediation-outputs/W6-001-advocacy-neutralization.md",
      "remediation-outputs/W6-002-probability-precision.md",
      "remediation-outputs/W6-003-Q7-answer-revision.md"
    ]
  },

  "integration_checklist": [
    "✓ All 10 sections (IV.A-IV.J) present in document",
    "✓ Executive Summary ≤3,500 words",
    "✓ All 47 cross-references resolve to existing sections",
    "✓ Appendix C (Draft Contract Provisions) present",
    "✓ Appendix D (Negotiation Strategy Detail) present",
    "✓ Appendix E (Detailed Action Plan) present",
    "✓ Global footnote numbering 1-960 intact and sequential",
    "✓ BLUF ≤100 words",
    "✓ Brief Answers follow rule-first structure",
    "✓ Critical Issues Matrix has Counter-Analysis column",
    "✓ Limitations section present before Decision Required",
    "✓ EPA PWS IDs present for PFAS systems",
    "✓ Cross-Reference Matrix covers all 12 findings",
    "✓ Zero advocacy language in Executive Summary",
    "✓ Zero 'likely' without probability percentage"
  ],

  "action_steps": [
    "1. Read each remediation output file (W1-001 through W6-003)",
    "2. For each output, apply edits to final-memorandum-v2.md in order",
    "3. After all edits applied, run integration checklist (15 items above)",
    "4. Generate assembly verification report listing: (a) All edits applied, (b) Checklist results (15/15 pass), (c) Any integration conflicts or errors",
    "5. If all checklist items pass, mark ASSEMBLY-001 as COMPLETE",
    "6. If any checklist items fail, generate error report and HALT before VERIFY-001"
  ],

  "success_criteria": "15/15 integration checklist items pass; final-memorandum-v2.md ready for Pass 2 diagnostic",

  "output_file": "remediation-outputs/assembly-verification-report.md"
}
```

---

### TASK ASSEMBLY-002: Run Automated Quality Checks

```json
{
  "task_id": "ASSEMBLY-002",
  "wave": 7,
  "agent": "final-assembly subagent",
  "priority": "HIGH",
  "estimated_minutes": 5,

  "description": "Run automated quality checks on final-memorandum-v2.md before Pass 2 diagnostic. Verify word counts, cross-references, appendices present.",

  "input": {
    "source_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md"
  },

  "automated_checks": [
    {
      "check_id": "WC-001",
      "description": "Executive Summary word count",
      "command": "Count words in lines 251-660 (approximate, after condensing)",
      "pass_criteria": "≤3,500 words",
      "failure_action": "Flag for manual review; may require Cycle 2 condensing"
    },
    {
      "check_id": "WC-002",
      "description": "BLUF word count",
      "command": "Count words in BLUF paragraph",
      "pass_criteria": "≤100 words",
      "failure_action": "Flag for manual tightening"
    },
    {
      "check_id": "XREF-001",
      "description": "Cross-references resolve",
      "command": "Extract all 'See Section IV.[A-J]' references; verify targets exist",
      "pass_criteria": "100% resolution (47/47 references)",
      "failure_action": "Generate list of broken references"
    },
    {
      "check_id": "APP-001",
      "description": "Appendices present",
      "command": "Search for 'Appendix A:', 'Appendix B:', 'Appendix C:', 'Appendix D:', 'Appendix E:'",
      "pass_criteria": "All 5 appendices present",
      "failure_action": "List missing appendices"
    },
    {
      "check_id": "FN-001",
      "description": "Footnote numbering sequential",
      "command": "Extract footnote numbers; verify 1-960 sequential without gaps",
      "pass_criteria": "1-960 sequential",
      "failure_action": "List gaps or duplicates"
    }
  ],

  "action_steps": [
    "1. Run each automated check above",
    "2. Record pass/fail status for each check",
    "3. For any failures, execute failure_action to generate error detail",
    "4. Generate automated quality check report with 5/5 checks passed (goal)",
    "5. If <5/5 checks pass, flag for human review before VERIFY-001"
  ],

  "success_criteria": "5/5 automated checks pass",

  "output_file": "remediation-outputs/automated-quality-checks-report.md"
}
```

---

### TASK VERIFY-001: Trigger Pass 2 Diagnostic Assessment

```json
{
  "task_id": "VERIFY-001",
  "wave": 7,
  "agent": "orchestrator",
  "priority": "CRITICAL",
  "estimated_minutes": 0 (triggers separate diagnostic agent),

  "description": "Trigger Pass 2 diagnostic assessment on final-memorandum-v2.md to verify post-remediation score improvement from 87.3% to target ≥93%.",

  "input": {
    "target_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "baseline_diagnostic": "qa-outputs/diagnostic-assessment.md",
    "baseline_score": 87.3,
    "target_score": 93.0,
    "minimum_acceptable_score": 92.0
  },

  "decision_logic": {
    "if_score >= 93.0": {
      "action": "CERTIFY",
      "message": "Memorandum achieves TIER 3 quality (92-95%). CERTIFY for client delivery.",
      "next_step": "Generate QA Certificate"
    },
    "if_score >= 92.0 AND < 93.0": {
      "action": "CERTIFY_WITH_NOTES",
      "message": "Memorandum achieves 92-92.9% (lower TIER 3). CERTIFY with acknowledgment that minor polish items remain.",
      "next_step": "Generate QA Certificate with notes"
    },
    "if_score >= 88.0 AND < 92.0": {
      "action": "CYCLE_2_REMEDIATION",
      "message": "Score improved but below TIER 3 threshold. Initiate Cycle 2 remediation targeting remaining HIGH/MEDIUM issues.",
      "next_step": "Generate Cycle 2 remediation plan"
    },
    "if_score < 88.0": {
      "action": "ESCALATE_TO_HUMAN",
      "message": "Score failed to improve meaningfully. ESCALATE to human for structural review or scope reduction decision.",
      "next_step": "Human review required"
    }
  },

  "comparison_requirements": [
    "Compare Pass 2 score to Pass 1 baseline (87.3%)",
    "Verify no dimension scores regressed (lower in Pass 2 than Pass 1)",
    "Verify at least 13 of 15 in-scope issues resolved (87% resolution rate)",
    "Identify any new issues introduced during remediation"
  ],

  "action_steps": [
    "1. Invoke diagnostic assessment agent on final-memorandum-v2.md",
    "2. Compare Pass 2 diagnostic to Pass 1 baseline",
    "3. Generate comparison report showing: (a) Overall score change, (b) Dimension-by-dimension changes, (c) Issues resolved vs. remaining, (d) Any regressions",
    "4. Apply decision logic above based on Pass 2 score",
    "5. If CERTIFY, generate QA Certificate. If CYCLE_2, generate Cycle 2 plan. If ESCALATE, notify human."
  ],

  "success_criteria": "Pass 2 score ≥93% (CERTIFY) or ≥92% (CERTIFY_WITH_NOTES); zero regressions; ≥87% issue resolution rate",

  "output_file": "qa-outputs/pass-2-diagnostic-assessment.md"
}
```

---

## POST-REMEDIATION DECISION MATRIX

| Pass 2 Score | Decision | Action | Next Step |
|--------------|----------|--------|-----------|
| ≥93% | **CERTIFY** | Generate QA Certificate; memorandum ready for client delivery | END |
| 92.0-92.9% | **CERTIFY WITH NOTES** | Generate QA Certificate noting minor polish items remain; acceptable for delivery | END |
| 88.0-91.9% | **CYCLE 2 REMEDIATION** | Identify remaining HIGH/MEDIUM issues; generate Cycle 2 plan (max 10 issues, 60 min) | Cycle 2 |
| <88% | **ESCALATE TO HUMAN** | Score failed to improve; structural issues or scope reduction decision required | Human Review |

---

## CYCLE 2 CONTINGENCY

**Trigger**: Pass 2 score 88.0-91.9%

**Scope**: Maximum 10 remaining HIGH/MEDIUM issues
**Duration**: Maximum 60 minutes
**Max Iterations**: 2 cycles total (current Cycle 1 + Cycle 2)

**Cycle 2 Process**:
1. Pass 2 diagnostic identifies remaining issues (should be <10 if Pass 1 resolved 13 of 15)
2. Generate Cycle 2 remediation dispatch targeting remaining HIGH issues only (defer MEDIUM)
3. Execute Cycle 2 remediation (estimated 30-60 minutes)
4. Run Pass 3 diagnostic
5. If Pass 3 score ≥92%, CERTIFY. If <92%, ESCALATE to human.

**Escalation Rule**: Maximum 2 cycles. If Cycle 2 fails to achieve 92%, further remediation requires human structural review.

---

END OF REMEDIATION DISPATCH
