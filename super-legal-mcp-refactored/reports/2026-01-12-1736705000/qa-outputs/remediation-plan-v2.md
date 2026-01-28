# REMEDIATION PLAN - FINAL MEMORANDUM V2

**Source**: diagnostic-assessment-v2.md
**Generated**: January 13, 2026
**Remediation Tier**: TIER_2_STANDARD — STANDARD REMEDIATION
**Issues in Scope**: 25 of 35 (CRITICAL + HIGH + MEDIUM; LOW deferred)
**Estimated Duration**: 480 minutes (8 hours)

---

## Execution Strategy

This remediation plan addresses **25 issues** across 6 execution waves. LOW severity issues (10 total) are DEFERRED as efficiency trade-off to achieve 94%+ score faster.

**Target Post-Remediation Score**: 94-96% (TIER 3: Senior Associate/Junior Partner Quality)

**Max Cycles**: 2 (if issues persist after first remediation, second cycle initiated)

**Escalation Trigger**: Same issue unresolved after 2 cycles flags for human review

---

## Execution Waves

### Wave 1: Additional Research
**Parallel Execution**: YES
**Gate**: None (first wave)
**Est. Duration**: 90 minutes

| Task ID | Agent | Priority | Est. Time | Description |
|---------|-------|----------|-----------|-------------|
| W1-001 | research-specialist-antitrust | HIGH | 60 min | Create Section IV.K: Antitrust and HSR Compliance with filing threshold analysis, waiting period, Second Request probability, competitive overlap assessment |
| W1-002 | citation-validator | HIGH | 30 min | Research and verify 100 [INFERRED]/[PENDING VERIFICATION] citations; obtain EPA ECHO IDs, FMC docket numbers, precedent transaction deal identifiers |

---

### Wave 2: Content Additions
**Parallel Execution**: YES
**Gate**: Wave 1 must complete
**Est. Duration**: 120 minutes

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Output File |
|---------|-------|----------|-----------|----------------|-------------|-------------|
| W2-001 | memo-remediation-writer | HIGH | 30 min | Sections III.C, III.D, III.G, III.I | Expand Counter-Analysis subsections to include minimum 2-3 substantive counter-arguments with detailed rebuttals (3-5 paragraphs each) | remediation-outputs/W2-001.md |
| W2-002 | research-specialist-section-905b | HIGH | 20 min | Section III.I | Research Ninth Circuit decisions on Section 905(b) dual capacity doctrine 2020-2026; add circuit-specific analysis | remediation-outputs/W2-002.md |
| W2-003 | research-specialist-jones-act | HIGH | 20 min | Section III.B | Verify Jones Act crew citizenship cases remain good law; add currency notes for pre-2024 cases | remediation-outputs/W2-003.md |
| W2-004 | citation-validator | HIGH | 30 min | All sections | Add specific facility IDs: EPA ECHO IDs for Seattle/Oakland terminals, FMC docket numbers for 12 complaints, USCG vessel numbers for Pacific Guardian/Shield | remediation-outputs/W2-004.md |
| W2-005 | memo-remediation-writer | MEDIUM | 20 min | Section II | Add explicit risk rating methodology: "CRITICAL (>75%), HIGH (40-75%), MEDIUM (15-40%), LOW (<15%); $2.05B/4.8B = 43% = HIGH" | remediation-outputs/W2-005.md |

---

### Wave 3: Structural Fixes
**Parallel Execution**: YES
**Gate**: Wave 2 must complete
**Est. Duration**: 120 minutes

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Output File |
|---------|-------|----------|-----------|----------------|-------------|-------------|
| W3-001 | memo-remediation-writer | HIGH | 60 min | All 10 sections | Add explicit CREAC labels (**Conclusion:**, **Rule:**, **Explanation:**, **Application:**) to all risk assessment subsections (B.1, B.2, B.3 in each section) | remediation-outputs/W3-001.md |
| W3-002 | memo-remediation-writer | HIGH | 30 min | Sections III.C, III.G, III.H | Restructure from IRAC to CREAC: Move conclusions from end to beginning of subsections B.1, B.2, B.3; no content changes, only reordering | remediation-outputs/W3-002.md |
| W3-003 | memo-remediation-writer | MEDIUM | 30 min | Sections III.A, III.B, III.E, III.F, III.G, III.J | Remove client facts from Explanation sections; move all PMSC-specific analysis to Application sections; Explanation should discuss only case-to-case comparisons | remediation-outputs/W3-003.md |

---

### Wave 4: Language/Format Fixes
**Parallel Execution**: YES
**Gate**: Wave 3 must complete
**Est. Duration**: 60 minutes

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Output File |
|---------|-------|----------|-----------|----------------|-------------|-------------|
| W4-001 | memo-remediation-writer | HIGH | 10 min | Sections III.F, III.J | Remove 2 instances of advocacy language ("clearly"); replace with neutral alternatives ("demonstrates," "indicates") | remediation-outputs/W4-001.md |
| W4-002 | memo-remediation-writer | HIGH | 20 min | Section I | Trim Executive Summary from ~4,200 words to 3,000-3,500 words; condense Cross-Domain Impact Analysis and Timeline sections while retaining all critical findings | remediation-outputs/W4-002.md |
| W4-003 | memo-remediation-writer | HIGH | 15 min | Sections III.E, III.I | Label perpetual liabilities clearly: "$28.5M-$57M annually = $356M-$713M NPV (10-year at 8%)" in first presentation; add footnote explaining NPV conversion | remediation-outputs/W4-003.md |
| W4-004 | memo-remediation-writer | MEDIUM | 15 min | Section II | Add WACC derivation footnote: "8% WACC derived from [calculation] OR represents maritime shipping industry standard (cite Damodaran or similar)"; include sensitivity analysis at 6%/10% | remediation-outputs/W4-004.md |

---

### Wave 5: Citation Cleanup
**Parallel Execution**: NO (sequential to avoid conflicts)
**Gate**: Wave 4 must complete
**Est. Duration**: 90 minutes

| Task ID | Agent | Priority | Est. Time | Description | Output File |
|---------|-------|----------|-----------|-------------|-------------|
| W5-001 | citation-validator | HIGH | 30 min | Add pincites to 40+ case citations lacking specific page references; format: "Source, Volume Reporter Starting Page, Pincite (Year)" | remediation-outputs/W5-001.md |
| W5-002 | citation-validator | HIGH | 30 min | Convert all inline bracketed citations to Bluebook superscript format; move full citations to Section Footnotes subsections with sequential numbering | remediation-outputs/W5-002.md |
| W5-003 | citation-validator | HIGH | 15 min | Add explanatory parentheticals to 15+ case citations where relevance non-obvious; format: "(holding that [specific relevant holding])" | remediation-outputs/W5-003.md |
| W5-004 | citation-validator | MEDIUM | 15 min | Add Bluebook signals (See, See also, Cf., But see) throughout document per Rule 1.2; spot-check 20% for accuracy | remediation-outputs/W5-004.md |

---

### Wave 6: Final Assembly
**Parallel Execution**: NO (sequential)
**Gate**: Wave 5 must complete
**Est. Duration**: Orchestrator-managed

| Task ID | Agent | Action |
|---------|-------|--------|
| ASSEMBLY-001 | orchestrator | Integrate all remediation outputs from W1-W5 into final-memorandum-v3.md; verify no regressions; run QA pass 2 |

---

## Dependency Graph

```
Wave 1 (Research)
  ├── W1-001: Antitrust section ──┐
  └── W1-002: Citation verification ──┤
                                      │
                                      ▼
Wave 2 (Content Additions)              │
  ├── W2-001: Counter-analysis expansion │
  ├── W2-002: Circuit split research    │
  ├── W2-003: Case law currency         │
  ├── W2-004: Facility IDs              │
  └── W2-005: Risk rating methodology   │
                                      │
                                      ▼
Wave 3 (Structural Fixes)               │
  ├── W3-001: CREAC labels              │
  ├── W3-002: IRAC to CREAC restructure │
  └── W3-003: Client facts removal      │
                                      │
                                      ▼
Wave 4 (Language/Format)                │
  ├── W4-001: Remove advocacy language  │
  ├── W4-002: Trim exec summary         │
  ├── W4-003: Perpetual liability labels│
  └── W4-004: WACC derivation           │
                                      │
                                      ▼
Wave 5 (Citation Cleanup)               │
  ├── W5-001: Add pincites              │
  ├── W5-002: Bluebook conversion       │
  ├── W5-003: Explanatory parentheticals│
  └── W5-004: Bluebook signals          │
                                      │
                                      ▼
Wave 6 (Assembly)                       │
  └── ASSEMBLY-001: Integrate all changes
```

---

## Issue-to-Task Mapping

### HIGH Priority Issues (15 total)

| Issue ID | Description | Wave | Task ID(s) |
|----------|-------------|------|------------|
| CREAC-H-001 | Missing CREAC labels | Wave 3 | W3-001 |
| CREAC-H-002 | Counter-Analysis shallow | Wave 2 | W2-001 |
| PROV-H-003 | 100 unverified citations | Wave 1, Wave 2 | W1-002, W2-004 |
| CIT-H-004 | Missing pincites | Wave 5 | W5-001 |
| CIT-H-005 | Non-Bluebook format | Wave 5 | W5-002 |
| LEGAL-H-006 | Missing Antitrust section | Wave 1 | W1-001 |
| LEGAL-H-007 | Outdated case law | Wave 2 | W2-003 |
| PROV-H-008 | No facility IDs | Wave 2 | W2-004 |
| EXEC-H-009 | Exec summary too long | Wave 4 | W4-002 |
| OBJ-H-010 | Advocacy language | Wave 4 | W4-001 |
| QUANT-H-011 | Perpetual liability labels | Wave 4 | W4-003 |
| CIT-H-012 | Missing parentheticals | Wave 5 | W5-003 |
| CREAC-H-013 | IRAC not CREAC (3 sections) | Wave 3 | W3-002 |
| PROV-H-014 | Precedent transaction IDs | Wave 1 | W1-002 |
| LEGAL-H-015 | Circuit split missing | Wave 2 | W2-002 |

### MEDIUM Priority Issues (10 total)

| Issue ID | Description | Wave | Task ID(s) |
|----------|-------------|------|------------|
| CREAC-M-001 | Client facts in Explanation | Wave 3 | W3-003 |
| CIT-M-002 | Inconsistent signals | Wave 5 | W5-004 |
| PROV-M-003 | Proxy data methodology | Wave 2 | W2-004 |
| QUANT-M-004 | WACC not derived | Wave 4 | W4-004 |
| EXEC-M-005 | Risk rating rationale | Wave 2 | W2-005 |
| OBJ-M-006 | Probability skew | Deferred (would require re-analysis) |
| CREAC-M-007 | Weaker fact comparisons | Deferred (addressed by W3-003) |
| CIT-M-008 | Incomplete full citations | Wave 5 | W5-004 |
| PROV-M-009 | Settlement dates missing | Wave 2 | W2-004 |
| LEGAL-M-010 | Jones Act timing xref | Deferred (minor precision issue) |

### LOW Priority Issues (10 total)
**All LOW issues DEFERRED** for efficiency. Post-TIER 3 achievement, these can be addressed in polish phase.

---

## Escalation Rules

- **Max Cycles**: 2
- **Escalation Trigger**: Same issue unresolved after 2 cycles
- **Escalation Action**: Flag for human review with diagnostic report

**Example**: If W3-001 (CREAC labels) completed but QA Pass 2 still detects missing labels in 2+ sections, issue escalates to human reviewer with specific section references.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Issues Resolved | ≥90% of in-scope issues (23 of 25) |
| Post-Remediation Score | ≥93% for CERTIFY eligibility |
| No Regressions | Pass 2 score ≥ Pass 1 score (91.5%) |
| Time to Completion | ≤10 hours (including QA Pass 2) |

---

## Wave Execution Notes

**Wave 1**: Can begin immediately; no dependencies. Research tasks should provide output files containing:
- W1-001: Complete Section IV.K draft (3,000+ words, CREAC structure)
- W1-002: Verification matrix (citation → verification source/result)

**Wave 2**: Requires W1-002 verification results before adding facility IDs. Other tasks can begin immediately after Wave 1.

**Wave 3**: Structural changes to existing text. Requires Wave 2 content additions complete to avoid merge conflicts.

**Wave 4**: Language polishing. Requires Wave 3 structural changes complete.

**Wave 5**: Citation formatting. MUST be sequential (not parallel) to avoid citation numbering conflicts. Each task modifies citation system.

**Wave 6**: Orchestrator integrates all outputs, runs final QA Pass 2, generates certification decision.

---

END OF REMEDIATION PLAN
