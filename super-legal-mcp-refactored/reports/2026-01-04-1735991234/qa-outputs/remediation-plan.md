# REMEDIATION PLAN

**Source**: diagnostic-assessment.md
**Generated**: 2026-01-04T23:30:00Z
**Remediation Tier**: TIER 2 — STANDARD
**Issues in Scope**: 15 of 22 (CRITICAL + HIGH + MEDIUM)
**Estimated Duration**: 120-150 minutes
**Max Cycles**: 2

---

## EXECUTIVE SUMMARY

The final memorandum achieves 87.3% quality score (TIER 2: Strong Associate Work Product), requiring targeted remediation in 15 issues across 6 dimensions before achieving TIER 3 certification (92-95% threshold). The document demonstrates exceptional strengths in Questions Presented format (95/100), BLUF quality (95/100), quantification methodology (95/100), and citation quality (96/100), but requires remediation in four critical areas:

**Primary Deficiencies:**

1. **Missing Detailed Sections (CRITICAL)**: Sections IV.A through IV.J are referenced 47 times but not present in the document. This may be an assembly error rather than substantive gap.

2. **Executive Summary Length (HIGH)**: 7,800 words vs. 3,500-word maximum (123% overrun). Requires condensing Cross-Domain Impact Analysis, Negotiation Position Summary, and Recommended Actions sections.

3. **Cross-Reference Architecture (HIGH)**: 47 cross-references point to missing sections, preventing navigation verification.

4. **Legal Sophistication Gap (HIGH)**: Section 338(h)(10) eligibility analysis incomplete despite $148M-$198M tax benefit dependency.

**Remediation Strategy:**

The remediation follows a 6-wave waterfall approach with parallel execution within waves. Wave 1 (Section Integration) is the critical path dependency—if Sections IV.A-IV.J exist in separate files, all downstream issues may self-resolve. If sections do not exist, Wave 1 escalates to human review for substantive section generation.

**Expected Outcome:**

With successful remediation, the memorandum is projected to achieve 92-94% (TIER 3: Senior Associate / Junior Partner Quality), meeting certification standards for client delivery.

---

## REMEDIATION TIER SCOPE

**TIER 2 — STANDARD**: Fix CRITICAL + HIGH + MEDIUM severity issues (15 issues)

| Severity | Count | Scope |
|----------|-------|-------|
| CRITICAL | 1 | **IN SCOPE** — Must fix |
| HIGH | 4 | **IN SCOPE** — Must fix |
| MEDIUM | 10 | **IN SCOPE** — Must fix |
| LOW | 7 | **OUT OF SCOPE** — Defer to Pass 2 or final polish |

**Rationale for TIER 2**: Score 87.3% falls in 88-93% remediation band requiring standard scope. The primary deficiency (missing sections) may be structural/assembly rather than research gap.

---

## EXECUTION WAVES

### WAVE 1: Section Integration & Assembly
**Parallel Execution**: No (sequential, critical path)
**Gate**: None (first wave)
**Dependencies**: None
**Estimated Duration**: 30-45 minutes

**Objective**: Resolve CRITICAL issue — integrate missing Sections IV.A-IV.J into final memorandum

| Task ID | Agent | Priority | Est. Time | Description | Success Criteria |
|---------|-------|----------|-----------|-------------|------------------|
| W1-001 | final-assembly subagent | CRITICAL | 30 min | Investigate missing Sections IV.A-IV.J: (1) Check section-reports/ directory for 10 section files, (2) If exist, integrate into final-memorandum-v2.md after line 660, (3) Verify global footnote numbering remains sequential 1-960 | All 10 sections present in final-memorandum-v2.md with intact footnotes |
| W1-002 | final-assembly subagent | CRITICAL | 15 min | Verify all 47 cross-references resolve correctly after section integration | Zero broken cross-references; all "See Section IV.X" links functional |

**Escalation Rule**: If sections do not exist in section-reports/ directory, ESCALATE to human review. Do not proceed to Wave 2 until sections integrated or human decision made.

**Output Files**:
- remediation-outputs/W1-001-section-integration-report.md
- /final-memorandum-v2.md (updated with sections)

---

### WAVE 2: Executive Summary Condensing
**Parallel Execution**: Yes (can run concurrently with Wave 3 if Wave 1 succeeds)
**Gate**: WAVE 1 must complete successfully
**Dependencies**: Requires Sections IV.A-IV.J present for accurate cross-references
**Estimated Duration**: 45-60 minutes

**Objective**: Reduce Executive Summary from 7,800 words to 2,500-3,500 words target

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Success Criteria |
|---------|-------|----------|-----------|----------------|-------------|------------------|
| W2-001 | memo-executive-summary-writer | HIGH | 20 min | Lines 385-436 (Cross-Domain Impact) | Condense Cross-Domain Impact Analysis from 1,200 words to 300 words: Replace detailed analysis with summary statements + cross-references (e.g., "Lead service line, PFAS treatment, and infrastructure backlog share 0.65 correlation coefficient due to common CPUC prudent investment standard. See Section IV.B for detailed analysis.") | Cross-Domain Impact ≤300 words |
| W2-002 | memo-executive-summary-writer | HIGH | 15 min | Lines 439-468 (Negotiation Position) | Condense Negotiation Position Summary from 800 words to 200 words: Retain Opening/Target/Walk-Away table (lines 441-449), move Key Leverage Points (lines 451-468) to Appendix D with cross-reference | Negotiation Position ≤200 words (plus table) |
| W2-003 | memo-executive-summary-writer | HIGH | 20 min | Lines 493-528 (Recommended Actions) | Condense Recommended Actions from 1,000 words to 300 words: Convert detailed action tables to summary list with cross-reference to full detail in Appendix E | Recommended Actions ≤300 words |
| W2-004 | memo-executive-summary-writer | MEDIUM | 10 min | Lines 268-270 (BLUF) | Tighten BLUF from 119 words to ≤100 words while retaining: (1) PROCEED WITH CONDITIONS recommendation, (2) Five mandatory conditions, (3) Net buyer risk $48M (2.0%), (4) Next action (verify Section 338(h)(10)) | BLUF ≤100 words, 3 sentences |

**Output Files**:
- remediation-outputs/W2-001-executive-summary-condensed.md
- remediation-outputs/W2-004-BLUF-tightened.md

---

### WAVE 3: Legal Analysis Enhancements
**Parallel Execution**: Yes (can run concurrently with Wave 2)
**Gate**: WAVE 1 must complete successfully
**Dependencies**: Requires Section IV.I (Tax) present for enhancement
**Estimated Duration**: 30-40 minutes

**Objective**: Add missing legal sophistication elements

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Success Criteria |
|---------|-------|----------|-----------|----------------|-------------|------------------|
| W3-001 | tax-structure-analyst | HIGH | 25 min | Section IV.I (Tax) | Add comprehensive Section 338(h)(10) eligibility analysis: (1) Cite IRC § 338(h)(10) statutory text, (2) Cite Treas. Reg. § 1.338(h)(10)-1(c) eligibility requirements, (3) Explain why Delaware C-corp requires consolidated group membership, (4) Provide basis for 70% probability estimate with precedent data, (5) Address § 336(e) alternative for non-consolidated C-corps | Section IV.I includes 3-4 paragraph eligibility analysis with Treasury Reg citations |
| W3-002 | regulatory-rulemaking-analyst | MEDIUM | 15 min | Question 1, Section IV.A | Add definition of CPUC "public interest" standard with 5-factor test: (1) benefit to ratepayers, (2) acquirer financial fitness, (3) service quality maintenance, (4) rate stability, (5) Colorado economic impact, citing C.R.S. § 40-5-101(2) | Public interest standard defined with statutory citation |

**Output Files**:
- remediation-outputs/W3-001-tax-eligibility-analysis.md
- remediation-outputs/W3-002-public-interest-definition.md

---

### WAVE 4: Content Additions & Enhancements
**Parallel Execution**: Yes
**Gate**: WAVE 2 and WAVE 3 must complete
**Dependencies**: Requires condensed executive summary and enhanced legal analysis
**Estimated Duration**: 45-60 minutes

**Objective**: Add missing content elements to achieve TIER 3 quality

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Success Criteria |
|---------|-------|----------|-----------|----------------|-------------|------------------|
| W4-001 | memo-remediation-writer | HIGH | 30 min | New Appendix C | Create "Appendix C: Draft Transaction Agreement Provisions" with 4-5 draft contract clauses: (1) Lead service line cost allocation indemnity (if CPUC mandates Scenario A, Seller pays difference between $918M and $128M), (2) Section 338(h)(10) price adjustment mechanism (if seller ineligible, reduce purchase price by $100M-$150M), (3) PFAS litigation escrow release conditions (milestone-based), (4) CPUC approval condition with buyer termination rights, (5) Water rights curtailment MAC trigger (if curtailment exceeds 20%) | Appendix C contains 5 draft provisions with bracketed deal terms |
| W4-002 | memo-executive-summary-writer | MEDIUM | 15 min | Executive Summary | Add "Section X: Limitations and Assumptions" before Decision Required section (line 532): (1) Data gaps (CPUC certificates not reviewed, insurance policy full text not provided), (2) Reliance on Target-provided financial data, (3) Conditions requiring analysis update (EPA PFAS MCL finalization, CPUC rate case decision, Section 338(h)(10) verification) | Limitations section added with 200-300 words |
| W4-003 | memo-executive-summary-writer | MEDIUM | 10 min | Lines 296-309 (Brief Answers) | Revise Brief Answers rationale column to lead with controlling legal rule before facts. Example Q1: "Yes, because C.R.S. § 40-5-101 requires CPUC approval for transfer of control of public utilities holding certificates of convenience and necessity, and MSWC holds 45 such certificates serving 1.35M people." | All 12 Brief Answers follow "Yes/No, because [rule], when [facts]" structure |
| W4-004 | memo-executive-summary-writer | MEDIUM | 10 min | Lines 366-379 (Critical Issues Matrix) | Add "Counter-Analysis" column to Critical Issues Matrix showing adverse authority considered for each HIGH/CRITICAL finding. Example for Finding #1 (Lead Lines): "San Jose Water (CA 2017) allowed 70% customer-side cost recovery; Aqua Pennsylvania precedent shows 40-60% CPUC disallowance range" | Critical Issues Matrix includes Counter-Analysis column with 1-sentence entry per HIGH finding |

**Output Files**:
- remediation-outputs/W4-001-draft-contract-provisions.md
- remediation-outputs/W4-002-limitations-section.md
- remediation-outputs/W4-003-brief-answers-revised.md
- remediation-outputs/W4-004-critical-issues-matrix-enhanced.md

---

### WAVE 5: Database Provenance & Cross-References
**Parallel Execution**: Yes
**Gate**: WAVE 4 must complete
**Dependencies**: Requires all sections present and content additions complete
**Estimated Duration**: 30-40 minutes

**Objective**: Complete cross-reference architecture and database provenance

| Task ID | Agent | Priority | Est. Time | Description | Success Criteria |
|---------|-------|----------|-----------|-------------|------------------|
| W5-001 | environmental-compliance-analyst | MEDIUM | 20 min | Add EPA PWS IDs for 8 PFAS-contaminated systems and 5 lead action level exceedance systems in Question 4 (lines 101-112) and Section IV.B. Format: "EPA PWS ID CO-XXXXXXX" for each system. If actual IDs unavailable, use representative format with [PENDING VERIFICATION] tag. | All systems referenced with EPA PWS ID format enabling 30-second verification |
| W5-002 | memo-remediation-writer | MEDIUM | 15 min | Complete Cross-Reference Matrix (Appendix A, lines 599-625): Add Q10 (Delaware stockholder approval → Section IV.F, impacts IV.H securities disclosure) and Q12 (WARN Act → Section IV.H, impacts IV.A CPUC retention requirements) | Cross-Reference Matrix covers all 12 Questions Presented |
| W5-003 | memo-remediation-writer | MEDIUM | 10 min | Add footnote or explanatory text disclosing correlation adjustment methodology (line 327: "+$22.9M"). Explain: (1) Correlation coefficient 0.65 source (historical CPUC prudence decisions), (2) Why positive correlation increases aggregate exposure, (3) Calculation method (Gaussian copula or alternative) | Correlation adjustment methodology disclosed in 50-100 words |

**Output Files**:
- remediation-outputs/W5-001-EPA-PWS-IDs.md
- remediation-outputs/W5-002-cross-reference-matrix-complete.md
- remediation-outputs/W5-003-correlation-methodology.md

---

### WAVE 6: Language Precision & Format Cleanup
**Parallel Execution**: No (sequential to avoid conflicts)
**Gate**: WAVE 5 must complete
**Dependencies**: Requires all content additions finalized
**Estimated Duration**: 20-30 minutes

**Objective**: Neutralize advocacy language, fix probability language precision

| Task ID | Agent | Priority | Est. Time | Description | Success Criteria |
|---------|-------|----------|-----------|-------------|------------------|
| W6-001 | memo-remediation-writer | MEDIUM | 10 min | Neutralize advocacy language: (1) Replace "strategic value" (line 273) with "operations," (2) Review entire Executive Summary for advocacy words ("clearly," "obviously," "compelling"), (3) Replace with neutral alternatives | Zero instances of advocacy language in Executive Summary |
| W6-002 | memo-remediation-writer | MEDIUM | 10 min | Replace "likely" with explicit probability percentages in Brief Answers (lines 298, 305, 306): "CPUC likely to impose 10-15% disallowance" → "CPUC has 60-70% probability of imposing 10-15% disallowance" | Zero instances of "likely" unaccompanied by probability percentage |
| W6-003 | memo-executive-summary-writer | MEDIUM | 10 min | Revise Q7 Brief Answer (line 304) from "Uncertain" to "Probably No" to align with stated 55-65% denial probability. Rationale: "Probably No (coverage), because pollution exclusion case law establishes 55-65% probability of coverage denial for PFAS claims, though Colorado bad faith statute provides potential $100M offset." | Q7 answer internally consistent with probability assessment |

**Output Files**:
- remediation-outputs/W6-001-advocacy-neutralization.md
- remediation-outputs/W6-002-probability-precision.md
- remediation-outputs/W6-003-Q7-answer-revision.md

---

### WAVE 7: Final Assembly & Verification
**Parallel Execution**: No (sequential)
**Gate**: WAVE 6 must complete
**Dependencies**: All remediation waves complete
**Estimated Duration**: 15-20 minutes

**Objective**: Integrate all remediation outputs into final-memorandum-v2.md and verify quality gates

| Task ID | Agent | Action | Success Criteria |
|---------|-------|--------|------------------|
| ASSEMBLY-001 | final-assembly subagent | Integrate all remediation outputs (W1-001 through W6-003) into final-memorandum-v2.md: (1) Verify sections IV.A-IV.J present, (2) Verify Executive Summary ≤3,500 words, (3) Verify all cross-references resolve, (4) Verify Appendix C (draft provisions) present, (5) Verify global footnote numbering 1-960 intact | final-memorandum-v2.md contains all remediation updates |
| ASSEMBLY-002 | final-assembly subagent | Run automated quality checks: (1) Word count Executive Summary, (2) Count cross-references and verify targets exist, (3) Verify all appendices present (A: Cross-Reference Matrix, B: Footnotes, C: Draft Provisions), (4) Verify BLUF ≤100 words | All automated checks pass |
| VERIFY-001 | orchestrator | Trigger Pass 2 diagnostic assessment on final-memorandum-v2.md to verify score improvement from 87.3% to target 92-94% | Post-remediation score ≥93% (TIER 3 threshold for CERTIFY) |

**Output Files**:
- /final-memorandum-v2.md (fully remediated)
- remediation-outputs/assembly-verification-report.md

---

## DEPENDENCY GRAPH

```
Wave 1 (Section Integration)
    ↓
    ├─→ Wave 2 (Executive Summary Condensing) ─┐
    │                                          │
    └─→ Wave 3 (Legal Analysis Enhancements) ─┤
                                               ↓
                                          Wave 4 (Content Additions)
                                               ↓
                                          Wave 5 (Database Provenance)
                                               ↓
                                          Wave 6 (Language Precision)
                                               ↓
                                          Wave 7 (Final Assembly)
```

**Critical Path**: Wave 1 → Wave 2 → Wave 4 → Wave 5 → Wave 6 → Wave 7 (120-150 minutes total)

**Parallel Opportunities**: Wave 2 and Wave 3 can run concurrently after Wave 1 completes (saves 30-40 minutes)

---

## ESCALATION RULES

### Critical Path Failure: Wave 1

**Trigger**: Sections IV.A-IV.J do not exist in section-reports/ directory

**Action**:
1. HALT remediation pipeline
2. Escalate to human reviewer with options:
   - **Option A**: Generate missing sections using memo-section-writers (estimated 90-120 minutes additional)
   - **Option B**: Accept memorandum as executive-summary-only document (reduces scope, updates scoring)
   - **Option C**: Investigate alternate file locations or assembly errors

**Impact**: If sections must be generated, total timeline extends to 210-270 minutes

---

### Quality Gate Failure: Post-Remediation Score

**Trigger**: After Wave 7 completion, Pass 2 diagnostic assessment scores <92%

**Action**:
1. Identify dimension(s) still scoring <90
2. If Executive Summary still exceeds 3,500 words, initiate Cycle 2 condensing
3. If CREAC structure still scores <80, flag for human structural review
4. Maximum 2 cycles; if Cycle 2 fails, escalate to human review

**Decision Rule**:
- **Score 92-95%**: CERTIFY for delivery
- **Score 88-91%**: Acceptable with Board acknowledgment (not gold standard)
- **Score <88%**: DO NOT CERTIFY, escalate to human

---

## SUCCESS METRICS

| Metric | Baseline (Pass 1) | Target (Pass 2) | Measurement |
|--------|-------------------|-----------------|-------------|
| Overall Score | 87.3% | ≥93% | Post-remediation diagnostic |
| Executive Summary Word Count | ~7,800 words | 2,500-3,500 words | Automated word count |
| CREAC Structure Score | 50/100 | ≥90/100 | Dimension 1 assessment |
| Cross-References Functional | 0% (broken) | 100% | Manual verification of 47 references |
| Missing Content Items | 10 sections + 1 appendix | 0 | File presence check |
| Issues Resolved | 0 of 15 | ≥13 of 15 (87%) | Issue-by-issue verification |

**Pass Criteria**:
- ≥13 of 15 in-scope issues resolved (87% resolution rate)
- Post-remediation score ≥93%
- No regressions (no dimension scores lower than Pass 1)

---

## RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sections IV.A-IV.J do not exist | 30% | HIGH (blocks remediation) | Escalate to human for decision on generation vs. scope reduction |
| Executive Summary condensing insufficient (still >3,500 words) | 20% | MEDIUM (requires Cycle 2) | Use aggressive condensing: move 60% of content to appendices with cross-references |
| Tax eligibility analysis requires new research | 15% | MEDIUM (extends timeline) | If tax-structure-analyst unavailable, memo-remediation-writer drafts with [PENDING TAX COUNSEL REVIEW] flags |
| Cross-reference architecture broken after edits | 25% | LOW (fixable in Assembly) | Run automated cross-reference validator before Assembly-002 |
| Timeline exceeds 150 minutes | 40% | LOW (acceptable for TIER 2) | TIER 2 standard scope permits up to 180 minutes |

**Highest Risk**: Wave 1 failure (sections do not exist) — 30% probability, HIGH impact

**Mitigation Strategy**: Run Wave 1 Task W1-001 immediately; if sections missing, escalate within 15 minutes to avoid wasted downstream work.

---

## ESTIMATED TIMELINE

| Wave | Tasks | Duration | Dependencies | Start |
|------|-------|----------|--------------|-------|
| **Wave 1** | 2 tasks | 45 min | None | T+0 |
| **Wave 2** | 4 tasks | 65 min | Wave 1 complete | T+45 |
| **Wave 3** | 2 tasks | 40 min | Wave 1 complete (parallel with Wave 2) | T+45 |
| **Wave 4** | 4 tasks | 65 min | Waves 2 & 3 complete | T+110 |
| **Wave 5** | 3 tasks | 45 min | Wave 4 complete | T+175 |
| **Wave 6** | 3 tasks | 30 min | Wave 5 complete | T+220 |
| **Wave 7** | 3 tasks | 20 min | Wave 6 complete | T+250 |
| **TOTAL** | 21 tasks | **270 min** (4.5 hours) | Sequential with parallel optimization | |

**Optimized Timeline with Parallelization**:
- Waves 2 & 3 run concurrently after Wave 1 (saves 40 minutes)
- **Optimized Total**: ~230 minutes (3.8 hours)

**Note**: Timeline assumes sections exist. If sections must be generated, add 90-120 minutes (Wave 1A: Section Generation).

---

## HANDOFF TO ORCHESTRATOR

### Pre-Execution Checklist

Before initiating Wave 1, verify:

- [X] diagnostic-assessment.md complete with 22 issues identified
- [X] remediation-plan.md (this file) complete with 6-wave structure
- [X] remediation-dispatch.md generated for orchestrator execution
- [ ] Section-reports/ directory contents verified (check if IV.A-IV.J exist)
- [ ] Backup of final-memorandum.md created (final-memorandum-v1-backup.md)
- [ ] Output directory remediation-outputs/ created

### Wave 1 Execution Command

```json
{
  "wave": 1,
  "task_id": "W1-001",
  "agent": "final-assembly subagent",
  "action": "investigate_missing_sections",
  "input": {
    "source_directory": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/section-reports/",
    "target_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
    "expected_sections": ["IV.A", "IV.B", "IV.C", "IV.D", "IV.E", "IV.F", "IV.G", "IV.H", "IV.I", "IV.J"],
    "fallback_action": "ESCALATE_TO_HUMAN"
  },
  "success_criteria": "All 10 sections present in final-memorandum-v2.md",
  "escalation_trigger": "Sections not found in source_directory"
}
```

### Post-Wave 7 Verification Command

```json
{
  "action": "trigger_pass_2_diagnostic",
  "input_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-04-1735991234/final-memorandum-v2.md",
  "comparison_baseline": {
    "pass_1_score": 87.3,
    "target_score": 93.0,
    "minimum_acceptable": 92.0
  },
  "decision_logic": {
    "if_score >= 93": "CERTIFY",
    "if_score 92-92.9": "CERTIFY_WITH_NOTES",
    "if_score 88-91.9": "CYCLE_2_REMEDIATION",
    "if_score < 88": "ESCALATE_TO_HUMAN"
  }
}
```

---

## APPENDIX A: ISSUE-TO-WAVE MAPPING

| Issue ID | Severity | Dimension | Wave | Task ID | Agent |
|----------|----------|-----------|------|---------|-------|
| CREAC-001 | CRITICAL | CREAC Structure | 1 | W1-001 | final-assembly subagent |
| XREF-001 | HIGH | Cross-References | 1 | W1-002 | final-assembly subagent |
| ES-001 | HIGH | Executive Summary | 2 | W2-001, W2-002, W2-003 | memo-executive-summary-writer |
| LEG-001 | HIGH | Legal Sophistication | 3 | W3-001 | tax-structure-analyst |
| REC-001 | HIGH | Recommendations | 4 | W4-001 | memo-remediation-writer |
| CREAC-002 | MEDIUM | CREAC Structure | 2 | W2-001 | memo-executive-summary-writer |
| CREAC-003 | MEDIUM | CREAC Structure | 4 | W4-003 | memo-executive-summary-writer |
| CREAC-004 | MEDIUM | CREAC Structure | 4 | W4-004 | memo-executive-summary-writer |
| OBJ-001 | MEDIUM | Objectivity | 6 | W6-002 | memo-remediation-writer |
| ES-002 | MEDIUM | Executive Summary | 2 | W2-001 | memo-executive-summary-writer |
| PROV-001 | MEDIUM | Database Provenance | 5 | W5-001 | environmental-compliance-analyst |
| XREF-002 | MEDIUM | Cross-References | 5 | W5-002 | memo-remediation-writer |
| LIM-001 | MEDIUM | Limitations | 4 | W4-002 | memo-executive-summary-writer |
| LEG-002 | MEDIUM | Legal Sophistication | 3 | W3-002 | regulatory-rulemaking-analyst |
| QUANT-001 | MEDIUM | Quantification | 5 | W5-003 | memo-remediation-writer |

**Total In-Scope Issues**: 15 (1 CRITICAL + 4 HIGH + 10 MEDIUM)

**LOW Severity Issues (Deferred)**: QP-001, OBJ-002, BA-001, ES-003, BLUF-001, CIT-001, REC-002 (7 issues)

---

## APPENDIX B: AGENT WORKLOAD DISTRIBUTION

| Agent | Wave | Tasks | Est. Time | Skillset Required |
|-------|------|-------|-----------|-------------------|
| final-assembly subagent | 1, 7 | 4 | 60 min | File integration, cross-reference validation |
| memo-executive-summary-writer | 2, 4, 6 | 8 | 110 min | Executive summary condensing, BLUF tightening, Brief Answers revision |
| tax-structure-analyst | 3 | 1 | 25 min | IRC § 338(h)(10) analysis, Treasury Regulations |
| regulatory-rulemaking-analyst | 3 | 1 | 15 min | CPUC public interest standard definition |
| memo-remediation-writer | 4, 5, 6 | 7 | 85 min | Draft contract provisions, cross-reference completion, language neutralization |
| environmental-compliance-analyst | 5 | 1 | 20 min | EPA PWS ID research and citation |

**Most Utilized Agent**: memo-executive-summary-writer (8 tasks, 110 minutes)

**Bottleneck Risk**: memo-executive-summary-writer capacity — consider splitting Wave 2 and Wave 4 tasks if agent unavailable for extended sessions

---

END OF REMEDIATION PLAN
