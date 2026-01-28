# REMEDIATION DISPATCH

**Diagnostic ID**: qa-diagnostic-2026-01-12-project-neptune
**Diagnostic Score**: 89.25%
**Remediation Tier**: TIER_2_STANDARD
**Total Issues Found**: 22
**Issues In Scope**: 18 (CRITICAL + HIGH + MEDIUM)
**Issues Deferred**: 4 (LOW severity)
**Estimated Duration**: 35-45 minutes
**Max Cycles**: 2
**Current Cycle**: 1

---

## WAVE 1: Additional Research
- **Parallel**: N/A
- **Gate**: none
- **Status**: SKIP (no research required; all issues are structural/formatting)

**Assessment**: All 18 in-scope issues involve CREAC restructuring, question reformatting, cross-reference resolution, and citation enhancement. No additional legal research required. Proceed directly to Wave 2.

---

## WAVE 2: Content Additions
- **Parallel**: YES (tasks operate on independent sections)
- **Gate**: none (Wave 1 skipped)
- **Estimated Duration**: 15-20 minutes

| Task ID | Agent | Priority | Est. Minutes | Target Section | Description | Output Method | Success Criteria |
|---------|-------|----------|--------------|----------------|-------------|---------------|------------------|
| W2-001 | memo-remediation-writer | CRITICAL | 8 | Section II (Questions Presented, lines 377-398) | Rewrite all 10 questions from generic statute-question format to Under/Does/When format incorporating transaction-specific facts | Edit tool (direct modification) | All 10 questions follow format: "Under [statute/regulation], does [PMSC-specific fact] create [risk] when [transaction circumstance]?" |
| W2-002 | memo-remediation-writer | CRITICAL | 12 | Sections A-J (after Application subsections) | Extract 54 embedded counter-arguments (identified via grep: "counter-argument\|opposing view\|Seller may contend") and create formal "Counter-Analysis" subsections for all 10 sections | Edit tool (direct modification) | All 10 sections contain new subsection "### [Letter]. Counter-Analysis" with minimum 2 counter-arguments + rebuttals each |

---

### TASK W2-001: Questions Presented Reformat

**Agent**: memo-remediation-writer
**Priority**: CRITICAL
**Estimated Time**: 8 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Location**: Section II. QUESTIONS PRESENTED (lines 377-398)

**Specific Instructions**:

You are reformatting 10 Questions Presented to comply with Under/Does/When format incorporating transaction-specific facts. Current questions use generic "Under [statute], does [issue] create [exposure]?" format. Required format: "Under [statute/regulation], does [PMSC-specific fact] create [risk] when [transaction-specific circumstance]?"

**Current Questions** (lines 379-397):
1. Under the Shipping Act of 1984, as amended by the Ocean Shipping Reform Act of 2022 (46 U.S.C. §§ 40101-41109), do pending Federal Maritime Commission detention and demurrage complaints against PMSC create material liability?
2. Under the Jones Act (46 U.S.C. §§ 688-688o) and applicable manning regulations, are PMSC's vessels in compliance with U.S. citizen crew citizenship requirements, and if not, what is the cost and timeline for correction?
3. Under the Maritime Transportation Security Act (46 U.S.C. § 70001 et seq.), is the Seattle Terminal in violation of Transportation Worker Identification Credential (TWIC) reader requirements, and what is the regulatory deadline and exposure?
4. Under existing ship mortgage agreements with Bank of America, Citibank, HSBC, and DVB Bank, will lenders consent to a private equity change of control transaction, and if not, what refinancing obligations arise?
5. Under the International Longshoremen's and Warehousemen's Union (ILWU) Collective Bargaining Agreement expiring July 1, 2027, what is the strike probability and revenue impact during the 2027 contract renewal period?
6. Under the Clean Air Act (42 U.S.C. §§ 7401-7671q) and state environmental laws, what is the probability and magnitude of settlement in the Sierra Club climate litigation pending against PMSC's operations?
7. Under the port terminal lease agreements at Oakland, Los Angeles, Seattle, and Tacoma, do change-of-control provisions require landlord consent for a stock purchase acquisition, and what is the timeline for obtaining such consent?
8. Under the International Maritime Organization (IMO) Carbon Intensity Indicator (CII) regulations, which PMSC vessels are rated D or lower, and what is the cost-benefit analysis of compliance alternatives?
9. Under vessel sharing agreements with major alliance partners, what is the probability that alliance partners will exercise termination rights upon a private equity acquisition, and what is the revenue impact?
10. Under the Longshore and Harbor Workers' Compensation Act (LHWCA), Section 905(b) (33 U.S.C. § 905(b)), does the pending Martinez litigation create precedent for conversion of LHWCA claims to Jones Act tort suits, and what is the fleet-wide exposure?

**Required Transformation Examples**:

Question 1 REWRITE:
"Under the Ocean Shipping Reform Act's enhanced detention and demurrage enforcement authority (46 U.S.C. § 41305(a)), does PMSC face material liability when 12 shipper complaints allege unreasonable charges totaling $1.0M-$2.2M in aggregate exposure, 8 of 12 complaints have already settled favorably, and when the Hapag-Lloyd $2M industry precedent suggests settlement within manageable ranges?"

Question 5 REWRITE:
"Under the ILWU Pacific Coast Longshore Contract Document expiring July 1, 2027, does PMSC face material strike risk when historical precedent (2002 lockout, 2014-15 slowdowns) establishes 35% strike probability, 90-day work stoppage would generate $474M revenue loss, and when acquisition closes 18 months before CBA expiration during negotiation period?"

Question 10 REWRITE:
"Under LHWCA Section 905(b) (33 U.S.C. § 905(b)), does the pending Martinez v. Pacific Maritime Services litigation in San Francisco Superior Court create precedent risk when plaintiff seeks $2M-$5M in tort damages (70% win probability), PMSC operates 22-vessel fleet generating 14-29 incidents annually, and when conversion from LHWCA workers' compensation to Jones Act tort suits would expose PMSC to $28.5M-$57M annual liability?"

**Transformation Checklist for Each Question**:
- [ ] Incorporates specific statute/regulation (not just general statutory chapter)
- [ ] Names PMSC specifically (not generic "target company")
- [ ] Includes quantified exposure from diagnostic assessment
- [ ] References transaction-specific facts (12 complaints, 22 vessels, July 1 2027 expiration, etc.)
- [ ] Incorporates deal timing/context (acquisition close date, regulatory deadlines)
- [ ] Follows Under/Does/When grammatical structure

**Success Criteria**:
- All 10 questions reformatted with transaction-specific facts
- Each question cites specific statute (not just chapter reference)
- Each question incorporates minimum 3 PMSC-specific facts (exposure amounts, vessel counts, deadlines, etc.)
- Questions remain answerable as Yes/No/Probably Yes/Probably No
- Length: 40-60 words per question (brief enough for Questions Presented section, detailed enough to incorporate facts)

**Output Method**: Use Edit tool to directly modify lines 379-397 in final-memorandum.md

---

### TASK W2-002: Counter-Analysis Subsection Creation

**Agent**: memo-remediation-writer
**Priority**: CRITICAL
**Estimated Time**: 12 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Sections A-J (insert after "Application to Transaction" subsections, before "Risk Assessment" subsections)

**Specific Instructions**:

You are extracting 54 embedded counter-arguments from Application subsections and creating formal "Counter-Analysis" subsections for all 10 sections (A-J). Diagnostic assessment identified counter-arguments embedded in Application text using phrases like "Counter-argument:", "Seller may contend", "opposing view", "alternative interpretation", "contrary authority".

**Counter-Arguments Detected** (via grep analysis):
- Section A (FMC): "Counter-argument: Seller may contend 8 of 12 settled complaints evidence FMC immateriality"
- Section B (Jones Act): Counter-arguments regarding COSCO contract cancellation necessity
- Section E (ILWU): Counter-arguments regarding strike probability methodologies
- Section F (Environmental): Alternative interpretations of preemption defense scope
- Section I (Section 905(b)): Counter-arguments regarding Martinez litigation precedential value
- Section J (VSA): Opposing views on alliance partner termination probability

**Required Structure for Counter-Analysis Subsection**:

```markdown
### [Letter]. Counter-Analysis

**Counter-Argument 1: [Seller's Position or Alternative Interpretation]**

[State the counter-argument clearly, presenting strongest version of opposing view. Include supporting authority if available.]

**Rebuttal:**

[Explain why primary conclusion stands despite counter-argument. Cite to authority, precedent, or factual distinctions that undermine counter-argument. Demonstrate that counter-argument does not change overall risk assessment.]

**Counter-Argument 2: [Alternative Legal Theory or Factual Interpretation]**

[State second counter-argument.]

**Rebuttal:**

[Respond to second counter-argument with analysis demonstrating why it is less persuasive than primary analysis.]

[Repeat for additional counter-arguments if present in Application subsection]
```

**Example Counter-Analysis Subsection** (Section A - FMC):

```markdown
### A. Counter-Analysis

**Counter-Argument 1: Favorable Settlement Record Suggests Immaterial Exposure**

Seller may contend that PMSC's successful resolution of 8 of 12 pending FMC complaints, with aggregate settlements reportedly below $500,000, demonstrates that the remaining 4 complaints present immaterial exposure well below the $1.0M-$2.2M range estimated in this analysis. Seller could argue that the pattern of favorable settlements suggests FMC complaints are routine commercial disputes that settle for nominal amounts without creating material liability for a $4.8B acquisition.

**Rebuttal:**

While the 8 favorable settlements support moderate settlement probability (85%), they do not establish that remaining 4 complaints are immaterial. The diagnostic assessment accounts for the favorable settlement pattern in estimating 85% settlement probability and applying typical FMC settlement discounts (40-60% below statutory maximums). However, the 4 remaining complaints involve the largest shippers in PMSC's customer base (Walmart, Target identified in FMC docket), suggesting these complaints may involve higher-value disputed charges than the 8 resolved matters. Additionally, OSRA 2022's burden-shifting provisions (46 U.S.C. § 41305(a) as amended) create elevated risk for remaining complaints filed post-2022, as carriers must affirmatively prove reasonableness rather than shippers proving unreasonableness. The Hapag-Lloyd $2M precedent (June 2022) demonstrates FMC willingness to impose material penalties for systemic violations, supporting the $1.0M-$2.2M exposure range as reasonable.

**Counter-Argument 2: Service Contract Revenue Loss Overstated Due to Tight Trans-Pacific Capacity**

Seller may argue that the estimated $50M-$100M annual revenue loss from service contract terminations (Finding 2) overstates risk because current tight capacity in trans-Pacific trade lanes limits shipper alternatives. If shippers cannot readily secure alternative carrier capacity, they may be compelled to consent to contract assignment regardless of private equity ownership concerns, reducing actual termination probability below the 30-50% estimated in the analysis.

**Rebuttal:**

The capacity constraint argument has merit but does not eliminate revenue risk. The diagnostic assessment already incorporates capacity dynamics in adjusting initial revenue-at-risk estimates downward from $120M-$300M to $50M-$100M, specifically noting "tight capacity in trans-Pacific trade lanes limiting shipper alternatives" as a mitigating factor. However, capacity constraints are cyclical; if acquisition closes in March-April 2026 and contract renegotiations extend through Q3-Q4 2026, capacity could loosen if economic slowdown materializes (as predicted by several maritime economists for late 2026). Additionally, largest shippers (representing disproportionate revenue) often have long-term relationships with multiple carriers and can leverage alternative capacity even in tight markets. The $50M-$100M estimate reflects a conservative, capacity-adjusted projection rather than worst-case scenario.
```

**Sections Requiring Counter-Analysis Subsections**:
1. Section A (FMC) - Insert between "Application to Transaction" and "Risk Assessment"
2. Section B (Jones Act) - Insert between "Application to Transaction" and "Risk Assessment"
3. Section C (Coast Guard/BWMS) - Insert between "Application to Transaction" and "Risk Assessment"
4. Section D (MTSA) - Insert between "Application to Transaction" and "Risk Assessment"
5. Section E (ILWU) - Insert between "Application to Transaction" and "Risk Assessment"
6. Section F (Environmental/IMO) - Insert between "Application to Transaction" and "Risk Assessment"
7. Section G (Port Leases) - Insert between "Application to Transaction" and "Risk Assessment"
8. Section H (Maritime Liens) - Insert between "Application to Transaction" and "Risk Assessment"
9. Section I (Section 905(b)) - Insert between "Application to Transaction" and "Risk Assessment"
10. Section J (VSA) - Insert between "Application to Transaction" and "Risk Assessment"

**Extraction Method**:
1. Read each section's "Application to Transaction" subsection
2. Identify embedded counter-arguments (look for phrases: "Counter-argument", "Seller may contend", "alternative interpretation", "opposing view", "contrary authority", "however", "but")
3. Extract counter-argument text
4. Formulate rebuttal explaining why primary conclusion stands
5. Insert new subsection after Application, before Risk Assessment

**Success Criteria**:
- All 10 sections contain new "Counter-Analysis" subsection
- Each subsection contains minimum 2 counter-arguments with rebuttals
- Counter-arguments present strongest version of opposing view (not straw man arguments)
- Rebuttals cite to authority, precedent, or factual distinctions
- Counter-arguments extracted from Application subsection are removed from original location (to avoid duplication)
- Total counter-arguments across all sections: minimum 20 (average 2 per section)

**Output Method**: Use Edit tool to insert new subsections in final-memorandum.md after each section's "Application to Transaction" subsection

---

## WAVE 3: Structural Fixes
- **Parallel**: YES (tasks operate on different structural elements)
- **Gate**: WAVE 2 must complete
- **Estimated Duration**: 8-12 minutes

| Task ID | Agent | Priority | Est. Minutes | Target Section | Description | Output Method | Success Criteria |
|---------|-------|----------|--------------|----------------|-------------|---------------|------------------|
| W3-001 | memo-remediation-writer | HIGH | 6 | Sections A-J (Application subsections) | Add formal "**Conclusion:**" lead paragraphs to all Application subsections stating finding upfront per CREAC methodology | Edit tool (direct modification) | All 10 Application subsections begin with bold "**Conclusion:**" statement + finding + rationale (3-4 sentences) |
| W3-002 | memo-remediation-writer | HIGH | 4 | Sections D, J (lines 3340, 3342, 8452, 8467, 8475) | Resolve 4 [TBD] cross-reference placeholders by identifying correct subsection references | Edit tool (direct modification) | Zero [TBD] placeholders remain; all cross-references cite to specific subsections (e.g., "Section III.G.3") |
| W3-003 | memo-remediation-writer | MEDIUM | 2 | Section I (line 7270) | Remove "## SECTION WRITING PROGRESS CHECKLIST" header (internal drafting artifact) | Edit tool (direct modification) | Header deleted; surrounding text intact |

---

### TASK W3-001: Add CREAC Conclusion Leads

**Agent**: memo-remediation-writer
**Priority**: HIGH
**Estimated Time**: 6 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Sections A-J, "Application to Transaction" subsections (first paragraph)

**Specific Instructions**:

You are adding formal "**Conclusion:**" lead paragraphs to all 10 Application subsections. Current subsections begin directly with factual application. CREAC methodology requires stating conclusion FIRST before presenting application analysis.

**Required Format**:
```markdown
**Conclusion**: [Definitive answer: Probably No / Probably Yes / Yes / No]. [One-sentence summary of basis]. [Quantified exposure]. [Key supporting authority or precedent].
```

**Example Conclusion Lead** (Section A - FMC):

CURRENT (line 513):
```
**Application:** Here, PMSC faces **12 pending shipper complaints** filed with the FMC alleging unreasonable detention and demurrage practices. [PENDING VERIFICATION - actual FMC docket numbers required from data room]. The complaints appear to involve invoicing practices during 2023-2024, predating the May 28, 2024 effective date of **46 CFR Part 541**.
```

REVISED:
```
**Conclusion**: Probably No. PMSC's 12 pending FMC detention and demurrage complaints likely settle within $1.0M-$2.2M range (85% probability), well below materiality threshold for $4.8B transaction. Settlement probability is supported by favorable resolution of 8 of 12 complaints and Hapag-Lloyd $2M industry precedent establishing FMC penalty benchmarks for systemic violations under OSRA 2022. Expected value exposure of $1.5M represents 0.031% of transaction value.

**Application:** Here, PMSC faces **12 pending shipper complaints** filed with the FMC alleging unreasonable detention and demurrage practices. [PENDING VERIFICATION - actual FMC docket numbers required from data room]. The complaints appear to involve invoicing practices during 2023-2024, predating the May 28, 2024 effective date of **46 CFR Part 541**.
```

**Conclusion Leads to Add** (use Brief Answers table as guide for findings):

**Section A (FMC)**: "Probably No. PMSC's 12 pending FMC detention and demurrage complaints likely settle within $1.0M-$2.2M range..."

**Section B (Jones Act)**: "Probably No. PMSC's 2 vessels (Pacific Guardian, Pacific Shield) operate at 72.5-72.7% U.S. citizen crew vs. 75% requirement; correctable within 90 days for $310K annually..."

**Section C (Coast Guard/BWMS)**: "Yes. M/V Pacific Titan's conditional Certificate of Inspection and fleet-wide BWMS aging create $26.8M aggregate exposure..."

**Section D (MTSA)**: "No. Seattle Terminal TWIC reader non-compliance does not constitute current violation; May 8, 2026 deadline (116 days remain) provides adequate installation time..."

**Section E (ILWU)**: "Yes. ILWU CBA expiring July 1, 2027 creates 35% strike probability with $474M 90-day revenue loss..."

**Section F (Environmental/IMO)**: "Yes. Sierra Club CAA litigation creates 65% settlement probability at $226M-$306M (5-year phased capital)..."

**Section G (Port Leases)**: "Yes. 100% stock sale constitutes deemed assignment at all 4 terminals; 70-80% landlord approval probability but 60-120 day timeline creates closing delay..."

**Section H (Maritime Liens)**: "Probably Yes. 60% probability all lenders approve with covenant amendments; 15% probability full refinance required..."

**Section I (Section 905(b))**: "Yes. Martinez litigation creates 70% plaintiff win probability at $2M-$5M verdict; fleet-wide exposure $28.5M-$57M annually..."

**Section J (VSA)**: "Probably Yes. 30-35% alliance partner termination probability if GLP portfolio non-competitive; increases to 75% if portfolio includes Trans-Pacific competitors..."

**Success Criteria**:
- All 10 Application subsections begin with "**Conclusion:**" in bold
- Each conclusion includes: (1) definitive answer, (2) exposure range, (3) probability assessment, (4) key supporting fact
- Conclusions match findings in Brief Answers table (lines 84-95)
- Length: 3-5 sentences per conclusion (75-125 words)

**Output Method**: Use Edit tool to insert conclusion paragraphs at beginning of each Application subsection

---

### TASK W3-002: Resolve [TBD] Cross-Reference Placeholders

**Agent**: memo-remediation-writer
**Priority**: HIGH
**Estimated Time**: 4 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Lines 3340, 3342, 8452, 8467, 8475

**Specific Instructions**:

You are resolving 4 [TBD] cross-reference placeholders by identifying correct subsection references in target sections. Placeholders indicate intended cross-references where paragraph numbers were not determined during document assembly.

**Placeholders to Resolve**:

1. **Line 3340**: "IV.G (Port Lease Negotiations) at ¶[TBD]"
   - Context: MTSA section discussing Seattle Terminal lease compliance covenants
   - Target: Section G (Port Terminal Leases) subsection discussing Seattle Terminal
   - Resolution: Read Section G, identify Seattle Terminal discussion, cite to subsection
   - Example: "Section III.G.2 (Seattle Terminal Lease Analysis)" or "Section III.G at ¶2.3"

2. **Line 3342**: "IV.J (Insurance Coverage) at ¶[TBD]"
   - Context: MTSA civil penalty indemnification and P&I policy coverage
   - Target: Section I (Section 905(b) discusses MEL insurance) or verify if insurance subsection exists
   - Note: Document uses Section I for 905(b), not "J"; may be reference error
   - Resolution: Search for insurance coverage discussion (likely in Section 905(b) recommendations or risk assessment)
   - Example: "Section III.I.3 (MEL Insurance Verification)" or note if insurance discussion not present

3. **Line 8452**: "Section IV.H (Maritime Liens & Ship Mortgages) at ¶[TBD]"
   - Context: VSA section discussing ship mortgage debt/EBITDA covenant impact
   - Target: Section H subsection discussing debt covenants and leverage ratios
   - Resolution: Read Section H, identify debt covenant discussion ($2.8B ship mortgage, 4.5× debt/EBITDA covenant)
   - Example: "Section III.H.2 (Debt Covenant Compliance)" or "Section III.H at ¶2.1"

4. **Line 8467**: "Section IV.G (Port Lease Negotiations) at ¶[TBD]"
   - Context: VSA section discussing Oakland Terminal economics
   - Target: Section G subsection discussing Oakland Terminal rent ($28M current vs. $42M demand)
   - Resolution: Read Section G, identify Oakland Terminal analysis
   - Example: "Section III.G.3 (Oakland Terminal Economics)" or "Section III.G at ¶3.2"

5. **Line 8475**: "Section IV.E (ILWU Labor Relations) at ¶[TBD]"
   - Context: VSA section discussing ILWU CBA expiration and strike risk
   - Target: Section E subsection discussing July 1, 2027 CBA expiration
   - Resolution: Read Section E, identify CBA expiration timeline discussion
   - Example: "Section III.E.2 (CBA Expiration Timeline)" or "Section III.E at ¶2.4"

**Resolution Method**:
1. For each [TBD] placeholder, note the context (what fact is being cross-referenced)
2. Navigate to target section (G, H, I, or E)
3. Scan section for relevant subsection (look for subsection headers or key terms: "Oakland Terminal", "debt covenant", "CBA expiration", "insurance coverage")
4. Determine subsection identifier:
   - If subsection has clear header (e.g., "### G.3 Oakland Terminal Analysis"), use that reference
   - If no clear subsection, cite to section generally (e.g., "Section III.G (Oakland Terminal analysis)")
5. Replace [TBD] with subsection reference

**Fallback Strategy**:
If specific paragraph cannot be identified:
- Use subsection-level reference: "Section III.G.2 (Risk Assessment subsection)"
- Or use general section reference with topic: "Section III.G (discussing Oakland Terminal rent economics)"
- Avoid leaving [TBD] placeholders; any specific reference better than placeholder

**Success Criteria**:
- Zero [TBD] placeholders remain in document (grep verification)
- All cross-references resolve to valid sections/subsections
- Cross-references cite to specific subsections where possible (e.g., "III.G.3") rather than general section references
- Cross-referenced content actually discusses topic mentioned in referencing text

**Output Method**: Use Edit tool to replace [TBD] placeholders with subsection references

---

### TASK W3-003: Remove Internal Drafting Artifact

**Agent**: memo-remediation-writer
**Priority**: MEDIUM
**Estimated Time**: 2 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Location**: Line 7270

**Specific Instructions**:

Delete the header "## SECTION WRITING PROGRESS CHECKLIST" which appears to be an internal drafting artifact left in final document. Verify surrounding text remains intact (Section I - Section 905(b) analysis should continue without interruption).

**Target**: Line 7270 (within Section I - Section 905(b))

**Action**: Delete header line; do not delete checklist content if present (may contain useful metadata), only remove prominent "##" header that makes artifact visible

**Success Criteria**:
- Header "## SECTION WRITING PROGRESS CHECKLIST" removed
- Section I (Section 905(b)) analysis flows continuously without internal artifact header
- No content loss in surrounding paragraphs

**Output Method**: Use Edit tool to delete line 7270

---

## WAVE 4: Language/Format Fixes
- **Parallel**: YES
- **Gate**: WAVE 3 must complete
- **Estimated Duration**: 5-8 minutes

| Task ID | Agent | Priority | Est. Minutes | Target | Description | Output Method | Success Criteria |
|---------|-------|----------|--------------|--------|-------------|---------------|------------------|
| W4-001 | memo-remediation-writer | HIGH | 3 | Document-wide | Remove 2 instances of advocacy language ("clearly") and rephrase in neutral language | Edit tool (direct modification) | Grep search for "clearly\|obviously\|without question\|undoubtedly" returns zero results |
| W4-002 | memo-remediation-writer | MEDIUM | 3 | Brief Answers table (lines 84-95) | Verify section reference consistency: table uses "III.A" through "III.J" but sections labeled "A" through "J" | Edit tool (direct modification) | Section column in Brief Answers table uses "A" through "J" (no "III." prefix) |
| W4-003 | memo-remediation-writer | MEDIUM | 2 | Document-wide (851 verification tags) | Standardize verification tag format for consistency | Edit tool (direct modification) | All tags follow consistent format: [TAG:source] or [TAG: description] |

---

### TASK W4-001: Neutralize Advocacy Language

**Agent**: memo-remediation-writer
**Priority**: HIGH
**Estimated Time**: 3 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: 2 instances detected via grep (specific line numbers to be determined during execution)

**Specific Instructions**:

Remove 2 instances of advocacy language ("clearly") detected in diagnostic assessment. Replace with neutral language that conveys same meaning without suggesting outcome is obvious or certain.

**Prohibited Terms**: clearly, obviously, without question, undoubtedly, it is certain that, must find, plainly

**Replacement Strategies**:
- "clearly establishes" → "establishes" or "demonstrates"
- "clearly indicates" → "indicates" or "suggests"
- "clearly shows" → "shows" or "reveals"
- "is clearly X" → "is X" or "appears to be X"

**Example Transformations**:
- BEFORE: "The statute clearly requires 75% U.S. citizen crew."
- AFTER: "The statute requires 75% U.S. citizen crew." (remove "clearly")

- BEFORE: "This precedent clearly establishes that..."
- AFTER: "This precedent establishes that..." or "This precedent demonstrates that..."

**Search Method**:
1. Use grep or find function to locate both instances of "clearly"
2. Read surrounding context
3. Determine appropriate neutral replacement
4. Edit to remove advocacy language while preserving meaning

**Success Criteria**:
- Zero instances of "clearly" remain in document
- Zero instances of other advocacy language (obviously, without question, undoubtedly, it is certain, must find)
- Neutral replacements preserve original meaning
- Grep validation: pattern "clearly|obviously|without question|undoubtedly|it is certain|must find" returns zero results

**Output Method**: Use Edit tool to modify sentences containing advocacy language

---

### TASK W4-002: Section Reference Consistency

**Agent**: memo-remediation-writer
**Priority**: MEDIUM
**Estimated Time**: 3 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Location**: Brief Answers table (lines 84-95)

**Specific Instructions**:

Resolve section reference inconsistency between Brief Answers table and actual section headers. Brief Answers table "Section" column references "III.A" through "III.J", but main analysis sections use headers "## A. FMC REGULATORY COMPLIANCE" (no "III." prefix).

**Current State** (line 84-95):
```
| Q# | Question (Abbreviated) | Answer | Rationale | Section |
| 1 | ... | **Probably No** | ... | III.A |
| 2 | ... | **Probably No** | ... | III.B |
...
| 10 | ... | **Yes** | ... | III.I |
```

**Actual Section Headers** (lines 403, 1138, 2032, etc.):
```
## A. FMC REGULATORY COMPLIANCE
## B. JONES ACT COMPLIANCE
## C. COAST GUARD CERTIFICATION AND BWMS
...
## I. SECTION 905(B) LONGSHOREMEN'S COMPENSATION
## J. VESSEL SHARING AGREEMENTS (VSAs)
```

**Resolution Options**:
1. **Option A** (RECOMMENDED): Update Brief Answers table "Section" column to reference "A" through "J" (remove "III." prefix)
2. **Option B**: Add "III." prefix to all 10 section headers (more formal but requires extensive changes throughout document)

**Recommended Action**: Option A (update table only)

**Revised Table** (lines 84-95):
Change "Section" column values from "III.A", "III.B", ... "III.I", "III.J" to "A", "B", ... "I", "J"

**Success Criteria**:
- Section references in Brief Answers table match actual section header labels
- Consistency achieved with minimal document changes
- Cross-references elsewhere in document (if any cite "Section III.A") remain functional

**Output Method**: Use Edit tool to modify Brief Answers table "Section" column (lines 86-95)

---

### TASK W4-003: Verification Tag Format Standardization

**Agent**: memo-remediation-writer
**Priority**: MEDIUM
**Estimated Time**: 2 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Document-wide (851 verification tags)

**Specific Instructions**:

Standardize verification tag format for consistency across 851 tags. Current tags use inconsistent formats:
- "[VERIFIED:fmc.gov/wp-content/uploads/...]" (full URL, no space after colon)
- "[VERIFIED: https://www.cbp.gov/...]" (https protocol, space after colon)
- "[VERIFIED: USCG.mil PDF]" (abbreviated, space after colon)
- "[INFERRED: fact-registry.md lines 52-55]" (file reference, space after colon)

**Assessment**: Tags are functional; standardization is aesthetic improvement. Prioritize consistency without breaking verifiability.

**Recommended Standard Format**:
```
[VERIFIED: source] - space after colon, source description or URL
[ASSUMED: context] - space after colon, assumption basis
[PENDING VERIFICATION: item] - space after colon, item requiring verification
[INFERRED: source] - space after colon, inference basis
```

**Action**:
1. Survey tag formats to determine most common pattern (appears to be "space after colon")
2. Standardize tags to include space after colon: "[VERIFIED:url]" → "[VERIFIED: url]"
3. Do NOT modify tag content (URLs, file references, source descriptions) - only format consistency
4. Prioritize high-visibility sections (Executive Summary, Questions Presented, first 2-3 analysis sections) if time-constrained

**Success Criteria**:
- All verification tags use consistent format: "[TAG: content]" with space after colon
- No changes to tag content that would break verifiability (URLs remain intact, file references unchanged)
- 100% of tags standardized if time permits; minimum 50% in high-visibility sections

**Output Method**: Use Edit tool to modify tag formats throughout document

**Note**: This is lowest-priority MEDIUM task; if time-constrained in remediation execution, defer this task and proceed to Wave 5.

---

## WAVE 5: Citation Cleanup
- **Parallel**: NO (sequential to avoid conflicts in citation formatting)
- **Gate**: WAVE 4 must complete
- **Estimated Duration**: 8-12 minutes

| Task ID | Agent | Priority | Est. Minutes | Description | Output Method | Success Criteria |
|---------|-------|----------|--------------|-------------|---------------|------------------|
| W5-001 | citation-validator | HIGH | 5 | Add Bluebook signals (See, See also, Cf., But see) to establish authority relationships for non-direct citations | Edit tool (direct modification) | All statutory/case citations in Rule and Explanation subsections include appropriate Bluebook signals |
| W5-002 | citation-validator | HIGH | 4 | Complete pincite coverage for case law citations (estimated 15-20% lack "at [page]" references) | Edit tool (direct modification) | All case citations include pincites or explicit notation "[pincite required - data room verification]" |
| W5-003 | citation-validator | MEDIUM | 3 | Add explanatory parentheticals to case citations describing holdings (e.g., "(holding that...)") | Edit tool (direct modification) | All case citations in Explanation subsections include parenthetical descriptions |

---

### TASK W5-001: Add Bluebook Signals

**Agent**: citation-validator
**Priority**: HIGH
**Estimated Time**: 5 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Rule and Explanation subsections in Sections A-J

**Specific Instructions**:

Add Bluebook signals to citations establishing authority relationships. Current state: only 28 signals detected across 851 citations. Gold standard requires signals for all non-direct citations to indicate whether authority directly supports proposition, provides analogous support, compares, or contradicts.

**Bluebook Signal Selection Rules**:

**"See"**: Use when cited authority directly supports proposition but text does not quote or paraphrase authority
- Example: "VOCCs must file Form FMC-1 prior to commencement of operations. *See* 46 CFR § 520.3."

**"See also"**: Use for additional supporting authority beyond primary citation
- Example: "The FMC carefully scrutinizes agreements to ensure operational cooperation does not serve as pretext for anti-competitive pricing. *See* 46 U.S.C. § 40307; *see also* 46 U.S.C. § 40303(b)-(c) (FMC rejection authority for unreasonable agreements)."

**"Cf."**: Use when cited authority supports proposition by analogy or comparison
- Example: "Jones Act crew citizenship violations face civil penalties up to $50,000 per day. *Cf.* 46 U.S.C. § 8103(f) (parallel penalty structure for documentation violations)."

**"But see"**: Use when cited authority contradicts proposition or suggests contrary interpretation
- Example: "Some circuits interpret preemption broadly. *But see* [contrary circuit case] (narrow preemption interpretation)."

**Target Sections for Signal Addition**:
- **Legal Framework subsections** (A.A through J.A): Add "See" signals to statutory/regulatory citations
- **Explanation subsections** (A.Explanation through J.Explanation): Add signals to case law citations

**Example Transformations**:

BEFORE:
```
The Shipping Act requires each service contract to be filed confidentially with the FMC. 46 U.S.C. § 40502.[48]
```

AFTER:
```
The Shipping Act requires each service contract to be filed confidentially with the FMC. *See* 46 U.S.C. § 40502.[48]
```

BEFORE:
```
In the landmark *Hapag-Lloyd AG* settlement approved by the FMC in June 2022, the carrier agreed to pay a $2 million civil penalty for alleged violations of detention and demurrage practices under the Shipping Act.[42]
```

AFTER (if introducing precedent):
```
*See, e.g.*, *Hapag-Lloyd AG* settlement, FMC Press Release (June 2022) (carrier agreed to pay $2 million civil penalty for detention and demurrage violations under OSRA 2022 enhanced enforcement authority).[42]
```

**Signal Formatting**:
- Signals in italics: *See*, *See also*, *Cf.*, *But see*
- Comma after introductory signal: "*See*, 46 U.S.C. § 40502"
- Semicolon between multiple authorities: "*See* 46 U.S.C. § 40502; *see also* 46 CFR § 520.3"
- Period after final citation in sentence

**Success Criteria**:
- All citations in Legal Framework subsections include appropriate signals (primarily "See")
- All case citations in Explanation subsections include signals indicating relationship to proposition
- Signals correctly formatted in italics with proper punctuation
- Conservative signal selection: when uncertain, default to "See" rather than more specific signals

**Output Method**: Use Edit tool to add signals to citations throughout Sections A-J

---

### TASK W5-002: Complete Pincite Coverage

**Agent**: citation-validator
**Priority**: HIGH
**Estimated Time**: 4 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Case law citations throughout document

**Specific Instructions**:

Complete pincite coverage for case law citations. Diagnostic assessment estimates 15-20% of case citations lack "at [page]" references. All case citations must include specific page numbers (pincites) indicating where cited proposition appears in source.

**Strong Citation Examples** (already compliant):
- "Federal Maritime Commission, 63rd Annual Report Fiscal Year 2024, at 18 (2025)" ✓
- "U.S. Customs and Border Protection, *The Jones Act – Informed Compliance Publication*, at 8-12 (Dec. 2024)" ✓
- "Congressional Research Service, *Shipping Under the Jones Act*, at 12-15 (R45725, updated Nov. 2024)" ✓

**Weak Citation Examples** (requiring pincites):
- "Hapag-Lloyd AG settlement" → needs "at [page]" or "slip op. at [page]"
- "*United Arab Shipping Company (UASC)* settlement" → needs specific page reference
- Case name without pincite → add "at [page]"

**Pincite Addition Methods**:

**For cases with FMC press releases or settlement documents**:
- Add page reference to press release or settlement agreement
- Example: "*Hapag-Lloyd AG* settlement, FMC Press Release at 2 (June 2022)"

**For cases where page number unavailable**:
- Add notation: "[pincite required - data room verification]"
- Example: "*Hapag-Lloyd AG* settlement [pincite required - data room verification], FMC Press Release (June 2022)"
- This flags citation for client follow-up while completing formal requirement

**For slip opinions or unpublished decisions**:
- Use "slip op. at [page]" format
- Example: "*Martinez v. Pacific Maritime Services*, slip op. at 8-12 (San Francisco Super. Ct. 2025)"

**Search Method**:
1. Identify case citations (italicized case names, FMC settlement names, administrative decisions)
2. Check if citation includes "at [page number]"
3. If missing:
   - If page number determinable from context, add pincite
   - If page number unknown, add "[pincite required - data room verification]"

**Success Criteria**:
- All case law citations include pincites ("at [page]") OR explicit notation "[pincite required - data room verification]"
- Pincite coverage ≥95% (estimated 15-20% deficiency resolved)
- Regulatory/statutory citations already compliant (e.g., "46 CFR § 520.3" does not require pincite)

**Output Method**: Use Edit tool to add pincites to case citations throughout document

---

### TASK W5-003: Add Explanatory Parentheticals

**Agent**: citation-validator
**Priority**: MEDIUM
**Estimated Time**: 3 minutes
**File**: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-12-1736705000/final-memorandum.md
**Locations**: Case citations in Explanation subsections (Sections A-J)

**Specific Instructions**:

Add explanatory parentheticals to case citations describing holdings or relevance. Parentheticals allow reader to understand case's significance without independently researching authority.

**Parenthetical Format**:
- Placed immediately after citation, before footnote marker
- Begin with present participle: "(holding that...)", "(establishing...)", "(finding...)", "(concluding...)"
- Brief: 10-20 words summarizing relevant holding
- Lowercase first word unless proper noun

**Example Transformations**:

BEFORE:
```
In the landmark *Hapag-Lloyd AG* settlement approved by the FMC in June 2022, the carrier agreed to pay a **$2 million civil penalty** for alleged violations of detention and demurrage practices under the Shipping Act.[42]
```

AFTER:
```
*See, e.g.*, *Hapag-Lloyd AG* settlement (establishing FMC penalty benchmark for systemic detention and demurrage violations under OSRA 2022), FMC Press Release (June 2022).[42]
```

BEFORE:
```
In *United Arab Shipping Company (UASC)*, the carrier paid **$537,500** to the Commission for violating **46 U.S.C. § 41104(1)**.[43]
```

AFTER:
```
*See also* *United Arab Shipping Company (UASC)* (carrier penalized for unlawfully rebating service contract rates through undisclosed fee arrangements), FMC Settlement at 2 (2020).[43]
```

**Target Citations**:
- Focus on case citations in Explanation subsections where precedential value must be clear
- Prioritize HIGH severity findings (Sections A, E, F, I, J) where case law supports quantified exposure
- Parentheticals not required for:
  - Statutory citations (self-explanatory)
  - Regulatory citations (provision content clear from context)
  - Direct quotations from cases (holding already stated in text)

**Success Criteria**:
- All case citations in Explanation subsections include explanatory parentheticals describing holdings
- Parentheticals use present participle format ("holding that...", "establishing...", "finding...")
- Parentheticals brief (10-20 words) and informative
- Minimum 20 parentheticals added across 10 sections (average 2 per section)

**Output Method**: Use Edit tool to add parentheticals to case citations in Explanation subsections

---

## WAVE 6: Final Assembly
- **Parallel**: NO (sequential validation)
- **Gate**: WAVE 5 must complete
- **Estimated Duration**: 2-3 minutes

| Task ID | Agent | Description | Success Criteria |
|---------|-------|-------------|------------------|
| ASSEMBLY-001 | Edit tool (validation) | Verify all Wave 2-5 edits successfully applied; confirm no regressions introduced | All edits integrated into final-memorandum.md |
| ASSEMBLY-002 | Edit tool (validation) | Run post-remediation validation checklist: verify [TBD] count = 0, "clearly" count = 0, all sections have Counter-Analysis subsections | All validation checks pass |

---

### TASK ASSEMBLY-001: Edit Integration Verification

**Agent**: Edit tool (validation function)
**Estimated Time**: 1 minute

**Validation Checklist**:
- [ ] Questions Presented section (lines 377-398): All 10 questions reformatted in Under/Does/When format
- [ ] Sections A-J: All 10 sections contain new "Counter-Analysis" subsections
- [ ] Sections A-J: All 10 Application subsections begin with "**Conclusion:**" lead paragraphs
- [ ] Lines 3340, 3342, 8452, 8467, 8475: All [TBD] placeholders resolved with subsection references
- [ ] Line 7270: "SECTION WRITING PROGRESS CHECKLIST" header removed
- [ ] Document-wide: Advocacy language ("clearly") removed
- [ ] Brief Answers table (lines 84-95): Section references consistent with actual section labels
- [ ] Citations: Bluebook signals added to Rule and Explanation subsections
- [ ] Citations: Pincite coverage complete or flagged with "[pincite required]" notation
- [ ] Citations: Explanatory parentheticals added to case citations in Explanation subsections

**Success Criteria**: All checklist items confirmed complete

---

### TASK ASSEMBLY-002: Post-Remediation Validation

**Agent**: Edit tool (validation function)
**Estimated Time**: 2 minutes

**Grep Validation Commands**:

1. **[TBD] Placeholder Count**:
   - Command: `grep -c "\[TBD\]" final-memorandum.md`
   - Expected Result: 0
   - If >0: Identify remaining placeholders and resolve or flag for Cycle 2

2. **Advocacy Language Count**:
   - Command: `grep -c "clearly\|obviously\|without question\|undoubtedly" final-memorandum.md`
   - Expected Result: 0
   - If >0: Identify remaining instances and neutralize

3. **Counter-Analysis Subsection Count**:
   - Command: `grep -c "### [A-J]\. Counter-Analysis" final-memorandum.md`
   - Expected Result: 10 (one per section)
   - If <10: Identify missing sections and complete W2-002

4. **Conclusion Lead Count**:
   - Command: `grep -c "^\*\*Conclusion\*\*:" final-memorandum.md`
   - Expected Result: ≥10 (one per Application subsection minimum)
   - If <10: Identify missing sections and complete W3-001

5. **Bluebook Signal Count**:
   - Command: `grep -c "\*See\*\|\*See also\*\|\*Cf\.\*\|\*But see\*" final-memorandum.md`
   - Expected Result: >100 (significant increase from baseline 28)
   - If <100: Wave 5 signal addition may require additional pass

**Document Integrity Checks**:
- [ ] File size similar to original (145,779 words + ~5,000-8,000 words for Counter-Analysis subsections = ~150,000-155,000 words expected)
- [ ] All 10 sections (A-J) present and intact
- [ ] Executive Summary, Questions Presented, Brief Answers sections unchanged (except Questions Presented reformat and Brief Answers section reference update)
- [ ] No content loss in Application, Risk Assessment, or Recommendations subsections

**Success Criteria**: All validation checks pass; document ready for second-pass QA diagnostic

---

## Remediation Execution Log

**Cycle**: 1
**Start Time**: [To be recorded]
**End Time**: [To be recorded]
**Total Duration**: [To be recorded]

### Wave Completion Status

| Wave | Status | Start Time | End Time | Duration | Tasks Completed | Issues Encountered |
|------|--------|------------|----------|----------|-----------------|-------------------|
| Wave 1 | SKIPPED | N/A | N/A | 0 min | N/A | N/A |
| Wave 2 | [PENDING/IN_PROGRESS/COMPLETE] | | | | W2-001: [✓/✗] W2-002: [✓/✗] | |
| Wave 3 | [PENDING/IN_PROGRESS/COMPLETE] | | | | W3-001: [✓/✗] W3-002: [✓/✗] W3-003: [✓/✗] | |
| Wave 4 | [PENDING/IN_PROGRESS/COMPLETE] | | | | W4-001: [✓/✗] W4-002: [✓/✗] W4-003: [✓/✗] | |
| Wave 5 | [PENDING/IN_PROGRESS/COMPLETE] | | | | W5-001: [✓/✗] W5-002: [✓/✗] W5-003: [✓/✗] | |
| Wave 6 | [PENDING/IN_PROGRESS/COMPLETE] | | | | ASSEMBLY-001: [✓/✗] ASSEMBLY-002: [✓/✗] | |

### Issue Resolution Status

| Issue ID | Severity | Status | Resolution Notes |
|----------|----------|--------|------------------|
| CRIT-001 | CRITICAL | [PENDING/RESOLVED/BLOCKED] | Questions Presented reformat |
| CRIT-002 | CRITICAL | [PENDING/RESOLVED/BLOCKED] | Counter-Analysis subsections |
| HIGH-001 | HIGH | [PENDING/RESOLVED/BLOCKED] | CREAC Conclusion leads |
| HIGH-002 | HIGH | [PENDING/RESOLVED/BLOCKED] | [TBD] placeholder resolution |
| HIGH-003 | HIGH | [PENDING/RESOLVED/BLOCKED] | Bluebook signals |
| HIGH-004 | HIGH | [PENDING/RESOLVED/BLOCKED] | Pincite completion |
| HIGH-005 | HIGH | [PENDING/RESOLVED/BLOCKED] | Explanatory parentheticals |
| HIGH-006 | HIGH | [PENDING/RESOLVED/BLOCKED] | Advocacy language removal |
| MED-001 | MEDIUM | [PENDING/RESOLVED/DEFERRED] | Counter-analysis distribution |
| MED-002 | MEDIUM | [PENDING/RESOLVED/DEFERRED] | Rule statement signals |
| MED-003 | MEDIUM | [PENDING/RESOLVED/DEFERRED] | Cross-reference paragraph numbering |
| [Continue for all 18 in-scope issues] | | | |

---

## Next Steps After Remediation

1. **Run second-pass QA diagnostic** on remediated final-memorandum.md
2. **Compare scores**: Baseline 89.25% vs. post-remediation score
3. **Determine next action**:
   - If ≥94%: Proceed to CERTIFY
   - If 93-93.9%: Optional TIER_1_POLISH cycle
   - If 91-92.9%: Required TIER_1_POLISH cycle
   - If <91%: Escalate for human review

---

**END OF REMEDIATION DISPATCH**
