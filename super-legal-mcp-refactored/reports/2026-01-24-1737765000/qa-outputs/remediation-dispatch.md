# REMEDIATION DISPATCH

**Diagnostic ID**: 2026-01-24-1737765000
**Diagnostic Score**: 78%
**Remediation Tier**: TIER_3_FULL
**Total Issues Found**: 42
**Issues In Scope**: 42 (all severities)
**Estimated Duration**: 12-15 hours (720-900 minutes)
**Max Cycles**: 2
**Current Cycle**: 1

---

## WAVE 1: Additional Research

**Status**: SKIPPED
**Reason**: No research gaps identified. All 13 sections demonstrate comprehensive legal analysis with 1,174 footnotes at 98.6% verification rate.

**Tasks**: 0

---

## WAVE 2: Content Additions

**Parallel**: YES
**Gate**: none (first active wave)
**Estimated Duration**: 6-8 hours (360-480 minutes)
**Priority**: CRITICAL + HIGH

| Task ID | Agent | Priority | Est. Minutes | Target Section | Description | Output File |
|---------|-------|----------|--------------|----------------|-------------|-------------|
| W2-001 | memo-executive-summary-writer | CRITICAL | 45 | Section II | Generate Questions Presented (8-12 questions in Under/Does/When format) | remediation-outputs/W2-001-questions-presented.md |
| W2-002 | memo-executive-summary-writer | CRITICAL | 60 | Section III | Generate Brief Answers (Yes/No/Probably answers with because-clauses) | remediation-outputs/W2-002-brief-answers.md |
| W2-003 | memo-section-writer | HIGH | 15 | IV.A | Generate risk assessment table (STARK/AKS findings) | remediation-outputs/W2-003-risk-table-IV-A.md |
| W2-004 | memo-section-writer | HIGH | 15 | IV.B | Generate risk assessment table (EMTALA findings) | remediation-outputs/W2-004-risk-table-IV-B.md |
| W2-005 | memo-section-writer | HIGH | 15 | IV.C | Generate risk assessment table (CON findings) | remediation-outputs/W2-005-risk-table-IV-C.md |
| W2-006 | memo-section-writer | HIGH | 15 | IV.D | Generate risk assessment table (GME findings) | remediation-outputs/W2-006-risk-table-IV-D.md |
| W2-007 | memo-section-writer | HIGH | 15 | IV.E | Generate risk assessment table (340B findings) | remediation-outputs/W2-007-risk-table-IV-E.md |
| W2-008 | memo-section-writer | HIGH | 15 | IV.F | Generate risk assessment table (HIPAA findings) | remediation-outputs/W2-008-risk-table-IV-F.md |
| W2-009 | memo-section-writer | HIGH | 15 | IV.G | Generate risk assessment table (Joint Commission findings) | remediation-outputs/W2-009-risk-table-IV-G.md |
| W2-010 | memo-section-writer | HIGH | 15 | IV.H | Generate risk assessment table (Tax conversion findings) | remediation-outputs/W2-010-risk-table-IV-H.md |
| W2-011 | memo-section-writer | HIGH | 15 | IV.I | Generate risk assessment table (Medicare findings) | remediation-outputs/W2-011-risk-table-IV-I.md |
| W2-012 | memo-section-writer | HIGH | 15 | IV.J | Generate risk assessment table (Credentialing findings) | remediation-outputs/W2-012-risk-table-IV-J.md |
| W2-013 | memo-section-writer | HIGH | 15 | IV.K | Generate risk assessment table (Commercial contracts findings) | remediation-outputs/W2-013-risk-table-IV-K.md |
| W2-014 | memo-section-writer | HIGH | 15 | IV.L | Generate risk assessment table (Employment findings) | remediation-outputs/W2-014-risk-table-IV-L.md |
| W2-015 | memo-section-writer | HIGH | 15 | IV.M | Generate risk assessment table (Insurance findings) | remediation-outputs/W2-015-risk-table-IV-M.md |
| W2-016 | memo-executive-summary-writer | HIGH | 60 | Section IV (Exec Summary) | Reduce Executive Summary from 4,500-5,000 words to 3,000-3,500 words | remediation-outputs/W2-016-executive-summary-condensed.md |
| W2-017 | memo-executive-summary-writer | HIGH | 20 | Section IV.A (Exec Summary) | Add explicit overall transaction risk rating (HIGH) with rationale | remediation-outputs/W2-017-risk-rating.md |
| W2-018 | memo-remediation-writer | HIGH | 30 | IV.B | Draft EMTALA investigation escrow provision ($5M, 18-month hold) | remediation-outputs/W2-018-emtala-escrow.md |
| W2-019 | memo-remediation-writer | HIGH | 30 | IV.G | Draft Joint Commission deemed status closing condition | remediation-outputs/W2-019-joint-commission-condition.md |
| W2-020 | memo-remediation-writer | HIGH | 30 | IV.I | Draft Medicare CCN transfer provision (90-day pre-filing, $15M escrow) | remediation-outputs/W2-020-medicare-ccn-transfer.md |
| W2-021 | memo-remediation-writer | HIGH | 30 | IV.J | Draft Dr. Wilson credentialing representation and indemnity ($15M cap) | remediation-outputs/W2-021-credentialing-representation.md |
| W2-022 | memo-remediation-writer | HIGH | 30 | IV.M | Draft insurance coverage provisions (cyber, tail, D&O, uninsured exposure) | remediation-outputs/W2-022-insurance-provisions.md |

**Wave 2 Total**: 22 tasks, 450 minutes (7.5 hours)

---

## WAVE 3: Structural Fixes (HYBRID - Script + Agent)

**Parallel**: YES (within each P group)
**Gate**: WAVE 2 must complete
**Estimated Duration**: 2-3 hours (120-180 minutes)
**Method**: Hybrid (scripts handle mechanical work, agents validate/enhance)

### P0: Pre-Validation (BLOCKING CHECK)

| Task ID | Agent | Priority | Est. Minutes | Script | Description | Output File |
|---------|-------|----------|--------------|--------|-------------|-------------|
| W3-000-PRECHECK | (script only) | P0 | 5 | pre-qa-validate.py | Run ALL validation checks before remediation; exit code 0 = ready, 1 = blocking issues | stdout |

**Usage**: `python3 scripts/pre-qa-validate.py /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum.md`

**Checks**:
- CREAC Headers ≥ 50 (BLOCKING)
- Provision Coverage = 100% for HIGH/CRITICAL (BLOCKING)
- Executive Summary ≤ 3,500 words (WARNING)
- Placeholders = 0 (BLOCKING)

**Action on Exit Code 1**: Run P1-P4 remediation tasks below, then re-run W3-000-PRECHECK until exit code 0.

---

### P1: CREAC Headers (Script + Agent Validation)

| Task ID | Agent | Priority | Est. Minutes | Script | Description | Output File |
|---------|-------|----------|--------------|--------|-------------|-------------|
| W3-001 | (script only) | P1 | 10 | apply-creac-headers.py | Insert CREAC headers with minimum 50-header guarantee | final-memorandum-creac.md |
| W3-001-VALIDATE | memo-remediation-writer | P1 | 45 | — | Validate CREAC header correctness and enhance analysis | remediation-outputs/W3-001-VALIDATE-creac-review.md |

**W3-001 Usage**:
```bash
python3 scripts/apply-creac-headers.py \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum.md \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum-creac.md \
  --min-headers 50
```

**Script Guarantee**: Minimum 50 CREAC headers inserted across 13 sections (pattern detection + backup insertion if <50 detected)

**Agent Validation**: Review header placement, correct systematic errors, enhance analysis where needed

---

### P2: Cross-References (Script + Agent Enhancement)

| Task ID | Agent | Priority | Est. Minutes | Script | Description | Output File |
|---------|-------|----------|--------------|--------|-------------|-------------|
| W3-XREF-SCAN | (script only) | P2 | 10 | analyze-xrefs.py | Build cross-reference dependency graph and identify orphaned sections | xref-matrix.json |
| W3-XREF-{section} | xref-insertion-agent | P2 | 30 per orphan | — | Insert semantic cross-references for each orphaned section (1-3 sections expected) | remediation-outputs/W3-XREF-IV-{section}.md |

**W3-XREF-SCAN Usage**:
```bash
python3 scripts/analyze-xrefs.py \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum.md
```

**Expected Orphans**: 1-3 sections with <2 cross-references (likely IV.C, IV.G)

**Agent Tasks**: One task per orphaned section, adding 2-4 substantive cross-references

---

### P3: Counter-Analysis (Script + Agent Enhancement)

| Task ID | Agent | Priority | Est. Minutes | Script | Description | Output File |
|---------|-------|----------|--------------|--------|-------------|-------------|
| W3-COUNTER-SCAN | (script only) | P3 | 10 | detect-counter-analysis.py | Detect scattered counter-analysis and identify underdeveloped sections | counter-analysis-locations.json |
| W3-COUNTER-{section} | memo-remediation-writer | P3 | 20 per section | — | Add 2-3 substantive counter-analysis blocks per underdeveloped section (2-4 sections expected) | remediation-outputs/W3-COUNTER-IV-{section}.md |

**W3-COUNTER-SCAN Usage**:
```bash
python3 scripts/detect-counter-analysis.py \
  /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum.md
```

**Expected Underdeveloped**: 2-4 sections with <3 counter-analysis blocks

**Agent Tasks**: One task per underdeveloped section, adding 2-3 counter-arguments with refutations

---

**Wave 3 Total**: 6+ tasks (3 scripts + 3+ agent tasks), 120-180 minutes (2-3 hours)

**Script Output Files**:
- `final-memorandum-creac.md` (full modified memorandum with CREAC headers)
- `xref-matrix.json` (cross-reference dependency graph)
- `counter-analysis-locations.json` (counter-analysis detection results)

---

## WAVE 4: Language/Format Fixes

**Parallel**: YES
**Gate**: WAVE 3 must complete
**Estimated Duration**: 45 minutes

| Task ID | Agent | Priority | Est. Minutes | Target Section | Description | Output File |
|---------|-------|----------|--------------|----------------|-------------|-------------|
| W4-001 | memo-remediation-writer | MEDIUM | 30 | Various | Neutralize 3 instances of advocacy language (clearly, obviously, etc.) | remediation-outputs/W4-001-advocacy-neutralization.md |
| W4-002 | memo-executive-summary-writer | MEDIUM | 15 | Section IV.A (Exec Summary) | Enhance BLUF recommendation prominence (first sentence, all-caps) | remediation-outputs/W4-002-bluf-enhancement.md |

**Wave 4 Total**: 2 tasks, 45 minutes

---

## WAVE 5: Citation Cleanup (AGENT ONLY - Sequential)

**Parallel**: NO (sequential to avoid footnote renumbering conflicts)
**Gate**: WAVE 4 must complete
**Estimated Duration**: 2-3 hours (120-180 minutes)
**Method**: Agent only (citation-validator)

**⚠️ IMPORTANT**: `scan-citation-tags.py` is a PRE-QA validation script (Wave 3 P5), NOT a Wave 5 remediation tool. Wave 5 uses **citation-validator agent directly**.

| Task ID | Agent | Priority | Est. Minutes | Description | Output File | Sequential Order |
|---------|-------|----------|--------------|-------------|-------------|------------------|
| W5-001 | citation-validator | MEDIUM | 90 | Add specific page references (pincites) to 10-15 citations missing them; prioritize top 100 most-cited cases | remediation-outputs/W5-001-pincites.md | FIRST (run before W5-002) |
| W5-002 | citation-validator | MEDIUM | 90 | Add explanatory parentheticals to top 50 case citations lacking them (estimated 30-40 citations) | remediation-outputs/W5-002-parentheticals.md | SECOND (run AFTER W5-001 completes) |

**⚠️ SEQUENTIAL EXECUTION**: W5-002 must wait for W5-001 to complete to avoid footnote renumbering conflicts.

**Wave 5 Total**: 2 tasks, 180 minutes (3 hours)

**Historical Note**: The successful 2026-01-23 remediation run used citation-validator agent directly for both W5-001 and W5-002 tasks. This approach worked correctly and should be replicated.

---

## WAVE 6: Final Assembly

**Parallel**: NO (sequential)
**Gate**: WAVE 5 must complete
**Estimated Duration**: 30 minutes

| Task ID | Agent | Description | Output File |
|---------|-------|-------------|-------------|
| ASSEMBLY-001 | memo-final-synthesis (or orchestrator) | Integrate all remediation outputs from Waves 2-5 into final-memorandum-v2.md; resolve conflicts; verify section numbering, cross-references, and footnote sequence | /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/final-memorandum-v2.md |

**Integration Checklist**:
- [ ] Insert W2-001 (Questions Presented) as Section II
- [ ] Insert W2-002 (Brief Answers) as Section III
- [ ] Renumber Executive Summary from Section II to Section IV
- [ ] Insert W2-003 through W2-015 (risk tables) into sections IV.A-IV.M
- [ ] Replace Executive Summary with W2-016 (condensed version)
- [ ] Insert W2-017 (risk rating) into Executive Summary
- [ ] Insert W2-018 through W2-022 (draft provisions) into sections
- [ ] Use final-memorandum-creac.md as base (includes CREAC headers from W3-001)
- [ ] Integrate W3-XREF-{section} cross-references
- [ ] Integrate W3-COUNTER-{section} counter-analysis blocks
- [ ] Apply W4-001 advocacy neutralization edits
- [ ] Apply W4-002 BLUF enhancement
- [ ] Apply W5-001 pincite additions
- [ ] Apply W5-002 parenthetical additions
- [ ] Renumber footnotes sequentially (1-1,174+)
- [ ] Verify section numbering (I, II, III, IV.A-IV.M, V, VI, VII, Appendix A-B)
- [ ] Verify cross-references accurate after renumbering
- [ ] Run markdown linter

**Wave 6 Total**: 1 task, 30 minutes

---

## Master Task Summary

| Wave | Tasks | Priority | Est. Minutes | Parallel? | Gate |
|------|-------|----------|--------------|-----------|------|
| **Wave 1** | 0 | — | 0 | — | None (skipped) |
| **Wave 2** | 22 | CRITICAL + HIGH | 450 (7.5 hrs) | YES | None |
| **Wave 3** | 6+ | CRITICAL + HIGH | 120-180 (2-3 hrs) | YES (within P groups) | Wave 2 |
| **Wave 4** | 2 | MEDIUM | 45 | YES | Wave 3 |
| **Wave 5** | 2 | MEDIUM | 180 (3 hrs) | NO (sequential) | Wave 4 |
| **Wave 6** | 1 | ASSEMBLY | 30 | NO | Wave 5 |
| **TOTAL** | **33** | — | **825-885 minutes (13.75-14.75 hrs)** | — | — |

---

## Agent Workload Distribution

| Agent | Wave(s) | Tasks | Est. Minutes |
|-------|---------|-------|--------------|
| **memo-executive-summary-writer** | 2, 4 | 4 | 140 (W2-001, W2-002, W2-016, W2-017, W4-002) |
| **memo-section-writer** | 2 | 13 | 195 (W2-003 through W2-015) |
| **memo-remediation-writer** | 2, 3, 4 | 8+ | 180+ (W2-018 through W2-022, W3-001-VALIDATE, W3-COUNTER-{sections}, W4-001) |
| **xref-insertion-agent** | 3 | 1-3 | 30-90 (W3-XREF-{sections}) |
| **citation-validator** | 5 | 2 | 180 (W5-001, W5-002) |
| **memo-final-synthesis** | 6 | 1 | 30 (ASSEMBLY-001) |
| **Scripts (automated)** | 3 | 3 | 25 (W3-000, W3-001, W3-XREF-SCAN, W3-COUNTER-SCAN) |
| **TOTAL** | — | **33** | **825-885 minutes** |

---

## Critical Path Analysis

**Longest Sequential Dependency Chain:**
```
Wave 2 (7.5 hrs) → Wave 3 (2-3 hrs) → Wave 4 (45 min) → Wave 5 (3 hrs) → Wave 6 (30 min)
Total Critical Path: 13.75-14.75 hours
```

**Parallelization Opportunities:**
- Wave 2: All 22 tasks can run in parallel (7.5 hrs wall-clock time with sufficient agents)
- Wave 3: P1, P2, P3 tasks can run in parallel within each priority group
- Wave 4: 2 tasks can run in parallel (45 min wall-clock time)

**Bottleneck**: Wave 5 (3 hours sequential) — citation-validator must complete W5-001 before W5-002 to avoid footnote renumbering conflicts.

---

## Conflict Resolution Protocol

**If Remediation Outputs Conflict:**

1. **Prioritize by Severity**:
   - CRITICAL > HIGH > MEDIUM > LOW
   - Example: If W2-016 (HIGH) and W4-002 (MEDIUM) both modify Executive Summary, apply W2-016 first, then integrate W4-002 changes

2. **Merge Compatible Edits**:
   - If both tasks enhance different aspects of same paragraph, merge changes
   - Example: W4-001 (neutralize advocacy) + W5-001 (add pincite) = compatible, merge both

3. **Document Unresolved Conflicts**:
   - If tasks fundamentally conflict (e.g., one adds content, other removes same content), flag for human review
   - Include in `remediation-outputs/conflicts-log.md`

4. **Escalate to Human Review**:
   - After 2 remediation cycles, if same conflict persists, escalate with specific recommendation

---

## Success Verification

**Post-Wave 6 Checks** (run before submitting to QA Certification):

1. **Dimension 0**: Questions Presented section present with 8-12 questions ✅
2. **Dimension 1**: ≥50 CREAC headers detected ✅
3. **Dimension 3**: Brief Answers section present with 8-12 answers ✅
4. **Dimension 4**: Executive Summary ≤3,500 words ✅
5. **Dimension 5**: 100% pincite coverage ✅
6. **Dimension 7**: Cross-reference matrix in appendix, orphaned sections connected ✅
7. **Dimension 8**: Risk tables in all 13 sections ✅
8. **Dimension 9**: Draft provisions for all HIGH findings ✅
9. **Dimension 10**: Clean markdown formatting ✅
10. **Dimension 11**: All sections present and ordered correctly ✅

**Automated Verification Commands**:
```bash
# Verify CREAC headers ≥50
grep -c "^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)" final-memorandum-v2.md

# Verify Questions Presented exists
grep -c "## II. QUESTIONS PRESENTED" final-memorandum-v2.md

# Verify Brief Answers exists
grep -c "## III. BRIEF ANSWERS" final-memorandum-v2.md

# Verify risk tables (13 expected)
grep -c "| Finding | Severity | Probability | Exposure | Mitigation |" final-memorandum-v2.md

# Verify no placeholders
grep -c "\[XREF\]|\[TBD\]|\[TODO\]|\[PLACEHOLDER\]" final-memorandum-v2.md  # Should be 0

# Verify Executive Summary word count
sed -n '/^## IV. EXECUTIVE SUMMARY/,/^## V./p' final-memorandum-v2.md | wc -w  # Should be 3000-3500
```

**Expected Post-Remediation Score**: 90-92% (TIER 2 quality)

---

## Delivery Decision Routing

**After Wave 6 Assembly and QA Certification Pass:**

| Certification Score | Outcome | Action |
|---------------------|---------|--------|
| ≥93% | CERTIFY | Deliver final-memorandum-v2.md with certificate |
| 88-92% | CERTIFY_WITH_LIMITATIONS | Deliver with limitations disclosure |
| <88% (Cycle 1) | REJECT_LOOP | Return to diagnostic for Cycle 2 |
| <88% (Cycle 2) | REJECT_ESCALATE | Human review required |

**Current Cycle**: 1
**Max Cycles**: 2

---

## File Outputs Manifest

**Remediation Outputs** (33+ files in `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs/`):

**Wave 2 (22 files)**:
- W2-001-questions-presented.md
- W2-002-brief-answers.md
- W2-003-risk-table-IV-A.md through W2-015-risk-table-IV-M.md (13 files)
- W2-016-executive-summary-condensed.md
- W2-017-risk-rating.md
- W2-018-emtala-escrow.md through W2-022-insurance-provisions.md (5 files)

**Wave 3 (4+ files)**:
- final-memorandum-creac.md (full modified memorandum)
- xref-matrix.json
- counter-analysis-locations.json
- W3-001-VALIDATE-creac-review.md
- W3-XREF-IV-{section}.md (1-3 files)
- W3-COUNTER-IV-{section}.md (2-4 files)

**Wave 4 (2 files)**:
- W4-001-advocacy-neutralization.md
- W4-002-bluf-enhancement.md

**Wave 5 (2 files)**:
- W5-001-pincites.md
- W5-002-parentheticals.md

**Wave 6 (1 file)**:
- final-memorandum-v2.md (complete remediated memorandum)

**QA Outputs** (in `/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/qa-outputs/`):
- diagnostic-assessment.md (this document)
- remediation-plan.md (human-readable plan)
- remediation-dispatch.md (orchestrator task list - THIS DOCUMENT)

**Total Files**: 40+ files

---

**END OF REMEDIATION DISPATCH**
