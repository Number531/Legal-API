# Tutorial 3: M&A Due Diligence

This tutorial demonstrates Super-Legal's enterprise capability for comprehensive M&A legal due diligence.

---

## Overview

Super-Legal can transform a complex due diligence request into a comprehensive legal memorandum with 500+ citations across 18+ databases - work that traditionally takes 2-4 weeks compressed into hours.

### What You'll Learn

1. Structuring due diligence requests
2. Multi-domain regulatory analysis
3. Risk quantification
4. Deliverable generation

---

## Case Study: Healthcare M&A

### The Scenario

A private equity firm is acquiring a multi-state healthcare provider for $185M. The target operates skilled nursing facilities across 5 states with complex regulatory exposure.

### Step 1: Structure Your Request

```
TRANSACTION OVERVIEW

Acquirer: [PE Firm] is evaluating a $185M acquisition of
[Target], a multi-state skilled nursing facility operator.

Target Profile:
- 12 facilities across GA, FL, SC, TN, AL
- 1,850 licensed beds
- $95M annual revenue
- 2,400 employees

REQUESTED ANALYSIS

Please prepare a comprehensive legal due diligence
memorandum addressing:

1. REGULATORY COMPLIANCE
   - Medicare/Medicaid certification status
   - State licensure (all 5 states)
   - Survey deficiencies and enforcement history
   - CMS star ratings and quality metrics

2. LITIGATION EXPOSURE
   - Pending lawsuits
   - Historical settlements
   - Class action risk

3. CORPORATE STRUCTURE
   - Entity organization
   - Real estate ownership
   - Physician relationships (Stark/Anti-Kickback)

4. FINANCIAL/REGULATORY RISK
   - Medicare reimbursement trends
   - Staffing mandate compliance
   - HIPAA compliance history

5. DEAL-SPECIFIC RISKS
   - Change of ownership requirements
   - State approval timelines
   - Assignment of agreements

FORMAT: CREAC structure with quantified risk assessments
and Bluebook citations.
```

### Step 2: The Multi-Agent Process

Super-Legal deploys 17 specialist agents in parallel:

```
PHASE 1: RESEARCH (Parallel)
├── Healthcare Regulatory Specialist
│   └── CMS databases, state licensing boards
├── Case Law Analyst
│   └── Litigation history, precedent analysis
├── Securities Researcher
│   └── SEC filings, corporate structure
├── Environmental Compliance Analyst
│   └── EPA facility records
├── Employment/Labor Analyst
│   └── OSHA, wage & hour, union status
└── [12 more specialists...]

PHASE 2: VALIDATION
├── Research Reviewer - Verify findings
├── Fact Validator - Cross-reference sources
├── Coverage Gap Analyzer - Identify missing areas
└── Citation Validator - Verify all citations

PHASE 3: SYNTHESIS
├── Section Writers (CREAC format)
├── Risk Aggregator (quantify exposure)
└── Memorandum Assembler
```

### Step 3: Sample Output Structure

The generated memorandum follows professional standards:

```markdown
# PRIVILEGED AND CONFIDENTIAL
## Legal Due Diligence Memorandum

### I. EXECUTIVE SUMMARY
- Transaction: $185M acquisition of [Target]
- Overall Risk Assessment: MODERATE-HIGH
- Key Issues Identified: 47
- Recommended Conditions: 12

### II. TRANSACTION OVERVIEW
[Detailed summary with verified facts]

### III. METHODOLOGY
[Research scope, databases queried, limitations]

### IV. ANALYSIS BY RISK CATEGORY

#### A. Medicare/Medicaid Regulatory Compliance
**CONCLUSION**: Moderate risk. Target maintains Medicare
certification but has elevated deficiency history.

**RULE**: CMS Conditions of Participation (42 CFR § 483)
require skilled nursing facilities to meet quality
standards. Facilities with pattern of non-compliance
risk termination from Medicare program.

**EXPLANATION**: [Regulatory framework analysis]

**APPLICATION TO TRANSACTION**:
- Facility A: 3 stars, 8 deficiencies (2024 survey)
- Facility B: 2 stars, 12 deficiencies, $45K CMP
- Facility C: 4 stars, 2 deficiencies
[Analysis of each facility...]

**COUNTER-ANALYSIS**: Target argues deficiencies were
corrected promptly and represent operational issues
rather than systemic failures. However, CMS enforcement
data shows...

**RISK QUANTIFICATION**:
| Risk | Probability | Impact | Expected Value |
|------|-------------|--------|----------------|
| CMP penalties | 35% | $500K | $175K |
| Decertification | 5% | $12M | $600K |
| Reimbursement cuts | 25% | $2M | $500K |

#### B. Pending Litigation
[Similar CREAC analysis...]

### V. RISK SUMMARY MATRIX
[Comprehensive risk quantification]

### VI. RECOMMENDED CONDITIONS PRECEDENT
1. Regulatory approval from 5 state health departments
2. CMS change of ownership notification
3. Resolution of [specific issue]
...

### VII. APPENDICES
A. Facility-by-Facility Analysis
B. Citation Index (557 citations)
C. Document Request List
D. Timeline for Approvals
```

---

## Structuring Your Request

### Essential Elements

1. **Transaction Context**
   - Deal size and structure
   - Parties involved
   - Timeline pressures

2. **Target Profile**
   - Industry and operations
   - Geographic footprint
   - Key metrics (revenue, employees, facilities)

3. **Specific Risk Areas**
   - List known concerns
   - Identify regulatory frameworks
   - Note any red flags from preliminary review

4. **Output Requirements**
   - Format (CREAC, memo, checklist)
   - Citation style (Bluebook, internal)
   - Risk quantification needed

### Example Prompt Template

```
CONFIDENTIAL - ATTORNEY WORK PRODUCT

To: Outside Counsel
From: [Your Name], In-House Counsel
Re: Project [Code Name] - Legal Due Diligence
Date: [Date]
Priority: [Urgent/Standard]

TRANSACTION STRUCTURE
[Acquirer] proposes to acquire [Target] for $[Amount]
via [structure: stock purchase/asset purchase/merger].

TARGET PROFILE
- Industry: [Description]
- Operations: [Summary]
- Employees: [Number]
- Revenue: $[Amount]
- Geographic presence: [States/Countries]

KEY KNOWN ISSUES
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

REQUESTED ANALYSIS
Please analyze the following areas:

[List specific areas with detail level needed]

OUTPUT FORMAT
- CREAC structure for each issue
- Bluebook citations
- Risk quantification (probability x impact)
- Recommended deal protections

DEADLINE: [Date]
```

---

## Industry-Specific Considerations

### Healthcare

Focus areas:
- CMS certification status
- State licensure requirements
- Stark Law / Anti-Kickback Statute
- HIPAA compliance
- Change of ownership (CHOW) requirements

Key tools:
- `search_federal_register` (CMS regulations)
- `search_cases` (healthcare litigation)
- `search_sec_filings` (if public)

### Technology

Focus areas:
- IP portfolio (patents, trademarks)
- Open source license compliance
- Data privacy (CCPA, GDPR)
- Export controls
- Customer contract assignability

Key tools:
- `search_patents` / `search_ptab_proceedings`
- `search_ftc_enforcement_cases`
- `search_sec_filings`

### Financial Services

Focus areas:
- Regulatory licenses (state, federal)
- Enforcement history
- AML/BSA compliance
- Consumer protection
- Capital requirements

Key tools:
- `search_sec_filings`
- `search_federal_register` (FinCEN, OCC)
- `search_state_statute` (state banking laws)

### Manufacturing

Focus areas:
- Environmental compliance (EPA, state)
- Product liability history
- OSHA compliance
- Supply chain risks
- Real estate/environmental

Key tools:
- `search_epa_facilities` / `search_epa_violations`
- `search_cpsc_recalls`
- `search_cases` (product liability)

---

## Best Practices

### 1. Provide Context

The more context you provide, the better the analysis:

```
# Less effective
Research legal issues for acquiring a hospital.

# More effective
Research legal issues for a $425M acquisition of a
340-bed acute care hospital in Florida with Level II
trauma designation, pending CON for cardiac surgery,
and recent CMS survey showing 3 condition-level
deficiencies. Acquirer is a publicly-traded health
system subject to CFIUS review due to foreign LP
investors.
```

### 2. Specify Risk Tolerance

```
Acquirer is a conservative institutional investor
requiring comprehensive analysis of all material
risks, even low-probability scenarios. Please analyze
tail risks and worst-case scenarios.
```

### 3. Note Deal Structure

```
Transaction structured as:
- Asset purchase (not stock)
- Excludes accounts receivable
- Seller retains pre-closing liabilities
- Transition services agreement for 6 months

Analyze how this structure affects risk allocation.
```

### 4. Request Actionable Output

```
For each identified risk, provide:
1. Recommended rep & warranty language
2. Suggested indemnification provisions
3. Conditions precedent to closing
4. Post-closing covenants
```

---

## Output Formats

### Full Memorandum
Comprehensive 100-200+ page document with complete CREAC analysis.

### Executive Summary
5-10 page summary of key findings and recommendations.

### Issue Checklist
Tabular format with issues, risk levels, and action items.

### Risk Matrix
Quantified risk assessment with probability and impact scoring.

---

## Next Steps

- [Tutorial 4: Memorandum Generation](04-memorandum-generation.md)
- [API Reference](../API-REFERENCE.md)
- [Featured Example: Project Asclepius](../../README.md#featured-example-project-asclepius)
