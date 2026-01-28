# REMEDIATION PLAN

**Source**: diagnostic-assessment.md
**Generated**: January 23, 2026
**Remediation Tier**: **TIER 3 — FULL** (score 82.4% <88% triggers comprehensive remediation)
**Issues in Scope**: **9 of 9** (TIER 3 includes all severities: 4 CRITICAL + 1 HIGH + 4 MEDIUM + 0 LOW)
**Estimated Duration**: **28-40 hours** (distributed across 6 waves)
**Target Post-Remediation Score**: **93-95%** (CERTIFY threshold ≥93%)

---

## Remediation Strategy

### Tier 3 Rationale

**Current Score: 82.4%** falls below 88% threshold, triggering **TIER 3 — FULL remediation** addressing all severity levels. While the memorandum demonstrates exceptional substantive quality (perfect scores in Quantification, Risk Tables, Formatting, Completeness), **critical structural deficiencies** prevent certification:

1. **Missing CREAC Headers** (0/10 points lost): Zero sections use formal Conclusion/Rule/Explanation/Application/Counter-Analysis structure
2. **Missing Questions Presented** (0/5 points lost): No formal section with Under/Does/When format
3. **Missing Cross-References** (5/8 points lost): Zero inline "See Section IV.X" references
4. **Incomplete Brief Answers** (3/5 points lost): Table format instead of full narrative answers

### Path to Certification

Remediating the 4 CRITICAL issues adds **+12 points** → **94.4% score** → **CERTIFY** status.

**Priority**: Focus remediation resources on CRITICAL/HIGH issues (Waves 2-3) that directly impact structural compliance. MEDIUM issues (advocacy language, pincites) are lower priority but included in TIER 3 scope.

---

## Execution Waves

### Wave 1: Additional Research
**Parallel Execution**: N/A (no research tasks)
**Gate**: None
**Duration**: 0 hours

| Task ID | Agent | Priority | Est. Time | Description |
|---------|-------|----------|-----------|-------------|
| — | — | — | — | No additional research required. All substantive analysis complete. |

**Rationale**: Memorandum already contains comprehensive legal analysis with 1,423 footnotes, quantified risk assessment, and draft contract provisions. Remediation focuses on **structural reorganization**, not new research.

---

### Wave 2: Content Additions
**Parallel Execution**: YES (tasks W2-001 and W2-002 can run simultaneously)
**Gate**: Wave 1 complete (immediate start, no research dependency)
**Duration**: 6-8 hours

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Output File |
|---------|-------|----------|-----------|----------------|-------------|-------------|
| **W2-001** | memo-executive-summary-writer | **CRITICAL** | 4-5 hours | Insert new Section II | Generate formal "Questions Presented" section with 12 questions in Under/Does/When format based on existing Brief Answers table (Section I.B). Extract abbreviated questions from I.B, expand to full format: "Under [statute], does [conduct] [result] when [specific facts]?" Order by deal-blocking risk. | remediation-outputs/W2-001-questions-presented.md |
| **W2-002** | memo-executive-summary-writer | **HIGH** | 2-3 hours | Insert new Section III | Generate standalone "Brief Answers" section with full narrative format. For each of 12 questions, provide: "**[Probably Yes/No/Yes/No].** Because [2-3 sentence reasoning citing key rule + critical facts]. See Section IV.X for detailed analysis." Convert existing I.B table data to narrative paragraphs. | remediation-outputs/W2-002-brief-answers.md |

**Success Criteria**:
- W2-001: 12 questions in Under/Does/When format, ordered by severity (CRITICAL findings first), mapped to analysis sections
- W2-002: 12 narrative Brief Answers with definitive answers, "because" clauses, rule references, fact incorporation, section cross-references

**Dependencies**: None (Wave 2 tasks are independent content generation based on existing memorandum)

---

### Wave 3: Structural Fixes (HYBRID WORKFLOW)
**Parallel Execution**: YES (within each P group: P1, P2, P3 run in sequence; tasks within each priority can parallel)
**Gate**: Wave 2 must complete (ensures Questions Presented and Brief Answers exist before CREAC restructuring)
**Duration**: 12-16 hours

Wave 3 uses **HYBRID WORKFLOW**: Python scripts handle mechanical operations (header insertion, cross-reference scanning, counter-analysis detection), then agents perform semantic validation and content generation.

---

#### P1: CREAC Headers (via apply-creac-headers.py + memo-remediation-writer)

| Task ID | Agent/Script | Priority | Est. Time | Target Sections | Description | Output File |
|---------|--------------|----------|-----------|----------------|-------------|-------------|
| **W3-001-SCAN** | apply-creac-headers.py | **CRITICAL** | 1 hour | All IV.A-IV.L | **SCRIPT**: Scan final-memorandum.md to identify CREAC insertion points in all 12 analysis sections. Detect existing subsection structure (e.g., "B.1 SEC October 2023 Examination Deficiencies") and map to CREAC components: (1) Locate conclusion statements (first paragraph of each finding), (2) Identify rule statements (paragraphs citing primary authority), (3) Find explanation sections (case discussions), (4) Locate application sections (fact-to-fact comparisons), (5) Detect scattered counter-analysis. Generate CREAC-insertion-map.json with line numbers for header insertion. | scripts/CREAC-insertion-map.json |
| **W3-001-INSERT** | apply-creac-headers.py | **CRITICAL** | 2 hours | All IV.A-IV.L | **SCRIPT**: Insert CREAC headers into final-memorandum.md based on CREAC-insertion-map.json. For each finding subsection (B.1, B.2, etc.), insert headers: "#### Conclusion", "#### Rule", "#### Explanation", "#### Application". DO NOT insert "#### Counter-Analysis" headers yet (P3 consolidation required first). Preserve all existing content, only add headers. | final-memorandum-creac-headers.md |
| **W3-001-VALIDATE** | memo-remediation-writer | **CRITICAL** | 3-4 hours | All IV.A-IV.L | **AGENT**: Validate CREAC header correctness in final-memorandum-creac-headers.md. For each of 12 sections × ~3 findings per section = ~36 CREAC structures, verify: (1) "#### Conclusion" appears FIRST and contains definitive conclusion statement, (2) "#### Rule" cites primary authority (statutes, regulations, cases), (3) "#### Explanation" discusses ONLY analogous cases (no client facts), (4) "#### Application" uses fact-to-fact comparison with precedent. If header placement is incorrect (e.g., conclusion appears under "Rule" header), manually relocate content to correct CREAC component. | remediation-outputs/W3-001-creac-validation-report.md + final-memorandum-creac-validated.md |

**Success Criteria**:
- 36+ CREAC structures (3 findings × 12 sections) with headers: Conclusion (first), Rule, Explanation, Application
- Validation report confirms 95%+ header placement accuracy
- No client facts appear in Explanation sections

---

#### P2: Cross-References (via analyze-xrefs.py + xref-insertion-agent)

| Task ID | Agent/Script | Priority | Est. Time | Target Sections | Description | Output File |
|---------|--------------|----------|-----------|----------------|-------------|-------------|
| **W3-XREF-SCAN** | analyze-xrefs.py | **CRITICAL** | 2 hours | All IV.A-IV.L | **SCRIPT**: Build cross-reference dependency graph by analyzing final-memorandum-creac-validated.md. Identify "orphaned findings" (findings with multi-domain implications but zero inline cross-references). Examples: (1) MFN side letter (IV.D) impacts client concentration (IV.H) — orphan if no "See Section IV.H", (2) ERISA cross-trading (IV.C) relates to Advisers Act disclosure (IV.A) — orphan if no "See Section IV.A", (3) Valuation markdown (IV.G) affects performance fee clawback (IV.G) and earnout structure (IV.J) — orphan if no "See Section IV.J". Generate xref-matrix.json with: finding_id, section, related_sections[], orphan_status (true/false), recommended_xref_text. Target: Identify 100+ recommended cross-references. | scripts/xref-matrix.json + scripts/xref-orphans-report.md |
| **W3-XREF-INSERT-IV-A** | xref-insertion-agent | **CRITICAL** | 1 hour | Section IV.A | **AGENT**: Insert semantic cross-references into Section IV.A based on xref-matrix.json orphans. For each orphaned finding in IV.A, insert inline cross-references in format: "See Section IV.X [subsection] for analysis of [specific implication]." Example: In IV.A.B.3 (Revenue Sharing Conflicts), insert "See Section IV.C.B.2 for ERISA prohibited transaction analysis of revenue sharing arrangements with plan clients." Preserve existing content, only add cross-reference sentences. | remediation-outputs/W3-XREF-IV-A.md |
| **W3-XREF-INSERT-IV-B** through **W3-XREF-INSERT-IV-L** | xref-insertion-agent | **CRITICAL** | 1 hour each (11 sections) | Sections IV.B through IV.L | **AGENT**: Repeat cross-reference insertion for each remaining section. Total: 11 tasks (IV.B, IV.C, IV.D, IV.E, IV.F, IV.G, IV.H, IV.I, IV.J, IV.K, IV.L). Each task inserts cross-references for orphaned findings in that section based on xref-matrix.json. | remediation-outputs/W3-XREF-IV-[B-L].md (11 files) |

**Success Criteria**:
- 100+ inline cross-references inserted across 12 sections
- All orphaned findings connected to related analysis sections
- xref-matrix.json shows orphan_status: false for 95%+ of multi-domain findings

**Parallelization**: W3-XREF-INSERT tasks for IV.A through IV.L can run in parallel (independent section edits), but all depend on W3-XREF-SCAN completing first.

---

#### P3: Counter-Analysis Consolidation (via detect-counter-analysis.py + memo-remediation-writer)

| Task ID | Agent/Script | Priority | Est. Time | Target Sections | Description | Output File |
|---------|--------------|----------|-----------|----------------|-------------|-------------|
| **W3-COUNTER-SCAN** | detect-counter-analysis.py | **MEDIUM** | 2 hours | All IV.A-IV.L | **SCRIPT**: Detect scattered counter-analysis in final-memorandum-creac-validated.md (with CREAC headers + cross-references inserted). Search for patterns: "Counter-Analysis", "Alternative View", "Counterargument", "Opposing View", "However", "Conversely", "Sellers could argue", "Opposing counsel may contend". For each instance, extract: section_id, finding_id, counter_text, current_location (Explanation/Application), line_number. Generate counter-analysis-locations.json + per-section JSON files (counter-analysis-locations-IV-A.json through counter-analysis-locations-IV-L.json). Target: Identify 48 scattered counter-analysis instances detected in diagnostic. | scripts/counter-analysis-locations.json + scripts/counter-analysis-locations-IV-*.json (12 files) |
| **W3-COUNTER-IV-A** | memo-remediation-writer | **MEDIUM** | 1 hour | Section IV.A | **AGENT**: Consolidate scattered counter-analysis into "#### Counter-Analysis" headers for Section IV.A. Read counter-analysis-locations-IV-A.json, extract all counter-analysis text scattered across Explanation/Application subsections, consolidate under new "#### Counter-Analysis" header (inserted after "#### Application"). Ensure counter-analysis addresses: (1) opposing legal interpretations, (2) mitigating facts favoring Seller, (3) rebuttal to counter-arguments. Remove scattered counter-text from Explanation/Application (avoid duplication). | remediation-outputs/W3-COUNTER-IV-A.md |
| **W3-COUNTER-IV-B** through **W3-COUNTER-IV-L** | memo-remediation-writer | **MEDIUM** | 1 hour each (11 sections) | Sections IV.B through IV.L | **AGENT**: Repeat counter-analysis consolidation for each remaining section. Total: 11 tasks. Each task reads counter-analysis-locations-IV-[X].json and consolidates counter-analysis under "#### Counter-Analysis" headers. | remediation-outputs/W3-COUNTER-IV-[B-L].md (11 files) |

**Success Criteria**:
- 36+ "#### Counter-Analysis" headers inserted (3 findings × 12 sections)
- All 48 scattered counter-analysis instances consolidated
- Counter-Analysis sections address opposing interpretations, mitigating facts, rebuttals

**Parallelization**: W3-COUNTER tasks for IV.A through IV.L can run in parallel after W3-COUNTER-SCAN completes.

---

**Wave 3 Summary**:
- **P1 (CREAC Headers)**: Script inserts headers → Agent validates placement (4-7 hours)
- **P2 (Cross-References)**: Script builds xref-matrix → Agents insert semantic cross-references (13-14 hours)
- **P3 (Counter-Analysis)**: Script detects scattered counter-analysis → Agents consolidate under headers (14-15 hours)
- **Total Wave 3: 12-16 hours** (assumes partial parallelization within P groups)

---

### Wave 4: Language/Format Fixes
**Parallel Execution**: YES
**Gate**: Wave 3 must complete (ensures CREAC structure finalized before language edits)
**Duration**: 4-6 hours

| Task ID | Agent | Priority | Est. Time | Target Sections | Description | Output File |
|---------|-------|----------|-----------|----------------|-------------|-------------|
| **W4-001** | memo-remediation-writer | **MEDIUM** | 2 hours | All sections | Neutralize advocacy language. Search for 9 instances: "clearly" (3), "obviously" (2), "undoubtedly" (2), "without question" (1), "it is certain" (1). Replace with neutral phrasing: "clearly" → "based on precedent" / omit, "obviously" → omit, "undoubtedly" → "the majority rule holds", "without question" → "consistently", "it is certain" → "probable". Preserve surrounding context. | remediation-outputs/W4-001-neutral-language.md |
| **W4-002** | memo-executive-summary-writer | **MEDIUM** | 3-4 hours | Section I (Executive Summary) | Reduce Executive Summary from ~4,200 words to 3,000 words target. Consolidate Sections II-VI (Aggregate Risk Summary, Critical Issues Matrix, Cross-Domain Impact Analysis, Negotiation Position Summary, Timeline & Critical Path) by: (1) Keep Section I (Transaction Recommendation) and I.B (Brief Answers table) unchanged, (2) Merge Sections II-IV into single "Risk Summary" section with consolidated table (retain all 18 findings but reduce prose), (3) Condense Sections V-VI into bullet lists. Preserve all critical numbers and recommendations. Target: 25% word reduction while maintaining board-ready clarity. | remediation-outputs/W4-002-exec-summary-condensed.md |
| **W4-003** | memo-remediation-writer | **LOW** | 1 hour | Throughout | Add precedent transaction references to draft contract provisions. For provisions lacking precedent references (~30% of 24 provisions = 7 provisions), add comparable transaction citations in format: "[See comparable: *Akorn/Fresenius* environmental indemnity structure, *Valeant/Salix* earnout clawback provisions]". Focus on HIGH/CRITICAL finding provisions. | remediation-outputs/W4-003-precedent-references.md |

**Success Criteria**:
- W4-001: Zero advocacy language instances remaining
- W4-002: Executive Summary ≤3,200 words (allows 200-word buffer), all critical numbers preserved
- W4-003: 95%+ of draft provisions include precedent transaction references

**Parallelization**: W4-001, W4-002, W4-003 are independent and can run in parallel.

---

### Wave 5: Citation Cleanup
**Parallel Execution**: NO (sequential to avoid footnote renumbering conflicts)
**Gate**: Wave 4 must complete (ensures final text settled before citation edits)
**Duration**: 4-6 hours

| Task ID | Agent | Priority | Est. Time | Target | Description | Output File |
|---------|-------|----------|-----------|--------|-------------|-------------|
| **W5-001** | citation-validator | **MEDIUM** | 3-4 hours | Top 100 material citations | Add pincites to top 100 most material citations. Prioritize: (1) PRIMARY authority (statutes, regulations, SEC releases, court cases) over secondary sources, (2) Citations supporting HIGH/CRITICAL findings over MEDIUM/LOW, (3) First-reference citations (full citations) over short-form. For each citation, add page number in format: "at [page]" or specific pincite (e.g., "375 U.S. at 194"). If page number unavailable from source, add verification note: "[specific section cited, full document at [URL]]". Target: Pincite compliance 17.6% → 40%+. | remediation-outputs/W5-001-pincites.md |
| **W5-002** | citation-validator | **MEDIUM** | 2-3 hours | Top 50 case citations | Add explanatory parentheticals to top 50 case citations where relevance is not obvious from context. Format: "*(holding that [brief statement of relevant holding])*" or "*(finding [specific fact pattern] created fiduciary breach)*". Focus on cases cited in Rule and Explanation sections (not counter-analysis). | remediation-outputs/W5-002-parentheticals.md |

**Success Criteria**:
- W5-001: 100+ citations with pincites added (total pincite compliance: 351/1,423 = 24.7%)
- W5-002: 50 case citations with explanatory parentheticals

**Sequential Execution**: W5-001 must complete before W5-002 to avoid citation renumbering conflicts.

---

### Wave 6: Final Assembly
**Parallel Execution**: NO (sequential integration)
**Gate**: Wave 5 must complete (all content and citation edits finalized)
**Duration**: 3-5 hours

| Task ID | Agent | Priority | Est. Time | Description | Output File |
|---------|-------|----------|-----------|-------------|-------------|
| **W6-001** | memo-final-synthesis | **CRITICAL** | 3-5 hours | Integrate all remediation outputs into final-memorandum-v2.md. Sequence: (1) Insert W2-001 (Questions Presented) as new Section II, (2) Insert W2-002 (Brief Answers) as new Section III, (3) Renumber existing sections (current Section II "Aggregate Risk Summary" becomes new Section IV, etc.), (4) Integrate W3-001 CREAC headers into all analysis sections, (5) Integrate W3-XREF cross-references into analysis sections, (6) Integrate W3-COUNTER consolidated counter-analysis headers, (7) Apply W4-001 neutral language edits, (8) Replace Executive Summary with W4-002 condensed version, (9) Apply W4-003 precedent references, (10) Update footnotes with W5-001 pincites and W5-002 parentheticals, (11) Regenerate Cross-Reference Matrix to reflect new section numbering and cross-references, (12) Regenerate Table of Contents, (13) Add document footer "--- END OF MEMORANDUM ---", (14) Update metadata tables at end of each section (footnote counts, draft provision counts). Validate: Zero broken cross-references, consistent section numbering, footnote sequence 1-1423 intact. | final-memorandum-v2.md |
| **W6-002** | memo-qa-diagnostic | **CRITICAL** | (separate invocation) | Orchestrator to invoke memo-qa-diagnostic for QA Pass 2 (certification assessment) on final-memorandum-v2.md. Target score: ≥93% for CERTIFY. | qa-outputs/final-qa-certificate.md |

**Success Criteria**:
- final-memorandum-v2.md contains all remediation edits integrated
- Zero merge conflicts or broken references
- Table of Contents accurate
- Footnote numbering 1-1423 preserved
- Cross-Reference Matrix updated with new section numbers
- Document footer present
- QA Pass 2 score ≥93%

---

## Dependency Graph

```
Wave 1 (Research: 0 hrs) ──▶ Wave 2 (Content: 6-8 hrs) ──▶ Wave 3 (Structure: 12-16 hrs) ──▶ Wave 4 (Language: 4-6 hrs) ──▶ Wave 5 (Citations: 4-6 hrs) ──▶ Wave 6 (Assembly: 3-5 hrs)
                                    │                              │
                                    │                              ├─ P1: CREAC (4-7 hrs)
                                    │                              ├─ P2: Cross-Refs (13-14 hrs, parallel within sections)
                                    │                              └─ P3: Counter-Analysis (14-15 hrs, parallel within sections)
                                    │
                                    ├─ W2-001 (Questions Presented)
                                    └─ W2-002 (Brief Answers)
```

**Critical Path**: Wave 2 → Wave 3 (P1-P3 sequential priorities, but parallelization within each priority) → Wave 6
**Estimated Total Duration**: 28-40 hours (assumes 50% parallelization efficiency in Wave 3)

---

## Escalation Rules

**Maximum Remediation Cycles**: 2
- **Cycle 1**: Execute Waves 1-6 → Invoke memo-qa-diagnostic for QA Pass 2
- **Cycle 2** (if QA Pass 2 score <93%): Address remaining HIGH/CRITICAL issues identified in Pass 2 → Invoke memo-qa-certifier for final certification

**Escalation Trigger**: Same issue unresolved after 2 cycles
**Escalation Action**: Flag for human review with diagnostics from both QA passes

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Overall Score** | 82.4% | ≥93% | QA Pass 2 diagnostic-assessment.md |
| **CREAC Headers Present** | 0 | 36+ | Count of "#### Conclusion/Rule/Explanation/Application/Counter-Analysis" headers |
| **Questions Presented** | 0 | 12 | Section II with Under/Does/When format |
| **Brief Answers Format** | Incomplete | Complete | Section III with narrative answers + "because" clauses |
| **Inline Cross-References** | 0 | 100+ | Count of "See Section IV.X" references |
| **Pincite Coverage** | 17.6% | 25%+ | (251 + 100) / 1,423 = 24.7% |
| **Advocacy Language** | 9 instances | 0 | Zero instances of "clearly", "obviously", "undoubtedly" |
| **Executive Summary Length** | ~4,200 words | ≤3,200 words | Word count of Section I |
| **Issues Resolved** | 0 | ≥8 of 9 (90%+) | Issues from diagnostic-assessment.md marked resolved |
| **No Regressions** | N/A | QA Pass 2 ≥ QA Pass 1 | Compare dimension scores Pass 1 vs Pass 2 |

---

## Risk Mitigation

### Risk: Wave 3 Parallelization Conflicts
**Description**: Multiple agents editing same sections simultaneously could create merge conflicts.
**Mitigation**:
- P1 (CREAC headers): Script-based insertion minimizes conflicts
- P2 (Cross-references): Tasks divided by section (IV.A through IV.L), enabling true parallelization
- P3 (Counter-analysis): Tasks divided by section, enabling parallelization
- All agents write to separate remediation-outputs/ files, final integration in W6-001 resolves conflicts

### Risk: CREAC Header Misplacement
**Description**: Script may incorrectly identify CREAC components, placing "Conclusion" header on non-conclusion text.
**Mitigation**:
- W3-001-VALIDATE agent reviews all header placements
- Manual correction in validation step before proceeding to P2/P3

### Risk: Over-Editing in Wave 4-5
**Description**: Language edits or citation additions could introduce errors or break existing cross-references.
**Mitigation**:
- Wave 4-5 tasks explicitly instruct "preserve surrounding context"
- W6-001 integration includes validation step: "Zero broken cross-references"
- QA Pass 2 detects regressions

### Risk: Executive Summary Reduction Loses Critical Detail
**Description**: Condensing from 4,200 to 3,000 words may omit material findings.
**Mitigation**:
- W4-002 instruction: "Preserve all critical numbers and recommendations"
- Focus reduction on prose consolidation, not data deletion
- QA Pass 2 Dimension 4 (Executive Summary Effectiveness) will detect insufficient detail

---

## Quality Gates

### Gate 1: Wave 3 Completion
**Criteria**:
- 36+ CREAC structures with headers inserted
- 100+ cross-references inserted
- 36+ Counter-Analysis headers with consolidated content
- CREAC validation report shows ≥95% header placement accuracy

**Action if Failed**: Re-run W3-001-VALIDATE with manual corrections before proceeding to Wave 4.

### Gate 2: Wave 6 Integration
**Criteria**:
- final-memorandum-v2.md compiles without errors
- Zero broken cross-references (validation script check)
- Footnote numbering 1-1423 intact (no duplicates or gaps)
- Table of Contents matches actual sections

**Action if Failed**: Manual debugging of integration conflicts in W6-001, re-run integration.

### Gate 3: QA Pass 2 Certification
**Criteria**:
- QA Pass 2 score ≥93% (CERTIFY threshold)
- Zero CRITICAL issues remaining
- Zero HIGH issues remaining
- ≤2 MEDIUM issues remaining (acceptable for CERTIFY status)

**Action if Failed**:
- If score 88-92%: CERTIFY_WITH_LIMITATIONS, document remaining limitations
- If score <88%: Initiate Cycle 2 remediation addressing remaining HIGH issues
- If score <88% after Cycle 2: ESCALATE to human review

---

## Task Assignment Summary

| Wave | Agent/Script | Tasks | Est. Hours |
|------|--------------|-------|------------|
| **Wave 1** | — | 0 | 0 |
| **Wave 2** | memo-executive-summary-writer | 2 (W2-001, W2-002) | 6-8 |
| **Wave 3** | apply-creac-headers.py + memo-remediation-writer + analyze-xrefs.py + xref-insertion-agent + detect-counter-analysis.py | 27 (1 scan + 3 insert/validate + 1 scan + 12 insert + 1 scan + 12 consolidate) | 12-16 |
| **Wave 4** | memo-remediation-writer + memo-executive-summary-writer | 3 (W4-001, W4-002, W4-003) | 4-6 |
| **Wave 5** | citation-validator | 2 (W5-001, W5-002) | 4-6 |
| **Wave 6** | memo-final-synthesis + memo-qa-diagnostic | 2 (W6-001 integration, W6-002 QA Pass 2) | 3-5 |
| **TOTAL** | 7 agents + 3 scripts | **36 tasks** | **29-41 hours** |

---

## Output Files Expected

### Remediation Outputs (36 files)
- remediation-outputs/W2-001-questions-presented.md
- remediation-outputs/W2-002-brief-answers.md
- scripts/CREAC-insertion-map.json
- final-memorandum-creac-headers.md
- remediation-outputs/W3-001-creac-validation-report.md
- final-memorandum-creac-validated.md
- scripts/xref-matrix.json
- scripts/xref-orphans-report.md
- remediation-outputs/W3-XREF-IV-A.md through W3-XREF-IV-L.md (12 files)
- scripts/counter-analysis-locations.json
- scripts/counter-analysis-locations-IV-A.json through counter-analysis-locations-IV-L.json (12 files)
- remediation-outputs/W3-COUNTER-IV-A.md through W3-COUNTER-IV-L.md (12 files)
- remediation-outputs/W4-001-neutral-language.md
- remediation-outputs/W4-002-exec-summary-condensed.md
- remediation-outputs/W4-003-precedent-references.md
- remediation-outputs/W5-001-pincites.md
- remediation-outputs/W5-002-parentheticals.md

### Final Outputs (2 files)
- final-memorandum-v2.md (integrated remediation)
- qa-outputs/final-qa-certificate.md (QA Pass 2 certification decision)

---

**END OF REMEDIATION PLAN**
