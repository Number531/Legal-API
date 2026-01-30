# REMEDIATION DISPATCH

**Diagnostic ID**: QA-DIAGNOSTIC-2026-01-29-1738200293
**Diagnostic Score**: 71.2%
**Remediation Tier**: **TIER_3_FULL**
**Total Issues Found**: 36
**Issues In Scope**: 36 (all severities per TIER 3)
**Estimated Duration**: 8-12 hours
**Max Cycles**: 2
**Current Cycle**: 1

---

## EXECUTION MANIFEST

### WAVE 1: Structural Fixes - CREAC Headers (CRITICAL)
- **Parallel**: YES
- **Gate**: none

| Task ID | Agent | Priority | Est. Minutes | Target Section | Output File | Success Criteria |
|---------|-------|----------|--------------|----------------|-------------|------------------|
| W1-CREAC-001 | memo-remediation-writer | CRITICAL | 30 | IV.A (Lines 694-1321) | remediation-outputs/W1-CREAC-001.md | `grep -cE "^### Conclusion" final-memorandum-v2.md` returns ≥8 in Section IV.A range |
| W1-CREAC-002 | memo-remediation-writer | CRITICAL | 35 | IV.B (Lines 1327-2241) | remediation-outputs/W1-CREAC-002.md | `grep -cE "^### Conclusion" final-memorandum-v2.md` returns ≥10 in Section IV.B range |
| W1-CREAC-003 | memo-remediation-writer | CRITICAL | 30 | IV.C (Lines 2242-3291) | remediation-outputs/W1-CREAC-003.md | `grep -cE "^### Conclusion" final-memorandum-v2.md` returns ≥8 in Section IV.C range |
| W1-CREAC-004 | memo-remediation-writer | CRITICAL | 30 | IV.D (Lines 3292-4076) | remediation-outputs/W1-CREAC-004.md | `grep -cE "^### Conclusion" final-memorandum-v2.md` returns ≥8 in Section IV.D range |
| W1-CREAC-005 | memo-remediation-writer | CRITICAL | 45 | IV.E (Lines 4077-6324) | remediation-outputs/W1-CREAC-005.md | `grep -cE "^### Conclusion" final-memorandum-v2.md` returns ≥12 in Section IV.E range |
| W1-CREAC-006 | memo-remediation-writer | CRITICAL | 30 | IV.F (Lines 6325-7539) | remediation-outputs/W1-CREAC-006.md | `grep -cE "^### Conclusion" final-memorandum-v2.md` returns ≥8 in Section IV.F range |

**Wave 1 Gate Check**: `grep -cE "^### Conclusion" final-memorandum-v2.md` total ≥54 (sum of all sections)

---

### WAVE 2: Content Additions - Questions, Risk Tables, Provisions (CRITICAL/HIGH)
- **Parallel**: YES
- **Gate**: WAVE 1 complete

| Task ID | Agent | Priority | Est. Minutes | Target Section | Output File | Success Criteria |
|---------|-------|----------|--------------|----------------|-------------|------------------|
| W2-QP-001 | memo-executive-summary-writer | CRITICAL | 30 | Section II (Lines 470-520) | remediation-outputs/W2-QP-001.md | `grep -ciE "^Under .* does .* when" final-memorandum-v2.md` returns 12 |
| W2-QP-002 | memo-executive-summary-writer | HIGH | 15 | Section II | remediation-outputs/W2-QP-002.md | Question #1 addresses "non-dischargeable injunctive obligations" (highest risk) |
| W2-RISK-001 | memo-remediation-writer | CRITICAL | 20 | Section IV.A | remediation-outputs/W2-RISK-001.md | Table with header `| Finding | Severity | Probability | Exposure | Mitigation |` present in Section IV.A, ≥5 data rows |
| W2-RISK-002 | memo-remediation-writer | CRITICAL | 25 | Section IV.B | remediation-outputs/W2-RISK-002.md | Table present in Section IV.B, ≥8 data rows covering environmental violations |
| W2-RISK-003 | memo-remediation-writer | CRITICAL | 20 | Section IV.C | remediation-outputs/W2-RISK-003.md | Table present in Section IV.C, ≥6 data rows covering facility size categories |
| W2-RISK-004 | memo-remediation-writer | CRITICAL | 20 | Section IV.D | remediation-outputs/W2-RISK-004.md | Table present in Section IV.D, ≥5 data rows covering IP risks |
| W2-RISK-005 | memo-remediation-writer | CRITICAL | 25 | Section IV.E | remediation-outputs/W2-RISK-005.md | Table present in Section IV.E, ≥10 data rows covering offset mechanisms |
| W2-RISK-006 | memo-remediation-writer | CRITICAL | 20 | Section IV.F | remediation-outputs/W2-RISK-006.md | Table present in Section IV.F, ≥5 data rows covering strategic risks |
| W2-PROV-001 | memo-remediation-writer | HIGH | 25 | Section IV.B (end of section) | remediation-outputs/W2-PROV-001.md | Provision ≥200 words, includes dollar amount for price adjustment, cites GM precedent |
| W2-PROV-002 | memo-remediation-writer | HIGH | 20 | Section IV.D (end of section) | remediation-outputs/W2-PROV-002.md | Provision ≥150 words, prohibits standalone IP auctions, cites Kodak precedent |
| W2-PROV-003 | memo-remediation-writer | HIGH | 20 | Section IV.E (end of section) | remediation-outputs/W2-PROV-003.md | Provision ≥150 words, establishes $10M reserve, cites § 503(b)(1)(A), LTV Steel precedent |

**Wave 2 Gate Check**:
1. `grep -c "| Finding | Severity | Probability | Exposure | Mitigation |" final-memorandum-v2.md` returns ≥6 (one per section)
2. `grep -ciE "^Under .* does" final-memorandum-v2.md` returns 12
3. Manual verification: 3 new provisions present (search for "Draft Provision:" or "Draft Contract Language:")

---

### WAVE 3: Citation Enhancement - Verification Tags & Pincites (CRITICAL/HIGH)
- **Parallel**: NO (sequential to avoid footnote renumbering conflicts)
- **Gate**: WAVE 2 complete

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W3-TAG-001 | citation-validator | CRITICAL | 60 | Add verification tags to ALL 562 citations. Prioritize: (1) Statutes/cases, (2) EPA facility IDs, (3) Financial metrics. Use [VERIFIED:source], [INFERRED:basis], [ASSUMED:reason]. | remediation-outputs/W3-TAG-001.md | `grep -cE "\\[VERIFIED:|\\[INFERRED:|\\[ASSUMED:" final-memorandum-v2.md` returns ≥562 |
| W3-PINCITE-001 | citation-validator | HIGH | 45 | Add pincites "at [page]" to 365 case citations lacking them. Focus: (1) SCOTUS, (2) Third Circuit, (3) Bankruptcy opinions. Note "[unpaginated order]" if no pagination. | remediation-outputs/W3-PINCITE-001.md | `grep -cE " at [0-9]+" final-memorandum-v2.md` returns ≥545 (current 180 + new 365) |
| W3-PAREN-001 | citation-validator | HIGH | 45 | Add explanatory parentheticals to 450 case citations per Bluebook 10.6. Format: "(holding that [summary])". Prioritize: (1) Cases cited 2+ times, (2) Central holdings, (3) Adverse authority. | remediation-outputs/W3-PAREN-001.md | `grep -cE "\\(.*holding.*\\)|\\(.*approving.*\\)" final-memorandum-v2.md` returns ≥450 |

**Wave 3 Gate Check**:
1. Verification tag coverage: 100% (562/562)
2. Pincite coverage: ≥97% (545/562)
3. Parenthetical coverage: ≥80% (450/562)

---

### WAVE 4: Quality Enhancements (MEDIUM/HIGH)
- **Parallel**: YES
- **Gate**: WAVE 3 complete

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W4-XREF-001 | memo-remediation-writer | MEDIUM | 30 | Expand Cross-Reference Matrix (Lines 7980-8115) to show multi-hop connections. Add column: "Cascading Chain" with probability chains (A → B → C → D). Add 10-15 multi-hop entries. Example: "IV.B violations (60%) → IV.C remediation (75%) → IV.E offset (46-83%) = 21-37% residual". | remediation-outputs/W4-XREF-001.md | Matrix includes ≥10 "Cascading Chain" entries with probability calculations |
| W4-PROV-004 | memo-remediation-writer | MEDIUM | 20 | Add precedent references to 4 existing provisions lacking them (from 6 original + 3 new = 9 total, 4 missing precedents). Format: "Comparable: [case] [provision type] ([year], [key terms])". Use Appendix C for precedent transactions. | remediation-outputs/W4-PROV-004.md | All 9 provisions cite precedent transactions |
| W4-PROV-005 | memo-remediation-writer | MEDIUM | 20 | Add basket/cap/survival structure to 3 indemnity provisions. Format: "subject to: (i) basket of $X; (ii) cap of $Y; (iii) survival of Z years". Basket = 1-2% purchase price, Cap = exposure midpoint, Survival = statute of limitations. | remediation-outputs/W4-PROV-005.md | All indemnity provisions include explicit basket, cap, survival terms |
| W4-BRIEF-001 | memo-executive-summary-writer | MEDIUM | 15 | Condense Brief Answer #1 from ~200 words to ≤150 words. Structure: (1) YES/NO (1 sentence), (2) *Kovacs* rule (1 sentence), (3) *Torwico* refinement (1 sentence), (4) Six factors (1 sentence), (5) Cross-ref to IV.E (1 sentence). | remediation-outputs/W4-BRIEF-001.md | Brief Answer #1 ≤150 words, maintains substance |
| W4-OBJ-001 | memo-remediation-writer | MEDIUM | 15 | Neutralize 3 advocacy language instances: "clearly provides" → "provides", "obviously increase" → "increase", "must apply" → "should apply". Search entire document for: "clearly," "obviously," "without question," "undoubtedly." | remediation-outputs/W4-OBJ-001.md | `grep -ciE "clearly|obviously|without question|undoubtedly" final-memorandum-v2.md` returns 0 |
| W4-FMT-001 | memo-remediation-writer | LOW | 10 | Fix Section IV.C title header case (Line 2242). Change "## IV.C. Remediation Requirements and Cost Analysis" → "## IV.C. REMEDIATION REQUIREMENTS AND COST ANALYSIS" to match IV.A, IV.B uppercase. | remediation-outputs/W4-FMT-001.md | Section IV.C title uses consistent uppercase |
| W4-QUANT-001 | memo-remediation-writer | LOW | 15 | Add discount rate citation. Find all "8% WACC" or "at 8% discount" and append: "[8% WACC represents median cost of capital for distressed manufacturing per Moody's 2023 Manufacturing Default Study, pp. 45-47]" OR alternative authoritative source. | remediation-outputs/W4-QUANT-001.md | All discount rate references cite supporting authority |

**Wave 4 Gate Check**:
1. Cross-Reference Matrix enhanced (≥10 cascading chains)
2. All 9 provisions cite precedent
3. No advocacy language remains (grep returns 0)
4. Discount rate cited throughout

---

### WAVE 5: Final Polish (LOW)
- **Parallel**: YES (except W5-CITE-001/002 should be sequential)
- **Gate**: WAVE 4 complete

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W5-TOC-001 | memo-remediation-writer | LOW | 15 | Update Table of Contents (Lines 17-162) page references. Prefer Option 2: Remove page references entirely ("Section IV.A: Case Identification and Bankruptcy Filing Patterns"). Alternative: Replace "Page 3" with "Line 694". | remediation-outputs/W5-TOC-001.md | TOC uses line numbers OR removes page references (consistent formatting) |
| W5-FOOT-001 | memo-remediation-writer | LOW | 10 | Verify footnote numbering 1-562 consecutive. Extract all footnote numbers, confirm sequential 1→562 with no gaps. If gaps found, identify missing numbers and remediate. | remediation-outputs/W5-FOOT-001.md | Automated check confirms footnotes 1-562 present, no gaps |
| W5-SCENARIO-001 | memo-remediation-writer | LOW | 20 | Expand Section IV.F scenario analysis. Add dedicated subsection: "Scenario Analysis & Sensitivity Testing" with: (1) Monte Carlo methodology, (2) Key driver assumptions (EPA settlement %, abandonment success, buyer discount), (3) Correlation factors. 300-500 words. | remediation-outputs/W5-SCENARIO-001.md | Section IV.F includes ≥300-word scenario analysis subsection with methodology disclosed |
| W5-CITE-001 | citation-validator | LOW | 10 | Review 7 instances of "See generally" signal. Confirm appropriate use per Bluebook 1.2 (background authority). If direct support, change to "See". If comparison, use "Cf." Document changes. | remediation-outputs/W5-CITE-001.md | All signals comply with Bluebook 1.2; inappropriate "See generally" corrected to "See" or "Cf." |
| W5-CITE-002 | citation-validator | LOW | 10 | Verify no short-form-before-full-citation violations (5-10 estimated). First reference in each section uses full citation. Subsequent use proper short form (*Kovacs*, 469 U.S. at 281). Fix violations. | remediation-outputs/W5-CITE-002.md | All first references use full citation; all subsequent use short form per Bluebook 10.9 |

**Wave 5 Gate Check**:
1. TOC formatting consistent
2. Footnotes 1-562 sequential
3. Section IV.F includes scenario analysis subsection
4. Citation signals and short-form compliant

---

### WAVE 6: Final Assembly & Validation (CRITICAL)
- **Parallel**: NO (sequential)
- **Gate**: WAVE 5 complete; all tasks verified

| Task ID | Agent | Priority | Description | Output File | Verification |
|---------|-------|----------|-------------|-------------|--------------|
| ASSEMBLY-001 | memo-remediation-writer | CRITICAL | Merge all W1-W5 remediation outputs into final-memorandum-v2.md. For each task: (1) Read remediation-outputs/[task-id].md, (2) Extract EDITED_START/EDITED_END markers, (3) Apply edits to target section, (4) Verify via grep. Use chunked processing for 838KB file. Log to assembly_results[]. | final-memorandum-v2.md + assembly-report.md | All 33 content tasks merged successfully (W1-W5, excluding ASSEMBLY-001, VALIDATE-001, RE-DIAGNOSTIC-001); zero placeholders; remediation-wave-state.json = "complete" |
| VALIDATE-001 | (orchestrator script) | CRITICAL | Run validation checks on final-memorandum-v2.md: (1) `grep -cE "^### Conclusion"` ≥50, (2) `grep -ciE "^Under .* does"` = 12, (3) `grep -c "| Finding | Severity"` = 6, (4) `grep -cE "\\[VERIFIED:"` ≥534 (95%), (5) `grep -cE " at [0-9]+"` ≥506 (90%), (6) No `[XREF]` or `[TBD]` placeholders, (7) Word count ≥110,000. | validation-report.md | All 7 validation checks pass; ready for re-diagnostic |
| RE-DIAGNOSTIC-001 | memo-qa-diagnostic | CRITICAL | Run second diagnostic pass on final-memorandum-v2.md. Use same 12-dimension scoring rubric. Expected score: 93-95%. If <93%, identify remaining issues and escalate. If ≥93%, recommend certification (quality-assessment-certification phase). | qa-diagnostic-pass2.md | Diagnostic score ≥93%; no CRITICAL issues remaining; max 2-3 MEDIUM/LOW issues acceptable |

**Wave 6 Gate Check**: Re-diagnostic score ≥93% AND all validation checks pass

---

## MERGE ORDER (ASSEMBLY-001 Processing Sequence)

Process tasks in this order to avoid conflicts:

**Phase 1: Structural (W1 - CREAC Headers)**
1. W1-CREAC-001 (IV.A)
2. W1-CREAC-002 (IV.B)
3. W1-CREAC-003 (IV.C)
4. W1-CREAC-004 (IV.D)
5. W1-CREAC-005 (IV.E)
6. W1-CREAC-006 (IV.F)

**Phase 2: Content Additions (W2 - Questions, Risk Tables, Provisions)**
7. W2-QP-001 (Questions format)
8. W2-QP-002 (Questions reorder)
9. W2-RISK-001 (IV.A risk table)
10. W2-RISK-002 (IV.B risk table)
11. W2-RISK-003 (IV.C risk table)
12. W2-RISK-004 (IV.D risk table)
13. W2-RISK-005 (IV.E risk table)
14. W2-RISK-006 (IV.F risk table)
15. W2-PROV-001 (IV.B provision)
16. W2-PROV-002 (IV.D provision)
17. W2-PROV-003 (IV.E provision)

**Phase 3: Citations (W3 - Sequential, No Interleaving)**
18. W3-TAG-001 (verification tags - FULL DOCUMENT PASS)
19. W3-PINCITE-001 (pincites - FULL DOCUMENT PASS)
20. W3-PAREN-001 (parentheticals - FULL DOCUMENT PASS)

**Phase 4: Quality Enhancements (W4)**
21. W4-XREF-001 (Cross-Reference Matrix expansion)
22. W4-PROV-004 (precedent references to provisions)
23. W4-PROV-005 (basket/cap/survival to indemnities)
24. W4-BRIEF-001 (Brief Answer #1 condensing)
25. W4-OBJ-001 (neutralize advocacy language)
26. W4-FMT-001 (Section IV.C title case)
27. W4-QUANT-001 (discount rate citation)

**Phase 5: Final Polish (W5)**
28. W5-TOC-001 (TOC page reference fix)
29. W5-FOOT-001 (footnote sequencing verification)
30. W5-SCENARIO-001 (Section IV.F scenario expansion)
31. W5-CITE-001 (signal review)
32. W5-CITE-002 (short-form verification)

**Assembly Checkpoints**:
- After Phase 1 (W1): Verify CREAC headers ≥50
- After Phase 2 (W2): Verify risk tables 6/6, questions 12/12
- After Phase 3 (W3): Verify verification tags ≥95%, pincites ≥90%
- After Phase 4 (W4): Verify no advocacy language, all provisions cite precedent
- After Phase 5 (W5): Verify TOC consistent, scenario analysis present

---

## AGENT INVOCATION PARAMETERS

### memo-remediation-writer (25 tasks)

**Common Parameters (All W1-CREAC Tasks)**:
```json
{
  "input_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/final-memorandum.md",
  "output_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/remediation-outputs/[TASK-ID].md",
  "task_type": "INSERT_CREAC_HEADERS",
  "target_section": "[section_range]",
  "minimum_structures": [8-12 depending on section],
  "template": "Use diagnostic-assessment.md IV.A.B.1 example (Lines 757-793 expansion) as CREAC template",
  "preserve_content": true,
  "instructions": "Insert Conclusion, Rule, Explanation, Application, Counter-Analysis headers for each major finding. Conclusion states position upfront. Rule cites primary authority. Explanation uses case-to-case comparison (NOT facts-to-conclusion leap). Application uses fact-to-fact comparison with precedent. Counter-Analysis provides adversarial testing (opposing counsel arguments with counterpoints)."
}
```

**Common Parameters (All W2-RISK Tasks)**:
```json
{
  "task_type": "CREATE_RISK_TABLE",
  "target_section": "[section_id]",
  "table_format": "| Finding | Severity | Probability | Exposure | Mitigation |",
  "minimum_rows": [5-12 depending on section],
  "severity_definitions": "CRITICAL = deal-blocking, HIGH = requires escrow/indemnity, MEDIUM = manageable with provisions, LOW = disclosure only",
  "instructions": "Extract all quantified findings from section. Create table row for each with: (1) Finding = 1-sentence description, (2) Severity = CRITICAL/HIGH/MEDIUM/LOW per definitions, (3) Probability = percentage with basis (e.g., '75% based on N=10 historical frequency'), (4) Exposure = dollar range with methodology (e.g., '$10M-$35M NPV at 8%'), (5) Mitigation = specific action with owner (e.g., 'Escrow $15M; EPA pre-negotiation'). Insert table after section introduction, before detailed subsections."
}
```

**Common Parameters (All W2-PROV Tasks)**:
```json
{
  "task_type": "DRAFT_CONTRACT_PROVISION",
  "provision_type": "[type - indemnity/covenant/reserve/etc.]",
  "risk_addressed": "[specific HIGH/CRITICAL risk from diagnostic]",
  "minimum_words": [150-200 depending on provision],
  "required_elements": ["Specific dollar amounts", "Survival period/duration", "Legal authority citation", "Precedent transaction reference"],
  "instructions": "Draft complete provision addressing identified risk. Include: (1) Operative language (shall indemnify/covenant/establish reserve), (2) Specific terms (dollar amounts, time periods, conditions), (3) Legal basis (statute/case citation), (4) Precedent reference (comparable transaction with key terms), (5) Cross-reference to supporting analysis (Section IV.X). Insert provision at end of section under heading '### Draft Contract Language' or '### Draft Provision'."
}
```

### memo-executive-summary-writer (3 tasks)

**W2-QP-001 Parameters**:
```json
{
  "input_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/final-memorandum.md",
  "output_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/remediation-outputs/W2-QP-001.md",
  "task_type": "REFORMAT_QUESTIONS_PRESENTED",
  "target_section": "Section II (Lines 470-520)",
  "required_format": "Under [case/statute], does [fact pattern with specific details], when [circumstances/conditions]?",
  "example": "Under the Supreme Court's holding in *Ohio v. Kovacs*, 469 U.S. 274 (1985), does a Western Pennsylvania manufacturing company with $40M-$200M CERCLA cleanup obligations achieve 46-83% offset through combined bankruptcy mechanisms when the company employs: (a) direct discharge of pre-petition claims; (b) property abandonment under *Midlantic*; (c) EPA consent decree negotiation; (d) Section 363 sale isolation; and (e) successor liability avoidance strategies?",
  "preserve_substance": true,
  "instructions": "Maintain all existing substantive content (facts, dollar amounts, case names, statutory references). ONLY change format structure to: 'Under [authority], does [client facts], when [conditions]?' Each question must be answerable Yes/No/Probably Yes/Probably No."
}
```

### citation-validator (5 tasks)

**W3-TAG-001 Parameters**:
```json
{
  "input_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/final-memorandum.md",
  "output_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/remediation-outputs/W3-TAG-001.md",
  "task_type": "ADD_VERIFICATION_TAGS",
  "target_count": 562,
  "tag_types": {
    "VERIFIED:PACER": "Court dockets, case filings, bankruptcy schedules",
    "VERIFIED:ECHO": "EPA facility IDs, violation records, enforcement actions",
    "VERIFIED:EDGAR": "SEC filings, 10-Ks, 8-Ks, CIK numbers",
    "VERIFIED:uscode.house.gov": "U.S. Code statutory text",
    "INFERRED:precedent-analogy": "Case-to-case reasoning, holding application",
    "ASSUMED:industry-standard": "Unverified statistics, expert estimates"
  },
  "priority_order": ["Statutes", "Supreme Court cases", "Circuit cases", "EPA facility data", "SEC filings", "Financial metrics"],
  "instructions": "Add verification tag immediately after each citation. Example: '28 U.S.C. § 1408 [VERIFIED:uscode.house.gov]', 'LTV Steel (CIK 0000060731) [VERIFIED:EDGAR]', 'Pension obligations: 80% of cases [INFERRED:N=10-sample-extrapolation]'. All 562 footnote citations MUST receive tags. Use [VERIFIED:source] for independently verifiable claims, [INFERRED:basis] for reasoning/extrapolation, [ASSUMED:reason] for unverified estimates."
}
```

### memo-qa-diagnostic (1 task)

**RE-DIAGNOSTIC-001 Parameters**:
```json
{
  "input_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/final-memorandum-v2.md",
  "output_file": "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/qa-outputs/qa-diagnostic-pass2.md",
  "expected_sections": ["IV.A", "IV.B", "IV.C", "IV.D", "IV.E", "IV.F"],
  "expected_count": 6,
  "min_file_size_kb": 150,
  "cycle": 2,
  "prior_score": 71.2,
  "expected_improvements": {
    "CREAC_headers": "0 → 50+",
    "Questions_format": "0/12 → 12/12",
    "Risk_tables": "0/6 → 6/6",
    "Verification_tags": "0% → 100%",
    "Overall_score": "71.2% → 93-95%"
  },
  "instructions": "Perform second diagnostic pass using same 12-dimension rubric. Verify remediation effectiveness: (1) CREAC headers ≥50 via grep, (2) Questions 12/12 Under/Does/When, (3) Risk tables 6/6 sections, (4) Verification tags 100%, (5) Pincites ≥90%, (6) Provisions 8/8 HIGH/CRITICAL coverage. If score ≥93% and no CRITICAL issues, recommend CERTIFY. If 88-92%, recommend CERTIFY_WITH_LIMITATIONS. If <88% after 2 cycles, ESCALATE to HUMAN_REVIEW."
}
```

---

## TASK DEPENDENCIES

### Hard Dependencies (Sequential Requirements)

| Task | Depends On | Reason |
|------|------------|--------|
| W2-* | W1-* complete | Risk tables and provisions require CREAC structure context |
| W3-* | W2-* complete | Citation work must not conflict with content additions |
| W3-PINCITE-001 | W3-TAG-001 complete | Avoid footnote renumbering conflicts (sequential processing) |
| W3-PAREN-001 | W3-PINCITE-001 complete | Same reason (sequential citation enhancement) |
| W4-* | W3-* complete | Quality enhancements require complete citation foundation |
| W5-* | W4-* complete | Final polish requires all substantive work done |
| ASSEMBLY-001 | All W1-W5 complete | Cannot merge until all remediation outputs generated |
| VALIDATE-001 | ASSEMBLY-001 complete | Validate final integrated document |
| RE-DIAGNOSTIC-001 | VALIDATE-001 complete | Re-diagnostic requires validated final document |

### Soft Dependencies (Recommended Order, Not Blocking)

| Task | Recommended Before | Reason |
|------|-------------------|--------|
| W2-RISK-001 through W2-RISK-006 | W2-PROV-001 through W2-PROV-003 | Risk tables inform provision drafting (HIGH/CRITICAL coverage) |
| W4-PROV-004 | W2-PROV-001, W2-PROV-002, W2-PROV-003 | Cannot add precedents to provisions that don't exist yet |
| W4-PROV-005 | W2-PROV-001 through W2-PROV-003, W4-PROV-004 | Basket/cap additions require provisions to exist |

---

## FAILURE HANDLING

### Task Failure Scenarios

| Failure Type | Detection | Response | Escalation Trigger |
|--------------|-----------|----------|-------------------|
| Agent error (systematic) | Task returns error code | BLOCK wave progression; ESCALATE immediately | Any CRITICAL task fails |
| Agent error (isolated) | Task returns error code | RETRY once; if second failure, SKIP task and continue wave | Same task fails 2× |
| Validation failure (gate check) | Gate check returns false | BLOCK next wave; ESCALATE if CRITICAL gate | CRITICAL gate fails (CREAC <50, Questions <12, Risk Tables <6) |
| Merge conflict (assembly) | EDITED_START/EDITED_END not found | LOG as NOT_MERGED; continue with other tasks | >2 tasks fail to merge |
| Re-diagnostic score <88% | RE-DIAGNOSTIC-001 returns <88% | ESCALATE to HUMAN_REVIEW after 2 cycles | Score <88% after cycle 2 |
| Re-diagnostic score 88-92% | RE-DIAGNOSTIC-001 returns 88-92% | Recommend CERTIFY_WITH_LIMITATIONS | Only if no CRITICAL issues remain |
| Re-diagnostic score ≥93% | RE-DIAGNOSTIC-001 returns ≥93% | Recommend CERTIFY for client delivery | N/A (success) |

### Escalation Contact Points

| Issue | Escalation Target | Information Required |
|-------|-------------------|----------------------|
| CRITICAL task failure (W1, W2, W3-TAG-001) | Human QA Manager | Task ID, agent error log, expected vs. actual output |
| Assembly merge conflicts (>2 tasks) | Human Integration Specialist | Failed task IDs, conflicting line ranges, EDITED markers |
| Score <88% after 2 cycles | Human Subject Matter Expert | qa-diagnostic-pass2.md, list of unresolved CRITICAL issues |
| Validation check failures | Human QA Manager | validation-report.md, specific check failures (CREAC count, question format, etc.) |

---

## SUCCESS CRITERIA (Wave 6 Validation)

### VALIDATE-001 Checks

| Check # | Validation Command | Pass Threshold | Notes |
|---------|-------------------|----------------|-------|
| 1 | `grep -cE "^### Conclusion" final-memorandum-v2.md` | ≥50 | Minimum CREAC headers |
| 2 | `grep -ciE "^Under .* does .* when" final-memorandum-v2.md` | 12 | All questions formatted |
| 3 | `grep -c "| Finding | Severity | Probability | Exposure | Mitigation |" final-memorandum-v2.md` | 6 | Risk tables in all sections |
| 4 | `grep -cE "\\[VERIFIED:|\\[INFERRED:|\\[ASSUMED:" final-memorandum-v2.md` | ≥534 (95% of 562) | Verification tag coverage |
| 5 | `grep -cE " at [0-9]+" final-memorandum-v2.md` | ≥506 (90% of 562) | Pincite coverage |
| 6 | `grep -cE "\\[XREF\\]|\\[TBD\\]|\\[TODO\\]|\\[PLACEHOLDER\\]" final-memorandum-v2.md` | 0 | No unresolved placeholders |
| 7 | `wc -w final-memorandum-v2.md` | ≥110,000 | Word count maintained/increased |

**Gate Pass Requirement**: ALL 7 checks must pass before RE-DIAGNOSTIC-001 invocation.

---

## STATE TRACKING

### remediation-wave-state.json Structure

```json
{
  "remediation_id": "QA-DIAGNOSTIC-2026-01-29-1738200293",
  "diagnostic_score": 71.2,
  "remediation_tier": "TIER_3_FULL",
  "cycle": 1,
  "max_cycles": 2,
  "current_wave": "W1",
  "waves": {
    "W1": {
      "status": "IN_PROGRESS",
      "tasks": [
        {
          "task_id": "W1-CREAC-001",
          "agent": "memo-remediation-writer",
          "status": "COMPLETE",
          "output_file": "remediation-outputs/W1-CREAC-001.md",
          "verification": {"grep_count": 8, "target": 8, "pass": true},
          "timestamp": "2026-01-29T10:30:00Z"
        }
      ],
      "gate_check": {"status": "PENDING", "criteria": "CREAC headers ≥54 total"}
    },
    "W2": {"status": "PENDING"},
    "W3": {"status": "PENDING"},
    "W4": {"status": "PENDING"},
    "W5": {"status": "PENDING"},
    "W6": {"status": "PENDING"}
  },
  "assembly": {
    "status": "PENDING",
    "merge_order": ["W1-CREAC-001", "W1-CREAC-002", "..."],
    "assembly_results": []
  },
  "validation": {
    "status": "PENDING",
    "checks": []
  },
  "re_diagnostic": {
    "status": "PENDING",
    "expected_score": "93-95%"
  }
}
```

### Update Triggers

- After each task completion: Update task status, verification results, timestamp
- After wave completion: Update wave status, execute gate check
- After assembly: Update assembly_results with merge success/failure for each task
- After validation: Update validation.checks with pass/fail for each check
- After re-diagnostic: Update re_diagnostic.status and re_diagnostic.score

---

## TIMELINE & MILESTONES

| Milestone | Estimated Time from Start | Cumulative Hours | Gate Condition |
|-----------|---------------------------|------------------|----------------|
| Wave 1 Start | T+0 | 0 | None (first wave) |
| Wave 1 Complete | T+4 hours | 4 | CREAC headers ≥54 (grep verified) |
| Wave 2 Complete | T+8 hours | 8 | Questions 12/12, Risk tables 6/6, 3 provisions added |
| Wave 3 Complete | T+10.5 hours | 10.5 | Verification tags 100%, Pincites ≥90% |
| Wave 4 Complete | T+12.5 hours | 12.5 | Cross-refs enhanced, advocacy language removed |
| Wave 5 Complete | T+13.5 hours | 13.5 | TOC fixed, scenario analysis added |
| Assembly Complete | T+14 hours | 14 | All 33 tasks merged into final-memorandum-v2.md |
| Validation Complete | T+14.5 hours | 14.5 | All 7 validation checks pass |
| Re-Diagnostic Complete | T+15 hours | 15 | Score ≥93%, CERTIFY recommendation |

**Total Duration**: 14-15 hours (includes buffer for unanticipated issues)

**Critical Path**: W1 (4 hours) → W2 (4 hours) → W3 (2.5 hours) → Assembly (0.5 hours) → Re-Diagnostic (0.5 hours) = **11.5 hours minimum**

---

## DELIVERY CHECKLIST

Before marking remediation complete, verify:

- [ ] All 33 content tasks (W1-W5) generated output files in remediation-outputs/
- [ ] ASSEMBLY-001 merged all 33 tasks into final-memorandum-v2.md
- [ ] assembly-report.md shows ≤2 merge failures (acceptable threshold)
- [ ] VALIDATE-001 completed with all 7 checks passing
- [ ] validation-report.md generated with detailed results
- [ ] RE-DIAGNOSTIC-001 completed on final-memorandum-v2.md
- [ ] qa-diagnostic-pass2.md generated with updated score
- [ ] Post-remediation score ≥93% OR escalation decision documented
- [ ] remediation-wave-state.json shows all waves "COMPLETE"
- [ ] final-memorandum-v2.md word count ≥110,000 words
- [ ] No [XREF], [TBD], [TODO], [PLACEHOLDER] tags in final document

**Delivery Artifacts**:
1. final-memorandum-v2.md (remediated memorandum)
2. qa-diagnostic-pass2.md (second diagnostic assessment)
3. validation-report.md (comprehensive validation results)
4. assembly-report.md (merge success/failure log)
5. remediation-wave-state.json (state tracking for resumption)

---

*End of Remediation Dispatch*
