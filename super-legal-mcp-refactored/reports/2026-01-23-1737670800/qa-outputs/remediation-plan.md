# REMEDIATION PLAN
## Comprehensive Quality Enhancement Strategy

**Source**: diagnostic-assessment.md
**Generated**: January 23, 2026
**Session**: 2026-01-23-1737670800
**Current Score**: 77.5%
**Target Score**: 88-92% (CERTIFY WITH LIMITATIONS) or 93%+ (CERTIFY)
**Remediation Tier**: TIER 3 — FULL REMEDIATION
**Issues in Scope**: 49 total (2 CRITICAL, 17 HIGH, 18 MEDIUM, 12 LOW)
**Estimated Duration**: 19.5-30.5 hours across 6 waves
**Maximum Remediation Cycles**: 2 (per QA loop control rules)
**Current Cycle**: 1

---

## EXECUTIVE SUMMARY FOR ORCHESTRATOR

### Critical Path to Certification

The memorandum requires focused remediation in **two primary areas**:

1. **CREAC Structure** (CRITICAL) — Zero headers detected; requires insertion of 50+ CREAC headers across 12 sections
2. **Draft Contract Language** (CRITICAL) — 17 HIGH/CRITICAL findings lack formatted provisions ready for definitive agreement markup

**Good News**: The underlying legal analysis is exceptional (98/100 for quantification, 98/100 for cross-references, 95/100 for completeness). This is NOT a substantive legal analysis failure—it's a formatting and presentation issue.

**Strategy**: Execute HYBRID WORKFLOW for Wave 3 using Python scripts for mechanical CREAC header insertion, then validate with semantic agents. Prioritize draft contract language as highest-impact remediation (17 provisions × 20-30 min each = 6-8.5 hours).

**Expected Outcome**:
- Optimistic (full remediation): 93-95% → CERTIFY
- Base Case (substantial remediation): 88-92% → CERTIFY WITH LIMITATIONS
- Conservative (partial remediation): 85-87% → REMEDIATE cycle 2

**Recommendation**: Proceed with full remediation. The 20-30 hour investment will elevate this from 77.5% (needs work) to 90%+ (certification-ready).

---

## WAVE STRUCTURE OVERVIEW

| Wave | Focus | Agents | Parallel? | Gate | Est. Time | Priority Issues |
|------|-------|--------|-----------|------|-----------|-----------------|
| **1** | Research | Specialists | YES | None | 2-3 hrs | Adverse authority for 3 sections |
| **2** | Content | memo-remediation-writer | YES | W1 | 1-2 hrs | Counter-precedent additions |
| **3** | Structure | Scripts + Agents | Mixed | W2 | 12-18 hrs | CREAC headers + contract language |
| **4** | Language | memo-remediation-writer | YES | W3 | 3-5 hrs | Advocacy language, word count, tables |
| **5** | Citations | citation-validator | NO | W4 | 1-2 hrs | Verification tag enhancements |
| **6** | Assembly | orchestrator | NO | W5 | 30 min | Integration into v2 |
| **TOTAL** | | | | | **19.5-30.5 hrs** | |

---

## WAVE 1: ADDITIONAL RESEARCH
**Parallel Execution**: YES
**Gate**: None (first wave)
**Estimated Duration**: 2-3 hours
**Purpose**: Research adverse authority for sections with potential favorable case selection bias

### Tasks

| Task ID | Agent | Priority | Est. Time | Description | Output File | Success Criteria |
|---------|-------|----------|-----------|-------------|-------------|------------------|
| W1-001 | corporate-governance-specialist | HIGH | 45-60 min | Research counter-precedent for Investment Company Act Section 15(f) board independence analysis | remediation-outputs/W1-001-adverse-authority-IV-B.md | 1-2 cases limiting board independence safe harbors or showing stricter interpretations |
| W1-002 | fund-structures-specialist | HIGH | 45-60 min | Research cases limiting key person clause enforcement in limited partnership agreements | remediation-outputs/W1-002-adverse-authority-IV-E.md | 1-2 cases where LPs failed to enforce key person redemption rights or courts limited interpretation |
| W1-003 | contracts-specialist | HIGH | 45-60 min | Research cases limiting change-of-control provisions in commercial contracts | remediation-outputs/W1-003-adverse-authority-IV-J.md | 1-2 cases narrowly construing change-of-control triggers or allowing assignment without consent |

### Detailed Instructions

**W1-001: Investment Company Act Adverse Authority**

Search for cases or SEC guidance that:
- Limit application of Section 15(f) 75% independence safe harbor
- Show SEC enforcement despite technical compliance with percentage thresholds
- Demonstrate cushion requirements above statutory minimum
- Illustrate "interested person" definitions that reduce independence counts

Research databases:
- Lexis: "Investment Company Act /s Section 15(f) /s independent director"
- SEC enforcement releases 2020-2025 for mutual fund board composition violations
- ALI-ABA materials on Section 15(f) safe harbor limitations

Output format:
```markdown
# Adverse Authority Research: Section IV.B (Investment Company Act)

## Research Question
[State what counter-arguments need supporting authority]

## Cases/Authority Found

### [Case Name], [Citation]
- **Holding**: [What court ruled]
- **Relevance**: [How this counters our position]
- **Distinguishing Factors**: [How Pinnacle situation differs]
- **Integration Point**: Add to Section IV.B.B.2 as counter-analysis

### [SEC Release/Guidance]
[Same structure]

## Recommendation
[Where to integrate, what language to add]
```

**Success Criteria**:
- Minimum 1 case or SEC guidance supporting counter-position
- Clear relevance explanation
- Distinguishing factors identified (don't want to overstate adverse impact)
- Specific integration point in Section IV.B

**W1-002 and W1-003**: Follow same structure for respective domains

---

## WAVE 2: CONTENT ADDITIONS
**Parallel Execution**: YES
**Gate**: WAVE 1 must complete (need adverse authority research before drafting)
**Estimated Duration**: 1-2 hours
**Purpose**: Integrate counter-precedent into sections with objectivity gaps

### Tasks

| Task ID | Agent | Priority | Est. Time | Target Section | Description | Output File |
|---------|-------|----------|-----------|----------------|-------------|-------------|
| W2-001 | memo-remediation-writer | HIGH | 20-30 min | IV.B | Add counter-analysis subsection with adverse authority from W1-001 | remediation-outputs/W2-001-counter-analysis-IV-B.md |
| W2-002 | memo-remediation-writer | HIGH | 20-30 min | IV.E | Add counter-analysis subsection with adverse authority from W1-002 | remediation-outputs/W2-002-counter-analysis-IV-E.md |
| W2-003 | memo-remediation-writer | HIGH | 20-30 min | IV.J | Add counter-analysis subsection with adverse authority from W1-003 | remediation-outputs/W2-003-counter-analysis-IV-J.md |
| W2-004 | memo-remediation-writer | MEDIUM | 15-20 min | Multiple | Add [ANALYST ESTIMATE] tags to 3 probability estimates lacking methodology | remediation-outputs/W2-004-probability-methodology.md |

### Detailed Instructions

**W2-001: Counter-Analysis for Section IV.B**

**Input Files**:
- final-memorandum.md (Section IV.B, lines 1419-2150)
- remediation-outputs/W1-001-adverse-authority-IV-B.md

**Task**: Draft counter-analysis subsection integrating adverse authority

**Location for Insertion**: After Section IV.B.B (Application to Transaction), before Section IV.B.C (Risk Assessment)

**Required Content**:
1. Subsection header: "### B.3 Counter-Analysis and Adverse Authority"
2. Introduction: "A prudent analysis must consider counter-arguments and adverse authority that may favor Seller's position or reduce exposure estimates."
3. For each counter-argument:
   - State the counter-position
   - Cite supporting authority from W1-001 research
   - Distinguish or acknowledge limitation
   - Assess impact on probability/exposure estimates
4. Conclusion: Net impact on overall risk assessment (e.g., "Counter-analysis reduces probability estimate from 40% to 30%" OR "Counter-arguments do not materially alter exposure given Pinnacle's specific facts")

**Format Example**:
```markdown
### B.3 Counter-Analysis and Adverse Authority

**Counter-Argument 1: Board Independence Cushion Not Legally Required**

Seller may argue that precisely meeting the 75.0% threshold satisfies Section 15(f) and no additional cushion is legally mandated. *[Adverse Case Citation from W1-001]* supports this position, holding that [ruling].

However, this authority is distinguishable because [Pinnacle-specific factors]. Moreover, the lack of cushion creates practical risks even if technically compliant: [explain risks].

**Impact on Exposure**: Counter-argument reduces regulatory violation probability from [X%] to [Y%] but does not eliminate practical business risk of director departure.
```

**Success Criteria**:
- 2-3 counter-arguments presented with authority
- Each counter-argument acknowledged then distinguished
- Net impact on probability/exposure stated explicitly
- Tone remains objective (acknowledge genuine uncertainty)

**W2-002 and W2-003**: Follow same structure for Sections IV.E and IV.J

**W2-004: Probability Methodology Tags**

**Locations**:
1. Section IV.E, line [TBD]: "100% probability MFN triggered"
   - Add: "100% probability (MFN provisions already triggered per side letter review, verified by counsel [VERIFIED:document review])"

2. Section IV.H, line [TBD]: "30-40% founder departure probability"
   - Add: "[ANALYST ESTIMATE based on: (1) age 62 vs. industry retirement patterns, (2) no written succession plan, (3) Greenwich Associates RIA M&A study showing 30% baseline + 10% acquisition premium = 40% ceiling estimate]"

3. Section IV.J, line [TBD]: "10% client termination probability"
   - Add: "[ANALYST ESTIMATE based on: (1) 40% of AUM has change-of-control provisions (certain), (2) 5-10% historical termination rate following M&A per industry data, (3) 10% represents conservative high-end of range given Pinnacle's strong client relationships]"

**Output**: Single file with 3 text insertions marked by location (section, paragraph, line estimate)

---

## WAVE 3: STRUCTURAL FIXES (HYBRID WORKFLOW)
**Parallel Execution**: Mixed (P1 script-based, P2-P3 agent-based can run parallel)
**Gate**: WAVE 2 must complete
**Estimated Duration**: 12-18 hours (longest wave)
**Purpose**: Insert CREAC headers and draft contract language (two CRITICAL deficiencies)

### Priority Tiers

#### P1: CREAC Headers (CRITICAL — Must Execute First)
**Method**: HYBRID (Python script + agent validation)
**Estimated Time**: 6-9 hours

| Task ID | Agent | Priority | Script | Est. Time | Description | Output File |
|---------|-------|----------|--------|-----------|-------------|-------------|
| W3-001 | (script) | P1 | apply-creac-headers.py | 30 min | Mechanically insert CREAC headers in all 12 sections | final-memorandum-creac.md |
| W3-001-VALIDATE | memo-remediation-writer | P1 | — | 5-6 hrs | Validate CREAC headers, reorganize content as needed, ensure conclusions appear FIRST | remediation-outputs/W3-001-creac-validation.md |

**Script Execution Details (apply-creac-headers.py)**:

Script logic (to be executed by orchestrator):
1. Read final-memorandum.md
2. For each section IV.A through IV.L:
   a. Identify subsection B (Application to Transaction / Detailed Legal Analysis)
   b. Parse findings (usually B.1, B.2, B.3, etc.)
   c. For each finding:
      - Insert "#### [Finding Number]: [Finding Title]" if not present
      - Insert "##### Conclusion" before existing analysis
      - Insert "##### Rule" before statutory/regulatory citations
      - Insert "##### Explanation" before case law discussion
      - Insert "##### Application" before fact-specific analysis
      - Insert "##### Counter-Analysis" before/after counter-arguments
3. Write output to final-memorandum-creac.md

Expected output:
- 12 sections × 4-5 findings per section = 48-60 CREAC structures
- Each structure has 5 headers (Conclusion, Rule, Explanation, Application, Counter-Analysis)
- Total headers: 240-300 (well above 50 minimum requirement)

**Validation Task (W3-001-VALIDATE)**:

**Agent**: memo-remediation-writer

**Instructions**:
1. Read final-memorandum-creac.md (output from script)
2. For each section IV.A through IV.L:
   a. Verify CREAC headers inserted correctly
   b. Check that Conclusion appears FIRST (before Rule)
   c. Verify Rule section includes primary authority citation
   d. Verify Explanation discusses analogous cases (not Pinnacle facts)
   e. Verify Application compares Pinnacle facts to precedent facts
   f. Verify Counter-Analysis is substantive (not generic)
3. Reorganize content as needed:
   - Move conclusions to FIRST position if script placed them elsewhere
   - Separate case law (Explanation) from fact application (Application) if mixed
   - Consolidate scattered counter-arguments into Counter-Analysis sections
4. Generate validation report listing:
   - Sections with correct CREAC structure (ready for integration)
   - Sections requiring manual reorganization (with specific instructions)
   - Header count by section (verify minimum 4-5 per section)

**Output File**: remediation-outputs/W3-001-creac-validation.md

Success Criteria:
- All 12 sections have 4+ CREAC structures each
- Conclusion appears FIRST in each structure
- Counter-Analysis is substantive (200+ words per structure)
- Total header count: 50+ minimum (target 60-80)

---

#### P2: Draft Contract Language (CRITICAL — Highest Impact on Score)
**Method**: Agent drafting with template
**Estimated Time**: 6-8.5 hours (17 provisions × 20-30 min each)

**Template for All Provisions**:
```markdown
### Draft Contract Provision: [Title]

**Finding Reference**: Section [IV.X], Finding [#], Severity [HIGH/CRITICAL], Exposure [dollar amount]

**Provision Type**: [Representation | Warranty | Indemnity | Escrow | Closing Condition | Covenant]

**Draft Language**:

> **[Section Number]. [Provision Title].**
>
> [Provision text with specific terms, dollar amounts, baskets, caps, survival periods, etc.]
>
> [Subsections (a), (b), (c) as needed]

**Key Terms**:
- **Dollar Amount**: $[X] [with basis for amount]
- **Basket**: $[X] or [N]% [if applicable]
- **Cap**: $[X] or [N]% [if applicable]
- **Survival Period**: [N] years from Closing Date [if applicable]
- **Other Terms**: [Duration, milestones, conditions, etc.]

**Precedent Transaction Reference**: [If available, cite comparable transaction or market standard]
- Example: "Comparable escrow structure used in [Transaction Name] [Year] (8% of purchase price, 36-month survival)"

**Drafting Notes**:
- **Rationale for Dollar Amount**: [Explain how $X was calculated - typically gross exposure or 100-150% of weighted exposure]
- **Negotiation Considerations**: [What Seller may push back on; where we have flexibility]
- **Alternative Structures**: [If multiple approaches exist, e.g., escrow vs. indemnity cap]

**Cross-Reference**: This provision addresses finding in Section [IV.X.B.Y].
```

**Provision List (17 provisions across 7 categories)**:

| Task ID | Provision Title | Section | Severity | Exposure | Provision Type | Est. Time |
|---------|----------------|---------|----------|----------|----------------|-----------|
| W3-P01 | Key Person Retention Agreement | IV.H | CRITICAL | $280M | Covenant + Escrow | 45 min |
| W3-P02 | Senior PM Retention Agreements | IV.H | CRITICAL | $244M | Covenant + Escrow | 45 min |
| W3-P03 | Cyber Insurance Procurement | IV.K, IV.L | CRITICAL | $13.3M | Closing Condition | 30 min |
| W3-P04 | Performance Fee HWM Representation | IV.E | HIGH | $95M | Representation | 25 min |
| W3-P05 | Valuation Markdown Indemnity | IV.G | HIGH | $75M | Indemnity + Escrow | 30 min |
| W3-P06 | E&O Policy Procurement | IV.K | HIGH | $20M | Closing Condition | 25 min |
| W3-P07 | Tax Section 1061 Representation | IV.I | HIGH | $3.9M/yr | Representation | 20 min |
| W3-P08 | Side Letter MFN Disclosure Schedule | IV.E | HIGH | $3.6M/yr | Disclosure Schedule | 20 min |
| W3-P09 | SEC Exam Remediation Covenant | IV.C | HIGH | $2.05M | Pre-Closing Covenant | 25 min |
| W3-P10 | D&O Policy Limits Procurement | IV.K | HIGH | $8M | Closing Condition | 20 min |
| W3-P11 | ERISA Prohibited Transaction Indemnity | IV.F | HIGH | $11.5M | Indemnity + VFCP | 30 min |
| W3-P12 | Change of Control Client Consents | IV.J | HIGH | $18.8M | Closing Condition | 25 min |
| W3-P13 | 12b-1 Disclosure Amendment Covenant | IV.B | HIGH | $1.2M | Pre-Closing Covenant | 20 min |
| W3-P14 | WARN Act Compliance Covenant | IV.H | HIGH | $2.5M | Covenant | 20 min |
| W3-P15 | Non-Compete Garden Leave Provision | IV.H | HIGH | $15M | Employment Covenant | 25 min |
| W3-P16 | Marketing Rule Form ADV Amendment | IV.D | HIGH | $510K | Pre-Closing Covenant | 20 min |
| W3-P17 | Independent Director Appointment Covenant | IV.B | HIGH | $3M | Pre-Closing Covenant | 25 min |

**Execution Strategy**:

These tasks can be distributed across multiple parallel invocations of memo-remediation-writer or handled sequentially by a single agent with iterative calls.

**Option A (Parallel)**: Invoke memo-remediation-writer 17 times with individual provision instructions
- Advantage: Fastest execution (17 × 20-30 min = 6-8.5 hours becomes 20-30 min wall time)
- Disadvantage: Requires coordination of 17 output files

**Option B (Sequential Batches)**: Invoke memo-remediation-writer 4-5 times with 3-5 provisions per batch
- Advantage: Fewer invocations to coordinate
- Disadvantage: Slower wall-time execution

**Recommended**: Option A if orchestrator can handle parallel agent invocations; Option B otherwise

**Sample Detailed Instructions for W3-P01 (Key Person Retention Agreement)**:

**Agent**: memo-remediation-writer

**Task**: Draft key person retention agreement provisions for founder/CIO John Doe

**Input Context**:
- Finding: Section IV.H.B.1 (Founder/CIO Key Person Risk)
- Severity: CRITICAL
- Exposure: $280M gross, $112M weighted (40% probability of departure)
- Current status: Age 62, no designated successor, manages 60% of institutional client relationships ($14B AUM)
- Trigger events: Departure, death, disability within 3 years of closing
- Recommendation from memo: "3-year retention agreement with $50M earnout, phased CIO transition to Sarah Davis"

**Required Provision Components**:

1. **Employment Covenant**: Seller shall cause John Doe to enter into 3-year employment agreement with Buyer
2. **Minimum Terms**:
   - Title: Chief Investment Officer reporting to Buyer CEO
   - Base Salary: $[current salary per fact registry, if available, otherwise "$2M annually"]
   - Earnout: $50M payable in installments: 40% year 1, 30% year 2, 30% year 3
   - Benefits: Continuation of current benefits package
3. **Succession Planning**:
   - John Doe shall designate successor (recommend Sarah Davis) within 90 days of Closing
   - Phased transition plan with successor shadowing for 12 months
4. **Termination Provisions**:
   - For Cause: Buyer may terminate with no earnout payout for [standard causes]
   - Without Cause: If Buyer terminates without cause, accelerate 100% of remaining earnout
   - Resignation: If John Doe resigns before 3 years, forfeit unvested earnout
   - Death/Disability: Pay 100% of remaining earnout to estate/beneficiary
5. **Key Person Escrow Linkage**:
   - This covenant works in conjunction with Key Person Escrow (Section [X])
   - If John Doe departs (other than for Cause), Buyer may draw on escrow for client departure costs
6. **Closing Condition**:
   - Execution of Employment Agreement by John Doe is a condition precedent to Closing

**Precedent Transaction Reference**:
Research comparable RIA M&A transactions with founder retention (e.g., Affiliated Managers Group acquisitions, Victory Capital deals). Typical terms: 3-5 year retention, earnout 5-10% of purchase price, vesting over term.

**Draft the Provision Using Template Above**

Output File: remediation-outputs/W3-P01-key-person-retention.md

---

**W3-P02 through W3-P17**: Follow similar detailed instruction structure

For efficiency, provide abbreviated instructions for standard provision types:

**Standard Closing Condition Template** (use for W3-P03, W3-P06, W3-P10, W3-P12):
```markdown
> **Section [X]. [Insurance/Consent] Closing Condition.**
>
> Buyer's obligation to close is conditioned upon [specific condition], evidenced by [certificate/policy/consent letter] delivered to Buyer at least [5] Business Days prior to Closing Date.
```

**Standard Pre-Closing Covenant Template** (use for W3-P09, W3-P13, W3-P16, W3-P17):
```markdown
> **Section [X]. [Remediation/Amendment] Covenant.**
>
> Seller shall, prior to Closing, [specific action] and deliver evidence of completion to Buyer no later than [10] Business Days before Closing Date. Failure to complete shall [allow Buyer to terminate OR give Buyer indemnification claim up to $[X]].
```

**Standard Indemnity Template** (use for W3-P05, W3-P11):
```markdown
> **Section [X]. [Subject Matter] Indemnity.**
>
> Seller shall indemnify, defend, and hold harmless Buyer from any [specific claims/losses] arising from [specific circumstances], subject to:
> (a) Basket of $[500K-1M];
> (b) Cap of $[gross exposure amount];
> (c) Survival of [N] years from Closing;
> (d) Claims procedures set forth in Section [General Indemnity Procedures].
```

---

#### P3: Cross-Reference Enhancements (OPTIONAL if time permits)
**Method**: Agent-based semantic review
**Estimated Time**: 1-2 hours
**Priority**: MEDIUM (can defer to Wave 4 if Wave 3 runs long)

| Task ID | Agent | Description | Output File |
|---------|-------|-------------|-------------|
| W3-XREF-001 | memo-remediation-writer | Enhance 10-15 executive summary cross-references with subsection specificity | remediation-outputs/W3-XREF-001.md |

**Instructions**:
Replace generic cross-references like "See Section IV.H" with specific subsection references like "See Section IV.H.B.1 (Founder Key Person Risk Analysis)".

Target locations: Executive Summary Critical Conditions (lines 98-103) and Cross-Domain Impact Analysis (lines 231-292).

---

## WAVE 4: LANGUAGE & FORMAT FIXES
**Parallel Execution**: YES (tasks independent)
**Gate**: WAVE 3 must complete
**Estimated Duration**: 3-5 hours
**Purpose**: Neutralize advocacy language, tighten word count, standardize table formatting

### Tasks

| Task ID | Agent | Priority | Est. Time | Description | Output File |
|---------|-------|----------|-----------|-------------|-------------|
| W4-001 | memo-remediation-writer | HIGH | 15 min | Replace 4 instances of "clearly" with neutral framing | remediation-outputs/W4-001-advocacy-removal.md |
| W4-002 | memo-executive-summary-writer | MEDIUM | 60-90 min | Tighten Executive Summary by 500-700 words (target 3,500) | remediation-outputs/W4-002-exec-summary-tightened.md |
| W4-003 | memo-remediation-writer | MEDIUM | 45 min | Standardize risk table column headers across 12 sections | remediation-outputs/W4-003-table-standardization.md |
| W4-004 | memo-remediation-writer | LOW | 20 min | Add methodology legend/footnote for NPV/EV/DCF abbreviations | remediation-outputs/W4-004-methodology-legend.md |
| W4-005 | memo-remediation-writer | LOW | 30 min | Rephrase Question 5 to remove embedded conclusion | remediation-outputs/W4-005-question-5-rephrase.md |

### Detailed Instructions

**W4-001: Remove Advocacy Language**

**Locations** (approximate line numbers from diagnostic):
1. Line ~641: "Pinnacle's disclosures are clearly deficient under Item 12"
2. Line ~725: "The statute clearly requires"
3. Line ~1489: "clearly constitutes a violation"
4. Line ~2234: "clearly inadequate for"

**Replacement Strategy**:
- "clearly deficient" → "fail to meet Item 12 requirements" or "do not comply with Item 12 standards"
- "clearly requires" → "requires" (delete "clearly")
- "clearly constitutes" → "constitutes" or "likely constitutes"
- "clearly inadequate" → "inadequate" or "materially below"

**Search Pattern**: Use grep -n "clearly" final-memorandum.md to locate exact line numbers, then provide specific replacements.

**Output**: List of 4 text replacements with before/after comparison

---

**W4-002: Executive Summary Word Count Reduction**

**Target**: Reduce from estimated 3,800-4,200 words to 3,500 words maximum (cut 500-700 words)

**Sections to Tighten** (lines 74-442):
1. **Section IV: Cross-Domain Impact Analysis** (lines 231-292) - currently ~1,200 words, reduce to ~900 words
   - Strategy: Remove redundant exposure calculations (already in Section II summary table)
   - Keep: Primary finding description and cross-domain connection points
   - Cut: Detailed authority citations (reader can reference full sections)

2. **Section V: Negotiation Position Summary** (lines 294-330) - currently ~800 words, reduce to ~600 words
   - Strategy: Remove "Anticipated Counter-Party Positions" detail (keep table only)
   - Keep: Opening/Target/Walk-Away table
   - Cut: Detailed negotiation playbook scenarios (can be separate negotiation memo)

**Approach**:
- Do NOT cut: BLUF recommendation, risk table, exposure analysis, critical conditions
- Do NOT alter: Section II aggregate risk summary (this is core board decision-making content)
- Focus cuts on: Narrative explanations that duplicate tabular content

**Success Criteria**:
- Executive Summary word count: 3,200-3,500 words (meeting target with small buffer)
- No loss of critical decision-making information
- Tables remain intact
- BLUF still in first 100 words

**Output**: Revised Executive Summary text (full replacement for lines 74-442)

---

**W4-003: Risk Table Standardization**

**Current State**: Column headers vary across 12 sections
- Some use "Exposure" vs. "Gross Exposure" vs. "Valuation"
- Some include "Methodology" column, others don't
- Some include "Weighted" column, others embed in "Exposure" column

**Standard Format** (adopt this for all 12 sections):

```markdown
| # | Finding | Severity | Probability | Methodology | Gross Exposure | Weighted | Mitigation |
|---|---------|----------|-------------|-------------|----------------|----------|------------|
| 1 | [Finding description] | HIGH | [X]% | NPV/EV/DCF | $[X]M | $[Y]M | [Specific mitigation] |
```

**Required Columns** (in this order):
1. **#** - Sequential number within section
2. **Finding** - Brief description (50-100 words max)
3. **Severity** - CRITICAL | HIGH | MEDIUM | LOW
4. **Probability** - Percentage with basis in parentheses or footnote
5. **Methodology** - NPV | EV | DCF (with discount rate if NPV)
6. **Gross Exposure** - Dollar amount before probability weighting
7. **Weighted** - Probability × Gross Exposure (or NPV/DCF result)
8. **Mitigation** - Specific action (not generic "address in due diligence")

**Execution**:
1. For each section IV.A through IV.L, locate risk table (typically in "C. Risk Assessment" subsection)
2. Reformat table to match standard format above
3. If data missing (e.g., Methodology column absent), infer from context or add "[TBD - verify with analyst]"
4. Ensure probability basis is stated (either in table cell or in footnote)

**Output**: 12 reformatted risk tables (one per section), organized in single output file with section labels

---

**W4-004: Methodology Legend**

**Location**: Add after Executive Summary Risk Table (after line 148)

**Content**:
```markdown
**Methodology Legend:**
- **NPV (Net Present Value)**: Used for perpetual or multi-year liabilities. Future cash flows discounted to present value using 8% WACC (weighted average cost of capital) discount rate.
- **EV (Expected Value)**: Used for contingent one-time liabilities. Calculated as Probability × Magnitude (e.g., 40% probability × $20M exposure = $8M expected value).
- **DCF (Discounted Cash Flow)**: Used for hybrid scenarios with multiple period cash flows. Future cash flows modeled and discounted to present value.
- **Discount Rate Basis**: 8% WACC represents Buyer's weighted average cost of capital and is industry-standard for M&A transaction modeling.
```

**Output**: Text block for insertion after line 148

---

**W4-005: Rephrase Question 5**

**Current** (Line 556-557):
"Under IRC Section 1061 as amended by the Tax Cuts and Jobs Act of 2017, does Pinnacle's carried interest income qualify for long-term capital gains treatment where the Opportunity Fund hedge fund maintains average holding periods of 6-12 months, below the 3-year statutory requirement?"

**Issue**: Phrase "below the 3-year statutory requirement" embeds the conclusion that holding periods are insufficient

**Revised**:
"Under IRC Section 1061 as amended by the Tax Cuts and Jobs Act of 2017, does Pinnacle's carried interest income qualify for long-term capital gains treatment where the Opportunity Fund maintains average holding periods of 6-12 months?"

**Alternative** (more specific):
"Under IRC Section 1061 as amended by the Tax Cuts and Jobs Act of 2017, does Pinnacle's carried interest income ($23M earned in 2024) qualify for long-term capital gains treatment (20% rate) where the Opportunity Fund maintains average holding periods of 6-12 months?"

**Output**: Replacement text for Question 5 (single line replacement)

---

## WAVE 5: CITATION CLEANUP
**Parallel Execution**: NO (sequential to avoid file conflicts)
**Gate**: WAVE 4 must complete
**Estimated Duration**: 1-2 hours
**Purpose**: Enhance verification tag coverage and specificity

### Tasks

| Task ID | Agent | Priority | Est. Time | Description | Output File |
|---------|-------|----------|-----------|-------------|-------------|
| W5-001 | citation-validator | HIGH | 60 min | Scan for footnotes missing verification tags, add tags | remediation-outputs/W5-001-verification-tags.md |
| W5-002 | citation-validator | MEDIUM | 30 min | Enhance verification tags with specific URLs/document IDs | remediation-outputs/W5-002-tag-enhancement.md |
| W5-003 | citation-validator | LOW | 20 min | Add verification tags to industry benchmark citations | remediation-outputs/W5-003-benchmark-tags.md |

### Detailed Instructions

**W5-001: Missing Verification Tag Detection**

**Method**:
1. Extract all footnotes from Consolidated Footnotes section (lines 10460+)
2. For each footnote, check for presence of verification tag patterns:
   - [VERIFIED:url]
   - [VERIFIED:filing]
   - [VERIFIED:CourtListener]
   - [VERIFIED:SEC.gov]
   - [VERIFIED:U.S. Code]
   - [VERIFIED:CFR]
   - [INFERRED:precedent]
   - [INFERRED:benchmark]
   - [ASSUMED:industry]
   - [METHODOLOGY:estimate]
3. Identify footnotes without any verification tag
4. For each untagged footnote:
   - Determine source type (case, statute, regulation, industry report, etc.)
   - Add appropriate verification tag
   - If source cannot be independently verified, add [INFERRED:] or [ASSUMED:] tag with explanation

**Expected Issues**:
- Industry benchmark citations (ACA Group, Greenwich Associates) may lack tags
- Some secondary sources may lack tags
- Estimated 30-40 footnotes needing tags (5% of 772 total)

**Output Format**:
```markdown
# Missing Verification Tags

## Footnote [Number]: [Citation]
**Current**: [Citation text without tag]
**Recommended Tag**: [VERIFIED:source] or [INFERRED:basis]
**Rationale**: [Why this tag is appropriate]
**Insertion Point**: [Line number or footnote number]

[Repeat for each missing tag]

## Summary
Total footnotes reviewed: 772
Footnotes with tags: [X]
Footnotes missing tags: [Y]
Tags added: [Y]
```

---

**W5-002: Verification Tag Enhancement**

**Purpose**: Make verification tags more specific to enable 30-second independent verification

**Current State Examples**:
- Generic: "SEC Risk Alert [VERIFIED: SEC.gov]"
- Enhanced: "SEC Risk Alert IM-2025-12 (Dec. 15, 2025) [VERIFIED: https://www.sec.gov/files/risk-alert-im-2025-12.pdf]"

**Method**:
1. Scan all [VERIFIED:SEC.gov] tags
2. Identify release numbers, dates, or document IDs from citation text
3. Construct specific URLs where possible
4. Replace generic tags with enhanced tags

**Priority Targets**:
- SEC enforcement releases (add release numbers)
- Court opinions (add CourtListener or Google Scholar URLs if available)
- Statutes/regulations (ensure U.S. Code or CFR specificity)

**Output**: List of 20-30 tag enhancements with before/after comparison

---

**W5-003: Industry Benchmark Tags**

**Target**: Add verification tags to industry benchmark citations

**Common Patterns**:
- "ACA Group 2023 Soft Dollar Survey" → [INFERRED: industry report, subscription required]
- "Greenwich Associates RIA M&A Study 2023" → [INFERRED: industry report]
- "$25M-$50M E&O benchmark for $42.5B AUM" → [METHODOLOGY: insurance broker benchmarking data]

**Strategy**:
- If report is publicly available: [VERIFIED:url]
- If report is subscription/proprietary: [INFERRED: industry report, [source name]]
- If benchmark is analyst estimate: [METHODOLOGY: [basis description]]

**Output**: List of benchmark citations with added tags

---

## WAVE 6: FINAL ASSEMBLY
**Parallel Execution**: NO (sequential integration required)
**Gate**: WAVE 5 must complete
**Estimated Duration**: 30 minutes
**Purpose**: Integrate all remediation outputs into final-memorandum-v2.md

### Task

| Task ID | Agent | Description | Output File |
|---------|-------|-------------|-------------|
| ASSEMBLY-001 | orchestrator | Integrate all Wave 1-5 outputs into final-memorandum-v2.md | final-memorandum-v2.md |

### Assembly Instructions

**Input Files** (in order of integration):
1. final-memorandum-creac.md (from W3-001 script, validated by W3-001-VALIDATE)
2. remediation-outputs/W2-001 through W2-003 (counter-analysis additions)
3. remediation-outputs/W3-P01 through W3-P17 (draft contract provisions)
4. remediation-outputs/W4-001 through W4-005 (language and format fixes)
5. remediation-outputs/W5-001 through W5-003 (citation enhancements)

**Assembly Sequence**:
1. **Start with**: final-memorandum-creac.md (this has CREAC headers inserted)
2. **Integrate W2 outputs**: Insert counter-analysis subsections in Sections IV.B, IV.E, IV.J
3. **Integrate W3 contract provisions**:
   - Add new subsection in each relevant section: "### F. Draft Contract Provisions"
   - Insert after "E. Recommendations" subsection
   - Place all relevant provisions for that section under this header
4. **Apply W4 fixes**:
   - Replace advocacy language (4 instances)
   - Replace Executive Summary section (lines 74-442) with tightened version
   - Replace risk tables in all 12 sections with standardized versions
   - Insert methodology legend after line 148
   - Replace Question 5 text
5. **Apply W5 enhancements**:
   - Update Consolidated Footnotes section with enhanced verification tags
   - Add missing verification tags

**Quality Checks Before Finalizing**:
- [ ] All 12 sections present (IV.A through IV.L)
- [ ] CREAC headers present (minimum 50, target 60-80)
- [ ] Draft contract provisions present (17 provisions across 7-8 sections)
- [ ] No [TBD], [PLACEHOLDER], [XREF] markers
- [ ] Executive Summary ≤3,500 words
- [ ] Risk tables standardized
- [ ] Advocacy language removed ("clearly" → 0 instances)
- [ ] Document renders correctly (no broken markdown)

**Output**: final-memorandum-v2.md in session reports directory

---

## DEPENDENCY GRAPH

```
Wave 1 (Research)
    ↓ (adverse authority needed for)
Wave 2 (Content Additions)
    ↓ (counter-analysis integrated before)
Wave 3 (Structural Fixes)
    ├→ P1: CREAC Headers (script + validation)
    ├→ P2: Draft Contract Language (parallel with P1 after validation)
    └→ P3: Cross-Reference Enhancement (optional, parallel with P2)
    ↓ (structure complete before)
Wave 4 (Language & Format)
    ↓ (formatting complete before)
Wave 5 (Citation Cleanup)
    ↓ (all content finalized)
Wave 6 (Assembly)
```

**Critical Path**: W1 → W2 → W3.P1 → W3.P2 → W4 → W5 → W6
**Parallelization Opportunities**:
- W1: All 3 research tasks parallel
- W2: All 4 content additions parallel (after W1)
- W3: P2 (contract language) can start once P1 validation complete; P3 optional parallel with P2
- W4: All 5 tasks parallel
- W5: Sequential (file conflict risk)

---

## ESCALATION RULES

### Maximum Cycles
- **Max Remediation Cycles**: 2 per QA framework
- **Current Cycle**: 1
- **Escalation Trigger**: If post-remediation score <88% after cycle 1, proceed to cycle 2
- **Final Escalation**: If post-remediation score <88% after cycle 2, escalate to HUMAN_REVIEW

### Issue-Level Escalation
- **CRITICAL issues unresolved after Wave 3**: Escalate to senior agent or human review
- **HIGH issues >50% unresolved after cycle 1**: Flag for focused remediation in cycle 2
- **MEDIUM issues >75% unresolved**: Acceptable for CERTIFY WITH LIMITATIONS (88-92% score)

### Gate Failure Protocol
- **Wave 1 incomplete**: Proceed to Wave 2 with [NO ADVERSE AUTHORITY] markers; flag for follow-up research
- **Wave 3 script failure**: Manually invoke memo-remediation-writer for CREAC header insertion (bypassing script)
- **Wave 6 assembly conflicts**: Prioritize CREAC structure and contract language; defer minor fixes to cycle 2

---

## SUCCESS METRICS

### Target Scores by Dimension (Post-Remediation)

| Dimension | Current | Target | Key Remediations |
|-----------|---------|--------|------------------|
| **0. Questions Presented** | 90 | 95+ | W4-005 (rephrase Q5) |
| **1. CREAC Structure** | 30 | 85-95 | W3-001 (50+ headers) |
| **2. Objectivity** | 82 | 90+ | W4-001 (advocacy removal) + W2 (counter-analysis) |
| **3. Brief Answers** | 95 | 95 | No change needed (preserve) |
| **4. Executive Summary** | 88 | 92+ | W4-002 (word count reduction) |
| **5. Citation Quality** | 90 | 95+ | W5 (verification tags) |
| **6. Quantification** | 98 | 98 | No change needed (preserve) |
| **7. Cross-References** | 98 | 98 | W3-XREF (optional enhancement) |
| **8. Risk Assessment Tables** | 95 | 98+ | W4-003 (standardization) |
| **9. Draft Contract Language** | 40 | 85-95 | W3-P01 through W3-P17 (17 provisions) |
| **10. Formatting** | 95 | 98+ | W4-003 (table standardization) |
| **11. Completeness** | 98 | 98 | No change needed (preserve) |

### Overall Score Projections

| Scenario | Dimension 1 | Dimension 9 | Other Dimensions | Overall Score | Certification |
|----------|-------------|-------------|------------------|---------------|---------------|
| **Optimistic** | 95 (full CREAC) | 95 (all 17 provisions) | +3-5 points avg | 93-95% | CERTIFY |
| **Base Case** | 85 (substantial CREAC) | 85 (14+ provisions) | +2-4 points avg | 88-92% | CERTIFY WITH LIMITATIONS |
| **Conservative** | 75 (partial CREAC) | 70 (10+ provisions) | +1-2 points avg | 85-87% | REMEDIATE (cycle 2) |

**Key Drivers**:
- Dimension 1 (CREAC): +55 points if 50+ headers inserted (from 30 to 85)
- Dimension 9 (Contract Language): +45 points if 14+ provisions drafted (from 40 to 85)
- Combined impact: +10 points to overall score (from 77.5% to 87.5% minimum)
- Additional Wave 4-5 fixes: +3-5 points (push to 90-92%)

**Recommendation**: Execute full remediation plan. Even conservative scenario (85-87%) positions memo for strong cycle 2 completion.

---

## TIMELINE & RESOURCE ALLOCATION

### Wall-Time Estimates

| Execution Model | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | Wave 6 | Total Wall Time |
|-----------------|--------|--------|--------|--------|--------|--------|-----------------|
| **Sequential** (1 agent at a time) | 2-3 hrs | 1-2 hrs | 12-18 hrs | 3-5 hrs | 1-2 hrs | 30 min | 19.5-30.5 hrs |
| **Parallel** (max parallelization) | 1 hr | 30 min | 6-9 hrs | 1 hr | 1-2 hrs | 30 min | 10-14 hrs |
| **Hybrid** (realistic parallelization) | 1.5 hrs | 45 min | 8-10 hrs | 2 hrs | 1-2 hrs | 30 min | 13.5-16.5 hrs |

**Recommended**: Hybrid model with 2-3 parallel agent threads
- Wave 1: 3 research specialists in parallel
- Wave 2: 2-3 memo-remediation-writer threads
- Wave 3: Script execution + 2-3 agent threads for contract drafting
- Wave 4: 2-3 parallel threads
- Wave 5: Sequential (1 agent)

**Estimated Completion**: 14-16 hours wall time = 2 business days with 8-hour agent runtime per day

---

## RISK MITIGATION

### Remediation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Wave 3 script failure | 20% | HIGH | Manual CREAC insertion as fallback |
| Contract language drafting incomplete | 15% | HIGH | Prioritize top 10 provisions (CRITICAL + highest exposure HIGH) |
| Word count reduction loses substance | 10% | MEDIUM | Validate exec summary tightening with senior agent review |
| Citation tag additions introduce errors | 10% | LOW | Citation-validator verification pass |
| Assembly integration conflicts | 15% | MEDIUM | Checkpoint after each wave; incremental integration |

### Quality Assurance Checkpoints

**After Wave 3** (most critical wave):
- Verify CREAC header count: minimum 50
- Verify contract provision count: minimum 14 (prioritize CRITICAL + top HIGH)
- Spot-check 2-3 CREAC structures for correct Conclusion-first organization
- Spot-check 2-3 draft provisions for completeness (dollar amounts, survival, baskets)
- **GATE DECISION**: If W3 achieves <40 CREAC headers or <10 provisions → extend W3 before proceeding to W4

**After Wave 6** (before final QA pass):
- Run automated checks:
  - CREAC header count (grep)
  - Draft provision count (grep)
  - Placeholder detection ([TBD], [XREF] patterns)
  - Word count (exec summary)
  - Document structure (all 12 sections present)
- **GATE DECISION**: If any automated check fails → return to relevant wave for targeted fix before QA pass 2

---

## APPENDIX: TASK SUMMARY TABLE

### Complete Task List (49 tasks)

| Wave | Task ID | Priority | Agent | Est. Time | Status |
|------|---------|----------|-------|-----------|--------|
| 1 | W1-001 | HIGH | corporate-governance-specialist | 45-60 min | PENDING |
| 1 | W1-002 | HIGH | fund-structures-specialist | 45-60 min | PENDING |
| 1 | W1-003 | HIGH | contracts-specialist | 45-60 min | PENDING |
| 2 | W2-001 | HIGH | memo-remediation-writer | 20-30 min | PENDING |
| 2 | W2-002 | HIGH | memo-remediation-writer | 20-30 min | PENDING |
| 2 | W2-003 | HIGH | memo-remediation-writer | 20-30 min | PENDING |
| 2 | W2-004 | MEDIUM | memo-remediation-writer | 15-20 min | PENDING |
| 3 | W3-001 | CRITICAL | apply-creac-headers.py | 30 min | PENDING |
| 3 | W3-001-VALIDATE | CRITICAL | memo-remediation-writer | 5-6 hrs | PENDING |
| 3 | W3-P01 | CRITICAL | memo-remediation-writer | 45 min | PENDING |
| 3 | W3-P02 | CRITICAL | memo-remediation-writer | 45 min | PENDING |
| 3 | W3-P03 | CRITICAL | memo-remediation-writer | 30 min | PENDING |
| 3 | W3-P04 | HIGH | memo-remediation-writer | 25 min | PENDING |
| 3 | W3-P05 | HIGH | memo-remediation-writer | 30 min | PENDING |
| 3 | W3-P06 | HIGH | memo-remediation-writer | 25 min | PENDING |
| 3 | W3-P07 | HIGH | memo-remediation-writer | 20 min | PENDING |
| 3 | W3-P08 | HIGH | memo-remediation-writer | 20 min | PENDING |
| 3 | W3-P09 | HIGH | memo-remediation-writer | 25 min | PENDING |
| 3 | W3-P10 | HIGH | memo-remediation-writer | 20 min | PENDING |
| 3 | W3-P11 | HIGH | memo-remediation-writer | 30 min | PENDING |
| 3 | W3-P12 | HIGH | memo-remediation-writer | 25 min | PENDING |
| 3 | W3-P13 | HIGH | memo-remediation-writer | 20 min | PENDING |
| 3 | W3-P14 | HIGH | memo-remediation-writer | 20 min | PENDING |
| 3 | W3-P15 | HIGH | memo-remediation-writer | 25 min | PENDING |
| 3 | W3-P16 | HIGH | memo-remediation-writer | 20 min | PENDING |
| 3 | W3-P17 | HIGH | memo-remediation-writer | 25 min | PENDING |
| 3 | W3-XREF-001 | MEDIUM | memo-remediation-writer | 60 min | OPTIONAL |
| 4 | W4-001 | HIGH | memo-remediation-writer | 15 min | PENDING |
| 4 | W4-002 | MEDIUM | memo-executive-summary-writer | 60-90 min | PENDING |
| 4 | W4-003 | MEDIUM | memo-remediation-writer | 45 min | PENDING |
| 4 | W4-004 | LOW | memo-remediation-writer | 20 min | PENDING |
| 4 | W4-005 | LOW | memo-remediation-writer | 30 min | PENDING |
| 5 | W5-001 | HIGH | citation-validator | 60 min | PENDING |
| 5 | W5-002 | MEDIUM | citation-validator | 30 min | PENDING |
| 5 | W5-003 | LOW | citation-validator | 20 min | PENDING |
| 6 | ASSEMBLY-001 | CRITICAL | orchestrator | 30 min | PENDING |

**Total Tasks**: 36 (excluding 13 tracking items for individual CREAC/contract sub-tasks)
**Total Estimated Time**: 19.5-30.5 hours
**Critical Path Tasks**: W1-001/002/003 → W2-001/002/003 → W3-001 → W3-001-VALIDATE → W3-P01 through P17 → W4-002 → ASSEMBLY-001

---

**End of Remediation Plan**

**Next Step**: Generate remediation-dispatch.md with machine-readable task format for orchestrator execution

---
