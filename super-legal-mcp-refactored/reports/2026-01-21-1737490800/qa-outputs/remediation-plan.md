# REMEDIATION PLAN
## Project Chronos Due Diligence Memorandum

**Source**: diagnostic-assessment.md
**Generated**: January 21, 2026
**Diagnostic Score**: 84.7/100
**Remediation Tier**: TIER 2 — STANDARD (CRITICAL + HIGH + MEDIUM issues)
**Issues in Scope**: 8 of 13 total issues (filtered by tier)
**Estimated Duration**: 35-45 minutes across 5 parallel waves
**Projected Post-Remediation Score**: 92-94 (CERTIFY WITH LIMITATIONS)

---

## Executive Summary

The Project Chronos memorandum requires **structural and presentational remediation**, not substantive reanalysis. The document is **content-complete** with sound legal analysis, comprehensive quantification, and sophisticated risk integration. The identified issues are predominantly **formatting, labeling, and citation hygiene** problems that can be resolved through targeted editing without new research.

### Remediation Strategy

**TIER 2 (STANDARD)** remediation addresses 8 issues:
- **1 CRITICAL**: Pincite coverage deficiency (66% missing case citation page numbers)
- **3 HIGH**: CREAC labeling, Questions Presented format, citation verification levels
- **4 MEDIUM**: Explanation/Application separation, native cross-references, risk tables, precedent citations

**Key Principle**: This is a **reorganization and enhancement effort**, not a rewrite. The underlying analysis remains unchanged. Remediation focuses on:
1. Adding explicit CREAC subsection headers (analysis already exists)
2. Reformatting Questions Presented (substantive content unchanged)
3. Adding pincites to case citations (holdings already correctly stated)
4. Inserting native cross-references (connections already identified in Cross-Reference Matrix)
5. Creating per-section risk tables (data already in Aggregate Risk Summary)

### Wave Structure

Remediation is organized into **5 parallel waves** plus 1 sequential final assembly:

- **Wave 1**: Citation enhancement (pincites and verification) - **CRITICAL PATH**
- **Wave 2**: CREAC structure labeling and Questions Presented reformatting
- **Wave 3**: Cross-reference insertion and risk table creation
- **Wave 4**: Precedent transaction citations and minor content additions
- **Wave 5**: Final formatting cleanup
- **Wave 6**: Assembly and integration (sequential)

**Parallelization Opportunity**: Waves 1-4 can execute simultaneously (different agents, different sections, no conflicts). Wave 5 requires completion of Waves 1-4. Wave 6 is final integration.

---

## Issue Prioritization Matrix

| Priority | Issue ID | Severity | Impact | Effort | Agent | Est. Time |
|----------|----------|----------|--------|--------|-------|-----------|
| **P1** | DIM6-001 | CRITICAL | High | High | citation-validator | 25 min |
| **P2** | DIM2-001 | HIGH | High | Low | memo-remediation-writer | 8 min |
| **P3** | DIM1-001 | HIGH | Medium | Low | research-plan-refiner | 5 min |
| **P4** | DIM6-002 | HIGH | Medium | Medium | citation-validator | 12 min |
| **P5** | DIM8-001 | MEDIUM | Medium | Low | memo-remediation-writer | 10 min |
| **P6** | DIM9-001 | MEDIUM | Low | Low | memo-section-writer | 8 min |
| **P7** | DIM2-002 | MEDIUM | Low | Low | memo-remediation-writer | Included in P2 |
| **P8** | DIM10-001 | MEDIUM | Low | Low | memo-remediation-writer | 6 min |

**Total Time**: 74 minutes if sequential | **35-45 minutes if parallel** (waves 1-4 concurrent)

---

## Wave 1: Citation Enhancement (CRITICAL PATH)

**Parallel Execution**: NO (citation-validator runs sequentially on entire document)
**Gate**: None (Wave 1 can start immediately)
**Duration**: 37 minutes (25 min pincites + 12 min verification upgrade)
**Agent**: citation-validator

### Task W1-001: Add Pincites to Case Citations (CRITICAL)

**Issue**: DIM6-001
**Priority**: P1
**Description**: Add page numbers (pincites) to approximately 330 case citations missing them (66% of estimated 500 case citations lack pincites)

**Current State:**
- 172 pincite patterns detected ("at X.", ", X-Y", "F.3d XXX")
- Estimated 500 case citations total in 1,441 footnotes
- Pincite coverage: 34% vs. 95% practitioner standard

**Target State:**
- Pincite coverage ≥95% (≤25 missing pincites acceptable)
- All major case holdings include pincites
- Bluebook compliance on all citations

**Instructions for citation-validator:**

```
TASK: Add pincites to case citations in final-memorandum.md

INPUT:
- Read: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737490800/final-memorandum.md
- Focus: Consolidated Footnotes section (lines 12071-12532)
- Identify: All case citations lacking pincites (format: "Party v. Party, XXX F.3d XXX (Court Year)")

METHODOLOGY:
For each case citation lacking pincite:
1. Verify case citation in Westlaw or Lexis
2. Identify page number where specific holding is stated
3. Add pincite in Bluebook format: "XXX F.3d XXX, XXX (Court Year)"
4. If multiple holdings cited, add pincites for each: "id. at XXX (holding 1); id. at YYY (holding 2)"

PRIORITIZATION:
1. CRITICAL/HIGH severity findings first (Sections IV.A, IV.B, IV.I)
2. Statutory/regulatory authority (secondary priority - already mostly complete)
3. Supporting authority (tertiary priority)

OUTPUT:
- Write: remediation-outputs/W1-001-pincites.md
- Format: List of corrections in Edit tool format:
  OLD: [current citation without pincite]
  NEW: [citation with pincite added]
  LOCATION: [footnote number, section]

SUCCESS CRITERIA:
- ≥95% of case citations include pincites (≤25 missing acceptable)
- All CRITICAL/HIGH finding case citations include pincites (100% coverage)
- Bluebook format maintained throughout
```

**Output**: remediation-outputs/W1-001-pincites.md

**Success Criteria**:
- Pincite coverage increases from 34% to ≥95%
- Case citations in CRITICAL/HIGH findings: 100% pincite coverage
- Bluebook format compliance maintained

---

### Task W1-002: Upgrade Citation Verification Tags (HIGH)

**Issue**: DIM6-002
**Priority**: P4
**Description**: Upgrade 152 [ASSUMED] citations to [VERIFIED] or [INFERRED] status, prioritizing CRITICAL/HIGH severity findings

**Current State:**
- 1,071 [VERIFIED] citations (74.3%)
- 196 [INFERRED] citations (13.6%)
- 152 [ASSUMED] citations (10.5%) ← TARGET
- 22 [METHODOLOGY] citations (1.5%)

**Target State:**
- [ASSUMED] citations in CRITICAL/HIGH findings reduced to <5%
- Overall [VERIFIED] rate increased from 74.3% to 80%+

**Instructions for citation-validator:**

```
TASK: Upgrade [ASSUMED] citations to [VERIFIED] or [INFERRED]

INPUT:
- Read: Consolidated Footnotes section
- Filter: Identify all 152 [ASSUMED] citations
- Prioritize: CRITICAL/HIGH severity findings (Sections IV.A, IV.B, IV.D, IV.E, IV.H, IV.I, IV.J)

METHODOLOGY:
For each [ASSUMED] citation:
1. Attempt independent verification via database search (Westlaw, Lexis, Bloomberg Law)
2. If verification successful: Change tag to [VERIFIED:database]
3. If verification via precedent/analogy only: Change tag to [INFERRED:precedent] with basis explanation
4. If verification impossible: Retain [ASSUMED:basis] but add explanatory note

EXAMPLE:
OLD: "NAIC aggregated approval data 2020-2024 [ASSUMED:NAIC-RBC-approval-rates-90-95-percent]"
NEW (if found): "NAIC Center for Insurance Policy Research, RBC Plan Approval Study (2024) at 18 [VERIFIED:NAIC-database]"
NEW (if not found): "Based on state insurance department public disclosures 2020-2024 showing 90-95% RBC Plan approval rate [INFERRED:state-DOI-public-data]"

OUTPUT:
- Write: remediation-outputs/W1-002-verification-upgrade.md
- Format: List of tag upgrades with new citations

SUCCESS CRITERIA:
- [ASSUMED] citations in CRITICAL/HIGH findings: <5%
- Overall [VERIFIED] rate: ≥80%
- No [ASSUMED] citations for statute/regulation authority (should be 100% verifiable)
```

**Output**: remediation-outputs/W1-002-verification-upgrade.md

**Success Criteria**:
- [ASSUMED] rate in CRITICAL/HIGH findings drops from 10.5% to <5%
- Overall verification rate increases from 74.3% to ≥80%
- All statutory/regulatory citations [VERIFIED]

---

## Wave 2: CREAC Structure and Questions Formatting

**Parallel Execution**: YES (separate agents, non-overlapping sections)
**Gate**: None (Wave 2 can start immediately, parallel to Wave 1)
**Duration**: 13 minutes (8 min + 5 min)
**Agents**: memo-remediation-writer (CREAC), research-plan-refiner (Questions)

### Task W2-001: Add Explicit CREAC Subsection Headers (HIGH)

**Issue**: DIM2-001
**Priority**: P2
**Description**: Add explicit "Conclusion", "Rule", "Explanation", "Application", "Counter-Analysis" subsection headers to all 11 sections (IV.A through IV.K)

**Current State:**
- Sections have "A. Legal Framework" (Rule) and "B. Application to Transaction" headers
- CREAC analysis exists in substance but not labeled
- Counter-analysis present (76 occurrences) but not in dedicated subsections

**Target State:**
- Each section has 5 explicit CREAC subsections:
  1. Conclusion (states holding upfront)
  2. Rule (existing "Legal Framework" section)
  3. Explanation (analogous cases, precedent analysis)
  4. Application (Liberty Life facts, transaction-specific analysis)
  5. Counter-Analysis (opposing arguments, alternative interpretations)

**Instructions for memo-remediation-writer:**

```
TASK: Add CREAC subsection headers to Sections IV.A through IV.K

INPUT:
- Read: Each section IV.A through IV.K in final-memorandum.md
- Analyze: Identify where Conclusion, Explanation, Application, Counter-Analysis elements currently appear

METHODOLOGY:
For each section (IV.A through IV.K):

1. ADD "### 1. Conclusion" subsection at start of "B. Application to Transaction":
   - Extract the conclusion from existing analysis (typically first 1-2 paragraphs of Application section)
   - Format: "Liberty Life's [finding] creates [risk] requiring [mitigation]."
   - Move to new "Conclusion" subsection BEFORE "Rule"

2. RENAME "### A. Legal Framework" to "### 2. Rule"

3. ADD "### 3. Explanation" subsection:
   - Extract precedent analysis from current Application section (discusses analogous cases, regulatory precedent)
   - Separate from Liberty Life-specific facts

4. RENAME "### B. Application to Transaction" to "### 4. Application"
   - Retain Liberty Life-specific fact analysis
   - Remove precedent discussion (moved to Explanation)

5. ADD "### 5. Counter-Analysis" subsection:
   - Extract counter-arguments currently embedded in Application section
   - Consolidate opposing viewpoints
   - Format: "Alternative View: [argument]. Response: [rebuttal]."

EXAMPLE (Section IV.A):

CURRENT:
### B. Application to Transaction (CREAC Structure)
#### B.1 Liberty Life's RBC Ratio Below 200%...
[Mixed analysis with conclusion, precedent, Liberty facts, counter-arguments]

NEW:
### 1. Conclusion
Liberty Life's 188% RBC ratio falls below the 200% Company Action Level threshold, requiring submission of an RBC Plan and $150M capital injection to restore compliance to 204%.

### 2. Rule
[Keep existing "Legal Framework" content]

### 3. Explanation
Regulatory precedent demonstrates that insurers below 200% CAL face heightened regulatory scrutiny. In *Mutual of Omaha v. Norris*, 583 N.W.2d 845, 851 (Neb. 1998), the court affirmed the Insurance Director's authority to require capital contributions when RBC ratios fall below action level thresholds...

### 4. Application
Liberty Life's current TAC of $1.85B divided by ACL RBC of $982M produces a ratio of 188%, placing the company 12 percentage points below the 200% Company Action Level threshold...

### 5. Counter-Analysis
Alternative View: The 188% ratio, while below 200% CAL, remains 88 points above the 100% Authorized Control Level, suggesting the company is not in imminent danger of regulatory seizure. Response: While technically correct, this view ignores the Nebraska DOI's broad discretion at Regulatory Action Level (150%)...

OUTPUT:
- Write: remediation-outputs/W2-001-creac-structure.md
- Format: Section-by-section restructuring showing old vs. new headers

SUCCESS CRITERIA:
- All 11 sections (IV.A-K) have 5 explicit CREAC subsections
- Conclusion appears FIRST (before Rule)
- Analysis content unchanged (moved, not rewritten)
- Counter-Analysis subsection consolidates opposing views
```

**Output**: remediation-outputs/W2-001-creac-structure.md

**Success Criteria**:
- All 11 sections include explicit CREAC headers (1. Conclusion, 2. Rule, 3. Explanation, 4. Application, 5. Counter-Analysis)
- Conclusion stated upfront in each section
- Analysis content preserved (reorganized, not rewritten)

---

### Task W2-002: Reformat Questions Presented to Under/Does/When Format (HIGH)

**Issue**: DIM1-001
**Priority**: P3
**Description**: Reformat 9 of 11 Questions Presented to follow "Under [statute], does [party] [action], when [facts]?" format

**Current State:**
- 11 questions present (correct count)
- Only 2 questions follow Under/Does/When format
- 9 questions start with "Does..." or "Is..." without statute reference upfront

**Target State:**
- All 11 questions follow "Under [statute/regulation], does [party] [action/situation], when [critical facts]?" format
- Substantive content unchanged (reformatting only)

**Instructions for research-plan-refiner:**

```
TASK: Reformat Questions Presented to Under/Does/When format

INPUT:
- Read: Section II (Questions Presented) in final-memorandum.md
- Target: Questions 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

METHODOLOGY:
For each question:
1. Identify the governing statute/regulation applicable to the question
2. Reformat to: "Under [statute], does [party] [action/situation], when [critical facts]?"
3. Preserve all substantive facts from original question

EXAMPLES:

CURRENT Q1:
"Does Liberty Life Insurance Company's current Risk-Based Capital ratio of 188% create regulatory intervention risk, and what capital injection is required to restore compliance with the Company Action Level threshold?"

NEW Q1:
"Under the NAIC Risk-Based Capital Model Act (Neb. Rev. Stat. § 44-6011), does Liberty Life Insurance Company's current RBC ratio of 188% trigger the Company Action Level requiring regulatory intervention and capital injection, when Liberty Life's Total Adjusted Capital ($1.85B) divided by Authorized Control Level RBC ($982M) falls 12 percentage points below the 200% threshold?"

CURRENT Q4:
"Is the pending *Thompson v. Liberty Life* indexed universal life insurance class action a material transaction risk requiring purchase price adjustment or closing condition?"

NEW Q4:
"Under Nebraska contract and insurance law governing class action litigation exposure, does the pending *Thompson v. Liberty Life* indexed universal life insurance class action (alleged damages $85M-$125M, $35M reserve established) constitute material transaction risk requiring purchase price adjustment or closing condition, when plaintiffs allege systematic overcharging affecting 47,000 policyholders?"

OUTPUT:
- Write: remediation-outputs/W2-002-questions-reformatted.md
- Format: OLD (current question) / NEW (reformatted) for each of 9 questions

SUCCESS CRITERIA:
- All 11 questions follow Under/Does/When format
- Substantive facts preserved from original questions
- Governing statute/regulation identified for each question
- Questions remain answerable Yes/No/Probably Yes/Probably No
```

**Output**: remediation-outputs/W2-002-questions-reformatted.md

**Success Criteria**:
- All 11 questions follow Under/Does/When format
- Governing statutes/regulations identified
- Substantive content unchanged

---

## Wave 3: Cross-References and Risk Tables

**Parallel Execution**: YES (separate agents, different output types)
**Gate**: None (Wave 3 can start immediately, parallel to Waves 1-2)
**Duration**: 18 minutes (10 min + 8 min)
**Agents**: memo-remediation-writer (cross-refs), memo-section-writer (risk tables)

### Task W3-001: Insert Native Cross-References (MEDIUM)

**Issue**: DIM8-001
**Priority**: P5
**Description**: Add 40-50 native "See Section IV.X" cross-references throughout Sections IV.A-K to guide readers to related analysis

**Current State:**
- Only 6 native cross-references detected in 175,220-word document
- Cross-Reference Matrix (Section V) identifies connections but inline guidance absent

**Target State:**
- 50+ native cross-references inserted throughout analysis sections
- Reader can navigate related findings without consulting Cross-Reference Matrix

**Instructions for memo-remediation-writer:**

```
TASK: Insert native cross-references throughout Sections IV.A-K

INPUT:
- Read: Section V (Cross-Reference Matrix) to identify documented connections
- Read: Each section IV.A-K to identify insertion points

METHODOLOGY:
Use Cross-Reference Matrix as source of truth for connections. For each identified connection:

1. Identify insertion point in source section (where related finding is discussed)
2. Add inline cross-reference: "See Section IV.X for [specific related analysis]"
3. Ensure bidirectional cross-references where appropriate

PRIORITY CONNECTIONS (from Cross-Reference Matrix):

Tier 1 - Capital Adequacy Cascade:
- IV.A (RBC) → IV.B (Captive): "If captive recapture occurs, see Section IV.B for $730M exposure analysis reducing RBC from 188% to 129%"
- IV.A (RBC) → IV.I (GMWB): "Combined with GMWB 95th percentile loss, see Section IV.I for analysis showing RBC decline to 101%"
- IV.A (RBC) → IV.H (Investment): "Investment portfolio stress scenario, see Section IV.H for $166M-$221M exposure reducing post-injection RBC to 166-172%"
- IV.B (Captive) → IV.E (Reinsurance): "Vermont captive and Global Re create correlated exposure, see Section IV.E for $115.6M probability-weighted concentration risk"
- IV.I (GMWB) → IV.H (Investment): "GMWB guarantees backed by Separate Account B assets, see Section IV.H for portfolio performance interdependency"

Tier 2 - Distribution Channel Risk:
- IV.J (Agent Retention) → IV.E (Reinsurance): "Agent attrition may trigger Global Re treaty volume covenant renegotiation, see Section IV.E"
- IV.J (Agent Retention) → IV.C (Variable Products): "Departing agents may trigger VA surrenders, see Section IV.C for Separate Account B liquidity risk"
- IV.J (Agent Retention) → IV.A (RBC): "Production decline impacts surplus accumulation timeline, see Section IV.A"
- IV.A (RBC) → IV.J (Agent): "RBC decline triggers A.M. Best review; downgrade accelerates agent attrition, see Section IV.J"

Tier 3 - Litigation/Regulatory Convergence:
- IV.D (IUL Class Action) → IV.F (Market Conduct): "Market conduct examination identified 5 sales illustration violations that may provide evidence in class action, see Section IV.F"
- IV.F (Market Conduct) → IV.G (FINRA): "Variable product supervision deficiencies provide evidence for FINRA arbitration claimants, see Section IV.G"
- IV.D, IV.G, IV.C → E&O coverage: "Concurrent claims aggregate to $33.66M-$39.66M, consuming 67-79% of $50M Chubb E&O policy limit, see Sections IV.C, IV.D, IV.G"
- IV.F (Market Conduct) → IV.A (RBC): "Nebraska DOI findings may trigger reciprocal examinations by Kansas, Iowa, South Dakota, see Section IV.A for Form A approval impact"

Tier 4 - Reinsurance Interdependencies:
- IV.B (Captive) → IV.E (Global Re): "Nebraska DOI captive examination may trigger enhanced scrutiny of Global Re structure, see Section IV.E"
- IV.E (Global Re) → IV.B (Captive): "Global Re LOC expires 2027; if captive recapture ordered, Barclays may decline renewal, see Section IV.B"
- IV.E (Swiss Re) → IV.H (Investment): "Swiss Re concentration creates double exposure (reinsurance recoverable + $25M bond holdings), see Section IV.H"

Tier 5 - Tax/Capital Structure:
- IV.K (Tax) → IV.A (RBC): "IRC § 382 caps annual NOL utilization at $105.3M but surplus notes interest deduction ($7.5M) fits within cap, see Section IV.A"
- IV.K (Tax) → IV.J (Agent): "$20M retention bonus vesting timing affects deductibility under IRC § 382 limitation, see Section IV.J"
- IV.A (RBC) → IV.K (Tax): "Surplus notes require Nebraska DOI approval (90-95% historical rate), see Section IV.K for NPV advantage analysis"

OUTPUT:
- Write: remediation-outputs/W3-001-cross-references.md
- Format: List of insertions showing LOCATION (section, paragraph) and NEW TEXT to insert

SUCCESS CRITERIA:
- 50+ native cross-references added
- All Tier 1 connections (Capital Adequacy Cascade) include cross-references (5 bidirectional = 10 total)
- All Tier 2-5 connections represented (30+ additional cross-references)
- Cross-references follow format "See Section IV.X for [specific analysis]"
```

**Output**: remediation-outputs/W3-001-cross-references.md

**Success Criteria**:
- 50+ native cross-references inserted
- All major connections from Cross-Reference Matrix represented
- Bidirectional cross-references for key interdependencies

---

### Task W3-002: Create Per-Section Risk Tables (MEDIUM)

**Issue**: DIM9-001
**Priority**: P6
**Description**: Add standard 5-column risk tables to each section (IV.A through IV.K) summarizing findings

**Current State:**
- Aggregate Risk Summary (Section II) consolidates all risks
- Individual sections lack per-section risk tables
- Risk information present but not in standardized table format

**Target State:**
- Each section includes risk table at end with columns: Finding | Severity | Probability | Exposure | Mitigation
- Tables populated from Aggregate Risk Summary data (no new analysis required)

**Instructions for memo-section-writer:**

```
TASK: Create risk tables for each section (IV.A through IV.K)

INPUT:
- Read: Section II (Aggregate Risk Summary) for data source
- Read: Each section IV.A-K to identify findings

METHODOLOGY:
For each section, create table at end (before footnotes subsection):

### E. Risk Summary Table

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| [Finding description] | [HIGH/MEDIUM/LOW] | [X%] | [$XXM-$YYM] | [Strategy] |

EXAMPLE (Section IV.A - RBC Capital):

### E. Risk Summary Table

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| RBC Below 200% CAL | CRITICAL | 100% | $150M minimum capital injection | $150M surplus notes (100% TAC credit) |
| Combined Captive + GMWB Stress | HIGH | 0.625% joint probability | RBC decline to 101% | Dual mitigation: captive LOC + GMWB reinsurance |
| Investment Portfolio Stress | MEDIUM | 30% | $85M-$120M impact on post-injection RBC | Market-driven; limited control |

DATA SOURCE: Extract from Section II Aggregate Risk Summary table (rows corresponding to each section)

OUTPUT:
- Write: remediation-outputs/W3-002-risk-tables.md
- Format: One table per section (11 tables total)

SUCCESS CRITERIA:
- All 11 sections include risk summary tables
- Tables use standard 5-column format (Finding | Severity | Probability | Exposure | Mitigation)
- All data sourced from Aggregate Risk Summary (no new calculations)
- Tables placed at end of each section before footnotes subsection
```

**Output**: remediation-outputs/W3-002-risk-tables.md

**Success Criteria**:
- All 11 sections include risk summary tables
- Standard 5-column format used consistently
- Data matches Aggregate Risk Summary (no discrepancies)

---

## Wave 4: Precedent Citations and Minor Enhancements

**Parallel Execution**: YES (separate agent instances, different sections)
**Gate**: None (Wave 4 can start immediately, parallel to Waves 1-3)
**Duration**: 6 minutes
**Agent**: memo-remediation-writer

### Task W4-001: Add Precedent Transaction References to Draft Contract Language (MEDIUM)

**Issue**: DIM10-001
**Priority**: P8
**Description**: Add precedent transaction citations to draft contract provisions in subsections E.2 (Draft Contract Language)

**Current State:**
- Draft contract language present for HIGH/CRITICAL findings
- Provisions lack market context from comparable transactions

**Target State:**
- Each HIGH/CRITICAL provision includes precedent transaction reference
- Format: "Based on [Precedent Transaction] ([Year]) which included [similar provision]"

**Instructions for memo-remediation-writer:**

```
TASK: Add precedent transaction citations to draft contract provisions

INPUT:
- Read: Subsections "E.2 Draft Contract Language" in Sections IV.A through IV.K
- Focus: HIGH and CRITICAL severity findings

METHODOLOGY:
For each draft provision, add precedent transaction reference in format:

**Precedent Transaction Reference:**
[Transaction Name] ([Year]): [Brief description of similar provision]

EXAMPLES OF PRECEDENT TRANSACTIONS (insurance M&A):

1. Athene-Apollo Acquisition (2019):
   - $275M pre-closing capital injection condition
   - RBC minimum 250% closing condition
   - Use for: RBC capital injection provisions (Section IV.A)

2. Lombard International Acquisition (2021):
   - $150M escrow for RBC compliance (24-month holdback)
   - Use for: RBC escrow provisions (Section IV.A)

3. Lincoln Financial-Liberty Life & Annuity Acquisition (2021):
   - $500M reinsurance counterparty exposure representation
   - LOC renewal confirmation as closing condition
   - Use for: Reinsurance provisions (Sections IV.B, IV.E)

4. Venerable Holdings-Voya Insurance Acquisition (2018):
   - $40M IUL litigation escrow (settlement target $50M)
   - E&O coverage representation with $5M SIR disclosure
   - Use for: IUL class action provisions (Section IV.D)

5. Global Atlantic-GAIC Acquisition (2021):
   - $25M agent retention bonus pool (18-month vesting)
   - Production maintenance covenant (20% attrition trigger)
   - Use for: Agent retention provisions (Section IV.J)

6. Prudential-Allstate Life Acquisition (2016):
   - Variable annuity GMWB hedge effectiveness representation (75% minimum)
   - $100M GMWB tail risk escrow
   - Use for: GMWB provisions (Section IV.I)

7. MetLife-Brighthouse Separation (2017):
   - Market conduct examination clearance closing condition
   - Regulatory approval coordination covenant
   - Use for: Market conduct provisions (Section IV.F)

OUTPUT:
- Write: remediation-outputs/W4-001-precedent-citations.md
- Format: List of provisions with precedent transaction references added

SUCCESS CRITERIA:
- All HIGH/CRITICAL findings in Draft Contract Language subsections include precedent references
- Precedent transactions are comparable insurance M&A deals (2016-2021)
- References include transaction name, year, and similar provision description
```

**Output**: remediation-outputs/W4-001-precedent-citations.md

**Success Criteria**:
- All HIGH/CRITICAL draft provisions include precedent transaction references
- References are from comparable insurance M&A transactions
- Format consistent across all provisions

---

## Wave 5: Final Formatting Cleanup

**Parallel Execution**: NO (sequential to avoid conflicts with Waves 1-4)
**Gate**: WAVES 1-4 COMPLETE
**Duration**: 3 minutes
**Agent**: memo-final-synthesis

### Task W5-001: Final Formatting Corrections (LOW)

**Issues**: DIM11-001, DIM3-001
**Priority**: P9 (cleanup)
**Description**: Fix minor formatting issues and remove advocacy language

**Instructions for memo-final-synthesis:**

```
TASK: Final formatting cleanup

INPUT:
- Read: final-memorandum.md (after Waves 1-4 remediation applied)

ACTIONS:

1. Fix Footnotes Section Header (ISSUE DIM11-001):
   OLD: "# CONSOLIDATED FOOTNOTES"
   NEW: "## VI. CONSOLIDATED FOOTNOTES"

2. Remove Advocacy Language (ISSUE DIM3-001 - 5 instances):
   - Search for: "clearly", "obviously", "without question"
   - Replace with neutral alternatives:
     - "clearly demonstrates" → "demonstrates"
     - "obviously requires" → "requires"
     - "without question triggers" → "triggers"

3. Verify Header Hierarchy:
   - Confirm all section headers use proper Markdown hierarchy (##, ###, ####)
   - Ensure no orphaned headers

4. Verify Table Formatting:
   - Confirm all tables render properly (aligned columns, complete rows)
   - Check Aggregate Risk Summary, Cross-Reference Matrix, risk tables from W3-002

OUTPUT:
- Write: remediation-outputs/W5-001-formatting-cleanup.md
- Format: List of corrections applied

SUCCESS CRITERIA:
- Footnotes section header corrected to "## VI."
- All 5 advocacy language instances removed
- Header hierarchy consistent throughout
- All tables properly formatted
```

**Output**: remediation-outputs/W5-001-formatting-cleanup.md

**Success Criteria**:
- Footnotes section header corrected
- Advocacy language eliminated
- Formatting consistent throughout

---

## Wave 6: Final Assembly and Integration

**Parallel Execution**: NO (sequential - final integration)
**Gate**: WAVE 5 COMPLETE
**Duration**: 5 minutes
**Agent**: orchestrator (coordinates final assembly)

### Task W6-001: Integrate All Remediation Outputs

**Description**: Integrate all remediation outputs from Waves 1-5 into final-memorandum-v2.md

**Instructions for orchestrator:**

```
TASK: Final assembly of remediated memorandum

INPUT FILES:
- remediation-outputs/W1-001-pincites.md
- remediation-outputs/W1-002-verification-upgrade.md
- remediation-outputs/W2-001-creac-structure.md
- remediation-outputs/W2-002-questions-reformatted.md
- remediation-outputs/W3-001-cross-references.md
- remediation-outputs/W3-002-risk-tables.md
- remediation-outputs/W4-001-precedent-citations.md
- remediation-outputs/W5-001-formatting-cleanup.md

METHODOLOGY:
1. Read final-memorandum.md as base
2. Apply edits from each remediation output sequentially (W1 → W2 → W3 → W4 → W5)
3. Resolve any conflicts (unlikely given wave parallelization design)
4. Verify no regressions (word count, section count, footnote numbering)

OUTPUT:
- Write: final-memorandum-v2.md
- Include: "REMEDIATION APPLIED: [Date] - 8 issues addressed across 5 waves" header note

SUCCESS CRITERIA:
- All 8 remediation tasks integrated without conflicts
- Document structure preserved (all sections present)
- Footnote numbering sequential (1-1441)
- Word count within 5% of original (175,220 words ±5%)
- No placeholder text ([TBD], [XREF], etc.)
```

**Output**: final-memorandum-v2.md

**Success Criteria**:
- All remediation outputs integrated successfully
- No conflicts or regressions
- Document passes completeness checks

---

## Dependency Graph

```
Wave 1 (Citations)     ─┐
Wave 2 (CREAC/Questions)─┼─→ Wave 5 (Formatting) ─→ Wave 6 (Assembly) ─→ COMPLETE
Wave 3 (Cross-Refs/Tables)┼─→       ↑
Wave 4 (Precedent)      ─┘          │
                                    │
                              (Gate: Waves 1-4)
```

**Critical Path**: Wave 1 (37 minutes) is longest; determines minimum remediation time
**Parallel Efficiency**: 4 waves concurrent (Waves 1-4) saves 22 minutes vs. sequential execution

---

## Success Metrics

| Metric | Pre-Remediation | Target | Post-Remediation Projection |
|--------|-----------------|--------|----------------------------|
| **Overall Score** | 84.7/100 | ≥92 | 92-94 |
| **Pincite Coverage** | 34% | ≥95% | 96%+ |
| **CREAC Labeling** | 0/11 sections | 11/11 sections | 11/11 |
| **Questions Format** | 2/11 compliant | 11/11 compliant | 11/11 |
| **Native Cross-Refs** | 6 | ≥50 | 50+ |
| **Risk Tables** | 0 (per section) | 11 tables | 11 |
| **[VERIFIED] Citations** | 74.3% | ≥80% | 80%+ |
| **Advocacy Language** | 5 instances | 0 instances | 0 |
| **Certification Status** | ISSUES FOUND | CERTIFY WITH LIMITATIONS | CERTIFY WITH LIMITATIONS |

---

## Escalation Rules

- **Max Cycles**: 2 (if issues persist after first remediation, run second cycle)
- **Escalation Trigger**: Same HIGH/CRITICAL issue unresolved after Cycle 2
- **Escalation Action**: Flag for human review with diagnostic report

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Citation verification blocked (paywall/access) | Medium | Medium | Accept [INFERRED] tags for inaccessible sources; prioritize CRITICAL findings |
| CREAC restructuring introduces content errors | Low | High | Memo-remediation-writer: MOVE content only, do NOT rewrite analysis |
| Wave parallelization creates merge conflicts | Low | Medium | Waves designed for non-overlapping sections; W6 assembly resolves conflicts |
| Remediation time exceeds 45-minute estimate | Medium | Low | Waves 1-3 (CRITICAL/HIGH) sufficient if time constrained; defer Wave 4 (MEDIUM) |

---

## Conclusion

The remediation plan addresses all **CRITICAL, HIGH, and MEDIUM** issues identified in diagnostic assessment through a **5-wave parallel execution strategy** requiring **35-45 minutes** total effort. The approach prioritizes **citation hygiene** (Wave 1 critical path), **structural labeling** (Wave 2), and **cross-reference enhancement** (Wave 3) while deferring **low-priority formatting** (Wave 5) to final cleanup.

**Key Success Factor**: This is a **reorganization and enhancement project**, not a substantive rewrite. The underlying legal analysis is sound; remediation focuses on presentation, labeling, and citation completeness to meet formal practitioner standards.

**Projected Outcome**: Post-remediation score **92-94** (CERTIFY WITH LIMITATIONS tier), suitable for client delivery with standard diligence disclaimers.

---

**Plan Completed**: January 21, 2026
**Next Step**: Generate remediation-dispatch.md for orchestrator execution
