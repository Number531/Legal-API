# REMEDIATION DISPATCH
## Machine-Readable Task Manifest for Orchestrator Execution

**Diagnostic ID**: memo-qa-diagnostic-2026-01-23-1737670800
**Diagnostic Score**: 77.5%
**Remediation Tier**: TIER_3_FULL
**Total Issues Found**: 49
**Issues In Scope**: 49 (TIER 3 includes all severities)
**Estimated Duration**: 19.5-30.5 hours (agent time) | 13.5-16.5 hours (wall time with parallelization)
**Max Cycles**: 2
**Current Cycle**: 1
**Target Score**: 88-92% (CERTIFY WITH LIMITATIONS) or 93%+ (CERTIFY)

---

## EXECUTION METADATA

```json
{
  "session_id": "2026-01-23-1737670800",
  "diagnostic_file": "qa-outputs/diagnostic-assessment.md",
  "remediation_plan_file": "qa-outputs/remediation-plan.md",
  "source_document": "final-memorandum.md",
  "target_document": "final-memorandum-v2.md",
  "current_score": 77.5,
  "target_score_min": 88.0,
  "target_score_optimal": 93.0,
  "remediation_tier": "TIER_3_FULL",
  "total_waves": 6,
  "critical_issues": 2,
  "high_issues": 17,
  "medium_issues": 18,
  "low_issues": 12,
  "estimated_wall_time_hours": 14.0,
  "parallel_execution_enabled": true
}
```

---

## WAVE 1: ADDITIONAL RESEARCH
**Parallel**: YES
**Gate**: none
**Estimated Wall Time**: 1-1.5 hours (with 3 parallel agents)

### Tasks

#### W1-001: Adverse Authority Research - Investment Company Act
```json
{
  "task_id": "W1-001",
  "wave": 1,
  "priority": "HIGH",
  "agent": "corporate-governance-specialist",
  "estimated_minutes": 50,
  "parallel_group": "W1-RESEARCH",
  "dependencies": [],
  "target_section": "IV.B",
  "output_file": "remediation-outputs/W1-001-adverse-authority-IV-B.md",
  "success_criteria": [
    "Minimum 1 case or SEC guidance limiting Section 15(f) 75% independence safe harbor",
    "Clear relevance explanation provided",
    "Distinguishing factors identified for Pinnacle transaction",
    "Specific integration point in Section IV.B identified"
  ],
  "prompt": {
    "task": "Research adverse authority for Investment Company Act Section 15(f) board independence analysis",
    "context": "Section IV.B concludes Pinnacle's mutual fund board is exactly 75.0% independent (9 of 12 directors), meeting statutory threshold but with zero cushion. Need counter-precedent showing risks or limitations of minimal compliance.",
    "research_questions": [
      "Are there cases where SEC enforced against advisers despite technical compliance with 75% threshold?",
      "Are there cases showing 'interested person' definitions that reduced independence counts below expectation?",
      "Is there SEC guidance requiring cushion above 75% minimum?",
      "Are there cases where one director change triggered Section 15(f) violations?"
    ],
    "research_databases": [
      "Lexis: 'Investment Company Act /s Section 15(f) /s independent director'",
      "SEC enforcement releases 2020-2025 for mutual fund board composition",
      "ALI-ABA materials on Section 15(f) safe harbors"
    ],
    "output_format": "Markdown with case name, citation, holding, relevance, distinguishing factors, integration point"
  }
}
```

#### W1-002: Adverse Authority Research - Key Person Clauses
```json
{
  "task_id": "W1-002",
  "wave": 1,
  "priority": "HIGH",
  "agent": "fund-structures-specialist",
  "estimated_minutes": 50,
  "parallel_group": "W1-RESEARCH",
  "dependencies": [],
  "target_section": "IV.E",
  "output_file": "remediation-outputs/W1-002-adverse-authority-IV-E.md",
  "success_criteria": [
    "Minimum 1 case limiting key person clause enforcement in LPAs",
    "Relevance to Pinnacle's key person provisions explained",
    "Distinguishing factors identified",
    "Integration point in Section IV.E specified"
  ],
  "prompt": {
    "task": "Research cases limiting key person clause enforcement in limited partnership agreements",
    "context": "Section IV.E analyzes key person clauses enabling LP redemptions upon founder departure. Need counter-precedent showing circumstances where LPs failed to enforce or courts limited interpretation.",
    "research_questions": [
      "Are there cases where key person redemption rights were not enforced by LPs?",
      "Are there cases narrowly construing 'key person' definitions?",
      "Are there cases showing business judgment deference to GPs in key person determinations?",
      "Are there Delaware LP cases limiting unilateral redemption rights?"
    ],
    "research_databases": [
      "Lexis: 'limited partnership /s key person /s redemption'",
      "Delaware Court of Chancery opinions 2020-2025",
      "Private equity fund litigation databases"
    ],
    "output_format": "Markdown with case name, citation, holding, relevance, distinguishing factors, integration point"
  }
}
```

#### W1-003: Adverse Authority Research - Change of Control
```json
{
  "task_id": "W1-003",
  "wave": 1,
  "priority": "HIGH",
  "agent": "contracts-specialist",
  "estimated_minutes": 50,
  "parallel_group": "W1-RESEARCH",
  "dependencies": [],
  "target_section": "IV.J",
  "output_file": "remediation-outputs/W1-003-adverse-authority-IV-J.md",
  "success_criteria": [
    "Minimum 1 case narrowly construing change-of-control provisions",
    "Relevance to Pinnacle's institutional contracts explained",
    "Distinguishing factors identified",
    "Integration point in Section IV.J specified"
  ],
  "prompt": {
    "task": "Research cases limiting change-of-control provisions in commercial contracts",
    "context": "Section IV.J analyzes change-of-control client consent requirements affecting 40% of institutional AUM. Need counter-precedent showing narrow construction or assignment without consent.",
    "research_questions": [
      "Are there cases allowing assignment without consent despite change-of-control clauses?",
      "Are there cases narrowly defining 'change of control' to exclude certain transactions?",
      "Are there cases showing business judgment or substantial continuity doctrines limiting consent requirements?",
      "Are there Massachusetts or Delaware cases on point?"
    ],
    "research_databases": [
      "Lexis: 'change of control /s assignment /s consent'",
      "Massachusetts and Delaware contract cases 2020-2025",
      "M&A transaction litigation databases"
    ],
    "output_format": "Markdown with case name, citation, holding, relevance, distinguishing factors, integration point"
  }
}
```

---

## WAVE 2: CONTENT ADDITIONS
**Parallel**: YES
**Gate**: WAVE 1 (requires adverse authority research outputs)
**Estimated Wall Time**: 30-45 minutes (with parallel agents)

### Tasks

#### W2-001: Counter-Analysis Integration - Section IV.B
```json
{
  "task_id": "W2-001",
  "wave": 2,
  "priority": "HIGH",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 25,
  "parallel_group": "W2-CONTENT",
  "dependencies": ["W1-001"],
  "target_section": "IV.B",
  "input_files": [
    "final-memorandum.md (Section IV.B, lines 1419-2150)",
    "remediation-outputs/W1-001-adverse-authority-IV-B.md"
  ],
  "output_file": "remediation-outputs/W2-001-counter-analysis-IV-B.md",
  "success_criteria": [
    "Counter-analysis subsection drafted with 2-3 counter-arguments",
    "Each counter-argument cites authority from W1-001",
    "Distinguishing analysis provided",
    "Net impact on probability/exposure stated",
    "Tone remains objective"
  ],
  "prompt": {
    "task": "Draft counter-analysis subsection for Section IV.B integrating adverse authority from W1-001",
    "insertion_point": "After Section IV.B.B (Application to Transaction), before Section IV.B.C (Risk Assessment)",
    "structure": "### B.3 Counter-Analysis and Adverse Authority",
    "required_elements": [
      "Introduction paragraph acknowledging need to consider counter-arguments",
      "2-3 counter-arguments with supporting authority",
      "Distinguish or acknowledge each counter-argument",
      "State net impact on probability/exposure estimates",
      "Maintain objective tone (acknowledge genuine uncertainty)"
    ],
    "example_counter_argument": "**Counter-Argument 1: Board Independence Cushion Not Legally Required** - Seller may argue that precisely meeting 75.0% threshold satisfies Section 15(f). [Cite adverse case from W1-001]. However, distinguishable because [Pinnacle factors]. Impact: Reduces regulatory violation probability from X% to Y% but practical business risk remains."
  }
}
```

#### W2-002: Counter-Analysis Integration - Section IV.E
```json
{
  "task_id": "W2-002",
  "wave": 2,
  "priority": "HIGH",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 25,
  "parallel_group": "W2-CONTENT",
  "dependencies": ["W1-002"],
  "target_section": "IV.E",
  "input_files": [
    "final-memorandum.md (Section IV.E, lines 3470-4190)",
    "remediation-outputs/W1-002-adverse-authority-IV-E.md"
  ],
  "output_file": "remediation-outputs/W2-002-counter-analysis-IV-E.md",
  "success_criteria": [
    "Counter-analysis subsection drafted",
    "Cites authority from W1-002",
    "Distinguishing analysis provided",
    "Net impact stated"
  ],
  "prompt": {
    "task": "Draft counter-analysis subsection for Section IV.E integrating adverse authority from W1-002",
    "insertion_point": "After Section IV.E.B (Application to Transaction), before Section IV.E.C (Risk Assessment)",
    "structure": "Same as W2-001, adapted for key person clause analysis"
  }
}
```

#### W2-003: Counter-Analysis Integration - Section IV.J
```json
{
  "task_id": "W2-003",
  "wave": 2,
  "priority": "HIGH",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 25,
  "parallel_group": "W2-CONTENT",
  "dependencies": ["W1-003"],
  "target_section": "IV.J",
  "input_files": [
    "final-memorandum.md (Section IV.J, lines 7153-8040)",
    "remediation-outputs/W1-003-adverse-authority-IV-J.md"
  ],
  "output_file": "remediation-outputs/W2-003-counter-analysis-IV-J.md",
  "success_criteria": [
    "Counter-analysis subsection drafted",
    "Cites authority from W1-003",
    "Distinguishing analysis provided",
    "Net impact stated"
  ],
  "prompt": {
    "task": "Draft counter-analysis subsection for Section IV.J integrating adverse authority from W1-003",
    "insertion_point": "After Section IV.J.B (Application to Transaction), before Section IV.J.C (Risk Assessment)",
    "structure": "Same as W2-001, adapted for change-of-control analysis"
  }
}
```

#### W2-004: Probability Methodology Tags
```json
{
  "task_id": "W2-004",
  "wave": 2,
  "priority": "MEDIUM",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 18,
  "parallel_group": "W2-CONTENT",
  "dependencies": [],
  "target_section": "Multiple (IV.E, IV.H, IV.J)",
  "output_file": "remediation-outputs/W2-004-probability-methodology.md",
  "success_criteria": [
    "3 probability estimates enhanced with methodology tags",
    "Each tag includes basis for percentage",
    "[ANALYST ESTIMATE] or [METHODOLOGY:...] format used"
  ],
  "prompt": {
    "task": "Add methodology disclosure tags to 3 probability estimates lacking explicit basis",
    "locations": [
      {
        "section": "IV.E",
        "finding": "100% probability MFN triggered",
        "enhancement": "Add: '100% probability (MFN provisions already triggered per side letter review, verified by counsel [VERIFIED:document review])'"
      },
      {
        "section": "IV.H",
        "finding": "30-40% founder departure probability",
        "enhancement": "Add: '[ANALYST ESTIMATE based on: (1) age 62 vs. industry retirement patterns, (2) no written succession plan, (3) Greenwich Associates RIA M&A study showing 30% baseline + 10% acquisition premium = 40% ceiling estimate]'"
      },
      {
        "section": "IV.J",
        "finding": "10% client termination probability",
        "enhancement": "Add: '[ANALYST ESTIMATE based on: (1) 40% of AUM has change-of-control provisions (certain), (2) 5-10% historical termination rate per industry data, (3) 10% represents conservative high-end given strong relationships]'"
      }
    ]
  }
}
```

---

## WAVE 3: STRUCTURAL FIXES (HYBRID WORKFLOW)
**Parallel**: Mixed (P1 script → validation → P2/P3 parallel)
**Gate**: WAVE 2
**Estimated Wall Time**: 8-10 hours

### Priority 1: CREAC Headers (CRITICAL)

#### W3-001: CREAC Header Insertion (Script)
```json
{
  "task_id": "W3-001",
  "wave": 3,
  "priority": "CRITICAL",
  "agent": "SCRIPT",
  "script": "apply-creac-headers.py",
  "estimated_minutes": 30,
  "parallel_group": null,
  "dependencies": ["W2-001", "W2-002", "W2-003"],
  "input_file": "final-memorandum.md",
  "output_file": "final-memorandum-creac.md",
  "success_criteria": [
    "CREAC headers inserted in all 12 sections",
    "Minimum 50 total headers across document",
    "Headers follow hierarchy: #### Finding → ##### CREAC components"
  ],
  "script_logic": {
    "for_each_section": "IV.A through IV.L",
    "identify_subsection": "B (Application to Transaction / Detailed Legal Analysis)",
    "parse_findings": "B.1, B.2, B.3, etc.",
    "for_each_finding": {
      "insert_finding_header": "#### [Number]: [Title] (if not present)",
      "insert_conclusion_header": "##### Conclusion (before existing analysis)",
      "insert_rule_header": "##### Rule (before statutory citations)",
      "insert_explanation_header": "##### Explanation (before case law)",
      "insert_application_header": "##### Application (before fact-specific analysis)",
      "insert_counter_analysis_header": "##### Counter-Analysis (after/before counter-arguments)"
    },
    "expected_output": "48-60 CREAC structures, 240-300 total headers"
  },
  "note": "This is a mechanical insertion. Validation by W3-001-VALIDATE will check correctness and reorganize content as needed."
}
```

#### W3-001-VALIDATE: CREAC Validation & Reorganization
```json
{
  "task_id": "W3-001-VALIDATE",
  "wave": 3,
  "priority": "CRITICAL",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 330,
  "parallel_group": null,
  "dependencies": ["W3-001"],
  "input_file": "final-memorandum-creac.md",
  "output_file": "remediation-outputs/W3-001-creac-validation.md",
  "success_criteria": [
    "All 12 sections validated",
    "Conclusion appears FIRST in each structure",
    "Explanation separates case law from fact application",
    "Counter-Analysis is substantive (200+ words per structure)",
    "Validation report lists sections ready vs. needing manual reorganization"
  ],
  "prompt": {
    "task": "Validate CREAC headers inserted by script and reorganize content as needed",
    "validation_checks": [
      "Verify CREAC headers inserted correctly in all 12 sections",
      "Check Conclusion appears FIRST (before Rule)",
      "Verify Rule section includes primary authority citation",
      "Verify Explanation discusses analogous cases (not Pinnacle facts)",
      "Verify Application compares Pinnacle facts to precedent facts",
      "Verify Counter-Analysis is substantive (not generic placeholder)"
    ],
    "reorganization_required": [
      "Move conclusions to FIRST position if script placed elsewhere",
      "Separate case law (Explanation) from fact application (Application) if mixed",
      "Consolidate scattered counter-arguments into Counter-Analysis sections",
      "Ensure each CREAC structure is complete (all 5 components present)"
    ],
    "output_format": "Validation report with: (1) sections ready for integration, (2) sections needing manual reorganization with specific instructions, (3) header count by section"
  }
}
```

### Priority 2: Draft Contract Language (CRITICAL)

**Note**: 17 provisions can be executed in parallel once W3-001-VALIDATE completes. Below are abbreviated task definitions (full instructions in remediation-plan.md).

#### W3-P01: Key Person Retention Agreement
```json
{
  "task_id": "W3-P01",
  "wave": 3,
  "priority": "CRITICAL",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 45,
  "parallel_group": "W3-CONTRACT",
  "dependencies": ["W3-001-VALIDATE"],
  "target_section": "IV.H",
  "finding_reference": "Section IV.H.B.1, Severity CRITICAL, Exposure $280M",
  "provision_type": "Covenant + Escrow",
  "output_file": "remediation-outputs/W3-P01-key-person-retention.md",
  "success_criteria": [
    "Employment covenant with 3-year term",
    "$50M earnout specified with vesting schedule",
    "Succession planning requirement included",
    "Termination provisions (Cause, Without Cause, Death/Disability) specified",
    "Cross-reference to Key Person Escrow",
    "Closing condition status stated"
  ],
  "prompt": "Draft key person retention agreement provisions for founder/CIO John Doe per template in remediation-plan.md, Section W3-P01 detailed instructions"
}
```

#### W3-P02 through W3-P17: Contract Provisions (abbreviated)
```json
{
  "task_ids": ["W3-P02", "W3-P03", "W3-P04", "W3-P05", "W3-P06", "W3-P07", "W3-P08", "W3-P09", "W3-P10", "W3-P11", "W3-P12", "W3-P13", "W3-P14", "W3-P15", "W3-P16", "W3-P17"],
  "wave": 3,
  "priority": "HIGH/CRITICAL (varies)",
  "agent": "memo-remediation-writer",
  "parallel_group": "W3-CONTRACT",
  "estimated_minutes_range": "20-45 per provision",
  "dependencies": ["W3-001-VALIDATE"],
  "provision_details": [
    {"id": "W3-P02", "title": "Senior PM Retention Agreements", "section": "IV.H", "exposure": "$244M", "type": "Covenant + Escrow", "time": 45},
    {"id": "W3-P03", "title": "Cyber Insurance Procurement", "section": "IV.K/IV.L", "exposure": "$13.3M", "type": "Closing Condition", "time": 30},
    {"id": "W3-P04", "title": "Performance Fee HWM Representation", "section": "IV.E", "exposure": "$95M", "type": "Representation", "time": 25},
    {"id": "W3-P05", "title": "Valuation Markdown Indemnity", "section": "IV.G", "exposure": "$75M", "type": "Indemnity + Escrow", "time": 30},
    {"id": "W3-P06", "title": "E&O Policy Procurement", "section": "IV.K", "exposure": "$20M", "type": "Closing Condition", "time": 25},
    {"id": "W3-P07", "title": "Tax Section 1061 Representation", "section": "IV.I", "exposure": "$3.9M/yr", "type": "Representation", "time": 20},
    {"id": "W3-P08", "title": "Side Letter MFN Disclosure Schedule", "section": "IV.E", "exposure": "$3.6M/yr", "type": "Disclosure Schedule", "time": 20},
    {"id": "W3-P09", "title": "SEC Exam Remediation Covenant", "section": "IV.C", "exposure": "$2.05M", "type": "Pre-Closing Covenant", "time": 25},
    {"id": "W3-P10", "title": "D&O Policy Limits Procurement", "section": "IV.K", "exposure": "$8M", "type": "Closing Condition", "time": 20},
    {"id": "W3-P11", "title": "ERISA Prohibited Transaction Indemnity", "section": "IV.F", "exposure": "$11.5M", "type": "Indemnity + VFCP", "time": 30},
    {"id": "W3-P12", "title": "Change of Control Client Consents", "section": "IV.J", "exposure": "$18.8M", "type": "Closing Condition", "time": 25},
    {"id": "W3-P13", "title": "12b-1 Disclosure Amendment Covenant", "section": "IV.B", "exposure": "$1.2M", "type": "Pre-Closing Covenant", "time": 20},
    {"id": "W3-P14", "title": "WARN Act Compliance Covenant", "section": "IV.H", "exposure": "$2.5M", "type": "Covenant", "time": 20},
    {"id": "W3-P15", "title": "Non-Compete Garden Leave Provision", "section": "IV.H", "exposure": "$15M", "type": "Employment Covenant", "time": 25},
    {"id": "W3-P16", "title": "Marketing Rule Form ADV Amendment", "section": "IV.D", "exposure": "$510K", "type": "Pre-Closing Covenant", "time": 20},
    {"id": "W3-P17", "title": "Independent Director Appointment Covenant", "section": "IV.B", "exposure": "$3M", "type": "Pre-Closing Covenant", "time": 25}
  ],
  "note": "All provisions follow template in remediation-plan.md with required components: draft language, key terms (dollar amounts, baskets, caps, survival), precedent references, drafting notes, cross-references"
}
```

### Priority 3: Cross-Reference Enhancement (OPTIONAL)

#### W3-XREF-001: Executive Summary Cross-Reference Granularity
```json
{
  "task_id": "W3-XREF-001",
  "wave": 3,
  "priority": "MEDIUM",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 60,
  "parallel_group": "W3-CONTRACT",
  "dependencies": ["W3-001-VALIDATE"],
  "target_section": "Executive Summary (lines 74-442)",
  "output_file": "remediation-outputs/W3-XREF-001.md",
  "success_criteria": [
    "10-15 cross-references enhanced with subsection specificity",
    "Format: 'See Section IV.X.Y.Z (Specific Finding Title)'"
  ],
  "prompt": {
    "task": "Enhance executive summary cross-references with subsection specificity",
    "target_locations": [
      "Critical Conditions (lines 98-103)",
      "Cross-Domain Impact Analysis (lines 231-292)"
    ],
    "transformation": "Replace 'See Section IV.H' → 'See Section IV.H.B.1 (Founder Key Person Risk Analysis)'"
  }
}
```

---

## WAVE 4: LANGUAGE & FORMAT FIXES
**Parallel**: YES
**Gate**: WAVE 3
**Estimated Wall Time**: 1.5-2 hours (with parallel agents)

### Tasks

#### W4-001: Advocacy Language Removal
```json
{
  "task_id": "W4-001",
  "wave": 4,
  "priority": "HIGH",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 15,
  "parallel_group": "W4-LANGUAGE",
  "dependencies": ["W3-001-VALIDATE"],
  "input_file": "final-memorandum-creac.md",
  "output_file": "remediation-outputs/W4-001-advocacy-removal.md",
  "success_criteria": [
    "4 instances of 'clearly' removed or replaced",
    "Neutral framing substituted",
    "No other advocacy language introduced"
  ],
  "prompt": {
    "task": "Remove advocacy language (4 instances of 'clearly') and replace with neutral framing",
    "search_pattern": "Use grep -n 'clearly' to locate exact line numbers",
    "replacements": [
      "'clearly deficient' → 'fail to meet Item 12 requirements'",
      "'clearly requires' → 'requires' (delete 'clearly')",
      "'clearly constitutes' → 'constitutes' or 'likely constitutes'",
      "'clearly inadequate' → 'inadequate' or 'materially below'"
    ]
  }
}
```

#### W4-002: Executive Summary Word Count Reduction
```json
{
  "task_id": "W4-002",
  "wave": 4,
  "priority": "MEDIUM",
  "agent": "memo-executive-summary-writer",
  "estimated_minutes": 75,
  "parallel_group": "W4-LANGUAGE",
  "dependencies": ["W3-001-VALIDATE"],
  "input_file": "final-memorandum-creac.md (lines 74-442)",
  "output_file": "remediation-outputs/W4-002-exec-summary-tightened.md",
  "success_criteria": [
    "Word count reduced from 3,800-4,200 to 3,200-3,500",
    "No loss of critical decision-making information",
    "BLUF remains in first 100 words",
    "All tables preserved"
  ],
  "prompt": {
    "task": "Tighten Executive Summary by 500-700 words without losing substance",
    "focus_cuts": [
      "Section IV: Cross-Domain Impact Analysis (lines 231-292) - reduce from ~1,200 to ~900 words",
      "Section V: Negotiation Position Summary (lines 294-330) - reduce from ~800 to ~600 words"
    ],
    "preserve": [
      "BLUF recommendation",
      "Risk table (Section II)",
      "Exposure analysis",
      "Critical conditions"
    ],
    "strategy": "Remove redundant exposure calculations and detailed negotiation playbook; keep primary findings and connections"
  }
}
```

#### W4-003: Risk Table Standardization
```json
{
  "task_id": "W4-003",
  "wave": 4,
  "priority": "MEDIUM",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 45,
  "parallel_group": "W4-LANGUAGE",
  "dependencies": ["W3-001-VALIDATE"],
  "input_file": "final-memorandum-creac.md (all 12 section risk tables)",
  "output_file": "remediation-outputs/W4-003-table-standardization.md",
  "success_criteria": [
    "All 12 risk tables reformatted to standard format",
    "Column headers consistent: # | Finding | Severity | Probability | Methodology | Gross Exposure | Weighted | Mitigation",
    "All data preserved",
    "Probability basis stated"
  ],
  "prompt": {
    "task": "Standardize risk table format across all 12 sections",
    "standard_format": "| # | Finding | Severity | Probability | Methodology | Gross Exposure | Weighted | Mitigation |",
    "instructions": [
      "Locate risk table in each section (typically in 'C. Risk Assessment' subsection)",
      "Reformat to match standard column structure",
      "Ensure probability basis stated (in cell or footnote)",
      "If data missing, mark [TBD - verify with analyst]"
    ]
  }
}
```

#### W4-004: Methodology Legend Addition
```json
{
  "task_id": "W4-004",
  "wave": 4,
  "priority": "LOW",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 20,
  "parallel_group": "W4-LANGUAGE",
  "dependencies": [],
  "insertion_point": "After Executive Summary Risk Table (after line 148)",
  "output_file": "remediation-outputs/W4-004-methodology-legend.md",
  "success_criteria": [
    "Legend explains NPV, EV, DCF, discount rate basis",
    "Board-accessible language (no jargon)"
  ],
  "prompt": {
    "task": "Draft methodology legend for NPV/EV/DCF abbreviations",
    "content": "Explain: (1) NPV - Net Present Value for perpetual/multi-year liabilities, (2) EV - Expected Value for contingent liabilities, (3) DCF - Discounted Cash Flow for hybrid scenarios, (4) 8% WACC discount rate basis",
    "insertion_point": "After line 148 (Executive Summary Risk Table)"
  }
}
```

#### W4-005: Question 5 Rephrase
```json
{
  "task_id": "W4-005",
  "wave": 4,
  "priority": "LOW",
  "agent": "memo-remediation-writer",
  "estimated_minutes": 30,
  "parallel_group": "W4-LANGUAGE",
  "dependencies": [],
  "target_location": "Questions Presented, Question 5 (lines 556-557)",
  "output_file": "remediation-outputs/W4-005-question-5-rephrase.md",
  "success_criteria": [
    "Embedded conclusion removed ('below the 3-year statutory requirement')",
    "Neutral question framing maintained",
    "Specific facts preserved"
  ],
  "prompt": {
    "task": "Rephrase Question 5 to remove embedded conclusion",
    "current": "Under IRC Section 1061, does Pinnacle's carried interest income qualify for long-term capital gains treatment where the Opportunity Fund hedge fund maintains average holding periods of 6-12 months, below the 3-year statutory requirement?",
    "revised": "Under IRC Section 1061, does Pinnacle's carried interest income qualify for long-term capital gains treatment where the Opportunity Fund maintains average holding periods of 6-12 months?",
    "alternative": "Under IRC Section 1061, does Pinnacle's carried interest income ($23M earned in 2024) qualify for long-term capital gains treatment (20% rate) where the Opportunity Fund maintains average holding periods of 6-12 months?"
  }
}
```

---

## WAVE 5: CITATION CLEANUP
**Parallel**: NO (sequential to avoid file conflicts)
**Gate**: WAVE 4
**Estimated Wall Time**: 1-2 hours

### Tasks

#### W5-001: Missing Verification Tags
```json
{
  "task_id": "W5-001",
  "wave": 5,
  "priority": "HIGH",
  "agent": "citation-validator",
  "estimated_minutes": 60,
  "parallel_group": null,
  "dependencies": ["W4-001", "W4-002", "W4-003"],
  "input_file": "final-memorandum-creac.md (Consolidated Footnotes section)",
  "output_file": "remediation-outputs/W5-001-verification-tags.md",
  "success_criteria": [
    "All 772 footnotes scanned",
    "Footnotes missing verification tags identified (estimated 30-40)",
    "Appropriate tags added ([VERIFIED:], [INFERRED:], [ASSUMED:], [METHODOLOGY:])",
    "Tag rationale provided for each addition"
  ],
  "prompt": {
    "task": "Scan all footnotes for missing verification tags and add appropriate tags",
    "method": [
      "Extract footnotes from Consolidated Footnotes section (lines 10460+)",
      "Check each for verification tag patterns",
      "Identify footnotes without tags",
      "Determine source type and add appropriate tag",
      "Generate report with before/after comparison"
    ],
    "tag_types": [
      "[VERIFIED:url] - independently verifiable source",
      "[VERIFIED:filing] - SEC filing or court document",
      "[INFERRED:precedent] - inferred from case law pattern",
      "[INFERRED:benchmark] - industry benchmark estimate",
      "[ASSUMED:industry] - industry assumption",
      "[METHODOLOGY:estimate] - analyst estimate with methodology"
    ]
  }
}
```

#### W5-002: Verification Tag Enhancement
```json
{
  "task_id": "W5-002",
  "wave": 5,
  "priority": "MEDIUM",
  "agent": "citation-validator",
  "estimated_minutes": 30,
  "parallel_group": null,
  "dependencies": ["W5-001"],
  "input_file": "final-memorandum-creac.md (with W5-001 tags added)",
  "output_file": "remediation-outputs/W5-002-tag-enhancement.md",
  "success_criteria": [
    "20-30 verification tags enhanced with specific URLs/document IDs",
    "Generic [VERIFIED:SEC.gov] → [VERIFIED:https://sec.gov/...]",
    "Before/after comparison provided"
  ],
  "prompt": {
    "task": "Enhance generic verification tags with specific URLs and document IDs",
    "targets": [
      "SEC enforcement releases - add release numbers and URLs",
      "Court opinions - add CourtListener or Google Scholar URLs",
      "Statutes/regulations - ensure specific U.S. Code or CFR citations"
    ],
    "transformation": "Generic: 'SEC Risk Alert [VERIFIED: SEC.gov]' → Enhanced: 'SEC Risk Alert IM-2025-12 (Dec. 15, 2025) [VERIFIED: https://www.sec.gov/files/risk-alert-im-2025-12.pdf]'"
  }
}
```

#### W5-003: Industry Benchmark Tags
```json
{
  "task_id": "W5-003",
  "wave": 5,
  "priority": "LOW",
  "agent": "citation-validator",
  "estimated_minutes": 20,
  "parallel_group": null,
  "dependencies": ["W5-002"],
  "input_file": "final-memorandum-creac.md (with W5-001/W5-002 enhancements)",
  "output_file": "remediation-outputs/W5-003-benchmark-tags.md",
  "success_criteria": [
    "Industry benchmark citations identified",
    "Appropriate tags added based on source availability",
    "Tag types: [VERIFIED:url] (public), [INFERRED:industry report] (proprietary), [METHODOLOGY:basis] (estimate)"
  ],
  "prompt": {
    "task": "Add verification tags to industry benchmark citations",
    "common_patterns": [
      "ACA Group surveys → [INFERRED: industry report, subscription required]",
      "Greenwich Associates studies → [INFERRED: industry report]",
      "Insurance benchmarks → [METHODOLOGY: insurance broker benchmarking data]"
    ]
  }
}
```

---

## WAVE 6: FINAL ASSEMBLY
**Parallel**: NO (sequential integration required)
**Gate**: WAVE 5
**Estimated Wall Time**: 30 minutes

### Task

#### ASSEMBLY-001: Integrate All Remediation Outputs
```json
{
  "task_id": "ASSEMBLY-001",
  "wave": 6,
  "priority": "CRITICAL",
  "agent": "orchestrator",
  "estimated_minutes": 30,
  "parallel_group": null,
  "dependencies": ["W5-001", "W5-002", "W5-003"],
  "input_files": [
    "final-memorandum-creac.md (base document with CREAC headers)",
    "remediation-outputs/W2-001 through W2-003 (counter-analysis)",
    "remediation-outputs/W3-P01 through W3-P17 (contract provisions)",
    "remediation-outputs/W4-001 through W4-005 (language/format fixes)",
    "remediation-outputs/W5-001 through W5-003 (citation enhancements)"
  ],
  "output_file": "final-memorandum-v2.md",
  "success_criteria": [
    "All remediation outputs integrated without conflicts",
    "All 12 sections present",
    "CREAC headers present (minimum 50)",
    "Draft contract provisions present (17 provisions)",
    "No unresolved placeholders",
    "Document renders correctly"
  ],
  "integration_sequence": [
    "1. Start with final-memorandum-creac.md",
    "2. Insert counter-analysis subsections (W2 outputs) in Sections IV.B, IV.E, IV.J",
    "3. Add 'F. Draft Contract Provisions' subsections with W3-P01 through W3-P17 provisions",
    "4. Apply W4 fixes: advocacy removal, exec summary replacement, table standardization, methodology legend, Question 5 rephrase",
    "5. Apply W5 enhancements: update Consolidated Footnotes section with enhanced tags"
  ],
  "quality_checks": [
    "All 12 sections present (IV.A through IV.L)",
    "CREAC headers: minimum 50 detected",
    "Contract provisions: 17 detected",
    "Placeholders: 0 detected ([TBD], [XREF], etc.)",
    "Executive Summary: ≤3,500 words",
    "Risk tables: standardized format",
    "Advocacy language: 'clearly' count = 0",
    "Document renders: no broken markdown"
  ]
}
```

---

## POST-REMEDIATION ACTIONS

### Automatic Quality Re-Assessment
**Trigger**: WAVE 6 complete (ASSEMBLY-001 finished)
**Action**: Orchestrator automatically invokes `memo-qa-diagnostic` on `final-memorandum-v2.md`
**Purpose**: Generate post-remediation diagnostic to measure score improvement

### Expected Post-Remediation Score
| Scenario | Score | Certification | Next Action |
|----------|-------|---------------|-------------|
| **Optimistic** (full remediation) | 93-95% | CERTIFY | Invoke memo-qa-certifier for delivery decision |
| **Base Case** (substantial remediation) | 88-92% | CERTIFY WITH LIMITATIONS | Invoke memo-qa-certifier for delivery decision |
| **Conservative** (partial remediation) | 85-87% | REMEDIATE | Begin cycle 2 with focused remediation |
| **Failure** (major issues remain) | <85% | REMEDIATE or ESCALATE | If cycle ≥2, escalate to HUMAN_REVIEW |

### Cycle Management
```json
{
  "current_cycle": 1,
  "max_cycles": 2,
  "cycle_decision_logic": {
    "if_score_>=_93": "Invoke memo-qa-certifier → CERTIFY",
    "if_score_88_to_92": "Invoke memo-qa-certifier → CERTIFY_WITH_LIMITATIONS",
    "if_score_85_to_87_and_cycle_<_2": "Begin cycle 2 with focused remediation on remaining CRITICAL/HIGH issues",
    "if_score_<_85_and_cycle_<_2": "Begin cycle 2 with comprehensive remediation",
    "if_score_<_88_and_cycle_>=_2": "ESCALATE to HUMAN_REVIEW (max cycles reached)"
  }
}
```

---

## EXECUTION SUMMARY FOR ORCHESTRATOR

### Critical Path
**W1-001/002/003 → W2-001/002/003 → W3-001 → W3-001-VALIDATE → W3-P01-P17 → W4-ALL → W5-ALL → ASSEMBLY-001**

### Parallelization Opportunities
- **W1**: 3 agents parallel (1.5 hours → 0.5 hours wall time)
- **W2**: 4 agents parallel (1.5 hours → 0.5 hours wall time)
- **W3-P01 through P17**: 17 agents parallel (8.5 hours → 0.75 hours wall time)
- **W4**: 5 agents parallel (3 hours → 1.5 hours wall time)

### Estimated Completion Time
- **Sequential Execution**: 19.5-30.5 hours agent time
- **Parallel Execution (optimal)**: 10-14 hours wall time
- **Parallel Execution (realistic)**: 13.5-16.5 hours wall time
- **Expected Delivery**: 2 business days (8 hours/day agent runtime)

### Resource Requirements
- **memo-remediation-writer**: 28 invocations (W2, W3, W4)
- **Research specialists**: 3 invocations (W1)
- **memo-executive-summary-writer**: 1 invocation (W4-002)
- **citation-validator**: 3 invocations (W5)
- **Python script**: 1 execution (W3-001)
- **orchestrator**: Assembly and integration (W6)

### Success Probability
- **High Confidence (80%)**: Score reaches 88-92% (CERTIFY WITH LIMITATIONS)
- **Moderate Confidence (60%)**: Score reaches 93%+ (CERTIFY)
- **Low Risk (15%)**: Score remains <88%, requires cycle 2
- **Very Low Risk (5%)**: Score <85%, escalation may be needed

---

## APPENDIX: TASK DEPENDENCY MATRIX

```
W1-001 ─────────┐
W1-002 ─────────┼─→ W2-001/002/003/004 ──→ W3-001 ──→ W3-001-VALIDATE ──┐
W1-003 ─────────┘                                                        │
                                                                         ├─→ W3-P01..P17 ──┐
                                                                         │                 │
                                                                         └─→ W3-XREF-001 ──┤
                                                                                           │
                                                                                           ├─→ W4-ALL ──→ W5-ALL ──→ ASSEMBLY-001 ──→ QA Pass 2
                                                                                           │
                                                                                           └─→ (optional parallel path)
```

---

**End of Remediation Dispatch**

**Orchestrator Next Actions**:
1. Read this dispatch file
2. Initialize remediation execution tracking (update orchestrator-state.md)
3. Begin Wave 1 task execution (invoke 3 research specialists in parallel)
4. Monitor task completion and trigger dependent waves
5. After Wave 6 complete, invoke memo-qa-diagnostic for Pass 2
6. Based on Pass 2 score, invoke memo-qa-certifier for delivery decision

---
