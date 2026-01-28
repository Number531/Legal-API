# FACT CONFLICT REPORT
**Project Asclepius - Sunset Senior Living Group Acquisition**

**Generated:** 2026-01-25
**Session:** 2026-01-25-1737843600
**Status:** CONFLICTS_DETECTED_AND_RESOLVED

---

## EXECUTIVE SUMMARY

**Total Conflicts Detected:** 1 material conflict
**Critical Conflicts:** 0
**Major Conflicts:** 1
**Minor Conflicts:** 0
**All Conflicts Resolved:** YES

**Conflict Resolution Methodology:**
- Source hierarchy: Primary legal documents > Detailed contract tables > General narrative references
- Consistency analysis: Multiple cross-references within same report
- Timeline coherence: Date sequences must be logically consistent
- Subject matter expertise: Specialist report focus area given priority

**Recommendation:** Conflict resolution complete. All canonical values established in fact-registry.md. One date discrepancy requires PACER verification during due diligence.

---

## CONFLICT #1: MARTINEZ QUI TAM FILING DATE

### Status: RESOLVED (Medium-Confidence Canonical Value Selected)

### Severity: MAJOR

**Impact:** Filing date affects:
- Statute of limitations calculations
- Timeline of DOJ investigation (19-month seal period)
- Relator credibility analysis (termination December 2022 vs filing date)
- Transaction timeline planning

---

### Conflicting Values

| Source | Value Stated | Location | Supporting Evidence |
|--------|--------------|----------|---------------------|
| **Source A (PRIMARY)** | **May 2023** | fca-litigation-report.md § I.A.1 | **Multiple references:** "filed May 2023, unsealed December 2024", "19-month seal period May 2023-December 2024", timeline table shows "May 2023 Martinez files qui tam" |
| **Source B (SECONDARY)** | **August 15, 2022** | User query (original research request) | Single mention in user query asking for "Martinez qui tam (filed August 2022)" |

---

### Analysis

#### Consistency Within FCA Report (Source A)

The fca-litigation-report.md consistently references **May 2023** across multiple sections:

1. **§ I.A.1 Executive Summary:**
   - "United States ex rel. Martinez v. Sunset Senior Living Group, LLC (D. Ariz., **filed May 2023**, unsealed December 2024)"
   - "**19-month seal period: May 2023-December 2024**"

2. **§ III.C Timeline Table:**
   - "**May 2023** | Martinez files qui tam complaint under seal in U.S. District Court for the District of Arizona"

3. **Seal Period Calculation:**
   - Consistently states "**19-month investigation**" which aligns with May 2023 → December 2024 (19 months)
   - If filed August 2022 → December 2024 = 28 months (inconsistent with stated 19-month period)

4. **Investigation Timeline Logic:**
   - "CIDs issued: **August-September 2023**" (stated in § I.A.1)
   - Typical DOJ practice: Issue CIDs 3-4 months after filing to allow preliminary review
   - May 2023 filing → August-September 2023 CIDs = 3-4 months (consistent)
   - August 2022 filing → August-September 2023 CIDs = 12-13 months (atypical delay)

5. **Termination vs Filing Timeline:**
   - Martinez terminated: **December 2022** (stated consistently)
   - If filed August 2022: Filing occurred **before** termination (undermines retaliation theory)
   - If filed May 2023: Filing occurred **after** termination (supports Martinez retaliation claim)
   - FCA report analysis assumes post-termination filing: "Sunset will argue termination preceded qui tam filing (May 2023), suggesting financial motive"

#### User Query Date (Source B)

- Single reference to "August 2022" in original research request
- No corroborating evidence in any of 7 specialist reports
- Possible explanations:
  - User error (typo or incorrect information)
  - Refers to different event (e.g., internal complaint date, preliminary investigation start)
  - Based on unverified source not available to research specialists

---

### Resolution

**CANONICAL VALUE SELECTED: May 2023**

**Reasoning:**
1. **Internal Consistency:** FCA litigation report (170KB, 1,700+ lines) consistently uses May 2023 across 5+ separate references
2. **Timeline Coherence:** 19-month seal period, CID timing, termination sequence all logically consistent with May 2023
3. **Specialist Expertise:** FCA litigation analyst conducted exhaustive research on qui tam procedure, DOJ practices, seal periods
4. **No Contradictory Evidence:** Zero references to August 2022 in any of 7 specialist reports
5. **Source Hierarchy:** Detailed specialist analysis trumps single user query reference

**Confidence Level:** MEDIUM

**Pending Verification:**
- **Action Required:** During due diligence, obtain PACER docket access to confirm actual filing date
- **Alternative Verification:** Request complaint copy from Silver Oak legal team (if available under protective order)
- **Fallback:** DOJ intervention decision expected Q1-Q2 2025 will clarify filing timeline

**Impact if August 2022 Correct:**
- Seal period extends to 28 months (significantly longer investigation)
- Filing pre-termination strengthens Martinez retaliation claim (filed complaint, then terminated)
- DOJ investigation timeline extends earlier (CIDs August 2023 = 12 months post-filing, possible second-round CIDs)
- No material change to settlement exposure or transaction risk

**Recommendation:**
- **Use May 2023 in all transaction documents and memorandum**
- **Flag for PACER verification** in due diligence checklist
- **Include caveat in memorandum:** "Filing date stated as May 2023 per specialist research; verification pending PACER docket access"

---

## CONFLICT #2: SAN DIEGO FACILITY - OWNED VS LEASED

### Status: RESOLVED (High-Confidence Canonical Value Selected)

### Severity: MINOR

**Impact:** Affects:
- Real estate ownership structure
- Sale-leaseback analysis (8 owned vs 7 owned + 1 leased)
- Lease rent obligations ($2.675M annually)
- Facility-level expense allocation

---

### Conflicting Values

| Source | Classification | Supporting Evidence |
|--------|----------------|---------------------|
| **Source A (DEFINITIVE)** | **LEASED** | commercial-contracts-report.md § IV.E - Detailed lease table: "San Diego Skilled Nursing | CA | 120 beds | $800,000/year rent | $6,667/bed" |
| Source B (Ambiguous) | Owned (implied) | tax-structure-report.md § IV.C - Lists "San Diego Coastal (125 beds)" in facilities discussion without lease designation |

---

### Analysis

#### Source A: Commercial Contracts Report (Definitive)

**§ IV.E Real Estate Leases Table:**
```
| Facility | State | Beds | Estimated Annual Rent | Key Lease Terms |
| San Diego Skilled Nursing | CA | 120 | $800,000 | Rent escalation 2-3% annually |
```

**Additional Detail:**
- Explicitly lists 4 leased facilities: Henderson, Reno, Chandler, **San Diego**
- Provides lease-specific information: Rent amount, escalation clauses, assignment provisions
- Total lease rent calculated: "$2.675M annually" (includes San Diego $800K)
- Section focus: Change of control consent requirements for **leased facilities**

#### Source B: Tax Structure Report (Ambiguous)

**§ IV.C Sale-Leaseback Analysis:**
- Lists facility names in sale-leaseback hypothetical: "San Diego Coastal (125 beds)"
- Does NOT explicitly state "owned" - inclusion in sale-leaseback scenario ambiguous
- Could mean: (a) Owned facility being sold to REIT, or (b) Example facility name for illustration
- No lease rent information provided in tax report

#### Cross-References

**Employment-Labor Report:**
- No explicit ownership designation for San Diego

**CMS Regulatory Report:**
- No explicit ownership designation for San Diego

**Insurance Coverage Report:**
- No explicit ownership designation for San Diego

---

### Resolution

**CANONICAL VALUE SELECTED: LEASED FACILITY**

**Reasoning:**
1. **Source Hierarchy:** Commercial contracts report provides **definitive lease table** with specific rent amounts - this is PRIMARY evidence of lease status
2. **Specificity:** Lease rent ($800K/year), per-bed rate ($6,667), lease terms provided - level of detail indicates verified lease status
3. **Subject Matter Authority:** Commercial contracts specialist responsible for analyzing vendor/lease agreements - area of expertise
4. **Portfolio Math:** Owned facilities (8) = 1,165 beds; Leased (4 including San Diego) = 485 beds; Total = 1,650 beds (matches stated total)
5. **Alternative Math Fails:** If San Diego owned, leased facilities (3) = 365 beds; Owned (9) = 1,285 beds; Total = 1,650 beds, but contradicts "8 owned facilities" stated in multiple reports

**Confidence Level:** HIGH

**Impact if Owned:**
- Sale-leaseback base increases from 8 to 9 facilities
- REIT sale proceeds increase by ~$19M-$25M (San Diego facility value)
- Annual rent decreases by $800K (no San Diego lease payment)
- Minimal impact on transaction structure or risk profile

**Recommendation:**
- **Classify San Diego as LEASED in all transaction documents**
- **Verify lease documentation** in data room during due diligence
- **Confirm landlord identity** and consent requirements for change of control
- **No material impact** on transaction economics or timeline

---

## POTENTIAL CONFLICTS INVESTIGATED (No Conflict Found)

### Investigation #1: Employee Count

**Potential Conflict:** Various employee counts mentioned across reports
**Investigation:**
- Total employees: 1,850 (consistent across employment-labor, cms-regulatory reports)
- Nursing staff: 980 (consistent: 480 CNAs + 320 LPNs + 180 RNs = 980)
- Other staff: 870 (calculated: 1,850 - 980 = 870)
**Conclusion:** No conflict - all figures consistent

### Investigation #2: EBITDA Amount

**Potential Conflict:** EBITDA stated in multiple contexts
**Investigation:**
- Base EBITDA: $52M (consistent across all reports)
- Post-sale-leaseback EBITDA: $42M-$45M (tax report, after rent adjustment)
- Post-union EBITDA: $32M (employment report, after $20M labor cost increase)
**Conclusion:** No conflict - different scenarios clearly distinguished

### Investigation #3: Facility Bed Counts

**Potential Conflict:** Some facilities have varying bed counts across reports
**Example:** San Diego listed as 120 beds (commercial contracts) vs 125 beds (tax structure)
**Investigation:**
- Licensed beds vs operational beds (common variance)
- Approximations in hypothetical scenarios vs actual lease data
**Conclusion:** Minor discrepancies (<5%) in non-critical facilities; use lease/contract values as canonical where available
**Recommendation:** Verify licensed bed counts in state licensing databases during due diligence

### Investigation #4: Orange County Census

**Potential Conflict:** Orange County residents stated as 127 vs implied 131
**Investigation:**
- Explicit: "127 residents" (cms-regulatory-report.md § I.B)
- Calculation: 145 beds × 88% occupancy = 127.6 residents
**Conclusion:** No conflict - figures consistent within rounding

---

## VERIFICATION PRIORITIES FOR DUE DILIGENCE

Based on conflict analysis, prioritize verification of:

### Priority 1: CRITICAL (Transaction-Blocking if Incorrect)
1. **Martinez Qui Tam Filing Date** - PACER docket access or complaint copy
2. **Orange County SFF March 2025 Survey Date** - Confirm with CMS/state agency
3. **Section 338(h)(10) Eligibility** - Verify Sunset entity classification (partnership/S-corp/C-corp) via 2024 tax return

### Priority 2: MAJOR (Material Impact on Economics)
4. **Total Licensed Beds by Facility** - State licensing database verification
5. **Real Estate Ownership Status** - Title reports for all 12 facilities
6. **Medical Director Compensation** - Actual contract review (esp. Dr. Johnson $180K)
7. **FY2024 DPNA Revenue Loss** - Actual financial statements ($1.53M verification)

### Priority 3: MINOR (Refinement of Estimates)
8. **Facility-Level Star Ratings** - Care Compare website verification
9. **Vendor Contract Assignment Provisions** - Data room contract review
10. **Employee Turnover Rates** - Payroll records/HR analytics verification

---

## CONFLICT RESOLUTION METHODOLOGY APPLIED

### Source Priority Hierarchy (Used in Resolutions)

| Priority | Source Type | Examples | Reliability |
|----------|-------------|----------|-------------|
| **1** | Primary legal documents | Statutes, regulations, court filings | Definitive |
| **2** | Detailed contract tables | Lease tables with rent amounts, contract terms | High |
| **3** | Specialist analysis with citations | FCA report with timeline table, CIA cost breakdown | High-Medium |
| **4** | Calculated values from verified inputs | EBITDA margin, occupancy rate, NPV | Medium |
| **5** | Industry benchmarks | Medical director FMV, union wage premiums | Medium |
| **6** | User-provided assumptions | Purchase price, closing date, transaction parameters | Medium-Low (verify) |
| **7** | Inferred values | Facility names without explicit verification | Low (flag for verification) |

### Conflict Resolution Decision Tree

```
1. Identify conflicting values across reports
   ↓
2. Determine severity (Critical/Major/Minor)
   ↓
3. Locate all references to fact across all 7 reports
   ↓
4. Apply source priority hierarchy
   ↓
5. Check internal consistency (timeline logic, calculations)
   ↓
6. Select canonical value with highest priority source
   ↓
7. Document confidence level (High/Medium/Low)
   ↓
8. Flag for verification if confidence < High
   ↓
9. Record in fact-registry.md with [VERIFICATION:type] tag
```

---

## RECOMMENDATIONS FOR MEMORANDUM SYNTHESIS

### Critical Facts Requiring Verification Caveats

When section writers reference the following facts, include verification caveats:

1. **Martinez Filing Date (May 2023):**
   - Caveat: "Based on specialist research; verification pending PACER docket access"

2. **Orange County March 2025 Survey:**
   - Caveat: "Survey window approximate; confirm exact date with California DHHS 30 days before scheduled survey"

3. **Facility Bed Counts:**
   - Caveat: "Licensed bed counts per specialist estimates; verify via state licensing records"

4. **Medical Director Time Commitment:**
   - Caveat: "Dr. Johnson 1 hour/month per relator allegation; actual time commitment disputed and requires contract review"

### High-Confidence Facts (No Caveat Needed)

These facts verified from multiple consistent sources and/or statutory provisions:

- Transaction price: $425M
- Total facilities: 12
- Total licensed beds: 1,650
- Current census: 1,485 residents
- FY2024 revenue: $285M
- FY2024 EBITDA: $52M
- Section 338(h)(10) deadline: December 15, 2025 (9 months post-closing)
- California SB 525 deadline: June 1, 2025 ($21/hour minimum)
- WARN Act notice: 60-day federal, 45-day California

---

## DOCUMENT END

**Conflict Resolution Complete:** 2026-01-25
**Next Review:** Upon discovery of additional inconsistencies during due diligence
**Escalation:** Critical conflicts (if discovered) require immediate notification to orchestrator
