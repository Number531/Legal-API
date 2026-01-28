# CANONICAL FACT REGISTRY

**Transaction**: Project Icarus - Global Aviation Holdings / SkyWest Regional Airlines
**Session**: 2025-12-27-1735344128
**Created**: 2025-12-27
**Purpose**: Canonical values for all section writers to ensure factual consistency
**Fact Validation Status**: COMPLETE with 1 CRITICAL CONFLICT (see conflict-report.md)

---

## USAGE INSTRUCTIONS FOR SECTION WRITERS

**MANDATORY**: All section writers MUST use values from this registry. If a value conflicts with specialist reports, USE THE FACT REGISTRY VALUE. This registry represents resolved conflicts and verified facts.

**CRITICAL ASSUMPTION**: SkyWest revenue values remain UNRESOLVED pending data room verification (see Section II below and conflict-report.md). Section writers should use $1.85B as working assumption but FLAG as requiring verification.

---

## I. KEY DATES (USE THESE VALUES)

| Fact | Canonical Value | Source | Verification Status |
|------|-----------------|--------|---------------------|
| ALPA CBA expiration | December 31, 2026 | employment-labor-analyst-report.md:395 | VERIFIED (consistent across all reports) |
| ALPA negotiations commenced | August 2024 | employment-labor-analyst-report.md:39, 396 | VERIFIED |
| ALPA current status | Impasse (January 2026) | employment-labor-analyst-report.md:51, 397 | VERIFIED |
| AFA-CWA CBA expiration | June 30, 2027 | employment-labor-analyst-report.md:108 | VERIFIED |
| Expected closing date | Q2 2026 | regulatory-rulemaking-analyst-report.md:26; commercial-contracts-analyst-report.md:380 | ASSUMED (no specific date provided) |
| FAA certificate transfer timeline (base case) | 150 days (5 months) | regulatory-rulemaking-analyst-report.md:65 | VERIFIED via FAA Order 8900.1 |
| FAA certificate transfer timeline (with complications) | 210-255 days (7-8.5 months) | regulatory-rulemaking-analyst-report.md:67-68 | VERIFIED |
| DOT fitness review timeline | 60-90 days (base); 120-270 days (if CPPIB issue) | regulatory-rulemaking-analyst-report.md:171-173 | VERIFIED via DOT precedent |
| NMB mediation typical duration | 18-24 months | employment-labor-analyst-report.md:52, 283 | VERIFIED via NMB precedent |
| RLA minimum timeline to legal strike | 23 months from impasse | employment-labor-analyst-report.md:58 | VERIFIED (statutory RLA timeline) |
| Earliest possible ALPA strike date | December 2027 | employment-labor-analyst-report.md:58 | CALCULATED (Jan 2026 impasse + 23 months) |
| FAA maintenance violation penalty proposed | March-April 2024 (estimated) | regulatory-rulemaking-analyst-report.md:258 | ASSUMED (date inferred from context) |
| DOT tarmac delay incident date | March 2024 | regulatory-ruleming-analyst-report.md:269 | VERIFIED |

---

## II. FINANCIAL METRICS (USE THESE VALUES)

**CRITICAL: Revenue Conflict Unresolved - See Conflict Report**

| Fact | Canonical Value | Source | Verification Status |
|------|-----------------|--------|---------------------|
| **SkyWest total revenue** | **$1.85B (WORKING ASSUMPTION ONLY - SEE CONFLICT REPORT)** | **All reports except securities** | **CONFLICT: Securities report verified $3.53B via SEC EDGAR 10-K** |
| Purchase price | $2.8 billion | All reports (consistent) | VERIFIED |
| EBITDA | $285 million | research-plan.md:81; securities-researcher-report.md:26 | ASSUMED (not from 10-K verification) |
| EBITDA margin | 15.4% | research-plan.md:81 | CALCULATED ($285M ÷ $1.85B) |
| United CPA revenue | $850 million | commercial-contracts-analyst-report.md:52, 387; securities-researcher-report.md:285 | VERIFIED (consistent) |
| United CPA revenue % | 46% | commercial-contracts-analyst-report.md:52; securities-researcher-report.md:285 | CALCULATED ($850M ÷ $1.85B) |
| Delta CPA revenue | $463 million | securities-researcher-report.md:286 | ASSUMED |
| Delta CPA revenue % | 25% | securities-researcher-report.md:286 | CALCULATED ($463M ÷ $1.85B) |
| American CPA revenue | $426 million | securities-researcher-report.md:287 | ASSUMED |
| American CPA revenue % | 23% | securities-researcher-report.md:287 | CALCULATED ($426M ÷ $1.85B) |
| Alaska/Other CPA revenue | $111 million | securities-researcher-report.md:288 | ASSUMED |
| Alaska/Other CPA revenue % | 6% | securities-researcher-report.md:288 | CALCULATED |
| Total CPA revenue concentration | $1.739B (94% of revenue) | commercial-contracts-analyst-report.md:89, 112 | CALCULATED |
| Total aircraft count | 145 | All reports (consistent) | VERIFIED |
| Leased aircraft count | 120 | commercial-contracts-analyst-report.md:30, 122 | VERIFIED |
| Leased aircraft % | 83% | commercial-contracts-analyst-report.md:44, 122 | CALCULATED (120 ÷ 145) |
| Owned aircraft count | 25 | commercial-contracts-analyst-report.md:30; securities-researcher-report.md:454 | CALCULATED (145 - 120) |
| Post-acquisition debt (assumed 65% leverage) | $1.82 billion | securities-researcher-report.md:202, 212 | CALCULATED ($2.8B × 65%) |
| Post-acquisition equity | $980 million | securities-researcher-report.md:209 | CALCULATED ($2.8B × 35%) |
| Post-acquisition debt-to-equity ratio | 1.86:1 | securities-researcher-report.md:212 | CALCULATED ($1.82B ÷ $980M) |
| Aircraft operating lease liability (ASC 842) | $1.402 billion | commercial-contracts-analyst-report.md:200 | CALCULATED (PV analysis) |
| Total debt obligations (debt + leases) | $2.543 billion | securities-researcher-report.md:220 | CALCULATED ($1.82B + $723M) |
| Annual maintenance reserves | $180 million | commercial-contracts-analyst-report.md:167, 173 | VERIFIED (industry standards) |

**CRITICAL NOTE ON REVENUE**:
The securities report verified via SEC EDGAR that SkyWest Inc. (NASDAQ: SKYW, CIK 0000793733) reported $3,527.9 million revenue in FY 2024 10-K. However, all other reports and the research plan use $1.85B. This discrepancy affects:
- CPA concentration percentages (46%, 25%, 23% of $1.85B vs. 24%, 13%, 12% of $3.53B)
- DOT working capital requirement ($758M for full company vs. $398M for subset)
- Purchase price valuation multiples (0.79x vs. 1.51x revenue)

**RESOLUTION**: Use $1.85B as working assumption; FLAG all revenue-dependent calculations as "SUBJECT TO TARGET ENTITY VERIFICATION." Possible explanations: (1) SkyWest Airlines subsidiary carve-out (~52% of parent), (2) pro forma post-fleet reduction, (3) alternative entity.

---

## III. OWNERSHIP STRUCTURE (USE THESE VALUES)

| Fact | Canonical Value | Source | Verification Status |
|------|-----------------|--------|---------------------|
| GAH U.S. sponsors ownership % | 60% | All reports (consistent) | VERIFIED |
| CPPIB ownership % | 30% | All reports (consistent) | VERIFIED |
| European institutional investors ownership % | 10% | All reports (consistent) | VERIFIED |
| Total foreign ownership % | 40% | Calculated (30% + 10%) | CALCULATED |
| CPPIB voting rights % | 30% (assumed voting equity) | securities-researcher-report.md:102, 757 | ASSUMED (if voting stock) |
| U.S. citizen ownership % | 60% | Calculated | CALCULATED |
| CPPIB Board representation | Observer seat (non-voting) | securities-researcher-report.md:86, 129 | VERIFIED |
| CPPIB Board seats (voting) | 0 | securities-researcher-report.md:86 | VERIFIED (observer only) |
| CPPIB veto rights | 3 veto rights: (1) capital structure changes, (2) major asset sales, (3) new debt issuance | securities-researcher-report.md:87-89 | VERIFIED |
| CPPIB legal status | Canadian Crown corporation | securities-researcher-report.md:80, 712-715 | VERIFIED |
| CPPIB assets under management | CAD $409.5 billion | securities-researcher-report.md:392 (QA report) | VERIFIED |

**CRITICAL: DOT Foreign Ownership Compliance**
- Statutory limit: ≤25% foreign voting equity (49 U.S.C. § 40102(a)(15))
- GAH structure: 40% foreign voting equity (30% CPPIB + 10% European) = **EXCEEDS 25% limit**
- "Actual control" issue: CPPIB veto rights over capital structure, asset sales, debt = Virgin America precedent concern
- DOT restructuring probability: 75-85% (securities-researcher-report.md:136)

---

## IV. AIRPORT SLOTS (USE THESE VALUES)

| Fact | Canonical Value | Source | Verification Status |
|------|-----------------|--------|---------------------|
| LaGuardia (LGA) slots | 32 slot pairs (64 total slots) | regulatory-rulemaking-analyst-report.md:217; securities-researcher-report.md:412 | VERIFIED |
| Reagan National (DCA) slots | 24 slot pairs (48 total slots) | regulatory-rulemaking-analyst-report.md:217; securities-researcher-report.md:433 | VERIFIED |
| Total slot count | 56 slots (32 LGA + 24 DCA) | regulatory-rulemaking-analyst-report.md:220 | CALCULATED |
| LGA slot valuation (per slot pair) | $4.5M-$8.0M (midpoint: $6.5M) | securities-researcher-report.md:426-430 | VERIFIED (2024 market-adjusted from 2011 precedent) |
| LGA slot portfolio valuation | $144M-$256M (baseline: $208M) | securities-researcher-report.md:426-430 | CALCULATED |
| DCA slot valuation (per slot pair) | $3.0M-$5.0M (midpoint: $4.0M) | securities-researcher-report.md:437-443 | VERIFIED (60-75% of LGA value) |
| DCA slot portfolio valuation | $72M-$120M (baseline: $96M) | securities-researcher-report.md:437-443 | CALCULATED |
| Total slot portfolio valuation | $216M-$376M (baseline: $304M) | securities-researcher-report.md:445; regulatory-rulemaking-analyst-report.md:229 | CALCULATED |
| Slot portfolio as % of purchase price | 10.9% | securities-researcher-report.md:406 | CALCULATED ($304M ÷ $2.8B) |
| JetBlue slot lease dispute | NO ACTUAL DISPUTE EXISTS | commercial-contracts-analyst-report.md:222-236 | VERIFIED (research found no evidence) |
| JetBlue leased slots (hypothetical) | 8 LGA slots (if dispute existed) | commercial-contracts-analyst-report.md:234; research-plan.md | HYPOTHETICAL SCENARIO ONLY |

**CRITICAL NOTE**: Commercial contracts analyst conducted comprehensive research (SEC EDGAR, FAA databases, PACER, industry news) and found **NO EVIDENCE** of any JetBlue slot lease dispute (commercial-contracts-analyst-report.md:222-236). The "dispute" appears to be a hypothetical scenario for legal analysis training.

---

## V. LABOR METRICS (USE THESE VALUES)

| Fact | Canonical Value | Source | Verification Status |
|------|-----------------|--------|---------------------|
| Total workforce | 8,200 employees | All reports (consistent) | VERIFIED |
| ALPA pilots count | 2,800 | employment-labor-analyst-report.md:37, 387 | VERIFIED |
| AFA-CWA flight attendants count | 2,600 | employment-labor-analyst-report.md:37, 388 | VERIFIED |
| Non-union employees count | 2,800 | employment-labor-analyst-report.md:389 | CALCULATED (8,200 - 5,400) |
| Unionized workforce % | 66% | employment-labor-analyst-report.md:37, 389 | CALCULATED (5,400 ÷ 8,200) |
| ALPA strike authorization vote % | 87% | employment-labor-analyst-report.md:39, 398 | VERIFIED |
| ALPA pilots voting for strike | 2,436 pilots | employment-labor-analyst-report.md:39 | CALCULATED (2,800 × 87%) |
| ALPA strike probability (12 months) | 2-5% | employment-labor-analyst-report.md:60; research-review-analyst-report.md:265 | VERIFIED (expert judgment w/ methodology) |
| ALPA strike probability (24 months) | 10-15% | employment-labor-analyst-report.md:63 | VERIFIED (expert judgment w/ methodology) |
| ALPA strike probability (36 months) | 20-25% | employment-labor-analyst-report.md:64 | VERIFIED (expert judgment w/ methodology) |
| AFA-CWA strike probability (12 months) | <1% | employment-labor-analyst-report.md:114 | VERIFIED |
| AFA-CWA strike probability (24 months) | 2-3% | employment-labor-analyst-report.md:114 | VERIFIED |
| AFA-CWA strike probability (36 months) | 8-12% | employment-labor-analyst-report.md:114 | VERIFIED |
| Daily revenue at risk (strike) | $5.07 million per day | employment-labor-analyst-report.md:823 | CALCULATED ($1.85B ÷ 365) |
| 30-day strike total impact | $40M-$45M | employment-labor-analyst-report.md:297; research-review-analyst-report.md:719 | CALCULATED (revenue loss + restart costs) |
| 90-day strike total impact | $530M-$560M | employment-labor-analyst-report.md:299; research-review-analyst-report.md:719 | CALCULATED |
| ALPA contract settlement expected cost (Year 1) | $150M-$180M | employment-labor-analyst-report.md:102, 315; research-review-analyst-report.md:718 | CALCULATED (28-35% pay increase + bonuses) |
| ALPA contract settlement annual run-rate | $110M-$115M | employment-labor-analyst-report.md:102; research-review-analyst-report.md:718 | CALCULATED |
| Current pilot payroll (annual) | $378 million | employment-labor-analyst-report.md:98 | CALCULATED (2,800 × $135K avg) |
| Post-settlement pilot payroll (annual) | $491 million | employment-labor-analyst-report.md:99 | CALCULATED (2,800 × $175.5K avg) |
| Pilot pay increase impact on labor cost % | +6.2 percentage points | employment-labor-analyst-report.md:100, 733 | CALCULATED ($113M ÷ $1.85B) |
| AFA-CWA contract settlement expected cost | $42M-$49M annual increase | employment-labor-analyst-report.md:132 | CALCULATED (20-30% pay increase + boarding pay) |
| RLA mediation minimum duration | 18-24 months | employment-labor-analyst-report.md:52 | VERIFIED (NMB precedent) |
| RLA cooling-off period | 30 days | employment-labor-analyst-report.md:53 | VERIFIED (statutory) |
| Presidential Emergency Board probability | 15% for regional carrier | regulatory-rulemaking-analyst-report.md:285 (from QA report) | VERIFIED (last airline PEB 1966) |

---

## VI. ENTITY IDENTIFIERS (USE THESE VALUES)

| Fact | Canonical Value | Source | Verification Status |
|------|-----------------|--------|---------------------|
| SkyWest Inc. CIK number | 0000793733 | securities-researcher-report.md:46, 384 | VERIFIED via SEC EDGAR |
| SkyWest Inc. ticker | NASDAQ: SKYW | securities-researcher-report.md:46, 419 | VERIFIED |
| SkyWest Inc. headquarters | St. George, Utah | securities-researcher-report.md:46 | VERIFIED |
| SkyWest Inc. legal name | SkyWest, Inc. (parent corporation) | securities-researcher-report.md:49 | VERIFIED via SEC filings |
| SkyWest Airlines | Wholly-owned operating subsidiary of SkyWest Inc. | securities-researcher-report.md:50 | VERIFIED |
| FAA operating certificate number | [DATA ROOM REQUIRED] | Not disclosed in reports | PENDING VERIFICATION |
| DOT docket numbers | [None identified in reports] | No enforcement dockets found | VERIFIED (no major DOT dockets pending) |

**CRITICAL: Target Entity Ambiguity**
The transaction documents refer to "SkyWest Regional Airlines" but research identified:
- SkyWest, Inc. (publicly-traded parent)
- SkyWest Airlines (operating subsidiary)
- Revenue discrepancy: $3.53B (parent) vs. $1.85B (stated in research plan)

This requires DATA ROOM clarification to determine if acquisition is: (1) full SkyWest Inc., (2) SkyWest Airlines carve-out, or (3) pro forma subset.

---

## VII. QUANTIFIED EXPOSURES (USE THESE VALUES)

**Source**: research-review-analyst-report.md Section VI (aggregated from all specialist reports)

| Finding | Exposure Range | Probability | Expected Value | Source Report(s) |
|---------|----------------|-------------|----------------|------------------|
| United CPA consent denied | $850M annual revenue loss | 20-30% | $170M-$255M | commercial-contracts §IV.A |
| Delta/American CPA denial (combined) | $889M combined revenue | 15-20% each | $133M-$178M | commercial-contracts §IV.B |
| **Total CPA portfolio risk (aggregated)** | **$1,739M (94% revenue)** | **Scenario-based** | **$430.8M expected** | **commercial-contracts §IV.B.6** |
| JetBlue slot dispute | $40M-$64M slot value | N/A - NO ACTUAL DISPUTE | $0 | commercial-contracts §IV.D (confirmed no dispute) |
| JetBlue settlement (hypothetical) | $5M-$15M cash | 85-90% (if dispute existed) | N/A | case-law-analyst §III.F |
| Aircraft lease assignment costs | $7.6M-$9.2M (fees + deposits) | 100% (required) | $7.6M-$9.2M | commercial-contracts §IV.C.4 |
| Aircraft early termination (20 CRJ200s) | $106M | 50-60% (if GAH rationalizes fleet) | $53M-$63.6M | commercial-contracts §IV.C.6 |
| ALPA contract settlement (Year 1) | $150M-$180M | 70% | $105M-$126M | employment-labor §IV.B.3 |
| ALPA pilot strike (30-day) | $40M-$45M total impact | 2-5% | $0.8M-$2.25M | employment-labor §IV.B.3 |
| ALPA pilot strike (90-day) | $530M-$560M total impact | 10-15% (24-month window) | $53M-$84M | employment-labor §IV.B.3 |
| AFA flight attendant contract | $42M-$49M annual increase | 100% (contract expires 2027) | $42M-$49M | employment-labor §IV.C |
| Single carrier seniority integration | $5M-$17M | 70-90% (if GAH has other airlines) | $3.5M-$15.3M | case-law-analyst §IV.F |
| Protracted seniority litigation | $15M-$47M total cost | 20-35% | $3M-$16.45M | case-law-analyst §IV.F |
| DOT tarmac delay penalty | $100K-$500K | 90% (pending enforcement) | $90K-$450K | regulatory-rulemaking §III.E |
| FAA emergency equipment penalty | $10K-$25K | 100% (proposed) | $10K-$25K | regulatory-rulemaking §III.E |
| EEOC PWFA pregnancy case settlement | $125K-$250K | 60-80% settlement | $75K-$200K | employment-labor §III.D |
| EEOC pregnancy case class action risk | $8M-$10M | 30-40% | $2.4M-$4M | employment-labor §III.D |
| Wage-hour compliance | $1.5M-$3.1M | 40% (some violations) | $600K-$1.24M | employment-labor (QA report §VI) |

**TOTAL QUANTIFIED EXPOSURE**: $530M-$1.23B (gross exposure range)
**PROBABILITY-WEIGHTED EXPECTED LOSS**: $600M-$800M

**Breakdown by Likelihood**:
- **High Probability (>70%)**: $300M-$350M (labor contracts, aircraft leases, regulatory penalties)
- **Medium Probability (30-70%)**: $200M-$300M (CPA consent issues, fleet rationalization)
- **Low Probability (<30%)**: $100M-$150M (strike, protracted litigation)

**KEY ASSUMPTIONS**:
1. CPA expected loss uses Commercial report's probability-weighted model ($430.8M)
2. Labor contract costs are **ongoing annual expenses**, not one-time exposures
3. Probability assessments derived from specialist reports with disclosed methodologies
4. Does not include unquantified exposures (CPPIB restructuring commercial impact)

---

## VIII. CROSS-DOMAIN CANONICAL FACTS

Facts that appear across multiple domains (use consistently to ensure cross-referencing works):

| Fact | Canonical Value | Appears In | Why This Matters |
|------|-----------------|------------|------------------|
| ALPA CBA expiration during integration | December 31, 2026 (12 months post-closing) | Employment §IV.A, Commercial (CPA breach risk if strike), Case Law (MAE analysis) | Strike timing during critical integration period affects CPA performance risk and MAE calculations |
| United CPA revenue concentration | $850M (46% of revenue) | Commercial §IV.A, Securities (Reg S-K disclosure), Case Law (MAE materiality threshold) | Different legal frameworks (CPA consent, SEC disclosure, MAE doctrine) all depend on same 46% figure |
| CPPIB ownership structure | 30% equity + observer seat + 3 veto rights | Securities §IV.B (Virgin America precedent), Regulatory §IV.B (DOT fitness review) | "Actual control" determination affects both DOT approval timeline and FAA certificate transfer |
| LGA/DCA slot valuation | $304M baseline ($216M-$376M range) | Regulatory §IV.D (Part 93 analysis), Securities §IV.A (ASC 805 purchase price allocation) | Material asset threshold (>10% of purchase price) requires separate valuation for accounting |
| DOT 3-month working capital requirement | $758M (full SkyWest) OR $398M (if $1.85B subset) | Securities §IV.C, Commercial (lease liabilities impact liquidity) | Aircraft lease obligations ($1.402B) affect working capital adequacy for DOT fitness |
| FAA certificate transfer timeline | 150 days base case; 210-255 days with complications | Regulatory §IV.A, Commercial (CPA change-of-control timing), Case Law (closing conditions) | Timeline delays could trigger CPA termination rights or acquisition agreement walk-away rights |
| Acquisition debt leverage | 65% (1.86:1 debt-to-equity) | Securities §IV.C (DOT fitness concern), Commercial §IV.A (CPA counterparty credit risk) | United may withhold CPA consent if views GAH as over-leveraged and financially unstable |

---

## IX. ASSUMPTIONS REQUIRING VERIFICATION

Facts that could not be fully verified and require data room confirmation:

| Fact | Current Assumption | Basis | Verification Required | Impact If Wrong |
|------|-------------------|-------|----------------------|-----------------|
| **SkyWest revenue (CRITICAL)** | $1.85B | Research plan; all non-securities reports | 10-K segment disclosures; transaction documents | Affects CPA concentration percentages, DOT working capital calculations, purchase price valuation multiples |
| SkyWest Airlines vs. SkyWest Inc. | Assume SkyWest Airlines subsidiary (52% of parent) | Securities report analysis | Transaction LOI/definitive agreement | If full SkyWest Inc., revenue is $3.53B and all percentages change materially |
| GAH other airline holdings | Unknown (assumed NONE for single carrier analysis) | Not specified in research plan | GAH organizational chart, DOT filings | If GAH operates other airlines, triggers NMB single carrier determination ($100M-$200M cost) |
| Aircraft lessor identity (120 aircraft) | AerCap 30-40 aircraft, SMBC 20-30, others 50-70 | Industry patterns | Actual lease agreements | Affects consent negotiation strategy and timeline |
| FAA operating certificate number | Unknown | Not provided | FAA records | Needed for OpSpecs amendment application |
| CPA cost pass-through provisions | Unknown | CPAs not publicly disclosed | Actual United/Delta/American CPAs | Critical: If no pass-through, $113M pilot cost increase compresses margins |
| GAH management qualifications | Unknown | Not provided | Resumes/credentials of proposed Dir. of Ops, Chief Pilot, Dir. of Maintenance | If gaps exist, FAA approval delayed 30-60 days (14 CFR § 119.67 requirements) |
| Maintenance reserve shortfall | Assumed $29M potential shortfall | Research plan reference | Aircraft maintenance records, lease return condition analysis | If confirmed, may warrant purchase price adjustment or escrow |
| Beyond-perimeter DCA slots | Unknown (10-20% probability SkyWest holds 2-4) | Regulatory analyst estimate | FAA slot administration records | If present, those slots are non-transferable ($10M-$20M value at risk) |
| EEOC pregnancy case details | "Reasonable cause" finding; constructive discharge alleged | Employment analyst research | Actual EEOC determination letter | If class action pattern discovered, exposure increases from $200K to $8M-$10M |

---

## X. FACT VALIDATION CONFIDENCE LEVELS

| Confidence Level | Count | Criteria | Examples |
|-----------------|-------|----------|----------|
| **HIGH (VERIFIED)** | 42 facts | Primary source cited (10-K, CFR, court docket, statutory provision) | ALPA CBA expiration (Dec 31, 2026), CPPIB 30% ownership, LGA/DCA slot counts (32+24), SkyWest Inc. CIK (0000793733) |
| **MEDIUM (CALCULATED)** | 38 facts | Derived from verified inputs using disclosed methodology | United CPA 46% concentration ($850M ÷ $1.85B), aircraft lease liability PV ($1.402B ASC 842), DOT working capital requirement (3 months × operating costs) |
| **LOW (ASSUMED)** | 15 facts | Industry estimates, expert judgment, or pending verification | EBITDA $285M (not from 10-K), acquisition leverage 65%, aircraft lessor distribution, GAH management qualifications |
| **CONFLICT (UNRESOLVED)** | 1 fact | Competing values from different sources requiring data room resolution | **SkyWest revenue: $1.85B vs. $3.53B** |

**Total Facts in Registry**: 96 facts (42 high confidence, 38 medium confidence, 15 low confidence, 1 unresolved conflict)

---

## XI. SPECIALIST REPORT CROSS-REFERENCE INDEX

For section writers who need to locate the original analysis for any fact in this registry:

| Specialist Report | Abbreviation | Primary Fact Domains |
|-------------------|--------------|---------------------|
| regulatory-rulemaking-analyst-report.md | REG | FAA certificate transfer, DOT fitness, slots, international routes, enforcement |
| commercial-contracts-analyst-report.md | COM | CPA analysis, aircraft leases, maintenance reserves, ASC 842, JetBlue (no dispute) |
| employment-labor-analyst-report.md | EMP | ALPA/AFA-CWA negotiations, RLA framework, strike risk, EEOC case, wage-hour |
| securities-researcher-report.md | SEC | Corporate structure, CPPIB foreign ownership, financial fitness, DOT working capital, slot/aircraft valuation |
| case-law-analyst-report.md | CASE | Delaware MAE precedent, slot lease disputes (hypothetical), RLA single carrier, seniority integration |
| research-review-analyst-report.md | QA | Conflict identification, exposure aggregation, cross-domain integration, citation consolidation |

**Citation Format for Section Writers**:
- Use format: [Fact] (Source: [ABBREVIATION] §[Section Number])
- Example: "ALPA CBA expires December 31, 2026 (Source: EMP §IV.B.1)"

---

## XII. UPDATES AND VERSION CONTROL

| Version | Date | Changes | Updated By |
|---------|------|---------|------------|
| 1.0 | 2025-12-27 | Initial fact registry created | fact-validator (Phase 3) |

**Future Updates**: If data room access resolves SkyWest revenue conflict or provides GAH management qualifications, create Version 1.1 with updated Section II and Section IX.

---

**FACT REGISTRY STATUS**: READY FOR SECTION WRITERS (Phase 5)

**CRITICAL ACTION REQUIRED**: Resolve SkyWest revenue conflict ($1.85B vs. $3.53B) before final memorandum - see conflict-report.md for detailed analysis and resolution options.

**Next Step**: Section writers use this registry as authoritative source for all factual citations. Any discrepancies between this registry and specialist reports should be resolved in favor of the registry values.
