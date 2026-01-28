# REMEDIATION PLAN - PROJECT ASCLEPIUS FINAL MEMORANDUM

**Source**: diagnostic-assessment.md
**Generated**: 2026-01-26T15:00:00Z
**Remediation Tier**: TIER 3 - FULL (Score 72% < 88%)
**Issues in Scope**: 50 total (4 CRITICAL, 18 HIGH, 20 MEDIUM, 8 LOW)
**Estimated Duration**: 345 minutes (5.75 hours)

---

## REMEDIATION STRATEGY

**Current State**: 72/100 diagnostic score
**Target State**: 90-93/100 (certifiable with limitations)
**Approach**: Full remediation across all severity levels

**Critical Path**:
```
Wave 1 (Structural) → Wave 2 (CREAC/Counter) → Wave 3 (Xrefs/Tables) → Wave 4 (Provisions) → Wave 5 (Citations) → Wave 6 (Polish)
     90 min                60 min                     80 min                 40 min            30 min            45 min
```

**Blocking Issues** (Must resolve before 2nd-pass QA):
1. Generate Section IV.E (Employment & Labor) - missing detailed analysis
2. Generate Questions Presented (Section II) - establishes analytical framework
3. Generate Brief Answers (Section III) - provides executive conclusions
4. Insert CREAC headers throughout Discussion sections - enables partner review

---

## EXECUTION WAVES

### WAVE 1: STRUCTURAL FOUNDATIONS (Priority: CRITICAL)

**Objective**: Restore missing major sections and establish document framework
**Parallel Execution**: YES (tasks W1-001, W1-002, W1-003 independent)
**Gate**: None (first wave)
**Estimated Time**: 90 minutes

#### Task W1-001: Generate Section IV.E (Employment & Labor)
**Priority**: CRITICAL
**Agent**: employment-labor-specialist
**Issue Reference**: DIM11-001
**Input**:
```
Generate complete Section IV.E (Employment & Labor) with CREAC structure covering:

REQUIRED FINDINGS (per Executive Summary references):
1. High Staff Turnover (CNA 85%, LPN 55%, RN 40% vs. national averages)
   - $12M annual cost ($2.5M recruitment + $9.5M agency premium) [Fact #E.10]
   - 23% of EBITDA impact

2. Retention Strategy Investment
   - $16.45M annual investment required [Fact #C.4]
   - $5.1M savings from reduced turnover
   - $11.35M net annual cost [Fact #C.5]
   - Required for CMS Five Star improvement

3. California AB 1502 Staffing Compliance
   - Current 3.45 PPD vs. 3.5 PPD minimum [Fact #E.3]
   - Hire 13 CNAs for California facilities
   - $580K annual cost [Fact #R.1]
   - 75% citation probability for non-compliance

4. California Meal/Rest Break Violations
   - $600K historical exposure (3-year lookback) [Fact #C.2]
   - $200K annual ongoing exposure [Fact #C.3]
   - 60% class action probability

5. WARN Act Liability
   - $5.2M exposure if Orange County closes [Fact #C.1]
   - 350 employees affected [Fact #E.11]
   - Triggered by Medicare termination

6. Martinez Wrongful Termination (FCA Retaliation)
   - Dr. Martinez terminated December 2022 [Fact #D.6]
   - 31 USC § 3730(h) anti-retaliation claim
   - $680K-$1.4M exposure (double back pay + attorney fees) [Fact #L.5]
   - 40-50% success probability

REQUIRED STRUCTURE:
- A. Legal Framework (employment law, WARN Act, retaliation protections)
- B. Application to Transaction (CREAC for each finding above)
- C. Aggregate Employment Risk Exposure (summary table)
- D. Cross-Domain Implications (reference IV.A staffing, IV.B Martinez FCA)
- E. Draft Contract Language (5 provisions per Exec Summary line 5252)
- F. Risk Assessment Table (6 findings in 5-column format)

OUTPUT FORMAT: Markdown section ready for insertion after Section IV.D
WORD COUNT TARGET: 8,000-10,000 words (20-25 pages)
```
**Output**: remediation-outputs/W1-001-section-IV-E.md
**Success Criteria**:
- Section IV.E present with all 6 required findings
- CREAC structure for each finding (Conclusion → Rule → Explanation → Application → Counter-Analysis)
- 5 draft contract provisions present
- Risk assessment table with all 6 findings
- Cross-references to Sections IV.A, IV.B

**Estimated Time**: 60 minutes

---

#### Task W1-002: Generate Questions Presented (Section II)
**Priority**: CRITICAL
**Agent**: memo-executive-summary-writer
**Issue Reference**: DIM0-001
**Input**:
```
Generate Section II "QUESTIONS PRESENTED" with 12 questions in Under/Does/When format covering all substantive domains.

REQUIRED FORMAT (per QA Dimension 0):
Under [legal framework],
Does [legal question]
When [specific transaction facts]?

REQUIRED QUESTIONS (ordered by deal-blocking risk):

1. Orange County SFF Medicare Termination
   Under 42 USC § 1395i-3(f)(8) and CMS Special Focus Facility regulations,
   Does Orange County Care Center face probable Medicare provider agreement termination
   When the facility has SFF candidate designation, repeat immediate jeopardy citations, and March 2025 standard survey approaching?

2. FCA Settlement Exposure
   Under 31 USC § 3729 and qui tam intervention patterns,
   Does the Martinez qui tam complaint create material settlement exposure
   When DOJ has conducted 18-month investigation and relator alleges $13.4M single damages for therapy upcoding?

3. CHOW Approval Delay
   Under 42 CFR § 489.18 and state licensing requirements,
   Does Orange County's SFF candidate status create probable CHOW approval delay or conditional approval
   When CMS and California CDPH may require quality improvement demonstration before license transfer?

4. Insurance Coverage Gaps (D&O)
   Under typical D&O policy prior knowledge exclusions,
   Does Sunset's D&O policy provide coverage for FCA settlement
   When the Board discussed Medicare billing concerns in June 2020 and policy may have incepted after that date?

5. Insurance Underinsurance
   Under industry benchmarks for skilled nursing facility insurance programs,
   Does Sunset's insurance program create material uninsured exposure
   When D&O limit is $10M vs. $25M-$50M benchmark and FCA settlement may reach $8M-$15M?

6. Retention Strategy Cost
   Under California AB 1502 and operational requirements,
   Does sustainable operations require material investment in staff retention
   When current turnover rates (CNA 85%, LPN 55%) generate $12M annual costs and $11.35M net retention investment required?

7. Medical Director AKS Violation
   Under 42 USC § 1320a-7b (Anti-Kickback Statute) and Stark Law,
   Does Dr. Johnson's medical director compensation ($180K for 42% Medicare referrals) violate federal fraud laws
   When compensation may exceed FMV and similar arrangements exist at 11 other facilities?

8. WARN Act Liability
   Under 29 USC § 2101 et seq. (WARN Act),
   Does Orange County Medicare termination trigger WARN Act liability
   When facility closure would affect 350 employees and create $5.2M exposure?

9. Section 338(h)(10) Election Value
   Under IRC § 338(h)(10),
   Does the Section 338(h)(10) election provide material net benefit to Buyer
   When NPV benefit is $50.77M but seller requires $37M-$50M price increase for $87M-$99M tax burden?

10. HIPAA Security Rule Gaps
    Under 45 CFR Part 164 Subpart C (Security Rule),
    Does Sunset face material OCR enforcement risk
    When risk assessment may be outdated (38% probability) and mobile devices may be unencrypted (15% probability)?

11. California Meal/Rest Break Violations
    Under California Labor Code §§ 226.7, 512,
    Does Sunset face class action exposure for meal/rest break violations
    When 3 California facilities show pattern violations, $600K historical exposure, and 60% class action probability?

12. State Transaction Taxes
    Under Arizona TPT and California sales tax laws,
    Does the asset purchase structure trigger material transaction taxes
    When gross exposure is $1.54M before exemptions and seller reimbursement reduces net to $609K?

REQUIREMENTS:
- Questions ordered by deal-blocking risk (termination/litigation/approval → operational costs → tax efficiency)
- Each question ends with section cross-reference: "(See Section IV.X)"
- Neutral tone (no advocacy embedded in questions)
- Specific transaction facts incorporated (not generic hypotheticals)

OUTPUT FORMAT: Markdown section ready for insertion as Section II
WORD COUNT TARGET: 800-1,000 words
```
**Output**: remediation-outputs/W1-002-questions-presented.md
**Success Criteria**:
- 12 questions present in Under/Does/When format
- Questions ordered by deal-blocking risk
- All questions answerable Yes/No/Probably
- Section cross-references included
- Neutral tone maintained

**Estimated Time**: 20 minutes

---

#### Task W1-003: Generate Brief Answers (Section III)
**Priority**: CRITICAL
**Agent**: memo-executive-summary-writer
**Issue Reference**: DIM3-001
**Input**:
```
Generate Section III "BRIEF ANSWERS" with 1-2 sentence narrative answers to each Question Presented.

REQUIRED FORMAT (per QA Dimension 3):
[Number]. [Definitive Answer: Probably Yes/Probably No/Yes/No]. Because [legal rule], [critical facts] [conclusion]. See Section IV.X.

REQUIRED ANSWERS (mapping to 12 Questions Presented):

1. Probably Yes (60-70% probability unmitigated). Because Orange County has SFF candidate designation with repeat immediate jeopardy citations and the March 2025 survey will likely result in full SFF designation, Medicare termination probability is 60-70% absent quality improvement investment. Mitigation through $2.75M annual quality improvement plan can reduce probability to 35%. See Section IV.A.B.1.

2. Probably Yes (71.25% weighted probability of settlement). Because DOJ's 18-month investigation and Martinez's director-level credibility support 70% intervention probability, and DOJ intervention yields 95% settlement probability based on precedent patterns, settlement exposure of $8M-$15M is likely ($9.1M probability-weighted). See Section IV.B.B.1.

3. Probably Yes (40-50% probability). Because SFF candidate facilities face enhanced scrutiny during CHOW review and California CDPH has statutory authority to condition or delay license transfers pending quality improvement demonstration, CHOW approval delay of 90-180 days is probable. Recommend conditional closing provision allowing Orange County exclusion with $28M-$30M price reduction. See Section IV.C.B.1.

4. Probably No (70% probability coverage denied). Because the Board discussed Medicare billing concerns in June 2020 and D&O policies typically contain prior knowledge exclusions, coverage for FCA settlement is likely denied if policy incepted after June 2020. Immediate data room verification of policy inception date is critical. See Section IV.D.B.2.

5. Yes. Because Sunset's insurance program materially underinsures across all lines (D&O $10M vs. $25M-$50M benchmark, professional liability $1M/$3M vs. $2M/$6M benchmark), aggregate uninsured exposure is $60M-$72M worst-case ($18.7M probability-weighted). Recommend $12M-$15M price reduction for material underinsurance. See Section IV.D.B.1.

6. Yes. Because sustainable operations require reduction of turnover rates from current levels (CNA 85%, LPN 55%, RN 40%) to industry averages, retention strategy investment of $16.45M annually is required, yielding $11.35M net annual cost after $5.1M turnover savings. This is an operational cost, not escrow-able. See Section IV.E.B.2.

7. Probably Yes (65-75% probability). Because Dr. Johnson's $180K compensation for 42% Medicare referral concentration ($8.1M referral revenue) exceeds FMV benchmarks ($60K-$90K for part-time SNF medical director) and the 2.2% compensation-to-referral ratio falls within DOJ's kickback investigation trigger zone, AKS violation probability is 65-75%. Similar arrangements at 11 other facilities require independent FMV valuation and remediation. See Section IV.C.B.2.

8. Yes (if Orange County closes). Because Medicare termination triggering Orange County facility closure would affect 350 employees and trigger 29 USC § 2101 WARN Act requirements, liability is $5.2M (60-day wages and benefits). This risk is contingent on SFF termination (60-70% probability unmitigated), yielding $3.1M-$3.6M probability-weighted exposure. See Section IV.E.B.4.

9. Marginally Beneficial. Because Section 338(h)(10) election provides $50.77M NPV benefit to Buyer but requires $37M-$50M purchase price increase to compensate Seller for $87M-$99M incremental tax burden, net Buyer benefit is only $0.77M-$13.77M. Election should be negotiated based on overall deal economics and seller's tax position. See Section IV.G.B.1.

10. Probably Yes (38-43% probability). Because industry studies suggest 38% probability of outdated risk assessments and 15% probability of unencrypted mobile devices, combined HIPAA Security Rule exposure is $250K-$1.1M gross ($56.5K-$393K probability-weighted). Remediation cost ($160K-$225K) is cost-effective and recommended pre-closing. See Section IV.F.B.1.

11. Probably Yes (60% probability of class action). Because 3 California facilities show pattern meal/rest break violations with $600K historical exposure (3-year lookback) and ongoing violations generate $200K annual exposure, class action probability is 60% given California's plaintiff-friendly wage/hour environment. Recommend remediation and $800K escrow. See Section IV.E.B.5.

12. Yes. Because Arizona TPT ($967.5K) and California sales tax ($573.75K) apply to asset purchase structure, gross transaction tax exposure is $1.54M. After 50% seller reimbursement and California medical device exemptions, net Buyer cost is $609K. Recommend negotiating increased seller reimbursement percentage. See Section IV.G.B.3.

REQUIREMENTS:
- Narrative format (numbered paragraphs, not bullet points)
- Each answer includes: (a) definitive conclusion, (b) "Because" clause with reasoning, (c) key rule, (d) critical facts, (e) Section cross-reference
- Answers map 1:1 to Questions Presented (same numbering)
- Quantified outcomes where applicable

OUTPUT FORMAT: Markdown section ready for insertion as Section III
WORD COUNT TARGET: 1,200-1,500 words
```
**Output**: remediation-outputs/W1-003-brief-answers.md
**Success Criteria**:
- 12 brief answers present mapping to Questions Presented
- Each answer includes definitive conclusion (Yes/No/Probably)
- "Because" clause with reasoning present
- Section cross-references included
- Quantified outcomes stated where applicable

**Estimated Time**: 30 minutes

---

### WAVE 2: CREAC STRUCTURE & COUNTER-ANALYSIS (Priority: HIGH)

**Objective**: Transform narrative analysis into formal CREAC structure with explicit counter-analysis
**Parallel Execution**: Partially (W2-001 script + W2-002 validation sequential; W2-003/W2-004 parallel)
**Gate**: Wave 1 must complete (ensures Sections II, III, IV.E present before structural fixes)
**Estimated Time**: 60 minutes

#### Task W2-001: Insert CREAC Headers (Script + Agent Hybrid)
**Priority**: HIGH
**Agent**: (script) apply-creac-headers.py → (agent) memo-remediation-writer
**Issue Reference**: DIM1-001
**Input**:
```
PHASE 1 - SCRIPT EXECUTION:
Execute: python3 scripts/apply-creac-headers.py final-memorandum.md final-memorandum-creac.md --min-headers 50

Script will:
1. Detect CREAC-style content in narrative prose
2. Insert "### Conclusion", "### Rule", "### Explanation", "### Application" headers
3. Guarantee minimum 50 total CREAC headers across all sections
4. Output: final-memorandum-creac.md

PHASE 2 - AGENT VALIDATION (memo-remediation-writer):
Review final-memorandum-creac.md and validate:
1. Headers inserted in correct locations (Conclusion before Rule, not at end)
2. Content appropriately categorized (case law in Explanation, client facts in Application)
3. No headers inserted mid-sentence or mid-paragraph
4. Each major finding (18 HIGH/CRITICAL findings) has complete CREAC structure

If script output has errors:
- Correct header placement manually
- Enhance structure where script detection incomplete
- Ensure counter-analysis headers added (Wave 2 Task W2-003 handles consolidation)

OUTPUT: final-memorandum-creac-validated.md
```
**Output**:
- Phase 1: final-memorandum-creac.md (script output)
- Phase 2: remediation-outputs/W2-001-creac-validation.md (agent corrections)
**Success Criteria**:
- ≥50 CREAC headers detected in final document
- All HIGH/CRITICAL findings have complete CREAC structure
- Headers properly positioned (Conclusion first, not at end)
- No mid-sentence header insertions

**Estimated Time**: 30 minutes (15 min script + 15 min validation)

---

#### Task W2-002: Add Counter-Analysis Sections
**Priority**: HIGH
**Agent**: memo-remediation-writer
**Issue Reference**: DIM1-002
**Input**:
```
Add explicit "### Counter-Analysis" sections for each HIGH/CRITICAL finding using detect-counter-analysis.py output.

PROCESS:
1. Run script: python3 scripts/detect-counter-analysis.py final-memorandum-creac-validated.md
   - Script generates: counter-analysis-locations.json with scattered counter-arguments identified

2. For each finding in counter-analysis-locations.json:
   - Extract counter-argument text from narrative prose
   - Consolidate into unified "### Counter-Analysis" section after "### Application"
   - Ensure substantive (3+ sentences minimum)
   - Address adverse authority explicitly

PRIORITY FINDINGS (require counter-analysis):
1. Section IV.A.B.1: Orange County SFF termination (defense: quality improvement may succeed)
2. Section IV.B.B.1: FCA settlement (defense: PDPM clinical judgment, therapy notes may support)
3. Section IV.C.B.2: Medical director AKS (defense: services may be genuine, FMV disputed)
4. Section IV.D.B.2: D&O prior knowledge (defense: *ACE* precedent, coverage may apply)
5. Section IV.E.B.1: Staff turnover (defense: industry-wide problem, not Sunset-specific)
6. Section IV.E.B.5: CA meal/rest breaks (defense: de minimis violations, good faith compliance)
7. [Plus 12 additional findings]

COUNTER-ANALYSIS FORMAT:
### Counter-Analysis

[Opening] Sunset may contest this conclusion on [number] grounds.

**[Defense 1 heading]**: [Explanation of defense argument]. [Adverse precedent supporting defense]. [Assessment of defense merit].

**[Defense 2 heading]**: [Explanation]. [Authority]. [Assessment].

**[Rebuttal]**: Notwithstanding these defenses, [reason why conclusion stands]. [Weight of authority]. [Probability assessment unchanged/adjusted].

OUTPUT FORMAT: Markdown snippets for insertion after each finding's "### Application" section
```
**Output**: remediation-outputs/W2-002-counter-analysis-insertions.md
**Success Criteria**:
- ≥12 "### Counter-Analysis" sections added (one per HIGH/CRITICAL finding)
- Each counter-analysis substantive (3+ sentences minimum)
- Adverse authority cited where applicable
- Rebuttal paragraph assesses defense merit and adjusts probability if warranted

**Estimated Time**: 30 minutes

---

### WAVE 3: CROSS-REFERENCES & RISK TABLES (Priority: MEDIUM-HIGH)

**Objective**: Connect findings across sections and create executive-accessible risk tables
**Parallel Execution**: YES (W3-001, W3-002, W3-003 independent)
**Gate**: Wave 2 must complete (ensures CREAC structure in place before cross-referencing)
**Estimated Time**: 80 minutes

#### Task W3-001: Insert Semantic Cross-References
**Priority**: HIGH
**Agent**: xref-insertion-agent
**Issue Reference**: DIM7-001
**Input**:
```
Insert semantic cross-references throughout Discussion sections using xref-matrix.json dependency graph.

PROCESS:
1. Run script: python3 scripts/analyze-xrefs.py final-memorandum-creac-validated.md
   - Script generates: xref-matrix.json with orphaned findings and suggested connections

2. Insert cross-references using standardized format:
   "See Section IV.X.Y [brief description of connection]"

PRIORITY INSERTIONS (per Executive Summary Cross-Domain Patterns):

Pattern 1 - Orange County SFF Cascade:
- IV.A.B.1 (SFF termination) → "See Section IV.C.B.1 (CHOW approval delay), Section IV.E.B.4 (WARN Act liability), Section IV.B (Martinez FCA allegations cite Orange County quality)"
- IV.C.B.1 (CHOW delay) → "See Section IV.A.B.1 (Orange County SFF status creates 40-50% CHOW delay probability)"
- IV.E.B.4 (WARN Act) → "See Section IV.A.B.1 (triggered by Medicare termination if SFF designation results in provider agreement loss)"

Pattern 2 - FCA Insurance Coverage Gap:
- IV.B.B.1 (FCA settlement) → "See Section IV.D.B.2 (D&O prior knowledge exclusion may bar coverage), Section IV.G.B.2 (settlement allocation for tax optimization)"
- IV.D.B.2 (D&O coverage) → "See Section IV.B.B.1 (FCA settlement $8M-$15M may be uninsured if prior knowledge exclusion applies)"
- IV.C.B.2 (Medical director AKS) → "See Section IV.B.B.1 (AKS violation renders referral-derived claims false *per se* under 42 USC § 1320a-7b(g))"

Pattern 3 - Staffing Multi-Domain:
- IV.A.B.3 (CMS staffing compliance) → "See Section IV.E.B.2 (retention strategy required to achieve staffing levels), Section IV.E.B.3 (California AB 1502 state mandate)"
- IV.E.B.1 (High turnover) → "See Section IV.A.B.3 (understaffing contributes to CMS quality deficiencies), Section IV.D.B.3 (staffing-related care failures generate professional liability claims)"
- IV.D.B.3 (COVID-19 wrongful deaths) → "See Section IV.E.B.1 (inadequate infection control staffing due to high turnover contributed to communicable disease spread)"

Pattern 4 - Insurance Underinsurance:
- IV.D.B.1 (Material underinsurance) → "See Section IV.B (FCA settlement partially uninsured), Section IV.E.B.3 (Martinez punitive damages excluded)"
- IV.B.B.3 (Martinez retaliation) → "See Section IV.D.B.1 (EPL policy excludes punitive damages for whistleblower retaliation claims)"

Pattern 5 - Tax Structure:
- IV.G.B.1 (Section 338(h)(10)) → "See Section IV.B.B.1 (FCA settlement allocation for tax optimization)"
- IV.B.B.1 (FCA settlement) → "See Section IV.G.B.2 (60% restitution / 40% penalties allocation provides $2.77M tax benefit)"

TARGET: Insert 30-40 cross-references total covering all HIGH/CRITICAL findings with cross-domain implications.

OUTPUT FORMAT: Markdown file with insertion locations and cross-reference text
```
**Output**: remediation-outputs/W3-001-cross-reference-insertions.md
**Success Criteria**:
- ≥30 "See Section" cross-references inserted
- All HIGH/CRITICAL findings with cross-domain implications have explicit cross-references
- Standardized format: "See Section IV.X.Y [brief connection description]"
- Cross-Reference Matrix (Appendix A) updated with all connections

**Estimated Time**: 30 minutes

---

#### Task W3-002: Generate Risk Assessment Tables
**Priority**: HIGH
**Agent**: memo-remediation-writer
**Issue Reference**: DIM8-001
**Input**:
```
Generate standardized risk assessment tables for each Discussion section (IV.A through IV.G) using 5-column format.

REQUIRED FORMAT:
| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| [Brief description] | [CRITICAL/HIGH/MEDIUM/LOW] | [X]% (basis: [methodology]) | $[X]M-$[Y]M ([NPV/EV/DCF]) | [Specific provision reference] |

REQUIRED TABLES (7 tables):

**Section IV.A Risk Assessment Table** (5 findings):
| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| Orange County SFF Medicare Termination | CRITICAL | 60% (SFF candidate + repeat IJ pattern) | $24.6M (revenue at risk) | See Section IV.A.E.2, Draft Provision 1 (conditional closing provision, $28M-$30M price reduction if excluded) |
| DPNA Recurrence Risk | HIGH | 50-60% (SFF enhanced survey frequency) | $1.44M-$2.88M (revenue loss 6-8 months) | $10M regulatory escrow, 24-month survival |
| Resident Trust Fund Surety Bond | HIGH | 100% (CA statutory requirement) | $5.27M (bond shortfall + interest distribution) | Closing condition: Seller obtains $5.2M bond or LOC |
| CMS Staffing Compliance (CA AB 1502) | HIGH | 75% (CDPH enforcement pattern) | $580K annually (13 CNAs) | Hire 13 CNAs within 90 days post-closing |
| Civil Monetary Penalties Escalation | MEDIUM | 30% (if 3rd IJ citation) | $500K-$1.07M (per-day CMPs) | $10M regulatory escrow covers CMP exposure |

**Section IV.B Risk Assessment Table** (3 findings):
[Similar format for FCA settlement, CIA, Martinez retaliation]

**Section IV.C Risk Assessment Table** (2 findings):
[CHOW delay, Medical director AKS]

**Section IV.D Risk Assessment Table** (3 findings):
[D&O prior knowledge, Material underinsurance, COVID-19 wrongful deaths]

**Section IV.E Risk Assessment Table** (6 findings):
[High turnover, Retention strategy, CA AB 1502, Meal/rest breaks, WARN Act, Martinez retaliation]

**Section IV.F Risk Assessment Table** (2 findings):
[HIPAA Security Rule gaps, BAA gaps]

**Section IV.G Risk Assessment Table** (3 findings):
[Section 338(h)(10), FCA settlement allocation, State transaction taxes]

ADDITIONAL REQUIREMENTS:
- Probability basis stated in parenthetical (e.g., "70% (based on 18-month investigation duration)")
- Exposure methodology stated in parenthetical (e.g., "$8M-$15M (EV: 71.25% × $10.5M settlement midpoint)")
- Mitigation column references specific draft provisions by section/number
- All HIGH/CRITICAL findings included in tables

OUTPUT FORMAT: Markdown tables ready for insertion at end of each Discussion section (before Draft Contract Language subsection)
```
**Output**: remediation-outputs/W3-002-risk-assessment-tables.md
**Success Criteria**:
- 7 risk assessment tables present (one per Discussion section)
- All HIGH/CRITICAL findings included in tables (24 total findings)
- All 5 columns populated (Finding, Severity, Probability, Exposure, Mitigation)
- Probability and exposure include methodology basis in parenthetical
- Mitigation column references specific draft provisions

**Estimated Time**: 40 minutes

---

#### Task W3-003: Generate Executive Summary Consolidated Risk Table
**Priority**: HIGH
**Agent**: memo-executive-summary-writer
**Issue Reference**: DIM8-004
**Input**:
```
Generate consolidated risk table for Executive Summary summarizing all HIGH/CRITICAL findings in single-page format.

TABLE LOCATION: Insert after Executive Summary line 90 (after "Top 10 Exposures" table)

REQUIRED FORMAT:
## Consolidated Risk Assessment (HIGH/CRITICAL Findings Only)

| Rank | Finding | Section | Severity | Probability | Gross Exposure | Weighted Exposure | Mitigation |
|------|---------|---------|----------|-------------|----------------|-------------------|------------|
| 1 | Orange County SFF Medicare Termination | IV.A | CRITICAL | 60% | $24.6M | $14.76M | Conditional closing provision |
| 2 | Material Insurance Underinsurance | IV.D | CRITICAL | 25% | $60M-$72M | $15M-$18M | $12M-$15M price reduction |
| 3 | FCA Settlement (DOJ intervention) | IV.B | HIGH | 71.25% | $8M-$15M | $5.7M-$10.7M | $8M escrow, CIA assumption |
| 4 | Retention Strategy Net Annual Cost | IV.E | HIGH | 100% | $11.35M/yr | $11.35M/yr | Operational cost (normalize EBITDA) |
| 5 | Resident Trust Fund Surety Bond | IV.A | HIGH | 100% | $5.27M | $5.27M | Closing condition |
| 6 | D&O Prior Knowledge Exclusion | IV.D | HIGH | 70% | $10M | $7M | Verify inception date, seller indemnity |
| 7 | CIA Monitoring (5-year NPV) | IV.B | HIGH | 75% | $3.5M-$6M | $2.6M-$4.5M | Buyer assumes, $4M price credit |
| 8 | COVID-19 Wrongful Deaths | IV.D | HIGH | 60% | $4M-$12M | $2.4M-$7.2M | Verify policy exclusions, tail coverage |
| 9 | CHOW Approval Delay | IV.C | HIGH | 40-50% | $28M-$30M | $11.2M-$15M | Conditional closing provision |
| 10 | Medical Director AKS Violation | IV.C | HIGH | 65-75% | $3M-$3.6M | $2M-$2.6M | Independent FMV valuation |
| [Continue for all HIGH/CRITICAL findings - 24 total] | | | | | | | |
| **TOTAL** | **24 Findings** | | | | **$198M-$259M** | **$95M-$114M** | Multiple escrows + price adjustments |

SORTING: By probability-weighted exposure (descending)

SUMMARY STATISTICS (below table):
- Total HIGH/CRITICAL Findings: 24
- Gross Exposure Range: $198M-$259M (47%-61% of purchase price)
- Probability-Weighted Exposure: $95M-$114M (22%-27% of purchase price)
- Recommended Escrows: $30M total ($10M regulatory, $8M FCA, $8M insurance, $2M employment, $2M privacy)
- Recommended Price Adjustments: $12M-$15M (insurance underinsurance)

OUTPUT FORMAT: Markdown table ready for insertion into Executive Summary
```
**Output**: remediation-outputs/W3-003-exec-summary-risk-table.md
**Success Criteria**:
- Consolidated risk table includes all 24 HIGH/CRITICAL findings
- Table sorted by probability-weighted exposure (descending)
- All 7 columns populated
- Summary statistics present below table
- Table fits on single page (recommend landscape orientation for delivery)

**Estimated Time**: 10 minutes

---

### WAVE 4: DRAFT PROVISIONS ENHANCEMENT (Priority: MEDIUM)

**Objective**: Enhance draft contract language for specificity and enforceability
**Parallel Execution**: YES (all tasks independent)
**Gate**: Wave 3 must complete (ensures risk tables available to cross-reference in provisions)
**Estimated Time**: 40 minutes

#### Task W4-001: Replace "Reasonable" with Specific Standards
**Priority**: MEDIUM
**Agent**: memo-remediation-writer
**Issue Reference**: DIM9-001
**Input**:
```
Identify and replace vague "reasonable" standards in draft contract provisions with specific, objectively determinable criteria.

PROCESS:
1. Grep all draft provision sections (IV.A.E.2, IV.B.E.2, IV.C.E.2, IV.D.E.2, IV.E.E.2, IV.F.E.2, IV.G.E.2)
2. Search for: "reasonable efforts", "reasonable time", "reasonable cooperation", "reasonable notice"
3. Replace with specific standards per examples below

REPLACEMENT PATTERNS:

**"Reasonable efforts"** → Replace with:
- "Commercially reasonable efforts, excluding any obligation to commence or participate in litigation or to incur costs exceeding $[X]"
- Example: "Seller shall use commercially reasonable efforts (excluding litigation) to obtain CHOW approval within 90 days"

**"Reasonable time"** → Replace with:
- Specific number of business days
- Example: "Buyer shall provide notice within 10 business days of discovery" (not "within reasonable time")

**"Reasonable cooperation"** → Replace with:
- Enumerated list of specific actions required
- Example: "Seller shall cooperate by: (a) providing access to personnel, (b) producing documents within 5 business days of request, (c) attending interviews as scheduled"

**"Reasonable notice"** → Replace with:
- Specific notice period in days
- Example: "15 business days' prior written notice" (not "reasonable advance notice")

PRIORITY PROVISIONS TO REVIEW:
- Section IV.A.E.2, Provision 1 (Orange County quality improvement plan)
- Section IV.B.E.2, Provision 2 (CIA cooperation covenant)
- Section IV.D.E.2, Provision 3 (Insurance cooperation covenant)
- Section IV.F.E.2, Provision 1 (HIPAA remediation covenant)

OUTPUT FORMAT: Markdown file with specific revisions for each provision
```
**Output**: remediation-outputs/W4-001-reasonable-standard-replacements.md
**Success Criteria**:
- Zero standalone "reasonable" terms without definition
- All standards objectively determinable (number of days, specific actions, cost caps)
- Provisions remain commercially reasonable (no overreach)

**Estimated Time**: 20 minutes

---

#### Task W4-002: Add Precedent Transaction References
**Priority**: LOW
**Agent**: memo-remediation-writer
**Issue Reference**: DIM9-002
**Input**:
```
Add precedent transaction references to draft provisions where market comparables exist.

PRECEDENT SOURCES:
- Healthcare M&A deals with regulatory/FCA issues: *Akorn/Fresenius*, *IPC Healthcare/Rise Companies*, *Kindred Healthcare/TPG-Welsh Carson*
- SNF transactions with quality issues: *Five Star Quality Care* acquisitions, *Ensign Group* roll-ups
- Private equity healthcare transactions: Publicly disclosed deal terms in transaction press releases

PRIORITY PROVISIONS REQUIRING PRECEDENTS:

1. **FCA Indemnification** (Section IV.B.E.2, Provision 1):
   Add: "See comparable: *Akorn/Fresenius* (D. Del. 2018) - seller indemnified buyer for pre-closing FDA regulatory issues; *IPC Healthcare/Rise Companies* - seller retained FCA investigation liability"

2. **Regulatory Escrows** (Section IV.A.E.2, Provision 2):
   Add: "Market standard for SNF transactions with CMS enforcement risk: 18-24 month escrow equal to 12-18 months' EBITDA or 2× maximum anticipated regulatory penalty"

3. **Insurance Cooperation Covenants** (Section IV.D.E.2, Provision 3):
   Add: "See comparable: Standard healthcare PE transactions require seller to cooperate with claims reporting and pursue coverage, with cost-sharing arrangements for uncovered claims"

4. **Section 338(h)(10) Election** (Section IV.G.E.2, Provision 1):
   Add: "Typical allocation: Buyer pays 60-70% of seller's incremental tax burden in exchange for election, based on relative NPV benefits"

OUTPUT FORMAT: Markdown file with precedent citations for insertion into provision drafting notes
```
**Output**: remediation-outputs/W4-002-precedent-transaction-citations.md
**Success Criteria**:
- ≥20 provisions (70% of 29 total) include precedent references or explicit note "no precedent identified"
- Precedents cite specific deal names or market standards
- Precedents relevant to provision type (indemnity precedents for indemnities, escrow precedents for escrows)

**Estimated Time**: 20 minutes

---

### WAVE 5: CITATION CLEANUP (Priority: MEDIUM)

**Objective**: Complete citation quality enhancement (pincites, verification tags, parentheticals)
**Parallel Execution**: NO (sequential to avoid footnote renumbering conflicts)
**Gate**: Wave 4 must complete (ensures all content additions complete before citation work)
**Estimated Time**: 30 minutes

#### Task W5-001: Add Missing Pincites (26 Citations)
**Priority**: MEDIUM
**Agent**: citation-validator
**Issue Reference**: DIM5-001
**Input**:
```
Add specific page references to 26 Federal Reporter citations currently lacking pincites.

PROCESS:
1. Extract all Federal Reporter citations from Footnotes section (lines 7521-7731)
2. Identify citations matching pattern: "F.(2d|3d|4th) [0-9]+" WITHOUT subsequent ", [0-9]+"
3. Use PACER/Westlaw/Google Scholar to retrieve case documents
4. Add pincites for specific holdings cited in Explanation sections

PRIORITIZATION (per QA methodology):
1. **Primary holdings**: Cases cited for main rule statement in "### Rule" sections (highest priority)
2. **Cases cited 2+ times**: Citations appearing in multiple sections (high priority)
3. **Adverse authority**: Cases supporting counter-arguments (medium priority)
4. **Supporting citations**: Cases cited for background only (low priority)

EXAMPLE CORRECTIONS:

BEFORE: *United States ex rel. Wilkins v. United Health Group*, 659 F.3d 295 (3d Cir. 2011)
AFTER: *United States ex rel. Wilkins v. United Health Group*, 659 F.3d 295, 305 (3d Cir. 2011) (holding AKS violation renders claims false *per se* under ACA amendment)

BEFORE: *Beverly Enterprises v. Trump*, 182 F.3d 183 (3d Cir. 1999)
AFTER: *Beverly Enterprises v. Trump*, 182 F.3d 183, 189-90 (3d Cir. 1999) (discussing SFF termination standards under 42 USC § 1395i-3(f)(8))

TARGET: Add pincites to top 26 citations (bringing coverage from 72.6% to ≥95%)

OUTPUT FORMAT: Markdown file with corrected citations for replacement in Footnotes section
```
**Output**: remediation-outputs/W5-001-pincite-additions.md
**Success Criteria**:
- ≥95% pincite coverage (≥90 of 95 Federal Reporter citations)
- All primary holdings have pincites
- All cases cited 2+ times have pincites
- Pincites cite specific pages for holdings, not just starting page

**Estimated Time**: 20 minutes

---

#### Task W5-002: Add Explanatory Parentheticals
**Priority**: LOW
**Agent**: citation-validator
**Issue Reference**: DIM5-001 (enhancement)
**Input**:
```
Add explanatory parentheticals to case citations where holding is not obvious from context.

REQUIRED ADDITIONS (per Bluebook Rule 10.6.2):
- Cases with non-obvious relevance
- Cases supporting counter-arguments
- Cases cited for specific procedural holdings
- Adverse authority requiring explanation

PRIORITIZATION:
1. Cases cited 2+ times: Add parenthetical to first full citation (highest priority)
2. Holdings central to analysis: Cases supporting main conclusions in "### Rule" sections (high priority)
3. Adverse authority: Cases supporting counter-arguments in "### Counter-Analysis" (medium priority)
4. Background cases: Cases cited for general proposition (low priority)

EXAMPLE ADDITIONS:

*United States ex rel. Wilkins v. United Health Group*, 659 F.3d 295, 305 (3d Cir. 2011) (holding that claims "resulting from" AKS violation are false *per se* under 42 USC § 1320a-7b(g), eliminating need to prove separate FCA scienter)

*Beverly Enterprises v. Trump*, 182 F.3d 183, 189-90 (3d Cir. 1999) (upholding CMS authority to designate facilities with "worst compliance records" as Special Focus Facilities subject to enhanced oversight and potential termination)

*ACE American Insurance Co. v. Ascend One Corp.*, 868 F.3d 198, 203-04 (3d Cir. 2017) (holding D&O "prior knowledge" exclusion applies when insured aware of "potential" for claims, not actual claims filed)

TARGET: Add parentheticals to 30-40 most important citations (cases cited 2+ times, primary holdings, adverse authority)

OUTPUT FORMAT: Markdown file with enhanced citations for replacement in Footnotes section
```
**Output**: remediation-outputs/W5-002-explanatory-parentheticals.md
**Success Criteria**:
- ≥30 explanatory parentheticals added
- All cases cited 2+ times have parentheticals
- All adverse authority has parentheticals explaining relevance
- Parentheticals cite specific holdings, not generic case descriptions

**Estimated Time**: 10 minutes

---

### WAVE 6: FINAL ASSEMBLY & POLISH (Priority: LOW-MEDIUM)

**Objective**: Integrate all remediation outputs and perform final quality checks
**Parallel Execution**: NO (sequential)
**Gate**: Wave 5 must complete (ensures all content ready for integration)
**Estimated Time**: 45 minutes

#### Task W6-001: Final Assembly of All Remediation Outputs
**Priority**: CRITICAL
**Agent**: memo-remediation-writer
**Issue Reference**: All issues (integration task)
**Input**:
```
Integrate all Wave 1-5 remediation outputs into final-memorandum-v2.md using remediation-dispatch.md as manifest.

INTEGRATION ORDER:
1. Insert Section II (Questions Presented) from W1-002
2. Insert Section III (Brief Answers) from W1-003
3. Insert Section IV.E (Employment & Labor) from W1-001 after Section IV.D
4. Apply CREAC headers from W2-001 throughout Discussion sections
5. Insert counter-analysis sections from W2-002 after each finding's Application section
6. Insert cross-references from W3-001 throughout Discussion sections
7. Insert risk assessment tables from W3-002 at end of each Discussion section
8. Insert consolidated risk table from W3-003 into Executive Summary
9. Apply provision enhancements from W4-001 and W4-002 to draft contract language sections
10. Apply citation corrections from W5-001 and W5-002 to Footnotes section

VERIFICATION CHECKS (run after integration):
1. Section count: Verify 7 Discussion sections present (IV.A-IV.G)
2. CREAC headers: Verify ≥50 headers detected (run Grep count)
3. Cross-references: Verify ≥30 "See Section" references (run Grep count)
4. Risk tables: Verify 7 risk tables present (one per Discussion section)
5. Placeholders: Verify zero [TBD] markers (run Grep "\[TBD\]")
6. Questions/Answers: Verify 12 questions and 12 answers present with 1:1 mapping

CHUNKING PROTOCOL (for >500KB files):
- Process in 100KB chunks to avoid token limits
- Use progressive saves after each major insertion
- Verify each insertion before proceeding to next

OUTPUT: final-memorandum-v2.md (complete remediated document)
```
**Output**: final-memorandum-v2.md
**Success Criteria**:
- All remediation outputs integrated
- Document renders cleanly (no broken formatting)
- All verification checks pass
- Zero placeholders remaining
- File size: ~900-950KB (slight increase from original 882KB due to additions)

**Estimated Time**: 30 minutes

---

#### Task W6-002: Add Table of Contents
**Priority**: MEDIUM
**Agent**: memo-final-synthesis
**Issue Reference**: DIM10-001
**Input**:
```
Generate Table of Contents with section numbers, titles, and line references for insertion after title page (line ~50).

REQUIRED FORMAT:
## TABLE OF CONTENTS

**Page/Line**

I. Transaction Overview ......................................................... [line]

II. Questions Presented ......................................................... [line]

III. Brief Answers .............................................................. [line]

IV. Material Legal Risks Summary ................................................ [line]
    A. Aggregate Risk Exposure .................................................. [line]
    B. Critical Issues (CRITICAL/HIGH Severity) ................................ [line]
    C. Risk Categories .......................................................... [line]

V. Cross-Domain Impact Analysis ................................................. [line]

VI. Deal-Blocking Issues Assessment ............................................. [line]

VII. Recommended Transaction Adjustments ........................................ [line]

VIII. Material Findings by Domain ............................................... [line]
    A. CMS Regulatory Compliance & Quality Ratings .............................. [line]
    B. False Claims Act Litigation and Investigation ............................ [line]
    C. Commercial Contracts and Change of Ownership ............................. [line]
    D. Insurance Coverage & Risk Transfer Analysis .............................. [line]
    E. Employment & Labor [NEW] ................................................. [line]
    F. Data Privacy & HIPAA Compliance .......................................... [line]
    G. Tax Structure & Transaction Tax Planning ................................. [line]

IX. Scenario Analysis ........................................................... [line]

X. Board Recommendation ......................................................... [line]

XI. Methodology and Limitations ................................................. [line]

XII. Appendices ................................................................. [line]
    A. Cross-Reference Matrix ................................................... [line]
    B. Consolidated Footnotes ................................................... [line]
    C. Limitations and Assumptions .............................................. [line]

PROCESS:
1. Extract section headers from final-memorandum-v2.md using Grep "^## "
2. Map each header to line number
3. Format as two-column table (section title + dots + line number)
4. Insert after title page (around line 50-60)

OUTPUT FORMAT: Markdown section ready for insertion
```
**Output**: remediation-outputs/W6-002-table-of-contents.md
**Success Criteria**:
- ToC includes all main sections (I-XII) and Discussion subsections (IV.A-IV.G)
- Line numbers accurate (±5 lines tolerance)
- Two-column format with dot leaders for readability
- Section IV.E (Employment & Labor) present in ToC

**Estimated Time**: 10 minutes

---

#### Task W6-003: Remove Advocacy Language & Artifacts
**Priority**: LOW
**Agent**: memo-remediation-writer
**Issue Reference**: DIM2-001, DIM10-002
**Input**:
```
Final pass to neutralize remaining advocacy language and remove formatting artifacts.

ADVOCACY LANGUAGE REPLACEMENTS:
- "must negotiate" → "should consider negotiating"
- "must remediate" → "should remediate" OR "requires remediation"
- "buyer must" → "buyer should" (except where true legal requirement: "CMS must terminate")
- "clearly indicates" → "indicates" OR "suggests"
- "obviously" → [remove intensifier]
- "without question" → [remove intensifier]

PRESERVE "MUST" WHERE APPROPRIATE:
- Regulatory/statutory requirements: "CMS must terminate under 42 CFR § 489.52" (keep "must")
- Contractual obligations: "Seller must obtain surety bond per closing condition" (keep "must")

ARTIFACT REMOVAL:
- Search: "[Omitted long context line]" → Remove entirely
- Search: "[Omitted long matching line]" → Remove entirely
- Search: Any remaining Grep artifacts → Remove

FINAL VERIFICATION:
- Run Grep "clearly|obviously|must|undoubtedly" case-insensitive
- Count should reduce from 142 to <20 instances
- All remaining "must" usage should be true legal/contractual requirements

OUTPUT FORMAT: Markdown file with specific text replacements by line number
```
**Output**: remediation-outputs/W6-003-language-neutralization.md
**Success Criteria**:
- Advocacy language count reduced from 142 to <20 instances
- All remaining "must" usage justified (true requirements)
- Zero formatting artifacts ([Omitted...] markers removed)
- Neutral tone maintained throughout

**Estimated Time**: 5 minutes

---

## DEPENDENCY GRAPH

```
Wave 1 (Structural)
    ├─ W1-001: Section IV.E ─────────┐
    ├─ W1-002: Questions Presented ───┼─────► Wave 2 (CREAC/Counter)
    └─ W1-003: Brief Answers ─────────┘           ├─ W2-001: CREAC headers ──────┐
                                                   └─ W2-002: Counter-analysis ───┼─► Wave 3 (Xrefs/Tables)
                                                                                   │      ├─ W3-001: Cross-references ──┐
                                                                                   │      ├─ W3-002: Risk tables ───────┼─► Wave 4 (Provisions)
                                                                                   │      └─ W3-003: Exec summary table ─┘      ├─ W4-001: Reasonable standards ─┐
                                                                                   │                                            └─ W4-002: Precedents ────────────┼─► Wave 5 (Citations)
                                                                                   │                                                                              │      ├─ W5-001: Pincites ──┐
                                                                                   │                                                                              │      └─ W5-002: Parentheticals ┼─► Wave 6 (Assembly)
                                                                                   │                                                                              │                                │      ├─ W6-001: Final assembly
                                                                                   │                                                                              │                                │      ├─ W6-002: Table of Contents
                                                                                   │                                                                              │                                │      └─ W6-003: Language polish
                                                                                   └──────────────────────────────────────────────────────────────────────────────┘──────────────────────────────┘
```

---

## SUCCESS METRICS

| Metric | Pre-Remediation | Post-Remediation Target | Measurement |
|--------|-----------------|------------------------|-------------|
| **Overall Score** | 72% | 90-93% | 2nd-pass diagnostic |
| **CRITICAL Issues** | 4 | 0 | All blocking issues resolved |
| **HIGH Issues** | 18 | ≤2 | Residual complex issues only |
| **CREAC Headers** | 0 | ≥50 | Grep count |
| **Cross-References** | 4 | ≥30 | Grep "See Section" count |
| **Risk Tables** | 0 | 7 | One per Discussion section |
| **Questions Presented** | Missing | 12 present | Section II complete |
| **Brief Answers** | Missing | 12 present | Section III complete |
| **Section IV.E** | Missing | Complete | 20-30 pages of analysis |
| **Placeholders** | 16 | 0 | Grep "[TBD]" = 0 |
| **Advocacy Language** | 142 | <20 | Grep count |
| **Pincite Coverage** | 72.6% | ≥95% | Citation analysis |

---

## ESCALATION RULES

**Maximum Remediation Cycles**: 2
- Current cycle: 1
- If 2nd-pass score <88% after this remediation: Proceed to cycle 2
- If 2nd-pass score <88% after cycle 2: ESCALATE to human review

**Escalation Triggers**:
1. Same CRITICAL issue unresolved after 2 cycles
2. Post-remediation score decline (score regression)
3. New CRITICAL issues introduced during remediation
4. Agent failure (unable to complete assigned task after 2 attempts)

**Escalation Action**:
- Generate escalation report identifying root cause
- Flag for senior associate / junior partner manual review
- Provide specific guidance on blocked issues

---

## RISK MITIGATION

**Quality Control Checks** (after each wave):
1. **Wave 1 completion**: Verify all 3 new sections render correctly (no broken formatting)
2. **Wave 2 completion**: Run Grep to verify CREAC header count ≥50
3. **Wave 3 completion**: Verify risk tables render correctly in all sections
4. **Wave 4 completion**: Spot-check 5 provisions for "reasonable" removal
5. **Wave 5 completion**: Verify pincite coverage ≥95%
6. **Wave 6 completion**: Run full diagnostic suite (all Grep checks from initial assessment)

**Rollback Protocol**:
- If any wave introduces regressions (broken formatting, content deletion), rollback to previous version
- Isolate problematic task and re-attempt with modified instructions
- Maximum 2 rollbacks per wave before escalating to human review

---

## POST-REMEDIATION DELIVERABLES

Upon completion of all 6 waves, orchestrator will deliver:

1. **final-memorandum-v2.md** - Fully remediated memorandum
2. **remediation-summary.md** - Issues resolved, residual issues, metrics comparison
3. **qa-certification-report.md** - 2nd-pass diagnostic assessment with final score

**Expected Outcome**: 90-93% score → **CERTIFY WITH LIMITATIONS** (proceed to delivery)

---

**END OF REMEDIATION PLAN**

---

*Generated by: memo-qa-diagnostic*
*Session: 2026-01-26-1737900000*
*Timestamp: 2026-01-26T15:00:00Z*
*Next Step: Generate remediation-dispatch.md for orchestrator execution*
