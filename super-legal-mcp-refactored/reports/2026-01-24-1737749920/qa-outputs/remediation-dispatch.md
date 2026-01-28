# REMEDIATION DISPATCH

**Diagnostic ID**: qa-diagnostic-2026-01-24-1737749920-cycle1
**Diagnostic Score**: 71%
**Remediation Tier**: TIER_3_FULL
**Total Issues Found**: 18
**Issues In Scope**: 18 (all severities)
**Estimated Duration**: 120 minutes
**Max Cycles**: 2
**Current Cycle**: 1

---

## ORCHESTRATOR EXECUTION INSTRUCTIONS

This dispatch document provides machine-readable task assignments for the memorandum orchestrator to execute remediation in 6 sequential waves.

### Execution Protocol
1. Execute waves in order (Wave 1 → Wave 2 → Wave 3 → Wave 4 → Wave 5 → Wave 6)
2. Wait for wave gate before proceeding to next wave
3. Validate success criteria after each task
4. If task fails validation, retry once before escalating
5. After Wave 6, run pre-qa-validate.py before re-diagnostic
6. Track progress in orchestrator-state.md

---

## WAVE 1: Generate Missing Critical Sections
- **Parallel**: NO (sequential)
- **Gate**: none
- **Success Criteria Gate**: Both W1-001 and W1-002 outputs exist and pass format validation

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W1-001 | memo-executive-summary-writer | CRITICAL | 20 | Generate Questions Presented section with 10-12 questions in Under/Does/When format mapping to sections IV.A-IV.J, ordered by deal-blocking risk | remediation-outputs/W1-001-questions-presented.md | File exists; contains 10-12 numbered questions; each follows "Under [statute], does [action] when [facts]?" format; questions answerable Yes/No |
| W1-002 | memo-executive-summary-writer | CRITICAL | 10 | Generate Brief Answers section with 2-3 sentence answers to each Question Presented from W1-001, including definitive answer + reasoning + section cross-reference | remediation-outputs/W1-002-brief-answers.md | File exists; contains 10-12 numbered answers; each starts with "Yes/No/Probably Yes/Probably No"; each includes "Because..." clause; each includes "See Section IV.X" cross-reference |

### W1-001 Detailed Instructions
```yaml
agent: memo-executive-summary-writer
mode: generate
input_files:
  - final-memorandum.md (sections IV.A-IV.J)
  - research-plan.md (critical issues checklist)
  - diagnostic-assessment.md (HIGH/CRITICAL findings list)
output_file: remediation-outputs/W1-001-questions-presented.md
parameters:
  question_count: 10-12
  format: "Under [statute/regulation/common law doctrine], does [specific action/arrangement/transaction element] [constitute violation/trigger liability/require approval/etc.] when [2-3 specific transaction facts from Mercy acquisition]?"
  ordering: Deal-blocking risk (CRITICAL → HIGH → MEDIUM)
  example_question: |
    1. Under 42 U.S.C. § 1395nn (Stark Law), does Mercy Regional Health System's Endoscopy Center LLC arrangement, in which 8 employed gastroenterologists collectively own 33% equity interests and refer Medicare patients for colonoscopies and endoscopies, violate the physician self-referral prohibition when no exception applies to the ownership relationship?
validation:
  - grep -c "^[0-9]+\. Under" W1-001-questions-presented.md >= 10
  - Each question ends with "?"
  - Each question mentions statute/regulation by citation
  - Each question includes Mercy-specific facts (not generic)
```

### W1-002 Detailed Instructions
```yaml
agent: memo-executive-summary-writer
mode: generate
depends_on: W1-001
input_files:
  - remediation-outputs/W1-001-questions-presented.md
  - final-memorandum.md (executive summary + detailed sections)
output_file: remediation-outputs/W1-002-brief-answers.md
parameters:
  answer_count: Must match W1-001 question count
  format: "[Number]. [Definitive Answer]. Because [1-2 sentence reasoning citing key rule and critical facts]. See Section [IV.X] for [detailed analysis/full CREAC structure/remediation options]."
  definitive_answers: ["Yes", "No", "Probably Yes", "Probably No"]
  example_answer: |
    1. Probably Yes. The arrangement violates STARK because the employed physicians hold ownership interests in an entity to which they refer designated health services, and no exception applies to the ownership relationship (the employment exception protects only the employment compensation, not the ownership returns). Mercy faces mandatory refund liability ($17.6M over 6-year lookback) plus civil monetary penalties up to $27,017 per service. See Section IV.A for STARK/AKS analysis and remediation options (unwind arrangement for $2M-$3M or OIG voluntary disclosure for $3M-$5M).
validation:
  - grep -c "^[0-9]+\. (Yes|No|Probably Yes|Probably No)" W1-002-brief-answers.md >= 10
  - Each answer includes "Because"
  - Each answer includes "See Section IV."
  - Each answer includes quantified exposure (dollar amount or percentage)
```

---

## WAVE 2: Apply CREAC Structure
- **Parallel**: NO (script then validation)
- **Gate**: Wave 1 complete
- **Success Criteria Gate**: CREAC header count ≥50 AND W2-002 validation reports no critical semantic errors

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W2-001 | apply-creac-headers.py | CRITICAL | 15 | Execute CREAC header insertion script with --min-headers 50 to insert Conclusion/Rule/Explanation/Application/Counter-Analysis headers in sections IV.A-IV.J | final-memorandum-creac.md | Script exit code 0; output file exists; `grep -c "^### (Conclusion\|Rule\|Explanation\|Application\|Counter-Analysis)" final-memorandum-creac.md` >= 50 |
| W2-002 | memo-remediation-writer | HIGH | 10 | Validate CREAC headers semantically correct (Conclusions are conclusion statements, Rules cite authority, Explanations discuss case law not facts, Applications compare Mercy to precedent, Counter-Analysis presents adverse arguments) | remediation-outputs/W2-002-creac-validation.md | Validation report exists; lists any semantic errors by section; provides corrections for misclassified headers |

### W2-001 Detailed Instructions
```yaml
agent: apply-creac-headers.py
mode: script
input_files:
  - final-memorandum.md
output_file: final-memorandum-creac.md
command: |
  python3 scripts/apply-creac-headers.py \
    final-memorandum.md \
    final-memorandum-creac.md \
    --min-headers 50 \
    --sections "IV.A,IV.B,IV.C,IV.D,IV.E,IV.F,IV.G,IV.H,IV.I,IV.J" \
    --verbose
parameters:
  min_headers: 50
  format: "### [Conclusion|Rule|Explanation|Application|Counter-Analysis]"
  insertion_strategy: |
    - Conclusion: Before first substantive paragraph of each finding subsection
    - Rule: Before statute/regulation citation blocks
    - Explanation: Before analogous case discussion paragraphs (look for case names)
    - Application: Before "Mercy..." or "Here..." fact comparison paragraphs
    - Counter-Analysis: Before "However," "Seller may argue," "Defense available," "But see" paragraphs
validation:
  - Exit code: 0
  - Output file size within 10% of input file size
  - Grep CREAC headers: >= 50 total
  - Breakdown:
      - Conclusion: >= 10
      - Rule: >= 12
      - Explanation: >= 10
      - Application: >= 10
      - Counter-Analysis: >= 12
```

### W2-002 Detailed Instructions
```yaml
agent: memo-remediation-writer
mode: validate
depends_on: W2-001
input_files:
  - final-memorandum-creac.md
output_file: remediation-outputs/W2-002-creac-validation.md
task: |
  Review each CREAC header in final-memorandum-creac.md and validate semantic accuracy.
  For each section IV.A-IV.J, check:
  1. Conclusion headers: Followed by definitive legal conclusion statement?
  2. Rule headers: Followed by statute/regulation/case law citation?
  3. Explanation headers: Followed by analogous case discussion WITHOUT client facts?
  4. Application headers: Followed by Mercy fact-to-precedent comparison?
  5. Counter-Analysis headers: Followed by adverse argument + rebuttal?

  Report format:
  ## Section IV.A
  - ✓ Conclusion (line 1075): "The arrangement violates STARK..." [CORRECT]
  - ✓ Rule (line 1090): "42 U.S.C. § 1395nn(a)(1)..." [CORRECT]
  - ⚠️ Explanation (line 1110): Contains Mercy facts [INCORRECT - should be Application]
  - ✓ Application (line 1150): Compares Mercy ASC to *Tuomey* facts [CORRECT]

  ## Corrections Required
  - Section IV.A line 1110: Change "### Explanation" to "### Application"
  - Section IV.B line 1680: Rule header missing citation (add "Ohio Rev. Code § 3702.51")
validation:
  - Report lists all 10 sections (IV.A-IV.J)
  - Each section has at least 3 CREAC headers reviewed
  - Corrections clearly specified with line numbers
```

---

## WAVE 3: Content Optimization
- **Parallel**: NO (single task, can run independently)
- **Gate**: Wave 2 complete
- **Success Criteria Gate**: W3-001 output word count 2,500-3,500 words AND all critical content preserved

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W3-001 | memo-executive-summary-writer | HIGH | 20 | Trim Executive Summary from ~5,500 words to 3,000-3,500 words by compressing scenario analysis (3 scenarios to 1-2 paragraphs each), removing duplicative quantification, consolidating cross-domain patterns into references to Cross-Reference Matrix section | remediation-outputs/W3-001-executive-summary-trimmed.md | Word count 2,500-3,500; BLUF recommendation preserved in first 100 words; risk table present; critical conditions present; scenario analysis present (compressed) |

### W3-001 Detailed Instructions
```yaml
agent: memo-executive-summary-writer
mode: revise
depends_on: W2-002
input_files:
  - final-memorandum.md (lines 84-811, Section I Executive Summary)
output_file: remediation-outputs/W3-001-executive-summary-trimmed.md
parameters:
  target_word_count: 3000-3500
  current_word_count: ~5500
  reduction_needed: 2000-2500 words (36-45%)
  preserve_required:
    - BLUF recommendation (first 100 words) — "PROCEED WITH CONDITIONS"
    - Rationale paragraph (structural costs + revenue pressure)
    - Critical Conditions for Proceeding (7 items) — DO NOT REMOVE ANY
    - Comprehensive Risk Summary Table — KEEP FULL TABLE
    - Aggregate Exposure Summary — KEEP NUMBERS
    - Recommended Deal Structure Adjustments — KEEP ESCROW/PRICE DETAILS
    - Scenario Analysis (Base/Downside/Severe) — COMPRESS each to 150-200 words
  compression_strategies:
    - Scenario Analysis: Remove detailed line-item calculations, keep only final EBITDA and viability assessment
    - Critical Findings (Sections A-G): Reduce from 15-20 lines each to 8-10 lines (remove technical detail available in Section IV)
    - Cross-Domain Integration: Remove Section IV paragraphs, replace with "See Cross-Reference Matrix Section V for 10 cross-domain patterns"
    - Eliminate repetitive quantification in narrative text (keep in tables)
  validation_check: |
    Must preserve:
    - Recommendation stated in first 100 words
    - All 7 Critical Conditions numbered and described
    - Risk table with all HIGH/CRITICAL findings
    - Purchase price reduction amount ($1.9B-$2.1B)
    - Escrow total ($68M-$90M)
    - All 3 scenario analyses (Base, Downside, Severe)
validation:
  - Word count: 2500 <= count <= 3500
  - Contains "PROCEED WITH CONDITIONS" in first 100 words
  - Contains "Critical Conditions for Proceeding" heading
  - Contains 7 numbered conditions
  - Contains "Comprehensive Risk Summary Table" with columns: Finding | Severity | Probability | Exposure | Mitigation
  - Contains "Scenario Analysis" heading with subsections A/B/C
```

---

## WAVE 4: Validation & Enhancement
- **Parallel**: YES (tasks can run in parallel)
- **Gate**: Wave 3 complete
- **Success Criteria Gate**: All W4 tasks complete AND no blocking issues found

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W4-001 | memo-remediation-writer | MEDIUM | 8 | Review all HIGH/CRITICAL findings to verify adverse authority cited and rebutted; flag any findings lacking adverse precedent discussion | remediation-outputs/W4-001-adverse-authority-check.md | Report lists all HIGH/CRITICAL findings; identifies any lacking adverse authority; provides recommendations for additions |
| W4-002 | memo-remediation-writer | MEDIUM | 6 | Verify all NPV calculations include discount rate disclosure (e.g., "NPV at 8% WACC"); flag any missing discount rate statements | remediation-outputs/W4-002-discount-rate-check.md | Report lists all NPV calculations; confirms discount rate stated; identifies any missing disclosures |
| W4-003 | memo-remediation-writer | MEDIUM | 5 | Verify each section IV.A-IV.J contains risk table with 5 required columns (Finding, Severity, Probability, Exposure, Mitigation) | remediation-outputs/W4-003-risk-table-check.md | Report confirms 10 section-level risk tables present; lists any sections missing tables or columns |
| W4-004 | validate-provisions.py | MEDIUM | 4 | Run provision coverage script to identify HIGH/CRITICAL findings lacking draft contract language provisions | provision-gaps.json | Script exit code 0 (100% coverage) OR produces provision-gaps.json with templates for missing provisions |
| W4-005 | memo-remediation-writer | MEDIUM | 2 | If W4-004 identifies gaps, generate missing contract provisions using templates from provision-gaps.json | remediation-outputs/W4-005-additional-provisions.md | All provision gaps filled with specific contract language including dollar amounts, survival periods, baskets/caps |

### W4-004 Detailed Instructions
```yaml
agent: validate-provisions.py
mode: script
depends_on: W3-001
input_files:
  - final-memorandum-creac.md (or final-memorandum.md if W2-001 failed)
output_file: provision-gaps.json
command: |
  python3 scripts/validate-provisions.py final-memorandum-creac.md --severity HIGH CRITICAL
parameters:
  severity_threshold: ["HIGH", "CRITICAL"]
  required_provision_types:
    - representation: "Seller represents that..."
    - warranty: "Seller warrants that..."
    - indemnity: "Seller shall indemnify Buyer for..."
    - escrow: "Parties shall establish escrow of $..."
    - condition: "Closing conditioned on..."
    - covenant: "Seller shall [affirmative action]" or "Seller shall not [negative action]"
  validation_checks:
    - Provision includes specific dollar amount (not "reasonable" or "appropriate")
    - Provision includes duration/survival period
    - Provision includes basket/cap where applicable
    - Provision cross-references specific finding in memorandum
validation:
  - Exit code: 0 (100% coverage) OR 1 (gaps identified)
  - If exit code 1: provision-gaps.json exists with structure:
      {
        "summary": {"coverage_percentage": N, "findings_missing_provisions": N},
        "missing_provisions": [{"section": "IV.X", "finding": "...", "severity": "HIGH", "provision_type": "..."}],
        "provision_templates": {"IV.X": {"template": "...", "precedent": "..."}}
      }
```

---

## WAVE 5: Citation Polish
- **Parallel**: NO (sequential to avoid citation conflicts)
- **Gate**: Wave 4 complete
- **Success Criteria Gate**: Verification rate ≥95% AND pincite count ≥150

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W5-001 | citation-validator | MEDIUM | 6 | Review 115 unverified citations (out of 920 total) and add verification tags where possible to reach 95%+ verification rate | remediation-outputs/W5-001-citation-enhancements.md | Verification rate ≥95% (875+/920 citations); enhancement report lists citations updated with new verification tags |
| W5-002 | citation-validator | LOW | 4 | Add pincites (page numbers) to major case citations, focusing on frequently cited cases, to reach 150+ pincite instances | remediation-outputs/W5-002-pincite-additions.md | Pincite count ≥150; enhancement report lists cases updated with pincite references |

### W5-001 Detailed Instructions
```yaml
agent: citation-validator
mode: enhance
depends_on: W4-005
input_files:
  - final-memorandum-creac.md
  - CONSOLIDATED FOOTNOTES section (lines 8714+)
output_file: remediation-outputs/W5-001-citation-enhancements.md
parameters:
  current_verification_rate: 87.5% (805/920)
  target_verification_rate: 95% (875/920)
  citations_to_enhance: 70
  priority_order:
    1. Statutes: 42 U.S.C., 26 U.S.C., Ohio Rev. Code → [VERIFIED:uscode.house.gov], [VERIFIED:codes.ohio.gov]
    2. Regulations: 42 C.F.R., 45 C.F.R. → [VERIFIED:ecfr.gov]
    3. Federal Register: Fed. Reg. citations → [VERIFIED:federalregister.gov]
    4. Cases: Federal reporters → [VERIFIED:courtlistener.com] or [VERIFIED:Westlaw]
    5. Agency guidance: CMS/OCR/OIG → [VERIFIED:cms.gov], [VERIFIED:oig.hhs.gov]
  fallback_tags:
    - For calculations: [METHODOLOGY:calculation based on X data source]
    - For industry data: [ASSUMED:industry standard per Y report]
    - For precedent transactions: [INFERRED:comparable transaction Z]
  do_not_add_false_tags: Never add [VERIFIED:X] unless source independently verifiable
validation:
  - Enhancement report lists 70+ citations updated
  - Final verification rate calculated: (805 + enhancements) / 920 >= 0.95
  - No false verification tags added (spot check 10 random enhanced citations)
```

### W5-002 Detailed Instructions
```yaml
agent: citation-validator
mode: enhance_pincites
depends_on: W5-001
input_files:
  - final-memorandum-creac.md
  - remediation-outputs/W5-001-citation-enhancements.md
output_file: remediation-outputs/W5-002-pincite-additions.md
parameters:
  current_pincite_count: 63
  target_pincite_count: 150
  pincites_to_add: 87
  priority_cases:
    - Frequently cited (appears 3+ times): Add pincite to ALL instances
    - Key precedent: *Tuomey*, *Singh*, *Gatewood*, *Astra USA*, *Kosenske*, *Petras*
    - Controlling circuit: 6th Circuit cases (Ohio venue)
    - SCOTUS: All Supreme Court citations
  pincite_format: "[Case Name], [Volume] [Reporter] [First Page], [Pincite Page(s)] ([Court] [Year])"
  example: "*United States ex rel. Drakeford v. Tuomey Healthcare System*, 792 F.3d 364, 377-380 (4th Cir. 2015)"
  add_parenthetical: For non-obvious relevance, add explanatory parenthetical
  example_with_parenthetical: "*Kosenske v. Carlisle HMA, Inc.*, 554 F.3d 88, 94 (3d Cir. 2009) (holding STARK 'inflexible in its application' and 'does not require proof of specific intent')"
validation:
  - Enhancement report lists 87+ pincites added
  - Final pincite count: grep -E "[0-9]+ F\.[0-9]d [0-9]+, [0-9]+" final-memorandum-v2.md >= 150
  - Pincites correspond to holdings cited in text (spot check 10 random pincites)
```

---

## WAVE 6: Final Assembly
- **Parallel**: NO (single assembly task)
- **Gate**: Wave 5 complete
- **Success Criteria Gate**: final-memorandum-v2.md exists, file size >1MB, pre-qa-validate.py exit code 0

| Task ID | Agent | Description | Output File |
|---------|-------|-------------|-------------|
| ASSEMBLY-001 | orchestrator | Integrate all remediation outputs (W1-001 through W5-002) into final-memorandum-v2.md: (1) Insert Questions Presented, (2) Insert Brief Answers, (3) Renumber sections, (4) Replace Executive Summary with trimmed version, (5) Replace body with CREAC-structured content, (6) Apply all W2-002 corrections, (7) Apply all W4/W5 enhancements, (8) Update Table of Contents, (9) Verify no placeholders, (10) Verify file integrity | final-memorandum-v2.md |

### ASSEMBLY-001 Detailed Instructions
```yaml
agent: orchestrator
mode: assemble
depends_on: [W1-001, W1-002, W2-001, W2-002, W3-001, W4-001, W4-002, W4-003, W4-005, W5-001, W5-002]
input_files:
  base: final-memorandum.md
  additions:
    - remediation-outputs/W1-001-questions-presented.md
    - remediation-outputs/W1-002-brief-answers.md
    - final-memorandum-creac.md (W2-001 output)
    - remediation-outputs/W2-002-creac-validation.md (corrections to apply)
    - remediation-outputs/W3-001-executive-summary-trimmed.md
    - remediation-outputs/W4-001-adverse-authority-check.md (enhancements to apply)
    - remediation-outputs/W4-002-discount-rate-check.md (corrections to apply)
    - remediation-outputs/W4-005-additional-provisions.md (if exists)
    - remediation-outputs/W5-001-citation-enhancements.md
    - remediation-outputs/W5-002-pincite-additions.md
output_file: final-memorandum-v2.md
assembly_sequence:
  1. Copy base structure from final-memorandum.md
  2. Insert new sections at front:
     - After Table of Contents (line ~80), insert W1-001 as "## I. QUESTIONS PRESENTED"
     - After Questions Presented, insert W1-002 as "## II. BRIEF ANSWERS"
  3. Renumber existing sections:
     - Old "## I. EXECUTIVE SUMMARY" → "## III. EXECUTIVE SUMMARY"
     - Old "## II. BACKGROUND" → "## IV. BACKGROUND"
     - Old "## III. METHODOLOGY" → "## V. METHODOLOGY"
     - Old "## IV. DETAILED LEGAL ANALYSIS" → "## VI. DETAILED LEGAL ANALYSIS"
     - Sections IV.A-IV.J → VI.A-VI.J
     - Old "## V. CROSS-REFERENCE MATRIX" → "## VII. CROSS-REFERENCE MATRIX"
     - Old "## VI. SCENARIO ANALYSIS" → "## VIII. SCENARIO ANALYSIS"
     - Old "## VII. CONCLUSIONS" → "## IX. CONCLUSIONS"
  4. Replace Section III (Executive Summary) content with W3-001 output
  5. Replace Sections VI.A-VI.J with final-memorandum-creac.md corresponding sections
  6. Apply W2-002 corrections (swap misclassified CREAC headers, add missing citations)
  7. Apply W4-001 enhancements (add adverse authority citations flagged as missing)
  8. Apply W4-002 corrections (add discount rate disclosures)
  9. If W4-005 exists, insert additional provisions into Recommendations subsections
  10. Apply W5-001 enhancements (add verification tags to 70+ citations)
  11. Apply W5-002 enhancements (add 87+ pincites)
  12. Update Table of Contents:
      - Regenerate line numbers for all sections
      - Update section numbers (I → III for Executive Summary, etc.)
  13. Final cleanup:
      - Verify no [TBD], [TODO], [PLACEHOLDER] markers: grep -i "\[TBD\]\|\[TODO\]\|\[PLACEHOLDER\]" final-memorandum-v2.md (should return 0)
      - Verify no broken section references: grep -o "Section IV\.[A-Z]" final-memorandum-v2.md (all should be "Section VI.[A-Z]" now)
      - Verify CREAC header count: grep -c "^### (Conclusion\|Rule\|Explanation\|Application\|Counter-Analysis)" final-memorandum-v2.md >= 50
  14. File integrity check:
      - File size >1MB (comparable to original 1,084,967 bytes)
      - Line count >8,500 (original had ~9,000 lines)
      - Word count 60,000-85,000 (target range per research plan)
validation:
  - File exists: final-memorandum-v2.md
  - File size: 1,000,000 <= bytes <= 1,200,000
  - No placeholders: grep -c "\[TBD\]\|\[TODO\]\|\[PLACEHOLDER\]" = 0
  - CREAC headers: grep -c "^### (Conclusion\|Rule\|Explanation\|Application\|Counter-Analysis)" >= 50
  - Questions Presented exists: grep -c "^## I. QUESTIONS PRESENTED" = 1 (or II if numbering different)
  - Brief Answers exists: grep -c "^## II. BRIEF ANSWERS" = 1 (or III if numbering different)
  - Executive Summary trimmed: Estimate word count of Section III, should be 2500-3500 words
  - All 10 analysis sections present: grep -c "^## VI\.[A-J]" = 10 (or updated section numbers)
post_assembly:
  - Run pre-qa-validate.py:
      command: python3 scripts/pre-qa-validate.py final-memorandum-v2.md
      expected_exit_code: 0
      if_exit_code_1: Review validation errors, remediate blocking issues, re-run
  - If pre-qa-validate.py passes, proceed to diagnostic cycle 2
```

---

## POST-REMEDIATION VALIDATION

After ASSEMBLY-001 completes, orchestrator must execute:

### Step 1: Run Pre-QA Validation Script
```bash
python3 scripts/pre-qa-validate.py final-memorandum-v2.md
```

**Expected Output**:
```
✓ CREAC Headers: 75 detected (threshold: 50) — PASS
✓ Provision Coverage: 100% (14/14 HIGH/CRITICAL findings) — PASS
⚠ Executive Summary: 3,420 words (threshold: 3,500) — PASS (warning only)
✓ Placeholders: 0 detected — PASS
✓ Section Count: 10 analysis sections detected — PASS

EXIT CODE: 0 (READY FOR QA)
```

If exit code 1 (blocking issues), review error details and remediate before proceeding.

### Step 2: Re-Run Diagnostic Assessment
```yaml
agent: memo-qa-diagnostic
input_file: final-memorandum-v2.md
output_files:
  - qa-outputs/diagnostic-assessment-cycle2.md
  - qa-outputs/remediation-plan-cycle2.md (if score <88%)
  - qa-outputs/remediation-dispatch-cycle2.md (if score <88%)
expected_score: 88-93%
decision_tree:
  - If score >= 93%: Proceed to memo-qa-certifier with CERTIFY recommendation
  - If score 88-92%: Proceed to memo-qa-certifier with CERTIFY_WITH_LIMITATIONS recommendation
  - If score <88% AND cycle <2: Begin remediation cycle 2
  - If score <88% AND cycle >=2: Escalate to human review
```

### Step 3: Certification (if score ≥88%)
```yaml
agent: memo-qa-certifier
input_files:
  - final-memorandum-v2.md
  - qa-outputs/diagnostic-assessment-cycle2.md
output_files:
  - qa-outputs/final-qa-certificate.md
  - qa-outputs/delivery-decision.md
expected_outcome: CERTIFY or CERTIFY_WITH_LIMITATIONS
```

---

## ISSUE TRACKING

### Critical Issues (3)
- [ ] CRIT-001: Generate Questions Presented section (W1-001)
- [ ] CRIT-002: Generate Brief Answers section (W1-002)
- [ ] CRIT-003: Apply CREAC headers ≥50 (W2-001 + W2-002)

### High Issues (6)
- [ ] HIGH-001: Missing Conclusion headers (W2-001)
- [ ] HIGH-002: Missing Rule headers (W2-001)
- [ ] HIGH-003: Missing Explanation headers (W2-001)
- [ ] HIGH-004: Missing Application headers (W2-001)
- [ ] HIGH-005: Executive Summary exceeds limit (W3-001)
- [ ] HIGH-006: Document structure incomplete (W1-001 + W1-002)

### Medium Issues (6)
- [ ] MED-001: Verify adverse authority (W4-001)
- [ ] MED-002: Enhance verification rate to 95% (W5-001)
- [ ] MED-003: Verify discount rates disclosed (W4-002)
- [ ] MED-004: Verify risk tables present (W4-003)
- [ ] MED-005: Verify provision coverage 100% (W4-004 + W4-005)
- [ ] MED-006: Standardize Counter-Analysis headers (W2-001)

### Low Issues (3)
- [ ] LOW-001: CREAC headers use canonical format (W2-001)
- [ ] LOW-002: Add pincites to 150+ citations (W5-002)
- [ ] LOW-003: Executive Summary overlength (duplicate of HIGH-005)

---

## SUCCESS METRICS DASHBOARD

| Metric | Before | Target | After | Status |
|--------|--------|--------|-------|--------|
| Overall Score | 71% | ≥88% | TBD | ⏳ |
| Questions Presented | MISSING | PRESENT | TBD | ⏳ |
| Brief Answers | MISSING | PRESENT | TBD | ⏳ |
| CREAC Headers | 18 | ≥50 | TBD | ⏳ |
| Exec Summary Words | ~5,500 | 2,500-3,500 | TBD | ⏳ |
| Verification Rate | 87.5% | ≥95% | TBD | ⏳ |
| Pincite Count | 63 | ≥150 | TBD | ⏳ |
| Provision Coverage | ~95% | 100% | TBD | ⏳ |
| Issues Resolved | 0/18 | ≥16/18 | TBD | ⏳ |

---

## ESCALATION TRIGGERS

If any of the following occur, escalate to human review:
1. Wave 1-2 tasks fail after 2 retry attempts (Critical sections cannot be generated)
2. CREAC script (W2-001) cannot achieve 50+ headers after retry
3. Post-remediation score <88% after cycle 2
4. New CRITICAL issues introduced by remediation
5. File corruption or data loss during assembly

**Escalation Report Template**: `/reports/[session]/qa-outputs/escalation-report.md`

---

END OF REMEDIATION DISPATCH
