# REMEDIATION DISPATCH

**Diagnostic ID**: diagnostic-2026-01-22-001
**Diagnostic Score**: 79.2%
**Remediation Tier**: TIER_2_STANDARD
**Total Issues Found**: 18
**Issues In Scope**: 13 (CRITICAL: 3, HIGH: 3, MEDIUM: 2, LOW: 5)
**Estimated Duration**: 105 minutes
**Max Cycles**: 2
**Current Cycle**: 1

---

## WAVE 1: Additional Research
- **Parallel**: N/A
- **Gate**: none
- **Status**: SKIP (no new research required)

---

## WAVE 2: Content Additions (Draft Contract Language)
- **Parallel**: NO (sequential to avoid merge conflicts)
- **Gate**: none (first executing wave)
- **Estimated Duration**: 45 minutes

### TASK W2-001: Draft Closing Conditions Provisions

**Agent**: memo-remediation-writer

**Priority**: CRITICAL

**Estimated Time**: 15 minutes

**Issue ID**: CONTRACT-001

**Target**: Create new APPENDIX C, Article VII [Closing Conditions]

**Input Context**:
```
Source: Section I.F (Mandatory Closing Conditions), lines 362-511
Current State: Memorandum recommendations exist but not in contract format

Mandatory Closing Conditions Identified:
1. MCC-001: $400M Letter of Credit for Vermont Captive
   - LOC amount: $400 million
   - LOC issuer: AA- or better rated U.S. bank (JPMorgan, Citi, Bank of America)
   - LOC type: Irrevocable, clean, unconditional
   - Beneficiary: LLIC (not Vermont captive)
   - Term: 5 years renewable with evergreen clause (90-day non-renewal notice)
   - Draw conditions: Nebraska DOI written notice of reserve credit disallowance
   - Annual cost: $8-10 million (2-2.5% pricing)

2. MCC-002: AFH Direct Funding of $150M Capital Injection
   - AFH wires $150 million directly to LLIC at closing
   - Surplus notes terms: 10-year maturity, 5.1% after-tax coupon, quarterly interest
   - Nebraska DOI pre-approval required 60 days pre-closing
   - AFH assumes/replaces $730M Vermont captive parental guarantee

3. MCC-003: $46M Agent/Producer Retention Program Funded
   - Captive agent retention: $22M (50% at 12 months, 50% at 24 months)
   - Independent producer incentives: $24M (5% production bonus Year 1)
   - 90%+ participation rate required

4. MCC-004: IUL Class Action Settlement Approved by June 2025
   - Settlement executed by March 31, 2025
   - Court final approval by June 30, 2025
   - E&O insurer confirms $35M coverage
   - Settlement fund ($32M cash) funded by Seller pre-closing

5. MCC-005: Global Re Consent Obtained Without Adverse Modifications
   - Global Re written consent required
   - No materially adverse modifications
   - Consent request filed within 10 business days of signing
```

**Action**:
Draft Article VII [Closing Conditions] with five subsections (Sections 7.1-7.5) corresponding to MCC-001 through MCC-005. Use formal contract language.

**Template for Section 7.1**:
```
7.1 Vermont Captive Letter of Credit. The obligations of Buyer to consummate the Closing shall be subject to satisfaction or waiver of the following condition: Seller shall have caused Liberty Reinsurance VT LLC to obtain, and shall deliver to Buyer at Closing, an irrevocable, clean, unconditional letter of credit (the "Vermont Captive LOC") in the form attached as Exhibit G, satisfying the following requirements:

(a) LOC Amount: Four Hundred Million Dollars ($400,000,000);

(b) LOC Issuer: A U.S. banking institution rated AA- or better by Standard & Poor's Rating Services or Fitch Ratings, or Aa3 or better by Moody's Investors Service;

(c) Beneficiary: Liberty Life Insurance Company (the "Company");

(d) Term: Five (5) years from the Closing Date, automatically renewable for successive one-year periods unless the issuing bank provides ninety (90) days' prior written notice of non-renewal to the Company and Buyer;

(e) Draw Conditions: Beneficiary may draw upon the Vermont Captive LOC upon presentation to the issuing bank of beneficiary's certificate stating that (i) the Nebraska Department of Insurance has issued a written notice to the Company disallowing all or any portion of the reserve credit relating to the reinsurance transactions between the Company and Liberty Reinsurance VT LLC, or (ii) the Nebraska Department of Insurance has commenced formal proceedings to disallow such reserve credit and the Company reasonably determines that such disallowance is probable.
```

Replicate this format for Sections 7.2-7.5.

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W2-001-closing-conditions.md

**Success Criteria**:
- Five closing condition sections (7.1-7.5) drafted in proper contract format
- All dollar amounts, timelines, and conditions specified
- Language suitable for deal counsel markup Monday morning
- Cross-references to Exhibits where appropriate (Exhibit G for LOC form)

---

### TASK W2-002: Draft Escrow Provisions

**Agent**: memo-remediation-writer

**Priority**: HIGH

**Estimated Time**: 15 minutes

**Issue ID**: CONTRACT-002

**Target**: Create APPENDIX C, Article IX [Escrow]

**Input Context**:
```
Source: Section I.D (Purchase Price Adjustment Analysis), Section I.F (Mandatory Closing Conditions)
Current State: Executive Summary recommends $185M three-tier escrow but formal provisions not drafted

Escrow Structure:
- Tier 1 Escrow: $100 million (Captive Recapture Risk)
  - Term: 36 months from Closing
  - Release Condition: (i) Nebraska DOI written confirmation that $850M Vermont captive reserve credit remains valid and AG48-compliant, OR (ii) execution and Nebraska DOI acknowledgment of $400M LOC backstop

- Tier 2 Escrow: $50 million (Global Re Consent Risk)
  - Term: 24 months from Closing
  - Release Condition: Global Re written consent obtained without materially adverse modifications

- Tier 3 Escrow: $35 million (Thompson Litigation Risk)
  - Term: 18 months from Closing (or until settlement final approval, if later)
  - Release Condition: (i) Thompson class action settlement receives court final approval and opt-out period expires with <2% opt-out rate, AND (ii) Chubb E&O insurer confirms $35M coverage payment without fraud exclusion invocation

Total Escrow: $185 million (6.7% of adjusted purchase price)
Escrow Agent: Major U.S. bank (JPMorgan, Citi, Bank of America)
```

**Action**:
Draft Article IX [Escrow] with three-tier structure. Include:
- Section 9.1: Establishment of Escrow Account
- Section 9.2: Tier 1 Escrow (Captive Recapture)
- Section 9.3: Tier 2 Escrow (Global Re Consent)
- Section 9.4: Tier 3 Escrow (Thompson Litigation)
- Section 9.5: Release Procedures
- Section 9.6: Claims Against Escrow
- Section 9.7: Dispute Resolution

**Template for Section 9.2**:
```
9.2 Tier 1 Escrow (Captive Recapture Risk).

(a) Amount and Term. At the Closing, Buyer shall deposit with the Escrow Agent One Hundred Million Dollars ($100,000,000) (the "Tier 1 Escrow Amount") to be held in escrow for a period of thirty-six (36) months following the Closing Date (the "Tier 1 Escrow Period").

(b) Release Conditions. The Escrow Agent shall release the Tier 1 Escrow Amount (plus any accrued interest) to Seller upon the earliest to occur of:

    (i) Buyer's delivery to the Escrow Agent of written confirmation from the Nebraska Department of Insurance stating that the $850,000,000 reserve credit relating to the reinsurance transactions between the Company and Liberty Reinsurance VT LLC remains valid, complies with applicable regulatory requirements including Actuarial Guideline 48, and will not be subject to disallowance or adjustment; or

    (ii) Buyer's delivery to the Escrow Agent of (A) evidence satisfactory to the Escrow Agent that the Company and Liberty Reinsurance VT LLC have executed and delivered the Vermont Captive LOC satisfying the requirements of Section 7.1, and (B) written acknowledgment from the Nebraska Department of Insurance that such LOC has been filed with and is acceptable to the Nebraska Department of Insurance; or

    (iii) Expiration of the Tier 1 Escrow Period without Buyer having delivered a Notice of Claim (as defined in Section 9.6) with respect to a Captive Recapture Event.

(c) Captive Recapture Event. For purposes of this Agreement, "Captive Recapture Event" means the Nebraska Department of Insurance has (i) issued a written notice to the Company disallowing all or any portion of the reserve credit relating to the reinsurance transactions between the Company and Liberty Reinsurance VT LLC, or (ii) formally commenced proceedings to disallow such reserve credit.
```

Replicate this format for Sections 9.3 and 9.4.

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W2-002-escrow-provisions.md

**Success Criteria**:
- Three-tier escrow structure fully defined
- All release conditions specific and objective
- Dispute resolution mechanism included
- Escrow agent designation and duties specified

---

### TASK W2-003: Draft Indemnification Provisions

**Agent**: memo-remediation-writer

**Priority**: HIGH

**Estimated Time**: 15 minutes

**Issue ID**: CONTRACT-003

**Target**: Create APPENDIX C, Article X [Indemnification]

**Input Context**:
```
Source: Risk findings throughout Sections IV.A-IV.J requiring indemnification

Key Indemnification Areas:
1. General Indemnity: Seller indemnifies Buyer for breach of representations/warranties
2. Specific Indemnities:
   - Vermont captive recapture (if LOC not obtained or reserve credit disallowed)
   - Thompson litigation excess (if settlement >$40M or E&O coverage denied)
   - Market conduct fines (if exceed $1.1M)
   - FINRA conditional approval costs (if material operational restrictions imposed)

Indemnification Parameters:
- Basket: $5 million aggregate (no individual claim minimum)
- Cap: 20% of purchase price ($580 million based on $2.9B original price, or $552M based on $2.76B adjusted price)
- Survival Periods:
  - General representations/warranties: 24 months
  - Fundamental representations (organization, authority, capitalization): 60 months
  - Tax matters: Statute of limitations + 60 days
  - Environmental: 60 months
  - Captive reinsurance: 60 months (aligned with regulatory examination cycle)
```

**Action**:
Draft Article X [Indemnification] with comprehensive provisions. Include:
- Section 10.1: Indemnification by Seller
- Section 10.2: Indemnification by Buyer (reciprocal, limited)
- Section 10.3: Limitations on Indemnification (basket, cap)
- Section 10.4: Survival Periods
- Section 10.5: Claims Procedures
- Section 10.6: Third-Party Claims
- Section 10.7: Exclusive Remedy

**Template for Section 10.1**:
```
10.1 Indemnification by Seller. Subject to the limitations set forth in this Article X, from and after the Closing, Seller shall indemnify, defend, and hold harmless Buyer, the Company, and their respective Affiliates, officers, directors, employees, agents, successors, and assigns (collectively, the "Buyer Indemnified Parties") from and against any and all Losses arising out of or resulting from:

(a) any breach of any representation or warranty made by Seller in this Agreement or in any certificate delivered by Seller pursuant to this Agreement;

(b) any breach of any covenant or agreement of Seller contained in this Agreement;

(c) any Captive Recapture Event (as defined in Section 9.2(c)) occurring prior to the expiration of the Tier 1 Escrow Period, including without limitation any capital contribution required to restore the Company's Risk-Based Capital ratio to at least 200% of Company Action Level following disallowance of reserve credit by the Nebraska Department of Insurance;

(d) any Losses incurred by the Company in connection with the Thompson v. Liberty Life Insurance Company class action litigation (Case No. CI-23-5418, Nebraska District Court) to the extent such Losses exceed Forty Million Dollars ($40,000,000) net of insurance recoveries;

(e) any fines, penalties, corrective action costs, or other monetary sanctions imposed by the Nebraska Department of Insurance in connection with the market conduct examination conducted in 2024 to the extent such amounts exceed One Million One Hundred Thousand Dollars ($1,100,000) in the aggregate; and

(f) any material operational restrictions, activity limitations, or enhanced supervision requirements imposed by the Financial Industry Regulatory Authority (FINRA) in connection with approval of the Form CMA application relating to the change of control of Liberty Life Securities LLC, to the extent such restrictions result in quantifiable revenue reduction or compliance costs exceeding Five Hundred Thousand Dollars ($500,000) in the aggregate over a twelve-month period.
```

**Template for Section 10.3**:
```
10.3 Limitations on Indemnification.

(a) Basket. Seller shall not have any liability under Section 10.1(a) (indemnification for breach of representations and warranties) until the aggregate amount of Losses with respect to such matters exceeds Five Million Dollars ($5,000,000) (the "Basket"), and then only for the amount by which such Losses exceed the Basket; provided, however, that the Basket shall not apply to Losses arising out of or resulting from breaches of the Fundamental Representations or the Specific Indemnities set forth in Section 10.1(c) through (f).

(b) Cap. The aggregate liability of Seller under Section 10.1(a) (indemnification for breach of representations and warranties) shall not exceed Five Hundred Fifty-Two Million Dollars ($552,000,000) (the "Cap"), which amount represents twenty percent (20%) of the Adjusted Purchase Price; provided, however, that the Cap shall not apply to Losses arising out of or resulting from breaches of the Fundamental Representations or fraud or willful misconduct.

(c) Exclusive Remedy. Following the Closing, except in the case of fraud or willful misconduct, the indemnification provisions in this Article X shall be the exclusive remedy of the parties with respect to any breach of any representation, warranty, covenant, or agreement contained in this Agreement.
```

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W2-003-indemnification-provisions.md

**Success Criteria**:
- General and specific indemnities clearly defined
- Basket, cap, and survival periods specified
- Claims procedures detailed
- Exclusive remedy provision included

---

## WAVE 3: Structural Fixes (CREAC Headers)
- **Parallel**: NO (sequential editing required)
- **Gate**: WAVE 2 must complete
- **Estimated Duration**: 20 minutes

### TASK W3-001: Add CREAC Headers to Priority Sections

**Agent**: memo-remediation-writer

**Priority**: CRITICAL

**Estimated Time**: 10 minutes

**Issue ID**: CREAC-001, CREAC-002

**Target Sections**: IV.A, IV.B, IV.D, IV.H (highest-priority sections with deal-blocking risks)

**Input Context**:
```
Current State: Discussion sections contain excellent CREAC reasoning in prose form but lack explicit structural signposting

Required CREAC Subsection Headers:
- ### Conclusion
- ### Rule
- ### Explanation
- ### Application
- ### Counter-Analysis

Sections Requiring Headers:
- Section IV.A: State Insurance Regulation and Risk-Based Capital Compliance
  - Finding B.1: RBC below Company Action Level (188% vs. 200% threshold)
  - Finding B.2: Vermont captive recapture scenario (RBC crashes to 114%)

- Section IV.B: Captive Reinsurance and AG48 Compliance
  - Finding B.1: Material non-compliance with Vermont AG48 Primary Security requirements
  - Finding B.2: Parental guarantee exceeds guarantor net worth (2.6x ratio)

- Section IV.D: Pending and Threatened Litigation
  - Finding B.1: Thompson v. Liberty Life IUL class action ($85M-$125M compensatory)
  - Finding B.2: Nebraska punitive damages prohibition (positive finding)

- Section IV.H: Reinsurance Treaties and Counterparty Risk
  - Finding B.1: Global Re change-of-control consent requirement
  - Finding B.2: Global Re 2030 recapture option risk
```

**Action**:
Add explicit CREAC subsection headers to all major findings in sections IV.A, IV.B, IV.D, IV.H. **CRITICAL INSTRUCTION**: Do NOT rewrite substantive analysis. Reorganize existing prose under appropriate CREAC headers via cut-and-paste structural editing.

**Example Transformation (Section IV.B, Finding B.1)**:

**Before** (current prose structure):
```
#### B.1 Material Non-Compliance with Vermont AG48 Primary Security Requirements

[Long paragraph with conclusion statement]

Actuarial Guideline 48, adopted by the NAIC on December 16, 2014, establishes... [rule statement]

State insurance departments have applied AG48 benchmarks... [explanation with precedent]

Liberty Re VT's current collateral structure reveals... [application to transaction]

However, this grandfathering argument has significant weaknesses... [counter-analysis]
```

**After** (with CREAC headers):
```
#### B.1 Material Non-Compliance with Vermont AG48 Primary Security Requirements

### Conclusion

[Existing conclusion paragraph moved here, unchanged]

### Rule

Actuarial Guideline 48, adopted by the NAIC on December 16, 2014, establishes... [existing rule content, unchanged]

### Explanation

State insurance departments have applied AG48 benchmarks... [existing explanation content with precedent, unchanged]

### Application

Liberty Re VT's current collateral structure reveals... [existing application content, unchanged]

### Counter-Analysis

However, this grandfathering argument has significant weaknesses... [existing counter-analysis content, unchanged]
```

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W3-001-creac-headers-priority.md

**Success Criteria**:
- All major findings in sections IV.A, IV.B, IV.D, IV.H have explicit CREAC subsection headers
- Prose content unchanged (only reorganized)
- Counter-analysis explicitly labeled with ### Counter-Analysis header
- No new analysis introduced

---

### TASK W3-002: Add CREAC Headers to Remaining Sections

**Agent**: memo-remediation-writer

**Priority**: HIGH

**Estimated Time**: 10 minutes

**Issue ID**: CREAC-001, CREAC-002

**Target Sections**: IV.C, IV.E, IV.F, IV.G, IV.I, IV.J

**Action**:
Replicate TASK W3-001 approach for remaining Discussion sections. Add explicit CREAC subsection headers to all major findings. Reorganize existing prose via cut-and-paste (no rewriting).

**Target Sections**:
- Section IV.C: Securities Regulation and Variable Products Compliance
- Section IV.E: Market Conduct Compliance and Regulatory Examinations
- Section IV.F: Financial Risk, Capital Structure, and Purchase Price Adjustments
- Section IV.G: Tax Structure, Optimization, and Surplus Notes
- Section IV.I: Employment, Labor, and Agent Retention
- Section IV.J: Insurance Coverage and Errors & Omissions Recovery

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W3-002-creac-headers-remaining.md

**Success Criteria**:
- All major findings in sections IV.C-IV.J have explicit CREAC subsection headers
- Prose content unchanged (only reorganized)
- Consistent CREAC structure across all 10 Discussion sections

---

## WAVE 4: Language/Format Fixes
- **Parallel**: NO (sequential editing required)
- **Gate**: WAVE 3 must complete
- **Estimated Duration**: 25 minutes

### TASK W4-001: Rewrite Questions Presented in Under/Does/When Format

**Agent**: research-plan-refiner

**Priority**: CRITICAL

**Estimated Time**: 20 minutes

**Issue ID**: QP-001, QP-002

**Target**: Section II (Questions Presented), all 12 questions

**Input Context**:
```
Current State: 12 questions present with excellent substantive content but do not follow Under/Does/When format

Required Format Template:
"Under [statute/regulation/contract provision], does [party/action/condition], and when [consequence/condition/timing]?"

Questions must be:
- Answerable Yes/No/Probably Yes/Probably No
- Neutral (no embedded conclusions)
- Specific (incorporate transaction facts and legal authorities)
- Mapped to Discussion sections (existing mapping preserved)
```

**Action**:
Rewrite all 12 Questions Presented in strict Under/Does/When format. Preserve substantive content and legal issues; change only format and structure.

**Example Transformation**:

**Current Question 1**:
```
**1. RBC Capital Adequacy and Vermont Captive Risk**

[Long embedded analysis question without Under/Does/When structure]
```

**Required Question 1**:
```
**1.** Under Nebraska Revised Statutes sections 44-6011 through 44-6014 establishing Risk-Based Capital thresholds for life insurance companies, does Liberty Life Insurance Company's current RBC ratio of 188% (below the 200% Company Action Level threshold) require a $150 million surplus notes capital injection to remediate capital deficiency and avoid mandatory RBC Plan filing, and when would Nebraska Department of Insurance disallowance of the $850 million Vermont captive reserve credit crash LLIC's RBC ratio to 114% (Regulatory Action Level), requiring $730 million to $1 billion in additional capital beyond the planned $150 million injection?
```

**Detailed Rewrite Instructions for Each Question**:

**Question 2 (Holding Company Capital Constraint)**:
```
Under general principles of corporate veil and guarantor liability, does Liberty Life Holdings LLC's net worth of only $280 million versus total transaction-related commitments of $880 million ($150M capital injection + $730M Vermont captive parental guarantee) create a structural funding failure risk with 40-50% probability, and when would such failure trigger transaction termination, delay, or force American Financial Holdings to fund shortfalls without negotiated terms, jeopardizing the Q3 2025 closing timeline?
```

**Question 3 (Global Re Change-of-Control Consent)**:
```
Under the Global Re (Bermuda) coinsurance treaty change-of-control consent provision covering $8.5 billion in term life face amount (90% quota share), does the proposed acquisition by American Financial Holdings require Global Re's prior written consent, and when would consent denial or materially adverse consent conditions trigger recapture requiring $255 million additional capital contribution plus $245 million exposure from the treaty's 2030 recapture option (exercisable with 12 months' notice)?
```

**Question 4 (Thompson Class Action Settlement)**:
```
Under Nebraska law governing class action settlements and the "range of reasonableness" standard established in Van Horn v. Trickey (8th Cir.), does the Thompson v. Liberty Life Insurance Company IUL class action (850 policyholders alleging 8.5% vs. 4.2% actual crediting rate misrepresentation) present 70% probability of settlement in the $32-40 million range, and when would settlement approval or trial schedule impact the Q3 2025 closing timeline given the requirement for court final approval and E&O insurance coverage confirmation?
```

**Question 5 (E&O Insurance Coverage)**:
```
Under the Chubb professional liability insurance policy providing $50 million aggregate coverage ($5M self-insured retention + $45M excess layer), does the Thompson class action settlement ($40 million target) qualify for full coverage absent fraud exclusion invocation, and when would proper settlement allocation strategy (95% "covered claims" vs. 5% "uncovered claims") maximize E&O recovery to achieve net LLIC cost of $6-7 million (after $35 million E&O payment minus $5M SIR)?
```

**Question 6 (Agent and Producer Retention Economics)**:
```
Under insurance M&A industry retention precedent (2015-2024 transaction data), does the absence of retention programs create 25% captive agent attrition risk (163 of 650 agents) causing $220 million annual sales loss and 40% independent producer premium allocation decline causing $195 million annual loss, and when would a $46 million combined retention program (captive: $22M, independent: $24M) generate 7.6-8.7x ROI over 5 years by reducing attrition to 12% and producer decline to 25%, thereby preserving $746 million in distribution platform value?
```

**Question 7 (Market Conduct Examination Fines)**:
```
Under Nebraska Department of Insurance market conduct examination authority (Nebraska Revised Statutes § 44-150) and historical fine precedent ($5,000-$10,000 per violation), does the 2024 examination identifying 20 violations (5 sales illustrations, 12 replacement forms, 3 claim delays) create 85-95% probability of fines and corrective actions totaling $1.0-$1.1 million, and when would execution of a consent order (target: $850K-$950K) as a mandatory closing condition provide certainty and avoid post-closing regulatory dispute?
```

**Question 8 (FINRA Form CMA Conditional Approval Risk)**:
```
Under FINRA Rule 1017 governing continuing membership applications for change of ownership or control of broker-dealer member firms, does American Financial Holdings' acquisition of Liberty Life Securities LLC trigger Form CMA filing with 30-90 day FINRA review period, and when would Liberty Life Securities' October 2023 suitability violation history ($75K fine, 3 agent suspensions) create 30-40% probability of conditional approval requiring enhanced supervision, restricted activities, or operational restructuring with estimated costs of $250K-$1M annually?
```

**Question 9 (Tax Optimization: Surplus Notes vs. Subordinated Debt)**:
```
Under Internal Revenue Code § 163(a) governing interest deduction and NAIC Model Act § 6 governing statutory capital treatment of surplus notes, does a $150 million surplus notes injection provide superior tax and regulatory benefits compared to subordinated debt or common equity, generating $94.5 million NPV benefit (10-year) from interest deductibility while receiving 100% Total Adjusted Capital (TAC) credit for RBC calculation, and when would subordinated debt's hybrid debt-equity classification create C1 asset risk charges offsetting regulatory capital benefits?
```

**Question 10 (IRC § 1504(c)(2) Consolidated Tax Return Wait)**:
```
Under Internal Revenue Code § 1504(c)(2) and Treasury Regulation § 1.1502-75 governing consolidated tax return affiliation requirements, does LLIC's current ownership by Liberty Life Holdings LLC (if affiliated with Liberty Mutual or other insurance group for 5+ years) trigger a mandatory 5-year wait period before American Financial Holdings can include LLIC in a consolidated tax return, thereby delaying $10.25 million in tax loss sharing benefits, and when would due diligence verification of LLIC's affiliation history determine whether the wait period applies or whether LLIC qualifies for immediate consolidation?
```

**Question 11 (Reinsurance Treaty Consent Requirements)**:
```
Under the Swiss Re modified coinsurance treaty (50% quota share on $3.2 billion IUL face amount) and Munich Re YRT treaty (group life excess of retention) change-of-control consent provisions, does the proposed acquisition require prior written consent from all three major reinsurers (Global Re, Swiss Re, Munich Re), and when would consent denial or materially adverse modifications justify conditioning the purchase agreement closing on obtaining all reinsurer consents with no materially adverse changes?
```

**Question 12 (Purchase Price Adjustment Methodology)**:
```
Under M&A valuation principles for probability-weighted risk adjustment, does the aggregate $280.7 million probability-weighted exposure identified across regulatory capital ($322.1M), captive/reinsurance ($117.6M), litigation ($49.75M), and other risks justify a $140 million purchase price reduction (from $2.9B to $2.76B, representing 4.8% adjustment), and when would application of tiered risk premium methodology (Tier 1: high-probability exposures 1.0x, Tier 2: medium-probability exposures 1.5x risk premium) yield fair allocation of identified risks between Seller and Buyer?
```

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W4-001-questions-presented-rewrite.md

**Success Criteria**:
- All 12 questions use Under/Does/When format
- Questions answerable Yes/No/Probably Yes/Probably No
- Questions neutral (no embedded conclusions)
- Substantive legal issues preserved from original questions
- Brief Answers section (Section III) still accurately responds to reformatted questions

---

### TASK W4-002: Neutralize Advocacy Language

**Agent**: memo-remediation-writer

**Priority**: LOW

**Estimated Time**: 5 minutes

**Issue ID**: OBJ-001

**Target**: 7 instances of advocacy language throughout memorandum

**Input Context**:
```
Advocacy Language Detected (via grep):
- "clearly" (instances requiring neutralization)
- Possibly "obviously" or similar terms (manual verification needed)
```

**Action**:
Locate and neutralize all advocacy language by replacing with evidence-based formulations:
- "clearly" → "the evidence demonstrates" or "the record shows"
- "obviously" → "as the analysis demonstrates"
- "undoubtedly" → "with high confidence based on [specific evidence]"

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/remediation-outputs/W4-002-advocacy-neutralization.md

**Success Criteria**:
- Zero instances of advocacy language remaining
- All conclusions evidence-based
- Objective tone maintained

---

## WAVE 5: Citation Cleanup
- **Parallel**: N/A
- **Gate**: WAVE 4 must complete
- **Status**: SKIP (citation quality already excellent; 1,034 verification tags, 1,015 footnotes)

**Deferred Tasks**:
- ISSUE-CIT-001: Pincite compliance verification (LOW priority, defer to TIER 1 polish if needed)

---

## WAVE 6: Final Assembly
- **Parallel**: NO (sequential)
- **Gate**: WAVES 2, 3, 4 must complete
- **Estimated Duration**: 15 minutes

### TASK W6-001: Integrate All Remediation Outputs

**Agent**: memo-final-synthesis

**Priority**: CRITICAL

**Estimated Time**: 5 minutes

**Action**:
Integrate all Wave 2-4 outputs into final-memorandum-v2.md:
1. Insert APPENDIX C (Draft Contract Language) after Section VI (Consolidated Footnotes)
   - Article VII: Closing Conditions (from W2-001)
   - Article IX: Escrow (from W2-002)
   - Article X: Indemnification (from W2-003)

2. Apply CREAC header reorganization (from W3-001 and W3-002) to Discussion sections IV.A-IV.J

3. Replace Section II (Questions Presented) with reformatted questions (from W4-001)

4. Apply advocacy language neutralization edits (from W4-002)

**Output File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/final-memorandum-v2.md

**Success Criteria**:
- All remediation changes integrated without merge conflicts
- File renders correctly in markdown
- No formatting artifacts introduced

---

### TASK W6-002: Add Document Footer

**Agent**: memo-final-synthesis

**Priority**: LOW

**Estimated Time**: 2 minutes

**Issue ID**: COMP-001

**Action**:
Add formal document footer after APPENDIX C:

```
---

**END OF MEMORANDUM**

---

**Document Control:**
- Version: 2.0 (Post-Remediation)
- Date: January 22, 2026
- Total Word Count: [calculated]
- Total Pages: [calculated]
- Remediation Cycle: 1
```

**Output**: Integrated into final-memorandum-v2.md

**Success Criteria**:
- Document footer present with proper formatting
- Version control information included

---

### TASK W6-003: Verify Table of Contents Accuracy

**Agent**: memo-final-synthesis

**Priority**: LOW

**Estimated Time**: 5 minutes

**Issue ID**: FORMAT-001

**Action**:
Manually verify all Table of Contents page numbers match actual section locations. Update if discrepancies found due to section reorganization.

**Validation Steps**:
1. Check Section I (Executive Summary) page number
2. Check Section II (Questions Presented) page number
3. Check all Section IV.A-IV.J page numbers
4. Check Section V (Cross-Reference Matrix) page number
5. Check Section VI (Consolidated Footnotes) page number
6. Add new entry: APPENDIX C (Draft Contract Language) with page number

**Output**: Updated Table of Contents in final-memorandum-v2.md

**Success Criteria**:
- All TOC page numbers accurate within ±1 page
- New APPENDIX C entry added to TOC

---

### TASK W6-004: Add Cross-References for New Contract Provisions (Optional LOW Priority)

**Agent**: memo-remediation-writer

**Priority**: LOW

**Estimated Time**: 3 minutes

**Issue ID**: XREF-001 (partial remediation)

**Action**:
Add specific paragraph ranges to any cross-references lacking them (estimated 21 instances). Use format "See Section IV.X at ¶¶YY-ZZ".

**Output**: Integrated into final-memorandum-v2.md

**Success Criteria**:
- All cross-references include specific paragraph numbers
- Format consistent throughout

---

## POST-REMEDIATION VALIDATION

After WAVE 6 completion, memo-final-synthesis will perform validation checks:

### Validation Checklist

1. **File Integrity**:
   - [ ] final-memorandum-v2.md renders without errors
   - [ ] All sections present (I-VI + APPENDIX C)
   - [ ] No formatting artifacts

2. **Substantive Preservation**:
   - [ ] Spot-check Section IV.B prose unchanged (only reorganized under CREAC headers)
   - [ ] Verify Brief Answers accurately respond to reformatted Questions Presented
   - [ ] Confirm all quantitative findings unchanged (dollar amounts, probabilities)

3. **Structural Compliance**:
   - [ ] All 12 Questions Presented use Under/Does/When format
   - [ ] All Discussion sections (IV.A-IV.J) have CREAC subsection headers
   - [ ] APPENDIX C contains draft provisions for all 10 HIGH/CRITICAL findings

4. **Completeness**:
   - [ ] Document footer present
   - [ ] Table of Contents updated
   - [ ] Cross-references valid

**Output**: validation-report.md documenting all checks

---

## RETURN TO ORCHESTRATOR

Upon completion of all waves and validation, memo-final-synthesis returns:

**Status**: REMEDIATION_COMPLETE

**Files**:
- final-memorandum-v2.md (remediated version)
- validation-report.md (quality checks performed)
- All remediation-outputs/ files (W2-001 through W6-004)

**Metrics**:
- Remediation time: [actual minutes]
- Issues resolved: 13 of 13 in scope
- Substantive analysis preserved: Yes
- Ready for QA Diagnostic Pass 2: Yes

**Next Step**: Orchestrator invokes memo-qa-diagnostic for Pass 2 assessment

**Expected Pass 2 Score**: 92.7-94.2% (certification threshold: 93%)

---

**END OF REMEDIATION DISPATCH**
