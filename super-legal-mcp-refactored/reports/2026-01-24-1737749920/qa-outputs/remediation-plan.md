# REMEDIATION PLAN

**Source**: diagnostic-assessment.md
**Generated**: 2026-01-24T18:50:00Z
**Remediation Tier**: TIER 3 — FULL REMEDIATION
**Issues in Scope**: 18 of 18 (all severities included)
**Estimated Duration**: 90-120 minutes

---

## EXECUTIVE SUMMARY

The final memorandum requires **TIER 3 FULL REMEDIATION** to address 18 issues across 12 quality dimensions. The diagnostic score of 71% falls 17 points below the 88% certification threshold.

### Critical Path to Certification

**Current Score**: 71%
**Target Score**: 88-92% (CERTIFY_WITH_LIMITATIONS)
**Stretch Goal**: 93%+ (CERTIFY)

**Point Recovery Roadmap**:
1. **Generate Questions Presented** (+5 points) → 76%
2. **Generate Brief Answers** (+5 points) → 81%
3. **Apply CREAC Headers (50+)** (+7 points) → 88% ✓ CERTIFICATION THRESHOLD
4. **Trim Executive Summary** (+2 points) → 90%
5. **Enhance Counter-Analysis** (+1 point) → 91%
6. **Improve Citation Coverage** (+2 points) → 93% ✓ FULL CERTIFICATION

### Wave Structure Overview

| Wave | Focus | Parallel | Issues | Est. Time | Gate |
|------|-------|----------|--------|-----------|------|
| **1** | Generate Missing Sections | No | 2 CRITICAL | 30 min | None |
| **2** | Apply CREAC Structure | No | 5 HIGH | 25 min | Wave 1 complete |
| **3** | Content Optimization | Yes | 2 HIGH | 20 min | Wave 2 complete |
| **4** | Validation & Enhancement | Yes | 6 MEDIUM | 25 min | Wave 3 complete |
| **5** | Citation Polish | No | 2 LOW | 10 min | Wave 4 complete |
| **6** | Final Assembly | No | 1 task | 10 min | Wave 5 complete |

**Total Estimated Duration**: 120 minutes (2 hours)

---

## EXECUTION WAVES

### WAVE 1: Generate Missing Critical Sections
**Parallel Execution**: No (sequential - must generate Questions before Answers)
**Gate**: None (first wave)
**Estimated Duration**: 30 minutes

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W1-001 | memo-executive-summary-writer | CRITICAL | 20 | Generate Questions Presented section with 10-12 questions in Under/Does/When format corresponding to sections IV.A-IV.J | remediation-outputs/W1-001-questions-presented.md | 10-12 questions; Under/Does/When format; answerable Yes/No; deal-risk ordered |
| W1-002 | memo-executive-summary-writer | CRITICAL | 10 | Generate Brief Answers section with 2-3 sentence answers to each Question Presented, including definitive answer + because clause + cross-reference | remediation-outputs/W1-002-brief-answers.md | One answer per question; definitive Yes/No/Probably; reasoning included; section cross-refs |

**Wave 1 Instructions**:

**W1-001 - Generate Questions Presented**:
```
INPUT: final-memorandum.md sections IV.A-IV.J, research-plan.md critical issues
OUTPUT: Questions Presented section (10-12 questions)

REQUIREMENTS:
1. Format: "Under [statute/regulation], does [action] when [specific facts]?"
2. Order by deal-blocking risk: STARK/AKS, Tax Conversion, Bond Redemption, 340B, HIPAA, CON, etc.
3. Incorporate transaction-specific facts: "$2.4B acquisition", "Mercy Regional", "8 employed physicians own 33%", etc.
4. Each question answerable Yes/No/Probably Yes/Probably No
5. Map to Discussion sections (e.g., Question 1 → IV.A, Question 2 → IV.G)

EXAMPLE:
1. Under 42 U.S.C. § 1395nn (STARK Law), does Mercy Regional Health System's Endoscopy Center LLC arrangement, in which 8 employed gastroenterologists collectively own 33% equity interests and refer Medicare patients for colonoscopies and endoscopies, violate the physician self-referral prohibition when no exception applies to the ownership relationship?
```

**W1-002 - Generate Brief Answers**:
```
INPUT: W1-001 output (Questions Presented), final-memorandum.md executive summary + detailed sections
OUTPUT: Brief Answers section (10-12 answers)

REQUIREMENTS:
1. Format: "[Definitive answer]. Because [1-2 sentence reasoning]. See Section [IV.X] for full analysis."
2. Lead with Yes/No/Probably Yes/Probably No
3. Include key rule and critical facts
4. Cross-reference to detailed analysis section

EXAMPLE:
1. Probably Yes. The arrangement violates STARK because the employed physicians hold ownership interests in an entity to which they refer designated health services, and no exception applies to the ownership relationship (the employment exception protects only the employment compensation, not the ownership returns). Mercy faces mandatory refund liability ($17.6M over 6-year lookback) plus civil monetary penalties up to $27,017 per service. See Section IV.A for STARK/AKS analysis and remediation options.
```

---

### WAVE 2: Apply CREAC Structure
**Parallel Execution**: No (script execution, then validation)
**Gate**: Wave 1 complete
**Estimated Duration**: 25 minutes

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W2-001 | apply-creac-headers.py (script) | CRITICAL | 15 | Run CREAC header insertion script with --min-headers 50 flag to insert Conclusion/Rule/Explanation/Application/Counter-Analysis headers throughout sections IV.A-IV.J | final-memorandum-creac.md | ≥50 total CREAC headers; Conclusion precedes Rule; proper H3 format |
| W2-002 | memo-remediation-writer | HIGH | 10 | Validate CREAC headers semantically correct (Conclusion statements are actually conclusions, Rules cite authority, Explanations discuss cases not facts, Applications compare Mercy to precedent) | remediation-outputs/W2-002-creac-validation.md | All headers semantically accurate; no misclassifications |

**Wave 2 Instructions**:

**W2-001 - Apply CREAC Headers Script**:
```bash
# Command
python3 scripts/apply-creac-headers.py \
  final-memorandum.md \
  final-memorandum-creac.md \
  --min-headers 50 \
  --verbose

# Expected Output
- Detected analysis sections: 10 (IV.A-IV.J)
- Identified conclusions: 12-15
- Identified rules: 18-22
- Identified explanations: 15-20
- Identified applications: 12-15
- Identified counter-arguments: 18-25
- Total headers inserted: 75-97
- Output: final-memorandum-creac.md

# Success Criteria
- Script exit code 0
- Output file created
- Header count ≥50 (verified via grep "^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)")
```

**W2-002 - Validate CREAC Semantic Accuracy**:
```
INPUT: final-memorandum-creac.md (output from W2-001)
OUTPUT: Validation report with corrections needed

VALIDATION CHECKS:
1. Conclusion headers: Followed by definitive statement (e.g., "The arrangement violates STARK...")
2. Rule headers: Followed by statute/regulation/case citation (e.g., "42 U.S.C. § 1395nn(a)(1)...")
3. Explanation headers: Followed by analogous case discussion (NOT Mercy facts)
4. Application headers: Followed by Mercy fact-to-precedent comparison
5. Counter-Analysis headers: Followed by adverse argument + rebuttal

REPORT FORMAT:
- Section IV.A: ✓ All headers semantically correct
- Section IV.B: ⚠️ Application header followed by rule statement (swap headers)
- Section IV.D: ⚠️ Explanation includes client facts (move to Application)
```

---

### WAVE 3: Content Optimization
**Parallel Execution**: Yes
**Gate**: Wave 2 complete
**Estimated Duration**: 20 minutes

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W3-001 | memo-executive-summary-writer | HIGH | 20 | Trim Executive Summary from ~5,500 words to 3,000-3,500 words while preserving BLUF, risk table, critical findings, recommendations, scenario analysis | remediation-outputs/W3-001-executive-summary-trimmed.md | Word count 2,500-3,500; all critical content preserved; recommendation in first 100 words |

**Wave 3 Instructions**:

**W3-001 - Trim Executive Summary**:
```
INPUT: final-memorandum.md lines 84-811 (current Executive Summary ~5,500 words)
OUTPUT: Trimmed Executive Summary 3,000-3,500 words

PRESERVE (REQUIRED):
1. BLUF recommendation (first 100 words) — "PROCEED WITH CONDITIONS" decision
2. Rationale paragraph — structural cost increases + revenue pressure summary
3. Critical Conditions (7 items) — purchase price, escrow, STARK remediation, CON, 340B, tax, payers
4. Comprehensive Risk Summary Table — all HIGH/CRITICAL findings with exposures
5. Aggregate Exposure Summary — certain costs, annual costs, contingent liabilities
6. Recommended Deal Structure Adjustments — purchase price reduction, escrow amounts
7. Scenario Analysis — Base (P50), Downside (P75), Severe Downside (P90) — COMPRESS each to 1-2 paragraphs

COMPRESS/ELIMINATE:
- Detailed subsection analysis (already in sections IV.A-IV.J)
- Repetitive cross-domain patterns (move to Cross-Reference Matrix section)
- Excessive technical detail in risk descriptions
- Redundant quantification (keep aggregate table, remove duplicative text)

TARGET STRUCTURE:
I. EXECUTIVE SUMMARY & BOARD BRIEFING (3,000-3,500 words)
  - BLUF Recommendation (100 words)
  - Rationale (200 words)
  - Critical Conditions (500 words)
  - Aggregate Risk Quantification (800 words — includes table)
  - Recommended Deal Structure (400 words)
  - Scenario Analysis (600 words — 3 scenarios × 200 words each)
  - Board Decision Framework (400 words)
```

---

### WAVE 4: Validation & Enhancement
**Parallel Execution**: Yes
**Gate**: Wave 3 complete
**Estimated Duration**: 25 minutes

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W4-001 | memo-remediation-writer | MEDIUM | 8 | Review HIGH/CRITICAL findings to verify adverse authority cited and rebutted | remediation-outputs/W4-001-adverse-authority-check.md | All HIGH/CRITICAL findings include ≥1 adverse precedent |
| W4-002 | memo-remediation-writer | MEDIUM | 6 | Verify all NPV calculations include discount rate disclosure ("NPV at 8% WACC") | remediation-outputs/W4-002-discount-rate-check.md | All perpetual/multi-year exposures state discount rate |
| W4-003 | memo-remediation-writer | MEDIUM | 5 | Verify each section IV.A-IV.J contains risk table with 5 columns | remediation-outputs/W4-003-risk-table-check.md | 10 section-level risk tables confirmed |
| W4-004 | validate-provisions.py (script) | MEDIUM | 4 | Run provision coverage script to identify HIGH/CRITICAL findings lacking draft contract language | provision-gaps.json | 100% coverage report (all HIGH/CRITICAL have provisions) |
| W4-005 | memo-remediation-writer | MEDIUM | 2 | If provision gaps exist, generate missing provisions using templates from provision-gaps.json | remediation-outputs/W4-005-additional-provisions.md | All gaps filled with specific contract language |

**Wave 4 Instructions**:

**W4-001 - Adverse Authority Check**:
```
INPUT: final-memorandum.md sections IV.A-IV.J, diagnostic-assessment.md list of HIGH/CRITICAL findings
OUTPUT: Report identifying any findings lacking adverse precedent discussion

PROCESS:
1. Extract all HIGH/CRITICAL findings from diagnostic assessment
2. For each finding, search final-memorandum.md for:
   - Adverse case citations (e.g., "But see...", "Cf...", "However, [case] held...")
   - Seller arguments (e.g., "Seller may argue...", "Defense available...")
   - Counter-analysis discussion
3. Flag findings lacking adverse authority

REPORT FORMAT:
FINDINGS WITH ADVERSE AUTHORITY (12):
- IV.A STARK/AKS: ✓ Cites defenses (*Tuomey*, exception analysis)
- IV.D 340B Loss: ✓ Acknowledges PhRMA litigation adverse outcome possibility

FINDINGS NEEDING ADVERSE AUTHORITY (2):
- IV.B CON Approval: ⚠️ Add OhioHealth opposition arguments + rebuttal
- IV.H Bond Covenant: ⚠️ Add trustee waiver precedent discussion
```

**W4-004 - Provision Coverage Script**:
```bash
# Command
python3 scripts/validate-provisions.py final-memorandum.md

# Expected Output (provision-gaps.json)
{
  "summary": {
    "total_high_critical_findings": 14,
    "findings_with_provisions": 14,
    "findings_missing_provisions": 0,
    "coverage_percentage": 100
  },
  "missing_provisions": [],
  "provision_templates": {}
}

# If gaps exist
{
  "summary": {"coverage_percentage": 92.9},
  "missing_provisions": [
    {
      "section": "IV.H",
      "finding": "Bond covenant breach risk",
      "severity": "HIGH",
      "provision_type": "covenant_waiver_consent"
    }
  ],
  "provision_templates": {
    "IV.H": {
      "template": "### Bond Covenant Waiver\n\n**Seller Representation.** Seller represents...",
      "precedent": "Comparable in *Akorn/Fresenius* bond financing..."
    }
  }
}
```

---

### WAVE 5: Citation Polish
**Parallel Execution**: No (sequential to avoid conflicts)
**Gate**: Wave 4 complete
**Estimated Duration**: 10 minutes

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Success Criteria |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W5-001 | citation-validator | MEDIUM | 6 | Review 115 unverified citations and add verification tags where possible to reach 95%+ verification rate | remediation-outputs/W5-001-citation-enhancements.md | Verification rate ≥95% (875+/920) |
| W5-002 | citation-validator | LOW | 4 | Add pincites to major case citations (focus on frequently cited cases) to reach 150+ pincite instances | remediation-outputs/W5-002-pincite-additions.md | ≥150 pincite instances (80%+ of case citations) |

**Wave 5 Instructions**:

**W5-001 - Enhance Citation Verification**:
```
INPUT: final-memorandum.md, CONSOLIDATED FOOTNOTES section (920 footnotes, 805 verified = 87.5%)
OUTPUT: Enhanced footnotes with additional verification tags

TARGET: 95% verification (875/920)
NEEDED: +70 verification tags

PRIORITY ORDER:
1. Statutes: Add [VERIFIED:uscode.house.gov] to any 42 U.S.C., 26 U.S.C. citations
2. Regulations: Add [VERIFIED:ecfr.gov] to any 42 C.F.R., 45 C.F.R. citations
3. Federal Register rules: Add [VERIFIED:federalregister.gov] to any Fed. Reg. citations
4. Cases: Add [VERIFIED:courtlistener.com] or [VERIFIED:Westlaw] where accessible
5. For truly unverifiable: Use [METHODOLOGY:calculation] or [ASSUMED:industry standard] as appropriate

AVOID: Do NOT add false verification tags; use ASSUMED/INFERRED if source not independently verifiable
```

**W5-002 - Add Pincites**:
```
INPUT: final-memorandum.md case citations
CURRENT: 63 pincite instances
TARGET: 150+ pincite instances

FOCUS ON:
- Frequently cited cases (appears 3+ times): Add pincite to all instances
- Key precedent: STARK (*Tuomey*, *Singh*), HIPAA (*Gatewood*), Tax (*Astra USA*)
- Controlling circuit: 6th Circuit (Ohio venue)

FORMAT:
Before: *United States ex rel. Drakeford v. Tuomey Healthcare System*, 792 F.3d 364 (4th Cir. 2015)
After: *United States ex rel. Drakeford v. Tuomey Healthcare System*, 792 F.3d 364, 377-380 (4th Cir. 2015) (holding compensation formula "takes into account" referrals violates STARK)
```

---

### WAVE 6: Final Assembly
**Parallel Execution**: No
**Gate**: Wave 5 complete
**Estimated Duration**: 10 minutes

| Task ID | Agent | Description | Output File |
|---------|-------|-------------|-------------|
| ASSEMBLY-001 | orchestrator | Integrate all remediation outputs into final-memorandum-v2.md: (1) Insert W1-001 Questions Presented after Table of Contents, (2) Insert W1-002 Brief Answers after Questions Presented, (3) Replace body with W2-001 CREAC-structured content validated by W2-002, (4) Replace Executive Summary with W3-001 trimmed version, (5) Apply all W4/W5 enhancements, (6) Regenerate Table of Contents with updated section numbers | final-memorandum-v2.md |

**Wave 6 Instructions**:

**ASSEMBLY-001 - Integrate All Outputs**:
```
INPUTS:
- final-memorandum.md (original)
- W1-001-questions-presented.md
- W1-002-brief-answers.md
- final-memorandum-creac.md (W2-001 output with CREAC headers)
- W2-002-creac-validation.md (corrections to apply)
- W3-001-executive-summary-trimmed.md
- W4-001 through W4-005 (validation corrections)
- W5-001-citation-enhancements.md
- W5-002-pincite-additions.md

OUTPUT: final-memorandum-v2.md

ASSEMBLY SEQUENCE:
1. Copy structure from final-memorandum.md
2. Insert W1-001 as new section "I. QUESTIONS PRESENTED" (before current Section I)
3. Insert W1-002 as new section "II. BRIEF ANSWERS" (after Questions Presented)
4. Renumber: Current "I. Executive Summary" → "III. Executive Summary"
5. Replace Section III content with W3-001 (trimmed executive summary)
6. Replace Sections IV.A-IV.J with final-memorandum-creac.md content (CREAC structured)
7. Apply W2-002 corrections (semantic fixes to CREAC headers)
8. Apply W4-001 through W4-005 enhancements
9. Apply W5-001 and W5-002 citation improvements
10. Update Table of Contents with new section numbers
11. Verify: No [TBD], [TODO], [PLACEHOLDER] markers
12. Verify: File size >1MB (comparable to original)
13. Run final validation: grep -c "^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)" (should be ≥50)
```

---

## DEPENDENCY GRAPH

```
Wave 1 (Generate Sections)
  ├── W1-001 (Questions Presented) ──┐
  └── W1-002 (Brief Answers) ────────┴─▶ Wave 2
                                         │
Wave 2 (Apply CREAC)                     │
  ├── W2-001 (Script) ────────────┐     │
  └── W2-002 (Validate) ──────────┴─▶ Wave 3
                                      │
Wave 3 (Optimize Content)             │
  └── W3-001 (Trim Exec Summary) ───▶ Wave 4
                                      │
Wave 4 (Validate/Enhance) ────────────┤
  ├── W4-001 (Adverse Authority)      │
  ├── W4-002 (Discount Rates)         │
  ├── W4-003 (Risk Tables)            ├─▶ Wave 5
  ├── W4-004 (Provision Script)       │
  └── W4-005 (Fill Provision Gaps)    │
                                      │
Wave 5 (Citation Polish) ──────────────┤
  ├── W5-001 (Verification)           │
  └── W5-002 (Pincites) ──────────────┴─▶ Wave 6
                                         │
Wave 6 (Final Assembly)                 │
  └── ASSEMBLY-001 ───────────────────▶ final-memorandum-v2.md
```

---

## ESCALATION RULES

**Max Cycles**: 2 remediation cycles
**Current Cycle**: 1

**Escalation Triggers**:
1. **Same CRITICAL issue unresolved after 2 cycles** → Escalate to human review
2. **Post-remediation score <88% after 2 cycles** → Escalate with detailed failure analysis
3. **New CRITICAL issues introduced by remediation** → Halt, rollback, escalate

**Escalation Protocol**:
- Document: `/reports/[session]/qa-outputs/escalation-report.md`
- Contents: Issue description, remediation attempts, failure analysis, recommended human intervention

---

## SUCCESS METRICS

| Metric | Current | Target | Verification Method |
|--------|---------|--------|---------------------|
| **Overall Score** | 71% | ≥88% (CERTIFY_WITH_LIMITATIONS) | Re-run memo-qa-diagnostic on final-memorandum-v2.md |
| **Questions Presented** | MISSING | PRESENT | Section exists with 10-12 questions |
| **Brief Answers** | MISSING | PRESENT | Section exists with 10-12 answers |
| **CREAC Headers** | 18 | ≥50 | `grep -c "^### (Conclusion\|Rule\|Explanation\|Application\|Counter-Analysis)" final-memorandum-v2.md` |
| **Executive Summary Words** | ~5,500 | 2,500-3,500 | Word count verification |
| **Verification Rate** | 87.5% (805/920) | ≥95% (875/920) | Citation statistics in CONSOLIDATED FOOTNOTES |
| **Pincite Coverage** | 63 instances | ≥150 instances | Grep for page number patterns in citations |
| **Provision Coverage** | ~95% | 100% | validate-provisions.py exit code 0 |
| **Issues Resolved** | 0/18 | ≥16/18 (89%) | Compare diagnostic-assessment.md before/after |

---

## POST-REMEDIATION VALIDATION

After Wave 6 assembly complete, orchestrator must:

1. **Run Pre-QA Validation Script**:
   ```bash
   python3 scripts/pre-qa-validate.py final-memorandum-v2.md
   ```
   - Expected exit code: 0 (ready for QA)
   - If exit code 1: Review blocking issues and remediate

2. **Re-Run Diagnostic Assessment**:
   ```
   Invoke: memo-qa-diagnostic
   Input: final-memorandum-v2.md
   Output: qa-outputs/diagnostic-assessment-cycle2.md
   ```
   - Expected score: 88-93%
   - If score <88%: Begin remediation cycle 2
   - If score 88-92%: CERTIFY_WITH_LIMITATIONS
   - If score ≥93%: CERTIFY

3. **Compare Issue Counts**:
   ```
   Cycle 1: 18 issues (3 CRITICAL, 6 HIGH, 6 MEDIUM, 3 LOW)
   Cycle 2: ≤3 issues (0 CRITICAL, ≤1 HIGH, ≤2 MEDIUM)
   ```

4. **Certification Decision**:
   - If all success metrics achieved + score ≥88%: Proceed to memo-qa-certifier
   - If score <88% after cycle 2: Escalate to human review

---

## ESTIMATED TIMELINE

| Milestone | Cumulative Time | Completion Status |
|-----------|----------------|-------------------|
| Wave 1 Complete | T+30 min | ⏳ |
| Wave 2 Complete | T+55 min | ⏳ |
| Wave 3 Complete | T+75 min | ⏳ |
| Wave 4 Complete | T+100 min | ⏳ |
| Wave 5 Complete | T+110 min | ⏳ |
| Wave 6 Complete | T+120 min | ⏳ |
| Pre-QA Validation | T+125 min | ⏳ |
| Diagnostic Cycle 2 | T+135 min | ⏳ |
| Certification Decision | T+140 min | ⏳ |

**Total Estimated Duration**: 140 minutes (2 hours 20 minutes) from remediation start to certification decision.

---

END OF REMEDIATION PLAN
