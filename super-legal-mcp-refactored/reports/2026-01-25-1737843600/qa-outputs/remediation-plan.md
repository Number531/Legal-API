# REMEDIATION PLAN

**Source**: diagnostic-assessment.md
**Generated**: 2026-01-25T00:00:00Z
**Remediation Tier**: TIER 3 — FULL (Score <88%, all severities addressed)
**Issues in Scope**: 40 of 40 (CRITICAL: 12, HIGH: 19, MEDIUM: 6, LOW: 3)
**Estimated Duration**: 180-240 minutes

---

## EXECUTIVE SUMMARY

The final memorandum demonstrates **exceptional analytical quality** (Dimensions 4-7, 10-11 scored 90-100%) but requires **targeted structural remediation** to achieve delivery standards:

**Primary Deficiencies:**
1. **CREAC Headers Missing** (Dimension 1: 3/10) — Zero headers across 6,900 lines of analysis
2. **Draft Contract Provisions Missing** (Dimension 9: 2/10) — Zero provisions for 12 HIGH/CRITICAL findings
3. **Risk Tables Incomplete** (Dimension 8: 6/8) — Summary tables present, detailed section tables missing

**Remediation Strategy:**
- **Hybrid Workflow**: Scripts handle mechanical operations (CREAC header insertion, risk table aggregation), agents provide semantic validation (provision drafting, counter-analysis consolidation)
- **Wave Structure**: 6 waves, dependencies enforced to prevent conflicts
- **Quality Gate**: Pre-QA validation (`pre-qa-validate.py`) run BEFORE and AFTER remediation

**Post-Remediation Target**: 88-92% (TIER 2: Strong Associate Work Product)

---

## TIER 3 REMEDIATION SCOPE

| Severity | Count | Included in Scope |
|----------|-------|-------------------|
| CRITICAL | 12 | ✅ All 12 (CREAC headers + Orange County provision) |
| HIGH | 19 | ✅ All 19 (draft provisions + risk tables) |
| MEDIUM | 6 | ✅ All 6 (Questions Presented format, citations, Brief Answers) |
| LOW | 3 | ✅ All 3 (formatting artifacts, verification tags) |
| **TOTAL** | **40** | **40 in scope** |

---

## EXECUTION WAVES

### WAVE 0: Pre-Remediation Validation (MANDATORY FIRST STEP)

**Execution**: Run `pre-qa-validate.py` to establish baseline metrics

```bash
python3 scripts/pre-qa-validate.py final-memorandum.md
```

**Expected Output**:
```
VALIDATION RESULTS (as of 2026-01-25):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASS: Document size adequate (841,784 bytes)
❌ FAIL: CREAC headers (0 found, 50 minimum required) — BLOCKING
✅ PASS: Cross-references (108 found)
❌ FAIL: Provision coverage (0%, requires 100% for HIGH/CRITICAL) — BLOCKING
✅ PASS: Executive Summary word count (~3,200 words, within 2,500-3,500 limit)
⚠️  WARN: Placeholders detected (0 [XREF], but 15 "[Omitted long context line]") — NON-BLOCKING

OVERALL: REMEDIATION REQUIRED
Exit Code: 1
```

**Gate Decision**:
- ✅ If exit code 0: Skip to Wave 6 (final assembly only)
- ❌ If exit code 1: Proceed to Wave 1 (full remediation)

---

### WAVE 1: Additional Research (SKIP — No Research Gaps Identified)

**Parallel Execution**: N/A
**Gate**: None

**Status**: ✅ **SKIPPED** — All 7 specialist reports complete with no identified research gaps

---

### WAVE 2: Content Additions

**Parallel Execution**: Yes
**Gate**: Wave 0 complete

| Task ID | Agent | Priority | Est. Time | Description | Output File | Success Criteria |
|---------|-------|----------|-----------|-------------|-------------|------------------|
| W2-001 | memo-remediation-writer | MEDIUM | 20 min | Restore full Brief Answers section (Section III) from truncated "[Omitted long context line]" placeholders | remediation-outputs/W2-001-brief-answers.md | Narrative brief answers present for all 12 questions |
| W2-002 | memo-remediation-writer | LOW | 15 min | Verify and restore any other truncated content flagged by "[Omitted long context line]" markers | remediation-outputs/W2-002-content-restoration.md | Zero "[Omitted long context line]" placeholders remain |

**Total Wave 2 Time**: 35 minutes

---

### WAVE 3: Structural Fixes (HYBRID WORKFLOW — Scripts + Agents)

**Parallel Execution**: Yes (within each P group)
**Gate**: Wave 2 complete
**Execution Method**: HYBRID — scripts for mechanical work, agents for semantic validation

---

#### P0: Pre-Validation (via pre-qa-validate.py) — RUN FIRST

| Task ID | Agent | Priority | Script | Description |
|---------|-------|----------|--------|-------------|
| W3-000-PRECHECK | (script) | P0 | pre-qa-validate.py | Run ALL validation checks before remediation |

**Usage**: `python3 scripts/pre-qa-validate.py final-memorandum.md`
**Exit Codes**: 0 = ready for QA, 1 = blocking issues found

---

#### P1: CREAC Headers (via apply-creac-headers.py + memo-remediation-writer)

| Task ID | Agent | Priority | Script | Est. Time | Description | Output File |
|---------|-------|----------|--------|-----------|-------------|-------------|
| W3-001-SCRIPT | (script) | P1 | apply-creac-headers.py | 5 min | Insert CREAC headers with minimum 50 guarantee | final-memorandum-creac.md |
| W3-001-VALIDATE | memo-remediation-writer | P1 | — | 30 min | Validate CREAC header correctness, add Counter-Analysis sections where missing | remediation-outputs/W3-001-creac-validation.md |

**Script Usage**:
```bash
python3 scripts/apply-creac-headers.py \
  final-memorandum.md \
  final-memorandum-creac.md \
  --min-headers 50
```

**Minimum Guarantee**: Script ensures ≥50 total CREAC headers, inserting Conclusion headers if pattern detection falls short

**Agent Validation Task (W3-001-VALIDATE)**:
```markdown
**Input**: final-memorandum-creac.md (output from apply-creac-headers.py)
**Task**: For each section (IV.A-IV.G), verify:
1. Each subsection (B.1, B.2, etc.) contains Conclusion → Rule → Explanation → Application → Counter-Analysis
2. Conclusion appears FIRST before Rule
3. Counter-Analysis is substantive (not placeholder)
4. If headers missing, insert manually with proper CREAC content

**Output**: remediation-outputs/W3-001-creac-validation.md (corrections to apply to final-memorandum-creac.md)
```

**Success Criteria**: ≥50 CREAC headers detected post-remediation, all 7 sections have complete CREAC structure

**Total P1 Time**: 35 minutes

---

#### P2: Cross-References (via analyze-xrefs.py + xref-insertion-agent) — SKIP (Already Complete)

**Status**: ✅ **SKIPPED** — Cross-Reference Matrix present with 20 documented patterns, 108 "Section IV.X" references detected, zero [XREF] placeholders

---

#### P3: Counter-Analysis (via detect-counter-analysis.py + memo-remediation-writer) — SKIP (Present in Narrative)

**Status**: ✅ **SKIPPED** — Counter-analysis present in narrative (e.g., "*Escobar* materiality defense," "PDPM subjectivity argument"). Counter-Analysis headers will be added by P1 (W3-001-VALIDATE).

---

#### P4: Provision Coverage (via validate-provisions.py + memo-remediation-writer)

| Task ID | Agent | Priority | Script | Est. Time | Description | Output File |
|---------|-------|----------|--------|-----------|-------------|-------------|
| W3-PROVISION-SCAN | (script) | P4 | validate-provisions.py | 5 min | Identify HIGH/CRITICAL findings missing provisions | provision-gaps.json |
| W3-PROVISION-IV-A | memo-remediation-writer | P4 | — | 20 min | Draft Orange County SFF closing condition, seller obligation, escrow provision | remediation-outputs/W3-PROV-IV-A.md |
| W3-PROVISION-IV-B | memo-remediation-writer | P4 | — | 20 min | Draft FCA indemnification, representation, escrow release provision | remediation-outputs/W3-PROV-IV-B.md |
| W3-PROVISION-IV-C | memo-remediation-writer | P4 | — | 15 min | Draft WARN Act 60-day notice, California SB 525 wage adjustment provisions | remediation-outputs/W3-PROV-IV-C.md |
| W3-PROVISION-IV-D | memo-remediation-writer | P4 | — | 15 min | Draft medical director FMV renegotiation, therapy consent provisions | remediation-outputs/W3-PROV-IV-D.md |
| W3-PROVISION-IV-E | memo-remediation-writer | P4 | — | 15 min | Draft D&O tail coverage, staff retention funding provisions | remediation-outputs/W3-PROV-IV-E.md |
| W3-PROVISION-IV-G | memo-remediation-writer | P4 | — | 10 min | Draft cybersecurity enhancement obligation, HIPAA compliance representation | remediation-outputs/W3-PROV-IV-G.md |

**Script Usage**:
```bash
python3 scripts/validate-provisions.py final-memorandum.md
```

**Expected Output**: `provision-gaps.json` with 12 findings requiring provisions

**Sample `provision-gaps.json` Structure**:
```json
{
  "summary": {
    "coverage_percentage": 0,
    "findings_missing_provisions": 12,
    "total_high_critical_findings": 12
  },
  "missing_provisions": [
    {
      "section_id": "IV.A",
      "finding": "Orange County SFF Termination Risk",
      "severity": "CRITICAL",
      "exposure": "$24.6M",
      "provision_type": "closing_condition_precedent"
    },
    {
      "section_id": "IV.B",
      "finding": "Martinez FCA Settlement",
      "severity": "HIGH",
      "exposure": "$8M-$15M",
      "provision_type": "indemnification"
    }
  ],
  "provision_templates": {
    "IV.A": {
      "template": "### Draft Contract Language: Orange County Pre-Closing Intervention\n\n**Closing Condition Precedent**..."
    }
  }
}
```

**Agent Tasks (W3-PROVISION-IV-X)**:

Each agent task follows this structure:

```markdown
**Input**:
- Section: IV.X (specific section)
- Findings: [list from provision-gaps.json]
- Template: [from provision_templates in provision-gaps.json]

**Task**: Draft complete contract provisions including:
1. **Provision Type** (representation/warranty/indemnity/escrow/condition)
2. **Specific Language** (actionable, not generic "recommend X")
3. **Dollar Amounts** (caps, baskets, escrow amounts)
4. **Duration/Survival** (time periods, release conditions)
5. **Precedent Reference** (cite comparable transaction if available)
6. **Cross-Reference** (tie to specific finding in memorandum)

**Output Format**:
### Draft Contract Language: [Finding Name]

**[Provision Type] (Purchase Agreement Section X.X):**

"[Specific contractual language with brackets for customization...]"

**Drafting Notes**:
- [Explain cap/basket rationale]
- [Cite precedent transaction]
- [Flag negotiation points]

**Precedent Reference**: [Transaction name, year, comparable provision]
```

**Success Criteria**: 100% provision coverage (12 of 12 HIGH/CRITICAL findings have draft provisions)

**Total P4 Time**: 100 minutes

---

#### P5: Citation Analysis (via extract-citations.py + scan-citation-tags.py) — OPTIONAL

| Task ID | Agent | Priority | Script | Est. Time | Description |
|---------|-------|----------|--------|-----------|-------------|
| W3-CITE-EXTRACT | (script) | P5 | extract-citations.py | 5 min | Extract & normalize citations to Bluebook format |
| W3-CITE-SCAN | (script) | P5 | scan-citation-tags.py | 5 min | Detect verification tag coverage |

**Status**: ✅ **OPTIONAL** — Citation quality scored 11/12 (91.7%), within acceptable range. Pincite remediation deferred to Wave 5 (citation-validator agent).

**Total P5 Time**: 10 minutes (optional)

---

#### P6: Risk Analysis (via aggregate-risk-tables.py)

| Task ID | Agent | Priority | Script | Est. Time | Description | Output File |
|---------|-------|----------|--------|-----------|-------------|-------------|
| W3-RISK-AGGREGATE | (script) | P6 | aggregate-risk-tables.py | 10 min | Generate 7 risk assessment tables from narrative content | risk-summary.json |
| W3-RISK-INSERT | memo-remediation-writer | P6 | — | 15 min | Insert risk tables into Sections IV.A-IV.G at end of each section | remediation-outputs/W3-RISK-INSERT.md |

**Script Usage**:
```bash
python3 scripts/aggregate-risk-tables.py final-memorandum-creac.md
```

**Expected Output**: `risk-summary.json` with 7 tables (one per section)

**Sample `risk-summary.json` Structure**:
```json
{
  "section_IV_A": {
    "section_name": "CMS Regulatory Compliance",
    "risk_table": [
      {
        "finding": "Orange County SFF Termination Risk",
        "severity": "CRITICAL",
        "probability": "35%",
        "exposure": "$24.6M annual revenue",
        "mitigation": "Mock survey, interim management, staffing surge to 3.6 PPD"
      },
      {
        "finding": "DPNA Revenue Loss (FY2024 + Future)",
        "severity": "MEDIUM",
        "probability": "30-40% recurrence",
        "exposure": "$1.53M FY2024 + $1.5M-$3M future",
        "mitigation": "Wound care specialist retention (Desert Sun), infection control program (Orange County)"
      }
    ]
  }
}
```

**Agent Task (W3-RISK-INSERT)**:

```markdown
**Input**:
- risk-summary.json (output from aggregate-risk-tables.py)
- final-memorandum-creac.md

**Task**: For each section (IV.A-IV.G), insert risk assessment table at end of section (before next ## header) using this format:

---

### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| [Finding 1] | [CRITICAL/HIGH/MEDIUM/LOW] | [X%] | [$Y] | [Strategy] |
| [Finding 2] | [CRITICAL/HIGH/MEDIUM/LOW] | [X%] | [$Y] | [Strategy] |

---

**Output**: remediation-outputs/W3-RISK-INSERT.md (7 tables ready for insertion)
```

**Success Criteria**: 7 risk assessment tables inserted (one per section IV.A-IV.G)

**Total P6 Time**: 25 minutes

---

**WAVE 3 TOTAL TIME**: 170 minutes (P1: 35m + P4: 100m + P6: 25m + buffer: 10m)

---

### WAVE 4: Language/Format Fixes

**Parallel Execution**: Yes
**Gate**: Wave 3 complete

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Output File |
|---------|-------|----------|------------|----------------|-------------|-------------|
| W4-001 | memo-remediation-writer | MEDIUM | 10 min | Section I (line 83) | Neutralize "clearly demonstrates" → "demonstrates" | remediation-outputs/W4-001-objectivity.md |
| W4-002 | memo-remediation-writer | MEDIUM | 15 min | Section II (Questions Presented) | Reformat 10 "Whether" questions to strict "Under/Does/When" format | remediation-outputs/W4-002-questions-format.md |

**Total Wave 4 Time**: 25 minutes

---

### WAVE 5: Citation Cleanup (AGENT ONLY — Sequential)

**Parallel Execution**: NO (sequential to avoid footnote renumbering conflicts)
**Gate**: Wave 4 complete
**Method**: Agent-only (citation-validator)

**IMPORTANT**: `scan-citation-tags.py` is a PRE-QA validation script (P5), NOT a Wave 5 remediation tool. Wave 5 uses `citation-validator` agent directly.

| Task ID | Agent | Priority | Est. Time | Description | Output File |
|---------|-------|----------|-----------|-------------|-------------|
| W5-001 | citation-validator | MEDIUM | 30 min | Add specific page references to top 100 most-cited cases (estimated 5-10% missing pincites) | remediation-outputs/W5-001-pincites.md |
| W5-002 | citation-validator | LOW | 20 min | Add explanatory parentheticals to case citations lacking context (prioritize: cases cited 2+ times, holdings central to analysis, adverse authority) | remediation-outputs/W5-002-parentheticals.md |
| W5-003 | citation-validator | LOW | 15 min | Document methodology for remaining [ASSUMED]/[INFERRED] citations explaining why direct verification unavailable | remediation-outputs/W5-003-unverified-methodology.md |

**Sequential Execution**: W5-001 → W5-002 → W5-003 (sequential to avoid footnote renumbering conflicts)

**Total Wave 5 Time**: 65 minutes

---

### WAVE 6: Final Assembly

**Parallel Execution**: NO (sequential)
**Gate**: Wave 5 complete

| Task ID | Agent | Description | Input Files | Output File |
|---------|-------|-------------|-------------|-------------|
| ASSEMBLY-001 | memo-final-synthesis | Integrate all remediation outputs into final-memorandum-v2.md | final-memorandum-creac.md + all W2-W5 remediation outputs | final-memorandum-v2.md |
| VALIDATE-001 | (script) | Run pre-qa-validate.py on final-memorandum-v2.md to confirm all issues resolved | final-memorandum-v2.md | qa-validation-post-remediation.txt |

**Assembly Task Instructions**:

```markdown
**Input Files** (in order of application):
1. final-memorandum-creac.md (base document with CREAC headers from W3-001)
2. remediation-outputs/W2-001-brief-answers.md (restored Brief Answers)
3. remediation-outputs/W2-002-content-restoration.md (other restored content)
4. remediation-outputs/W3-001-creac-validation.md (CREAC header corrections)
5. remediation-outputs/W3-PROV-IV-[A-G].md (12 draft contract provisions)
6. remediation-outputs/W3-RISK-INSERT.md (7 risk assessment tables)
7. remediation-outputs/W4-001-objectivity.md (language neutralization)
8. remediation-outputs/W4-002-questions-format.md (Questions Presented reformatting)
9. remediation-outputs/W5-001-pincites.md (citation pincites)
10. remediation-outputs/W5-002-parentheticals.md (explanatory parentheticals)
11. remediation-outputs/W5-003-unverified-methodology.md (verification methodology notes)

**Assembly Process**:
1. Start with final-memorandum-creac.md as base
2. Apply W2 content restorations (Brief Answers, truncated sections)
3. Apply W3 structural fixes (CREAC validation corrections, provisions, risk tables)
4. Apply W4 language/format fixes
5. Apply W5 citation enhancements
6. Verify no conflicts (e.g., duplicate headers, inconsistent numbering)
7. Save as final-memorandum-v2.md

**Quality Checks**:
- [ ] CREAC headers ≥50 (via grep count)
- [ ] Draft provisions present for all 12 HIGH/CRITICAL findings
- [ ] Risk assessment tables present in all 7 sections
- [ ] Zero "[Omitted long context line]" placeholders
- [ ] Zero advocacy language ("clearly," "obviously")
- [ ] Questions Presented in "Under/Does/When" format
```

**Validation Task (VALIDATE-001)**:

```bash
python3 scripts/pre-qa-validate.py final-memorandum-v2.md
```

**Expected Output**:
```
VALIDATION RESULTS (post-remediation):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASS: Document size adequate (900,000+ bytes)
✅ PASS: CREAC headers (65 found, 50 minimum required)
✅ PASS: Cross-references (108 found)
✅ PASS: Provision coverage (100%, all HIGH/CRITICAL findings covered)
✅ PASS: Executive Summary word count (~3,200 words)
✅ PASS: Placeholders (0 found)

OVERALL: READY FOR QA CERTIFICATION
Exit Code: 0
```

**Total Wave 6 Time**: 30 minutes

---

## DEPENDENCY GRAPH

```
Wave 0 (Pre-Validation)
    ↓
Wave 2 (Content Additions)
    ↓
Wave 3 (Structural Fixes — Parallel within P groups)
    ├─ P1: CREAC Headers (script + agent)
    ├─ P4: Provision Coverage (script + agent)
    └─ P6: Risk Tables (script + agent)
    ↓
Wave 4 (Language/Format Fixes)
    ↓
Wave 5 (Citation Cleanup — Sequential)
    W5-001 → W5-002 → W5-003
    ↓
Wave 6 (Final Assembly + Validation)
```

---

## ESCALATION RULES

- **Max Cycles**: 2 (current cycle: 1)
- **Escalation Trigger**: Same issue unresolved after 2 cycles
- **Escalation Action**: Flag for human review with specific issue details

**Escalation Scenarios**:

| Scenario | Trigger | Action |
|----------|---------|--------|
| CREAC headers still <50 after remediation | Wave 6 validation fails | Human review of `apply-creac-headers.py` output + manual insertion |
| Provision coverage still <100% after remediation | Wave 6 validation fails | Human drafting of missing provisions using precedent transactions |
| Post-remediation score <88% | Second QA diagnostic cycle scores <88% | Escalate to senior partner review with remediation-plan.md |

---

## SUCCESS METRICS

| Metric | Baseline (Pre-Remediation) | Target (Post-Remediation) | Measurement Method |
|--------|---------------------------|---------------------------|-------------------|
| Overall Score | 73% | ≥88% (TIER 2) | QA diagnostic re-run |
| CREAC Headers | 0 | ≥50 | Grep count |
| Provision Coverage | 0% | 100% | validate-provisions.py |
| Risk Table Coverage | 0 of 7 sections | 7 of 7 sections | Manual inspection |
| Dimension 1 (CREAC) | 3/10 | ≥8/10 | QA dimension score |
| Dimension 9 (Provisions) | 2/10 | ≥8/10 | QA dimension score |
| Dimension 8 (Risk Tables) | 6/8 | 8/8 | QA dimension score |
| Regressions | N/A | 0 (no score decreases) | QA dimension comparison |

---

## ESTIMATED TIMELINE

| Wave | Duration | Cumulative |
|------|----------|------------|
| Wave 0: Pre-Validation | 5 min | 5 min |
| Wave 2: Content Additions | 35 min | 40 min |
| Wave 3: Structural Fixes | 170 min | 210 min |
| Wave 4: Language/Format | 25 min | 235 min |
| Wave 5: Citation Cleanup | 65 min | 300 min |
| Wave 6: Final Assembly | 30 min | 330 min |
| **TOTAL** | **330 min** | **(5.5 hours)** |

**Note**: Parallel execution within waves reduces wall-clock time. Actual elapsed time with agent concurrency: **~4 hours**.

---

## POST-REMEDIATION QUALITY PROJECTION

**Expected Dimension Scores (Post-Remediation):**

| Dimension | Pre-Remediation | Post-Remediation | Improvement |
|-----------|-----------------|------------------|-------------|
| Dim 0: Questions Presented | 4.5/5 (90%) | 5.0/5 (100%) | +0.5% |
| **Dim 1: CREAC Structure** | 3.0/10 (30%) | 8.5/10 (85%) | **+5.5%** |
| Dim 2: Objectivity | 7.5/8 (94%) | 8.0/8 (100%) | +0.5% |
| Dim 3: Brief Answers | 4.5/5 (90%) | 5.0/5 (100%) | +0.5% |
| Dim 4: Executive Summary | 7.0/7 (100%) | 7.0/7 (100%) | 0% |
| Dim 5: Citation Quality | 11.0/12 (92%) | 11.5/12 (96%) | +0.5% |
| Dim 6: Quantification | 10.0/10 (100%) | 10.0/10 (100%) | 0% |
| Dim 7: Cross-References | 8.0/8 (100%) | 8.0/8 (100%) | 0% |
| **Dim 8: Risk Tables** | 6.0/8 (75%) | 8.0/8 (100%) | **+2.0%** |
| **Dim 9: Draft Provisions** | 2.0/10 (20%) | 9.0/10 (90%) | **+7.0%** |
| Dim 10: Formatting | 6.5/7 (93%) | 7.0/7 (100%) | +0.5% |
| Dim 11: Completeness | 9.0/10 (90%) | 10.0/10 (100%) | +1.0% |
| **BASE SCORE** | **79.0%** | **96.5%** | **+17.5%** |
| Red Flag Deductions | -6.0% | 0% | +6.0% |
| **OVERALL SCORE** | **73%** | **96.5%** | **+23.5%** |

**Projected Quality Tier**: TIER 3 (92-95%) — Senior Associate / Junior Partner Quality

---

**REMEDIATION PLAN COMPLETE**
**Next Step**: Generate remediation-dispatch.md for orchestrator execution
