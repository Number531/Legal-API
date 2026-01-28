# PRIVILEGED AND CONFIDENTIAL
# ATTORNEY WORK PRODUCT

---

# VERMONT CAPTIVE REINSURANCE REGULATORY ANALYSIS

**Prepared For:** Legal Memorandum Synthesis — Project Chronos
**Prepared By:** Federal Regulatory Research Specialist
**Date:** 2026-01-16
**Re:** Vermont Captive Reinsurance Regulation — Liberty Re Vermont Inc. ($850M AXXX/XXX Reserves)
**Status:** ✅ Research Complete

---

## RESEARCH TRACEABILITY METADATA

| Field | Value |
|-------|-------|
| **Report ID** | 2026-01-16-T2-vermont-captive-reinsurance |
| **Subagent** | regulatory-rulemaking-analyst (Federal Regulatory Research Specialist) |
| **Model** | claude-sonnet-4-5-20250929 |
| **Research Started** | 2026-01-16T19:31:30Z |
| **Research Completed** | 2026-01-16T20:15:00Z |
| **WebSearch Queries Executed** | 10 |
| **Primary Sources Analyzed** | Vermont 8 V.S.A. Chapter 141, AG48, AG38, NAIC Model #785, NAIC Model #787, Nebraska Title 210 Chapter 65 |
| **Case Law Reviewed** | Ross v. AXA Equitable Life Insurance Co. (S.D.N.Y. 2015), Robainas v. MetLife (2d Cir. 2017) |
| **Regulatory Reports** | NYDFS June 2013 Shadow Insurance Report, NAIC AG48 adoption history |
| **Data Freshness** | Current as of January 2026; AG48/Model #787 state adoption verified August 2025 |

---

## I. EXECUTIVE SUMMARY

### Overview

Liberty Life Insurance Company (LLIC) has ceded **$850 million in AXXX/XXX redundant reserves** to Liberty Reinsurance VT LLC (Liberty Re Vermont), a Vermont-domiciled captive reinsurer. This structure is common in the life insurance industry to finance statutory reserves that significantly exceed economic reserves for term life insurance policies issued under pre-2017 formulaic reserve standards. However, Liberty Re Vermont's **14% asset backing** ($120M assets vs. $850M reserves) likely falls below NAIC Actuarial Guideline 48 (AG48) requirements for "Primary Security," creating material regulatory risk that Nebraska Department of Insurance may disallow reserve credit. If disallowed, LLIC's Risk-Based Capital (RBC) ratio would drop from **188% to 114%** (below the 150% Regulatory Action Level), triggering mandatory regulatory intervention and potentially blocking the $2.9B acquisition.

This report analyzes Vermont captive insurance regulation (8 V.S.A. Chapter 141), AG38/AG48 compliance requirements, NYDFS "shadow insurance" investigations (2013-2015), Nebraska-Vermont regulatory coordination, and recapture scenarios. The probability-weighted exposure from captive reinsurance regulatory risk is **$43.1M**, with worst-case exposure of **$730M** if full recapture required.

### Key Findings

**1. Vermont Captive Structure Follows Industry Practice But Has Compliance Gaps**

Liberty Re Vermont operates as a Vermont captive reinsurer, likely structured as either a pure captive (owned by Liberty Life Holdings LLC) or a Special Purpose Financial Insurance Company (SPFI). Vermont's captive framework (8 V.S.A. Chapter 141) requires:
- Minimum capital $250K (pure captive) or $5M (SPFI)
- Reserves "actuarially sufficient to support liabilities incurred" for life reinsurance
- Annual actuarial opinion filed with Vermont DFR

Liberty Re Vermont's disclosed structure:
- **$850M reserves ceded** from LLIC (100% coinsurance of AXXX/XXX term life reserves)
- **$120M assets** held at captive (14% of reserves)
- **$730M parental guarantee** from Liberty Life Holdings LLC (86% of reserves)

**Compliance Issue:** The **14% asset backing** is substantially below industry expectations for AG48 "Primary Security" (40-50% of statutory reserves = $340M-$425M). This creates vulnerability that Nebraska DOI may reject the structure as non-compliant.

[CONFIDENCE: HIGH for Vermont statutory requirements; MEDIUM for AG48 Primary Security threshold (40-50% based on industry studies, not Liberty Re Vermont-specific actuarial opinion)]

**2. NAIC Actuarial Guidelines AG38 and AG48 Govern Redundant Reserve Financing**

**AG38 (Actuarial Guideline XXXVIII):** Addresses valuation of term life and universal life with secondary guarantees under Regulation XXX. Industry consensus: XXX/AXXX statutory reserves are "overly conservative," exceeding economic reserves by **2-3×**. For Liberty Re Vermont's $850M statutory reserves, economic reserves likely **$300M-$400M** (35-50%).

**AG48 (Actuarial Guideline XLVIII):** Adopted December 2014, effective January 1, 2015, in response to NYDFS "shadow insurance" investigation. AG48 establishes two-tier security framework:

- **Primary Security:** High-quality assets at captive reinsurer equal to "Required Level of Primary Security" (economic reserve + margin for conservatism). Calculated using actuarial method (stochastic/deterministic modeling). Industry expectation: **40-50% of statutory reserves**.

- **Other Security:** Gap between Primary Security and full statutory reserves may be backed by parental guarantees, letters of credit (LOCs), contingent capital, or lower-quality assets.

**Application to Liberty Re Vermont:**
- Primary Security: $120M assets (14% of $850M) — **LIKELY INSUFFICIENT**
- Other Security: $730M parental guarantee (86% of $850M)
- **If $120M < Required Level of Primary Security ($340M-$425M),** structure is non-compliant with AG48

**Critical Gap:** Without access to Liberty Re Vermont's actuarial opinion calculating the Required Level of Primary Security under AG48, cannot definitively confirm compliance. However, 14% asset backing is **dramatically below** the 40-50% industry standard, suggesting high probability of non-compliance.

[CONFIDENCE: MEDIUM — AG48 threshold estimate based on industry literature; HIGH confidence that 14% is insufficient]

**3. Nebraska Retains AG48 (Not NAIC Model #787), Providing Regulatory Discretion**

42 jurisdictions have adopted NAIC Model #787 (Term and Universal Life Insurance Reserve Financing Model Regulation), which codifies AG48 principles with enhanced standards. However, **Nebraska is one of 9 jurisdictions** that continue to rely on **AG48** as the governing framework (others: ID, IL, KY, MN, NH, NY, OH, TN).

**Implication:** Nebraska DOI has **significant discretion** in interpreting AG48 requirements and accepting/rejecting captive structures. Key areas of discretion:
- Whether $120M assets satisfy "Required Level of Primary Security"
- Whether $730M parental guarantee qualifies as acceptable "Other Security"
- Whether parental guarantee from entity with $280M net worth (2.6× leverage) is enforceable

**Nebraska's Credit for Reinsurance Framework (Title 210 Nebraska Admin. Code, Chapter 65):**
Liberty Re Vermont is an **unauthorized reinsurer** (not licensed in Nebraska). Default rule: Unauthorized reinsurers require **100% collateral** (trust, LOC, or funds withheld) unless they qualify as Certified Reinsurer under NAIC Model #785.

Liberty Re Vermont **does NOT qualify as Certified Reinsurer** because:
- $120M assets < $250M minimum capital/surplus requirement
- Captive structure (not standalone commercial reinsurer)
- Relies on parental guarantee (not independent financial strength)

**Regulatory Question:** Does Nebraska DOI accept the $730M parental guarantee as satisfying the 100% collateral requirement? AG48 permits parental guarantees as "Other Security," but Nebraska has discretion to reject if guarantor's financial capacity is insufficient.

[CONFIDENCE: HIGH — Nebraska's AG48 retention verified; Certified Reinsurer disqualification clear]

**4. "Shadow Insurance" Investigations (2013-2015) Led to AG48 But No Enforcement Actions**

**NYDFS Investigation (July 2012 – June 2013):**
- NYDFS sent letters to ~80 life insurers requesting captive reinsurance information
- June 2013: NYDFS issued report identifying **$48 billion in "shadow insurance" arrangements**
- Report called transactions "financial alchemy" and "shell game[] to hide risk"
- Concerns: Captives holding insufficient assets, parental guarantees from potentially insolvent parents, offshore jurisdictions (Bermuda/Cayman Islands) or Vermont

**NYDFS Recommendations:**
- National moratorium on captive reinsurance pending reform
- Enhanced collateral requirements
- Uniform regulatory standards

**NAIC Response (February 2014 – December 2014):**
- NAIC did NOT impose moratorium
- February 2014: NAIC issued preliminary report (later criticized as "defanged" by Superintendent Lawsky)
- **December 2014:** NAIC adopted **AG48**, effective January 1, 2015
- Regulatory philosophy: Acknowledge XXX/AXXX reserves are overly conservative, but require adequate Primary Security + Other Security

**Class Action Litigation (2015-2017) — All Dismissed:**
Following NYDFS's June 2013 report, policyholders filed class actions against MetLife (2 lawsuits), AXA Equitable (2 lawsuits), and Lincoln National (1 lawsuit) alleging shadow insurance practices harmed policyholders.

**Outcomes:**
- July 2015: S.D.N.Y. dismissed *Ross v. AXA Equitable Life Insurance* (no Article III standing)
- February 2017: Second Circuit affirmed dismissals in *Ross v. AXA* and *Robainas v. MetLife*
- Legal holding: Policyholders cannot demonstrate "concrete injury-in-fact" from captive reinsurance practices

**Implication:** Private litigation risk from policyholders is **very low** post-2017 Second Circuit precedent. Regulatory scrutiny continues, but civil liability exposure is minimal.

**Current Status (2024-2026):**
- No major enforcement actions against captive reinsurers 2015-2024
- Regulatory focus shifted to AG48/Model #787 implementation
- Principle-Based Reserves (PBR/VM-20) for post-2017 products reduced need for captive structures (only legacy pre-2017 products subject to AXXX/XXX)

[CONFIDENCE: HIGH — NYDFS investigation timeline and case law outcomes verified]

**5. Parental Guarantee Concentration Risk: $730M Guarantee vs. $280M Net Worth = 2.6× Leverage**

Liberty Life Holdings LLC (LLIC's parent company) provides a **$730M parental guarantee** to backstop Liberty Re Vermont's $730M reserve shortfall (gap between $850M reserves and $120M assets).

**Concentration Risk Calculation:**
- Guarantee: $730M
- Guarantor Net Worth: $280M (disclosed in research plan)
- **Leverage Ratio: 2.6×** ($730M ÷ $280M)

**Regulatory Concerns:**
1. **Guarantor Cannot Perform:** If LLIC fails and captive must pay claims, can Liberty Life Holdings perform a $730M obligation with only $280M net worth?
2. **Circular Guarantee Risk:** Liberty Life Holdings' primary asset is LLIC itself. If LLIC fails, guarantor's net worth likely impaired simultaneously.
3. **Unsecured vs. Secured:** If guarantee is unsecured, Liberty Life Holdings' creditors have pari passu claims, reducing recovery for LLIC policyholders.

**Nebraska DOI Likely Concerns:**
- 2.6× leverage exceeds typical guarantor capacity ratios (insurers generally prefer <1.5× for parental guarantees)
- No evidence of guarantor's other assets/liquidity to support $730M obligation
- Stress scenario: If LLIC's losses trigger captive obligation, Liberty Life Holdings may be unable to capitalize the captive

**Due Diligence Action Required:**
- Obtain full parental guarantee agreement (security, subordination, covenants)
- Obtain Liberty Life Holdings consolidated financials (total assets, liabilities, debt schedule)
- Assess guarantor's liquidity and debt capacity to perform $730M obligation

[CONFIDENCE: HIGH — mathematical calculation; MEDIUM — regulatory concern threshold (no specific Nebraska DOI guidance on acceptable leverage ratios)]

**6. Critical RBC Impact if Reserve Credit Disallowed: 188% → 114% (Below Regulatory Action Level)**

**Current RBC Ratio (With Captive Reserve Credit):**
- Total Adjusted Capital (TAC): $1.85B
- Authorized Control Level (ACL): $982M
- **RBC Ratio: 188%** (TAC ÷ ACL)
- Status: Below 200% Company Action Level threshold, requiring RBC Plan filing with Nebraska DOI

**If Nebraska DOI Disallows Reserve Credit (Recapture Scenario):**
- LLIC must reestablish $850M reserves on balance sheet
- Captive returns $120M assets to LLIC (partial offset)
- **Net Impact on TAC: -$730M** (gap between reserves and assets)
- New TAC: $1.85B - $730M = **$1.12B**
- ACL: ~$982M (remains approximately constant; reserve increase offsets C1/C2 risk reduction)
- **New RBC Ratio: 114%** ($1.12B ÷ $982M)

**RBC Action Level Implications:**

| Level | Threshold | Status | Regulatory Action |
|-------|-----------|--------|-------------------|
| Company Action Level (CAL) | 200% | Current: 188% | File RBC Plan with corrective actions |
| **Regulatory Action Level (RAL)** | **150%** | **Recapture: 114%** | **Commissioner MAY place under regulatory control** |
| Authorized Control Level (ACL) | 100% | Below RAL | Commissioner authorized to seize company |
| Mandatory Control Level (MCL) | 70% | Well above MCL | Commissioner MUST seize company |

**Finding:** If recapture occurs, LLIC's RBC ratio **114%** falls below **150% RAL**, triggering:
- Mandatory Nebraska DOI intervention (commissioner has authority to place insurer under regulatory control)
- Rehabilitation or receivership proceedings possible
- **Acquisition likely cannot close** until capital restored to >200%

**Deal-Blocking Risk:** This is a **critical, deal-blocking exposure**. Acquirer (American Financial Holdings LLC) would need to inject **$730M additional capital** (on top of the already-planned $150M injection) to restore RBC above 200%, totaling **$880M capital required** (30% of $2.9B purchase price).

[CONFIDENCE: HIGH — mathematical calculation based on disclosed financials]

**7. Mitigation Strategies: LOC Backstop ($300M-$500M) or Capital Injection ($220M-$305M)**

**Option 1: Post Letter of Credit (LOC) Backstop**
- Liberty Life Holdings LLC posts $300M-$500M irrevocable LOC with Nebraska-qualified bank
- LOC backstops parental guarantee, providing liquid collateral if Nebraska DOI questions guarantee enforceability
- Preserves reserve credit for LLIC; no impact on RBC ratio
- **Cost:** 0.75% annually = **$2.25M-$3.75M** LOC fees (industry standard per captive insurance literature)
- **Feasibility:** Requires Liberty Life Holdings to have borrowing capacity/credit facility; may be challenging given $280M net worth

**Option 2: Capital Injection into Liberty Re Vermont**
- Increase captive assets from $120M to $340M-$425M (40-50% Primary Security threshold)
- Additional capital required: **$220M-$305M**
- Satisfies AG48 "Required Level of Primary Security" fully
- Eliminates Nebraska DOI compliance concerns
- **Challenge:** Liberty Life Holdings' $280M net worth may be insufficient to provide $220M-$305M capital injection

**Option 3: Capital Injection into LLIC (Acquirer Provides)**
- Acquirer injects $150M via surplus notes (already planned per research plan)
- If recapture occurs, acquirer injects additional **$730M**
- Total capital required: **$880M**
- **Impact on Deal Economics:** $880M ÷ $2.9B purchase price = **30% additional equity required** — economically unattractive
- **More Likely:** Acquirer walks from deal or renegotiates $730M purchase price reduction

**Option 4: Restructure Captive Pre-Closing**
- Partial recapture (e.g., recapture $400M reserves, retain $450M at captive)
- Increase asset backing percentage for remaining reserves
- Reduce reliance on parental guarantee
- **Timeline Risk:** Restructuring requires actuarial recalculations, treaty amendments, regulatory approvals (Vermont DFR + Nebraska DOI) — **6-12 months**, delaying Q3 2025 closing

**Option 5: Maintain Status Quo + Regulatory Engagement**
- Provide Nebraska DOI with detailed actuarial analysis demonstrating AG48 compliance
- Argue $120M assets + $730M guarantee = adequate security under AG48 "Other Security" provisions
- Emphasize Vermont DFR oversight and annual actuarial opinions
- **Risk:** Nebraska DOI rejects argument; mandates LOC or recapture

**Recommended Strategy:**
- **Immediate (Pre-Closing):** Obtain Liberty Re Vermont actuarial opinion; determine actual Required Level of Primary Security under AG48
- **If Non-Compliant:** Negotiate with seller to post $300M-$500M LOC backstop as closing condition
- **Transaction Structure:** $75M-$100M escrow for 24 months, released upon Nebraska DOI final exam accepting captive structure

[CONFIDENCE: HIGH for cost estimates and mechanics; MEDIUM for feasibility given Liberty Life Holdings' financial capacity]

**8. Probability-Weighted Exposure: $43.1M (Escrow Recommended: $75M-$100M)**

**Scenario Analysis:**

| Scenario | Probability | Exposure | Weighted Exposure |
|----------|-------------|----------|-------------------|
| **Base Case:** Nebraska DOI accepts current structure | 70% | $0 | $0 |
| **Stress Case 1:** LOC required ($300M-$500M) | 20% | $15M PV (5yr @ $3M/yr) | $3M |
| **Stress Case 2:** Partial recapture (capital injection $220M-$305M) | 7% | $260M (midpoint) | $18.2M |
| **Worst Case:** Full recapture ($730M surplus reduction) | 3% | $730M | $21.9M |
| **Total Probability-Weighted Exposure:** | 100% | — | **$43.1M** |

**Probability Methodology:**
- **Base Case (70%):** Based on industry practice (many life insurers use similar captive structures), grandfathering potential (if captive established pre-2015), and Vermont DFR oversight providing regulatory comfort to Nebraska DOI.
- **Stress Case 1 (20%):** Nebraska DOI raises concerns but allows captive to continue with enhanced collateral (LOC backstop). Reflects AG48 discretion and Nebraska's conservative posture given LLIC's 188% RBC ratio.
- **Stress Case 2 (7%):** Nebraska DOI requires increased Primary Security but accepts restructuring. Lower probability reflects industry disruption concerns (wholesale disallowances would affect multiple insurers).
- **Worst Case (3%):** Nebraska DOI completely disallows reserve credit. Very low probability because Vermont DFR oversight and actuarial opinions provide some regulatory reliance, and full disallowance would trigger systemic concerns.

[METHODOLOGY: Expert judgment based on regulatory trends, AG48 implementation history 2015-2024, and Nebraska DOI's examination practices. NOT based on Nebraska-specific precedent or actuarial opinion.]

**Recommended Escrow/Holdback:**
- **Amount:** **$75M-$100M** (covers Stress Case 2 partial recapture + margin)
- **Duration:** **24 months** post-closing (allows Nebraska DOI examination cycle to complete + resolution of any findings)
- **Release Conditions:**
  - Nebraska DOI final examination report explicitly accepts Liberty Re Vermont captive structure
  - No recapture mandated or additional collateral required
  - LLIC's RBC ratio maintained >200% throughout escrow period

**Purchase Price Adjustment Mechanisms:**
- If Nebraska DOI requires LOC: Seller bears ongoing LOC fees OR purchase price reduction equal to present value of fees
- If Stress Case 2: Dollar-for-dollar price reduction for capital injection amount required
- If Worst Case: Acquirer walk right OR $730M purchase price reduction

[CONFIDENCE: MEDIUM — probability estimates based on expert judgment; escrow recommendation follows M&A best practices for regulatory risk]

### Cross-Domain Impacts (For Coverage-Gap-Analyzer)

| Finding | Impacts Domain | Target Specialist | Specific Research Question | Severity |
|---------|----------------|-------------------|---------------------------|----------|
| **RBC ratio 188% → 114% if captive disallowed** | T1: Nebraska Regulation | regulatory-analyst (T1) | How does Nebraska DOI $150M capital injection plan interact with potential $730M captive recapture? Does acquirer need $880M total capital? | **HIGH** |
| **Reinsurance treaty recapture provisions** | T6: Reinsurance Contracts | contracts-analyst (T6) | Does Liberty Re Vermont treaty contain change-of-control recapture clause triggered by acquisition? What are recapture notice periods and economic penalties? | HIGH |
| **$730M parental guarantee enforceability** | T6: Reinsurance Contracts | contracts-analyst (T6) | Is parental guarantee from Liberty Life Holdings secured or unsecured? What are guarantor's other debt obligations? Circular guarantee risk if LLIC is guarantor's primary asset? | MEDIUM |
| **Purchase price adjustment for captive risk** | T9: M&A Transaction Structure | contracts-analyst (T9) | How should purchase agreement address captive regulatory risk? Escrow amount, release conditions, price adjustment mechanisms if LOC or recapture required? | HIGH |
| **Financial impact aggregation** | T10: Financial Impact | financial-analyst (T10) | Include $43.1M probability-weighted exposure and $75M-$100M escrow recommendation in overall deal risk model. How does captive risk interact with other capital needs (RBC Plan $150M)? | HIGH |

### Finding Confidence Levels

| Finding | Confidence | Basis |
|---------|------------|-------|
| Vermont captive statutory framework (8 V.S.A. Chapter 141) | **HIGH** | Verified statutes, Vermont DFR regulations |
| AG48 two-tier security framework (Primary + Other Security) | **HIGH** | NAIC adopted guideline, effective Jan. 1, 2015 |
| Nebraska retains AG48 (not Model #787) | **HIGH** | NAIC Model Law State Adoption Page verified |
| Required Level of Primary Security = 40-50% of statutory reserves | **MEDIUM** | Industry studies (Harrington 2014-2015); NOT Liberty Re Vermont-specific actuarial opinion |
| $120M assets insufficient to meet AG48 Primary Security | **MEDIUM** | 14% << 40-50% strongly suggests non-compliance, but cannot confirm without actuarial opinion |
| Parental guarantee concentration risk (2.6× leverage) concerns Nebraska DOI | **MEDIUM** | Mathematical calculation HIGH; regulatory concern threshold extrapolated (no Nebraska-specific guidance) |
| RBC ratio 188% → 114% if recapture | **HIGH** | Mathematical calculation based on disclosed financials ($1.85B TAC, $982M ACL, $730M impact) |
| Probability of Nebraska DOI disallowance: 10-15% | **LOW-MEDIUM** | Research plan estimate; based on regulatory trends, NOT Nebraska precedent or exam findings |
| Class action litigation dismissed (Ross v. AXA, Robainas v. MetLife) | **HIGH** | Verified case law, Second Circuit 2017 |
| No major enforcement actions 2015-2024 | **HIGH** | Public records search, NYDFS enforcement actions reviewed |
| LOC fee ~0.75% annually | **HIGH** | Industry standard per captive insurance literature |
| Probability-weighted exposure $43.1M | **MEDIUM** | Scenario probabilities based on expert judgment, not statistical modeling |

---

## II. SCOPE OF RESEARCH

### A. Research Questions Addressed
1. Vermont captive insurance regulatory framework (8 V.S.A. Chapter 141)
2. AG38/AG48 compliance for AXXX/XXX redundant reserve financing
3. "Shadow insurance" regulatory scrutiny (NYDFS Circular Letter No. 8, 2013-2015)
4. Nebraska-Vermont regulatory coordination for affiliated reinsurance
5. Recapture scenarios and capital impact on acquirer

### B. Databases and Sources Consulted
- Federal Register (regulatory guidance on captive reinsurance)
- Vermont Department of Financial Regulation (captive insurance regulation)
- NAIC regulatory framework (AG38, AG48, Model #785)
- Multi-state regulatory task force investigations
- Federal Reserve guidance (SR 13-24)

### C. Limitations and Caveats
- Liberty Re Vermont Inc. specific examination reports not publicly available
- Nebraska DOI internal review of affiliated reinsurance not disclosed
- Actual collateral agreements and parental guarantee terms not provided

---

## III. FACTUAL BACKGROUND

### A. Transaction Structure

Liberty Life Insurance Company (domiciled in Nebraska) has ceded $850 million in AXXX/XXX reserves to Liberty Reinsurance VT LLC (Liberty Re Vermont), a Vermont captive reinsurer. The captive structure consists of:

- **Total Reserves Ceded:** $850 million (term life insurance with level premiums/guarantees)
- **Captive Assets:** $120 million (14% of ceded reserves)
- **Parental Guarantee:** $730 million (86% of ceded reserves) from Liberty Life Holdings LLC ($280M net worth = 2.6× concentration)
- **Nebraska RBC Impact:** If reserve credit disallowed, LLIC's RBC ratio would decline from 188% to 114% (below 150% Regulatory Action Level)

### B. Regulatory Environment Evolution

**2013-2015 Shadow Insurance Investigations:**
- June 2013: NYDFS issued report identifying $48 billion in "shadow insurance" arrangements
- December 2014: NAIC adopted Actuarial Guideline 48 (AG48) establishing reserve credit standards
- 2015-2016: Multi-state regulatory task force investigations into captive reinsurance practices

**Current Regulatory Framework (2024-2026):**
- NAIC Model #787 (XXX/AXXX Model Regulation) adopted in 42 jurisdictions
- **Nebraska retains AG48 as governing framework** (NOT Model #787 adopter) [VERIFIED: NAIC Model Law State Adoption Page]
- Vermont maintains dual framework: AG48 + Vermont captive insurance regulations (8 V.S.A. Chapter 141)

---

## IV. DETAILED ANALYSIS

### A. Vermont Captive Insurance Regulatory Framework

#### 1. Statutory Authority and Structure

Vermont's captive insurance framework is codified at **8 V.S.A. Chapter 141** (Captive Insurance Companies Act), first enacted in 1981 and continuously updated through 2024. [VERIFIED: Vermont Legislature, https://legislature.vermont.gov/statutes/fullchapter/08/141]

**Types of Captive Entities (8 V.S.A. § 6001):**
- Pure captive insurance company
- Association captive insurance company
- **Special Purpose Financial Insurance Company (SPFI)** — used for life reinsurance securitization
- Sponsored captive insurance company
- Agency captive insurance company

Liberty Re Vermont likely operates as either a **pure captive** (owned by Liberty Life Holdings LLC to insure affiliated risks) or an **SPFI** (if structured for capital markets transactions).

#### 2. Capital and Surplus Requirements

**Minimum Capital by Entity Type (8 V.S.A. § 6004, effective July 1, 2024):**

| Captive Type | Minimum Capital & Surplus |
|--------------|--------------------------|
| Pure captive | $250,000 |
| Association captive | $500,000 |
| **Special Purpose Financial Insurance Company (SPFI)** | **$5,000,000** |
| Sponsored captive | $100,000 |
| Risk retention group | $1,000,000 |

**Form of Capital (8 V.S.A. § 6004(c)):**
Capital and surplus may be in the form of:
- Cash
- Marketable securities
- Trust approved by Commissioner (Commissioner as sole beneficiary)
- **Irrevocable letter of credit** issued by qualified bank

**Finding:** If Liberty Re Vermont operates as an SPFI (likely for $850M life reinsurance), it must maintain minimum $5M capital. The disclosed $120M in assets exceeds this threshold. [CONFIDENCE: HIGH — statutory requirement, verified]

#### 3. Life Insurance Reinsurance Specific Requirements

Vermont Department of Financial Regulation has issued specific regulations for **Captive Insurance Companies Reinsuring Life Insurance Policies**. [VERIFIED: Vermont DFR, https://dfr.vermont.gov/reg-bul-ord/captive-insurance-companies-reinsuring-life-insurance-policies]

**Key Requirements:**
1. **Actuarial Sufficiency:** Captive must maintain reserves that are "actuarially sufficient to support the liabilities incurred" in reinsuring life policies (including term, universal, variable life, and related guarantees/riders).

2. **Annual Actuarial Report:** Must file annual report demonstrating reserve adequacy under Vermont standards.

3. **Additional Surplus:** Commissioner may prescribe additional surplus requirements based on the specific nature of the insurance business.

**Application to Liberty Re Vermont:**
- $120M assets vs. $850M reserves = **14% asset backing**
- $730M gap covered by parental guarantee from Liberty Life Holdings LLC
- This structure relies on "Other Security" under AG48 framework (discussed below)

### B. NAIC Actuarial Guideline 38 (AG38) — AXXX Reserves

#### 1. Purpose and Scope

**Actuarial Guideline XXXVIII (AG38)** provides guidance to valuation actuaries on applying the Valuation of Life Insurance Policies Model Regulation (commonly known as "Regulation XXX" or "Regulation Triple-X") to term life insurance and universal life insurance with secondary guarantees. [VERIFIED: NAIC, https://content.naic.org/cipr-topics/actuarial-guideline-xxxviii-ag-38]

**Historical Context:**
- NAIC Model Regulation 830 (XXX) established formulaic reserve requirements for term life insurance
- AG38 addressed universal life policies with "secondary guarantees" (no-lapse guarantees)
- Industry consensus: XXX/AXXX reserves are "overly conservative" and exceed economic reserves by 2-3×

**Why Captives Were Used:**
Life insurers unable to finance redundant XXX reserves on term portfolios during the 2008 financial crisis began using captive reinsurance to move excess reserves off-balance-sheet while maintaining economic reserves at the captive.

#### 2. Redundant Reserve Problem

**Definition:** "Redundant reserves" are statutory reserves that significantly exceed the economic reserves needed to cover expected claims based on actuarial modeling.

**Magnitude for Liberty Re Vermont:**
- $850M ceded reserves represent statutory AXXX requirements
- Economic reserves likely $300M-$400M (35-50% of statutory) based on industry patterns
- **Redundancy:** $450M-$550M excess reserves

**Regulatory Rationale for Captive Use:**
Instead of holding $850M in high-quality assets at LLIC (impacting RBC ratio), the transaction:
1. Cedes reserves to Vermont captive ($850M liability transfer)
2. Captive holds $120M in assets (covering economic reserves + margin)
3. Parent company provides $730M guarantee (non-asset security)
4. LLIC obtains reserve credit, improving statutory surplus by $730M

### C. NAIC Actuarial Guideline 48 (AG48) — Reserve Credit Standards

#### 1. Adoption and Effective Date

**AG48** was adopted by the NAIC Executive Committee and Plenary in **December 2014**, effective **January 1, 2015**, in response to the "shadow insurance" investigations. [VERIFIED: NAIC documents, https://www.actuary.org/wp-content/uploads/2025/06/Actuarial%20Guideline%20XLVIII%20(AG%2048).pdf]

**Purpose:** Define rules for new XXX/AXXX reserve financing transactions to address solvency implications while allowing continued use of captive structures with enhanced standards.

#### 2. Key Definitions: Primary Security vs. Other Security

AG48 introduced a two-tier security framework:

**Primary Security:**
- High-quality assets held at the captive reinsurer
- Must equal the "Required Level of Primary Security" (economic reserve + margin)
- Calculation uses "Actuarial Method" (stochastic/deterministic modeling)
- Typical range: 35-60% of statutory reserves

**Other Security:**
- Additional backing for the gap between Primary Security and full statutory reserves
- May include:
  - Parental guarantees
  - Letters of credit
  - Contingent capital agreements
  - Lower-quality assets

**Application to Liberty Re Vermont:**
- Primary Security: $120M assets (14% of $850M)
- Other Security: $730M parental guarantee (86% of $850M)
- **Issue:** If $120M < Required Level of Primary Security under AG48, structure may be non-compliant

#### 3. Required Level of Primary Security Calculation

AG48 specifies the actuarial method for calculating the economic reserve layer:

**Factors Considered:**
1. Mortality assumptions (percentage of CSO mortality tables)
2. Lapse assumptions (policy surrender rates)
3. Expense assumptions (policy maintenance costs)
4. Investment income assumptions (portfolio yield)
5. **Margin for conservatism** (additional cushion above best-estimate reserves)

**Regulatory Expectation:**
For term life insurance with AXXX redundancy:
- Economic reserve typically **40-50% of statutory reserve**
- For $850M statutory, Required Level of Primary Security likely **$340M-$425M**

**Critical Finding:**
If Liberty Re Vermont's $120M assets < $340M Required Level of Primary Security:
- **Structure may be non-compliant with AG48**
- Nebraska DOI may disallow reserve credit
- LLIC would need to post additional collateral or recapture reserves

[CONFIDENCE: MEDIUM — calculation requires access to actuarial opinion; 40-50% range based on industry studies]

#### 4. Exemptions from AG48

AG48 does **not** apply to:
- Risks ceded to **Certified Reinsurers** under NAIC Model #785 (rated Secure-1 through Secure-6)
- Risks ceded to reinsurers meeting NAIC Credit for Reinsurance Model Act Section 2.E requirements

**Liberty Re Vermont Status:**
- Unlikely to qualify as Certified Reinsurer (captive structure, parental guarantee reliance)
- Therefore subject to full AG48 requirements

### D. "Shadow Insurance" Regulatory Scrutiny (2013-2015)

#### 1. NYDFS Investigation and June 2013 Report

**Timeline:**
- **July 2012:** NYDFS sent letters to ~80 life insurers requesting information on captive insurance arrangements
- **June 2013:** NYDFS issued report identifying $48 billion in "shadow insurance" arrangements by NY-based life insurers

**Key Findings from NYDFS Report:**
The report called captive reinsurance transactions "financial alchemy" that are a "shell game[] to hide risk and loosen reserve requirements," potentially putting "the stability of the broader financial system at risk." [VERIFIED: Joseph M. Belth chronology, http://www.josephmbelth.com/2015/05/no-100-shadow-insurancea-chronology-of.html]

**NYDFS Concerns:**
- Life insurers using captive entities (often offshore in Bermuda/Cayman Islands or in Vermont) to divert reserves
- $48 billion in hidden deals through "shell companies"
- Captives holding insufficient assets relative to ceded reserves
- Parental guarantees from parent companies potentially unable to perform if stress scenario occurred

**NYDFS Call for Action:**
Superintendent Lawsky called for a "national moratorium" on captive reinsurance arrangements pending regulatory reform.

#### 2. NAIC Response and AG48 Adoption (December 2014)

**NAIC Deliberations:**
- NAIC did not impose moratorium requested by NYDFS
- February 2014: NAIC issued preliminary report on captive reinsurance (later "defanged" according to Superintendent Lawsky)
- Superintendent Lawsky sent letter to fellow commissioners criticizing "weak response" to shadow insurance problems

**Outcome — AG48 (December 2014):**
Instead of banning captive arrangements, NAIC adopted **Actuarial Guideline 48 (AG48)**, effective January 1, 2015, establishing:
- Required Level of Primary Security (economic reserves + margin)
- Two-tier security framework (Primary Security + Other Security)
- Uniform national standards for XXX/AXXX reserve financing

**Regulatory Philosophy:**
NAIC acknowledged that XXX/AXXX reserves were "overly conservative" (2-3× economic reserves) but needed safeguards to ensure adequate asset backing.

#### 3. Class Action Litigation (2015-2017) — All Dismissed

Following NYDFS's June 2013 report, policyholders filed class action lawsuits against major insurers alleging harm from shadow insurance practices.

**Cases Filed:**
- 2 lawsuits against **MetLife**
- 2 lawsuits against **AXA Equitable**
- 1 lawsuit against **Lincoln National**
- All filed in federal courts (U.S. District Court for S.D.N.Y. and D.N.J.)

**Outcomes — All Dismissed on Standing Grounds:**

**AXA Equitable Cases:**
- July 21, 2015: S.D.N.Y. granted AXA's motion to dismiss *Ross v. AXA Equitable Life Insurance* [VERIFIED: Lexology, https://www.lexology.com/library/detail.aspx?g=9d973d2a-cfc4-488c-af54-fd72f2f31934]
- Court held: Plaintiffs failed to demonstrate "concrete injury-in-fact" under Article III standing requirements
- February 2017: Second Circuit affirmed dismissal in both *Ross v. AXA* and *Robainas v. MetLife* [VERIFIED: Mondaq, https://www.mondaq.com/unitedstates/insurance-laws-and-products/585388/second-circuit-affirms-dismissal-of-shadow-insurance-lawsuits]

**MetLife Cases:**
- Similarly dismissed on standing grounds
- Courts found policyholders could not show actual harm from captive reinsurance practices

**Legal Holding:**
Even though regulators raised concerns about systemic risks, individual policyholders lacked standing because they could not demonstrate:
- Their policies were less secure than represented
- They suffered concrete financial harm
- Imminent risk of insurer insolvency

**Implication for Liberty Re Vermont:**
- No civil liability precedent for captive reinsurance structures
- Regulatory scrutiny continues, but private litigation risk is low post-*Ross/Robainas*

#### 4. Current Status (2024-2026)

**Regulatory Framework Evolution:**
- 42 states adopted NAIC Model #787 (superseding AG48 with codified standards)
- 9 states continue using AG48 (including **Nebraska**)
- Vermont maintains both AG48 + Vermont captive regulations

**Reduced Regulatory Intensity:**
- No major enforcement actions against captive reinsurers 2015-2024
- Focus shifted to implementation of AG48/Model #787 standards
- Principle-Based Reserves (PBR/VM-20) for post-2017 products reduced need for captive structures

**Residual Risk:**
- Legacy AXXX/XXX reserves (pre-2017 policies) still financed through captives
- Heightened scrutiny if captive asset backing < Required Level of Primary Security
- Nebraska DOI examination authority to disallow reserve credit if non-compliant

### E. Nebraska-Vermont Regulatory Coordination

#### 1. Nebraska's Authority Over Affiliated Reinsurance

**Statutory Framework:**
Nebraska Insurance Code and Title 210 Nebraska Administrative Code, Chapter 65 govern credit for reinsurance. [VERIFIED: Nebraska DOI, https://doi.nebraska.gov/insurers/reinsurance-information]

**Categories of Reinsurers:**
1. **Authorized Reinsurers** — Licensed in Nebraska, full credit without collateral
2. **Certified Reinsurers** — Unauthorized but meet NAIC Model #785 standards, reduced collateral based on rating (Secure-1 through Secure-6: 0%-100%)
3. **Unauthorized Reinsurers** — Require 100% collateral (LOC, trust, or funds withheld) UNLESS qualify for exemption

**Liberty Re Vermont Status:**
- **Unauthorized reinsurer** (Vermont domicile, not licensed in Nebraska)
- Likely does NOT qualify as Certified Reinsurer (captive structure, parental guarantee reliance)
- Therefore requires **100% collateral** to support reserve credit

**Current Collateral Structure:**
- $120M assets at captive (14%)
- $730M parental guarantee from Liberty Life Holdings LLC (86%)

**Nebraska DOI Question:**
Does the parental guarantee qualify as acceptable "collateral" under Nebraska Admin. Code Title 210, Chapter 65?

#### 2. AG48 Compliance Review by Nebraska DOI

**Nebraska's Governing Framework:**
Nebraska is one of 9 jurisdictions relying on **AG48** (not Model #787) [VERIFIED: NAIC Model Law State Adoption Page]

**Nebraska DOI Examination Authority:**
- Annual financial examination of LLIC (domestic insurer)
- Review of affiliated reinsurance arrangements
- Authority to disallow reserve credit if:
  - Captive holds insufficient Primary Security under AG48
  - Parental guarantee does not meet collateral standards
  - Economic reserves not actuarially sound

**2024 Market Conduct Examination:**
Research plan indicates Nebraska DOI conducted market conduct examination in 2024 with preliminary findings. The examination likely included review of:
- Liberty Re Vermont captive structure
- AG48 compliance (Required Level of Primary Security)
- Parental guarantee enforceability
- Impact on LLIC's RBC ratio if credit disallowed

**Probability of Disallowance (Estimated):**
Research plan estimates **10-15% probability** Nebraska DOI disallows reserve credit. [CONFIDENCE: LOW-MEDIUM — estimate based on regulatory trends, not Nebraska-specific precedent]

**Factors Increasing Disallowance Risk:**
1. **Low Asset Backing:** $120M (14%) likely below Required Level of Primary Security ($340M-$425M = 40-50% of statutory)
2. **Parental Guarantee Concentration:** $730M guarantee vs. $280M net worth of guarantor = **2.6× leverage**
3. **LLIC's RBC Stress:** LLIC already at 188% RBC (below 200% CAL threshold), making Nebraska DOI more conservative

**Factors Decreasing Disallowance Risk:**
1. **Grandfathering:** If Liberty Re Vermont captive established pre-2015 (before AG48 effective date), may be grandfathered under prior standards
2. **Industry Practice:** Many life insurers use similar structures; wholesale disallowance would be industry-disruptive
3. **Actuarial Opinion:** If Vermont-licensed actuary opines reserves are adequate, Nebraska may defer

#### 3. Vermont DFR Oversight of Liberty Re Vermont

**Vermont's Role:**
- Domiciliary regulator of Liberty Re Vermont
- Annual financial examination
- Review of actuarial opinion on reserve adequacy
- Capital and surplus requirements enforcement

**Vermont DFR Life Reinsurance Regulation:**
Captives reinsuring life policies must maintain reserves that are "actuarially sufficient to support the liabilities incurred." [VERIFIED: Vermont DFR, https://dfr.vermont.gov/reg-bul-ord/captive-insurance-companies-reinsuring-life-insurance-policies]

**Vermont's Incentive:**
Vermont has largest captive insurance domicile in U.S. (900+ captives as of 2024), generating significant premium tax revenue. Vermont's regulatory philosophy balances:
- Protecting ceding insurer solvency
- Maintaining Vermont's competitive captive environment

**Coordination Between Nebraska and Vermont:**
- Nebraska DOI may request information from Vermont DFR
- Vermont DFR likely shares annual financial statements and actuarial opinions
- No formal memorandum of understanding (MOU) publicly disclosed

### F. NAIC Model #785 — Credit for Reinsurance Model Law

#### 1. Unauthorized Reinsurer Collateral Requirements

**Default Rule (NAIC Model #785):**
Insurers ceding to **unauthorized reinsurers** must post **100% collateral** to obtain reserve credit, unless the reinsurer qualifies for an exception. [VERIFIED: NAIC Model #785, https://content.naic.org/sites/default/files/model-law-785.pdf]

**Forms of Acceptable Collateral:**
1. **Trust Fund:** Assets held in qualified U.S. financial institution, Commissioner as sole beneficiary
2. **Letter of Credit (LOC):** Irrevocable, qualified bank, using NAIC-approved form
3. **Funds Withheld:** Ceding insurer retains assets, reinsurer has beneficial interest

**Parental Guarantees:**
- NOT explicitly listed as acceptable collateral in Model #785
- AG48 permits parental guarantees as "Other Security" (not Primary Security)
- Nebraska's acceptance of parental guarantees = regulatory discretion

#### 2. Certified Reinsurer Exception

**Alternative to 100% Collateral:**
Unauthorized reinsurers may apply for **Certified Reinsurer** status, allowing reduced collateral based on financial strength rating.

**Collateral Sliding Scale (Model #785):**

| Rating | Collateral Required |
|--------|---------------------|
| Secure-1 | 0% |
| Secure-2 | 10% |
| Secure-3 | 20% |
| Secure-4 | 50% |
| Secure-5 | 75% |
| Vulnerable-6 | 100% |

**Requirements for Certification:**
- Domiciled in Qualified Jurisdiction
- Minimum capital/surplus $250M
- Solvency ratio RBC 300%+
- Annual financial statements filed with NAIC

**Liberty Re Vermont Unlikely to Qualify:**
- $120M assets < $250M minimum capital/surplus
- Captive structure (not commercial reinsurer)
- Relies on parental guarantee (not standalone financial strength)

**Implication:**
Liberty Re Vermont does not qualify for Certified Reinsurer reduced collateral. Under strict Model #785 interpretation, Nebraska could require **$850M collateral** (LOC or trust) to allow LLIC's reserve credit.

**Current Structure ($730M Shortfall):**
- $120M assets held at captive
- $730M parental guarantee (questionable whether acceptable under Model #785)
- If Nebraska requires full collateral → LLIC or Liberty Life Holdings must post $730M LOC

### G. Recapture Scenarios and Capital Impact

#### 1. Recapture Mechanics

**Definition:**
"Recapture" = ceding insurer (LLIC) terminates reinsurance treaty with captive (Liberty Re Vermont) and takes back the ceded reserves.

**Recapture Triggers:**
- **Voluntary:** LLIC decides to recapture for risk management or capital optimization
- **Regulatory Mandate:** Nebraska DOI disallows reserve credit, forcing LLIC to re-establish reserves
- **Reinsurance Treaty Terms:** Contractual recapture provisions (typically after 10 years, or upon rating downgrade, or change of control)

**Process:**
1. LLIC gives notice to Liberty Re Vermont of intent to recapture
2. Liberty Re Vermont transfers reserves back to LLIC ($850M liability)
3. LLIC reestablishes statutory reserves on balance sheet
4. Captive's $120M assets returned to LLIC (partial offset)
5. **Net Impact on LLIC Surplus:** -$730M (gap between reserves and assets)

#### 2. Impact on LLIC RBC Ratio (Critical)

**Current RBC Ratio:**
- Total Adjusted Capital (TAC): $1.85B
- Authorized Control Level (ACL): $982M
- **RBC Ratio:** 188% (TAC ÷ ACL)

**If Nebraska Disallows Reserve Credit (Recapture Scenario):**
- TAC declines by $730M → **$1.12B**
- ACL remains ~$982M (reserve increase offsets risk reduction)
- **New RBC Ratio:** **114%** (falls between 100-150% = Regulatory Action Level)

**RBC Action Levels:**

| Level | Threshold | Regulatory Action |
|-------|-----------|-------------------|
| Company Action Level (CAL) | 200% | File RBC Plan with corrective actions |
| **Regulatory Action Level (RAL)** | **150%** | Commissioner may place under regulatory control |
| **Authorized Control Level (ACL)** | **100%** | Commissioner authorized to seize company |
| Mandatory Control Level (MCL) | 70% | Commissioner MUST seize company |

**Finding:** If recapture occurs, LLIC's RBC ratio **114%** falls below 150% RAL, triggering:
- Mandatory regulatory intervention
- Potential rehabilitation or receivership proceedings
- Acquisition likely cannot close until capital restored

[CONFIDENCE: HIGH — mathematical calculation based on disclosed financials]

#### 3. Mitigation Strategies

**Option 1: Post Additional Collateral (LOC)**
- Liberty Life Holdings LLC posts $300M-$500M irrevocable LOC with Nebraska-qualified bank
- Backstops parental guarantee, satisfies Nebraska DOI collateral requirement
- Preserves reserve credit for LLIC
- **Cost:** 0.75% annually = $2.25M-$3.75M LOC fees [VERIFIED: Industry standard, https://www.captive.com/captives-101/letters-of-credit-(locs)-the-basics]

**Option 2: Capital Injection into Liberty Re Vermont**
- Increase captive assets from $120M to $340M-$425M (Required Level of Primary Security)
- Requires $220M-$305M additional capital contribution
- Satisfies AG48 Primary Security requirements
- **Challenge:** Liberty Life Holdings net worth $280M may be insufficient

**Option 3: Capital Injection into LLIC**
- Acquirer (American Financial Holdings LLC) injects $150M via surplus notes (already planned per research plan)
- Additional $730M injection if recapture occurs
- Total capital required: $880M
- **Impact on Deal Economics:** $880M capital ÷ $2.9B purchase price = 30% additional equity required

**Option 4: Restructure Captive (Pre-Closing)**
- Renegotiate reinsurance treaty to increase asset backing
- Partial recapture (e.g., recapture $400M, retain $450M at captive)
- Reduce reliance on parental guarantee
- **Timeline Risk:** Restructuring may take 6-12 months, delaying Q3 2025 closing

**Option 5: Maintain Status Quo + Regulatory Engagement**
- LLIC provides Nebraska DOI with actuarial analysis demonstrating AG48 compliance
- Argue $120M assets + $730M guarantee = adequate security
- Emphasize Liberty Life Holdings' $280M net worth and guarantee enforceability
- **Risk:** Nebraska DOI rejects argument, mandates recapture or LOC

---

## V. RISK FACTORS AND CONCERNS

### A. Identified Risks

| Risk Factor | Severity | Likelihood | Quantified Exposure | Mitigation Strategy |
|-------------|----------|------------|---------------------|---------------------|
| **Nebraska DOI disallows reserve credit** | **CRITICAL** | **Medium (10-15%)** | **$730M surplus reduction → RBC 114%** | Post $300M-$500M LOC; inject capital into captive |
| **Primary Security insufficient under AG48** | HIGH | High (60-70%) | $220M-$305M additional capital required | Capital injection into captive; actuarial opinion supporting adequacy |
| **Parental guarantee concentration risk** | HIGH | Medium (30-40%) | $730M guarantee ÷ $280M guarantor net worth = 2.6× | Diversify security (LOC + guarantee); increase guarantor net worth |
| **Recapture triggered by change of control** | MEDIUM | Low (5-10%) | $730M surplus reduction if contractual recapture clause triggered by acquisition | Review reinsurance treaty recapture provisions; obtain reinsurer consent pre-closing |
| **Vermont DFR requires increased capital** | MEDIUM | Low (5-10%) | $130M-$305M to reach $250M-$425M captive assets | Capital injection into captive |
| **Civil litigation (policyholder class action)** | LOW | Very Low (<5%) | $25M-$50M settlement range | Precedent: *Ross v. AXA* dismissed on standing; low risk post-2017 |

### B. Red Flags Requiring Further Investigation

**1. Actual Primary Security Calculation**
- **Issue:** Without access to Liberty Re Vermont's actuarial opinion, cannot verify whether $120M assets meet AG48 "Required Level of Primary Security"
- **Required:** Obtain actuarial opinion from Vermont-licensed actuary calculating economic reserve under AG48 methodology
- **Due Diligence Action:** Request from seller in data room

**2. Parental Guarantee Enforceability**
- **Issue:** $730M guarantee from Liberty Life Holdings LLC ($280M net worth) = 2.6× leverage raises enforceability concerns
- **Questions:**
  - Is guarantee secured by specific assets?
  - What are Liberty Life Holdings' other obligations/debt?
  - Can guarantor perform if LLIC fails (circular guarantee risk)?
- **Due Diligence Action:** Review guarantee agreement; obtain Liberty Life Holdings consolidated financials

**3. Reinsurance Treaty Recapture Provisions**
- **Issue:** Contractual recapture clauses may be triggered by change of control (acquisition)
- **Questions:**
  - Does acquisition of LLIC trigger recapture right for Liberty Re Vermont?
  - What notice period applies?
  - Are there economic penalties for recapture?
- **Due Diligence Action:** Review reinsurance agreement; obtain legal opinion on change-of-control implications

**4. Nebraska DOI 2024 Market Conduct Exam — Captive Findings**
- **Issue:** Research plan indicates Nebraska DOI conducting market conduct exam with preliminary findings in Q1 2025
- **Questions:**
  - Did exam specifically review Liberty Re Vermont captive structure?
  - Any preliminary findings on AG48 compliance?
  - Nebraska DOI position on parental guarantee acceptability?
- **Due Diligence Action:** Request exam status update from seller; engage with Nebraska DOI (with seller cooperation)

**5. Grandfathering Status**
- **Issue:** If Liberty Re Vermont captive established **before January 1, 2015** (AG48 effective date), may be grandfathered under prior standards
- **Critical Date:** When was Liberty Re Vermont captive established and when did LLIC begin ceding reserves?
- **Due Diligence Action:** Obtain formation documents and initial reinsurance treaty date

### C. Potential Exposure Analysis

**Base Case (70% Probability):**
- Nebraska DOI accepts current captive structure
- Parental guarantee deemed acceptable collateral
- No recapture required
- **Exposure:** $0
- **Acquirer Action:** Monitor annually; maintain good regulatory relations

**Stress Case 1: LOC Required (20% Probability):**
- Nebraska DOI requires additional collateral but allows captive to continue
- Liberty Life Holdings posts $300M-$500M LOC backstop
- Reserve credit maintained
- **Exposure:** $2.25M-$3.75M annually (0.75% LOC fee)
- **Acquirer Action:** Negotiate LOC posting pre-closing or post-closing within 180 days

**Stress Case 2: Partial Recapture (7% Probability):**
- Nebraska DOI requires increased Primary Security at captive
- Capital injection into Liberty Re Vermont: $220M-$305M
- Partial recapture if capital unavailable
- **Exposure:** $220M-$305M capital requirement
- **Acquirer Action:** Include in purchase price negotiation; escrow adjustment

**Worst Case: Full Recapture (3% Probability):**
- Nebraska DOI disallows reserve credit entirely
- LLIC must reestablish $850M reserves, return $120M assets from captive
- Surplus declines $730M
- RBC ratio → 114% (below 150% RAL)
- **Exposure:** $730M capital injection required to restore RBC above 200%
- **Acquirer Action:** Walk from deal OR renegotiate purchase price reduction of $730M

**Probability-Weighted Exposure:**
- Base Case: 70% × $0 = $0
- Stress Case 1: 20% × $15M (present value 5yr at $3M/yr) = $3M
- Stress Case 2: 7% × $260M (midpoint) = $18.2M
- Worst Case: 3% × $730M = $21.9M
- **Total Weighted Exposure:** **$43.1M**

**Recommended Escrow/Holdback:**
- **Amount:** $75M-$100M (covers Stress Case 2 + margin)
- **Duration:** 24 months post-closing (allows Nebraska DOI exam cycle + resolution)
- **Release Conditions:**
  - Nebraska DOI final examination report accepts captive structure
  - No recapture mandated
  - RBC ratio maintained >200%

---

## VI. CONCLUSIONS AND RECOMMENDATIONS

### A. Summary of Conclusions

1. **Vermont Captive Structure is Common But Vulnerable:** Liberty Re Vermont's captive structure ($850M reserves, $120M assets, $730M parental guarantee) follows industry practice for AXXX/XXX redundant reserve financing. However, the **14% asset backing** likely falls below AG48's Required Level of Primary Security (40-50% = $340M-$425M), creating regulatory vulnerability.

2. **Nebraska Retains AG48 (Not Model #787):** Nebraska is one of 9 jurisdictions that has **not** adopted NAIC Model #787, instead relying on Actuarial Guideline 48 as the governing framework for captive reinsurance. This provides Nebraska DOI significant discretion in accepting or rejecting parental guarantees as "Other Security."

3. **Critical RBC Impact if Disallowed:** If Nebraska DOI disallows reserve credit, LLIC's RBC ratio drops from **188% to 114%** (below the 150% Regulatory Action Level), triggering mandatory regulatory intervention and potentially blocking the acquisition. This is a **deal-blocking risk**.

4. **Parental Guarantee Concentration Risk:** The $730M guarantee from Liberty Life Holdings LLC ($280M net worth) represents **2.6× leverage**, raising serious questions about guarantor ability to perform in stress scenarios. Nebraska DOI may view this as inadequate "Other Security."

5. **Shadow Insurance Precedent Provides Litigation Insulation:** Class action lawsuits against AXA Equitable and MetLife (2015-2017) were **all dismissed** on Article III standing grounds (*Ross v. AXA*, *Robainas v. MetLife*). Private litigation risk from policyholders is **very low** post-2017 Second Circuit precedent.

6. **No Major Enforcement Actions 2015-2024:** Despite NYDFS's aggressive 2013 investigation ($48B shadow insurance identified), **no major enforcement actions** or settlements occurred 2015-2024. Regulatory focus shifted to AG48/Model #787 implementation, not wholesale captive bans.

7. **Mitigation Options Exist But Are Costly:** Posting a $300M-$500M LOC backstop would preserve reserve credit at annual cost of $2.25M-$3.75M (0.75% fee). Capital injection into captive ($220M-$305M) would satisfy AG48 Primary Security but may exceed Liberty Life Holdings' financial capacity.

8. **Probability-Weighted Exposure: $43M:** Across all scenarios (base case, stress cases, worst case), the probability-weighted exposure from captive reinsurance regulatory risk is **$43.1M**.

9. **Recommended Escrow: $75M-$100M for 24 Months:** Given the 10-15% probability of Nebraska DOI disallowance and the potential $220M-$730M exposure range, a **$75M-$100M escrow** held for 24 months post-closing is prudent risk mitigation.

10. **Due Diligence Gaps Must Be Closed:** Critical information needed: (1) Liberty Re Vermont actuarial opinion on AG48 compliance, (2) parental guarantee agreement terms, (3) reinsurance treaty recapture provisions, (4) Nebraska DOI 2024 market conduct exam findings on captive, (5) captive formation date (grandfathering status).

### B. Recommended Next Steps

**Immediate Actions (Pre-Closing, Next 30-60 Days):**

1. **Obtain Liberty Re Vermont Actuarial Opinion**
   - Request from seller's data room
   - Engage independent actuary to review AG48 "Required Level of Primary Security" calculation
   - Verify whether $120M assets meets economic reserve + margin standard

2. **Review Parental Guarantee Agreement**
   - Obtain full guarantee document
   - Analyze guarantee security, subordination, and enforceability provisions
   - Obtain Liberty Life Holdings consolidated financials and debt schedule
   - Assess guarantor's ability to perform $730M obligation

3. **Review Reinsurance Treaty with Liberty Re Vermont**
   - Identify recapture provisions (timing, triggers, notice requirements)
   - Determine if change-of-control (acquisition) triggers recapture right
   - Assess economic penalties for recapture
   - Engage reinsurance treaty attorney for legal opinion

4. **Engage with Nebraska DOI (Seller Cooperation Required)**
   - Request status of 2024 market conduct examination
   - Inquire whether exam reviewed Liberty Re Vermont captive structure
   - Understand Nebraska DOI's position on parental guarantee acceptability
   - Gauge regulator's openness to alternative collateral structures (LOC backstop)

5. **Confirm Grandfathering Status**
   - Obtain Liberty Re Vermont formation documents
   - Determine date of initial reinsurance treaty with LLIC
   - If established **before January 1, 2015**, captive may be grandfathered under pre-AG48 standards

**Transaction Structure Recommendations:**

6. **Condition Precedent: Nebraska DOI Acceptance**
   - Make closing contingent on Nebraska DOI's written confirmation that current captive structure is acceptable OR
   - Require seller to post $300M-$500M LOC backstop pre-closing if Nebraska DOI raises concerns

7. **Purchase Price Adjustment Mechanism**
   - If Nebraska DOI requires LOC: Seller bears ongoing LOC fees OR price reduction of present value of fees
   - If partial recapture required: Dollar-for-dollar price reduction for capital injection amount
   - If full recapture required ($730M): Acquirer walk right OR $730M purchase price reduction

8. **Escrow/Holdback**
   - **Amount:** $75M-$100M
   - **Duration:** 24 months post-closing
   - **Release:** Upon Nebraska DOI final examination report accepting captive structure

9. **Representation & Warranty Insurance**
   - Obtain RWI policy covering captive reinsurance regulatory risk
   - Policy limit: $200M-$300M (covers Stress Case 2 + margin)
   - Retention: $10M-$15M (acquirer retains first-dollar risk)

**Post-Closing Monitoring (If Transaction Proceeds):**

10. **Annual Actuarial Review**
    - Engage independent actuary to review Liberty Re Vermont's annual actuarial opinion
    - Monitor compliance with AG48 Required Level of Primary Security
    - Assess reserve adequacy under evolving mortality/lapse experience

11. **Nebraska DOI Relations**
    - Proactive engagement with Nebraska DOI insurance department
    - Provide annual updates on captive structure and reserve adequacy
    - Address any concerns before they escalate to formal examination findings

12. **Captive Restructuring Option (Year 2-3)**
    - If acquisition closes and LLIC stabilizes, consider restructuring captive:
      - Increase Primary Security assets to $340M-$425M (satisfy AG48 fully)
      - Replace parental guarantee with LOC from acquirer's credit facility
      - Transition to Certified Reinsurer status (if feasible, reduce collateral)

### C. Outstanding Questions

**Critical Questions Requiring Seller Response:**

1. **What is the Required Level of Primary Security calculated in Liberty Re Vermont's most recent actuarial opinion under AG48?**
   - If $120M < RLPS, captive is non-compliant
   - Quantifies additional capital needed

2. **Is the parental guarantee from Liberty Life Holdings LLC secured by specific assets, or is it an unsecured obligation?**
   - Secured guarantee = stronger enforceability
   - Unsecured = Nebraska DOI may reject as insufficient collateral

3. **Does the reinsurance treaty between LLIC and Liberty Re Vermont contain a change-of-control recapture provision triggered by the acquisition?**
   - If yes, recapture may be automatic upon closing
   - Need to negotiate waiver or consent from Liberty Life Holdings

4. **What are Nebraska DOI's preliminary findings from the 2024 market conduct examination regarding Liberty Re Vermont?**
   - Any concerns raised about AG48 compliance?
   - Any requirements for additional collateral or restructuring?

5. **When was Liberty Re Vermont established, and when did LLIC begin ceding reserves to the captive?**
   - Pre-2015 establishment = potential grandfathering under pre-AG48 standards
   - Post-2015 = subject to full AG48 requirements from inception

6. **Has LLIC or Liberty Life Holdings received any communication from Nebraska DOI or Vermont DFR expressing concerns about the captive structure?**
   - Any examination letters, orders, or informal discussions?
   - Understanding regulator sentiment is critical

---

## VII. SOURCE CITATIONS

### A. Statutes and Regulations

Vermont Statutes Annotated. (2024). Title 8, Chapter 141: Captive Insurance Companies. https://legislature.vermont.gov/statutes/fullchapter/08/141

Vermont Statutes Annotated. (2024). 8 V.S.A. § 6001 (Definitions). https://legislature.vermont.gov/statutes/section/08/141/06001

Vermont Statutes Annotated. (2024). 8 V.S.A. § 6004 (Capital and surplus requirements). https://legislature.vermont.gov/statutes/section/08/141/06004

Nebraska Insurance Code. Chapter 44. https://nebraskalegislature.gov/laws/browse-chapters.php?chapter=44

Nebraska Administrative Code. Title 210, Chapter 65 (Credit for Reinsurance). Referenced at https://doi.nebraska.gov/insurers/reinsurance-information

### B. NAIC Guidance and Model Laws

National Association of Insurance Commissioners. (2014). Actuarial Guideline XLVIII (AG 48). Effective January 1, 2015. https://www.actuary.org/wp-content/uploads/2025/06/Actuarial%20Guideline%20XLVIII%20(AG%2048).pdf

National Association of Insurance Commissioners. Actuarial Guideline XXXVIII (AG 38) — The Application of the Valuation of Life Insurance Policies Model Regulation. https://content.naic.org/cipr-topics/actuarial-guideline-xxxviii-ag-38

National Association of Insurance Commissioners. Model Law #785: Credit for Reinsurance Model Law. https://content.naic.org/sites/default/files/model-law-785.pdf

National Association of Insurance Commissioners. Model Law #787: Term and Universal Life Insurance Reserve Financing Model Regulation. https://content.naic.org/sites/default/files/model-law-787.pdf

National Association of Insurance Commissioners. (2024). Model Law State Adoption Page — Model #787. https://content.naic.org/sites/default/files/model-law-state-page-673.pdf (Confirms Nebraska relies on AG 48, not Model #787)

National Association of Insurance Commissioners. Insurance Topics | Captive Insurance Companies. https://content.naic.org/insurance-topics/captive-insurance-companies

National Association of Insurance Commissioners. Term and Universal Life Insurance Reserve Financing Government Affairs Brief. https://content.naic.org/sites/default/files/government-affairs-brief-term-universal-life-reserve-financing.pdf

### C. Regulatory Actions and Reports

New York State Department of Financial Services. (2013, June). Report on Shadow Insurance [describing $48 billion in captive reinsurance arrangements]. Referenced in Belth, J.M. (2015). Shadow Insurance—A Chronology. http://www.josephmbelth.com/2015/05/no-100-shadow-insurancea-chronology-of.html

Vermont Department of Financial Regulation. Captive Insurance Companies Reinsuring Life Insurance Policies (Regulation). https://dfr.vermont.gov/reg-bul-ord/captive-insurance-companies-reinsuring-life-insurance-policies

Vermont Department of Financial Regulation. Captives Section. https://dfr.vermont.gov/category/sections/captives

Nebraska Department of Insurance. Reinsurance Information. https://doi.nebraska.gov/insurers/reinsurance-information

### D. Case Law

*Ross v. AXA Equitable Life Insurance Co.*, No. 13 Civ. 6736, 2015 WL 4389766 (S.D.N.Y. July 16, 2015) (granting motion to dismiss shadow insurance class action on standing grounds). Referenced at https://www.lexology.com/library/detail.aspx?g=9d973d2a-cfc4-488c-af54-fd72f2f31934

*Robainas v. Metropolitan Life Insurance Co.* and *Ross v. AXA Equitable Life Insurance Co.*, Nos. 15-3201, 15-3211 (2d Cir. Feb. 23, 2017) (summary order affirming dismissal). Referenced at https://www.mondaq.com/unitedstates/insurance-laws-and-products/585388/second-circuit-affirms-dismissal-of-shadow-insurance-lawsuits

### E. Industry Publications and Articles

Harrington, S.E. (2014). *The Use of Captive Reinsurance in Life Insurance*. American Council of Life Insurers. https://www.acli.com/-/media/acli/public/files/pdfs-public-site/public-public-policy/captives/captive_reinsurance_in_life_ins_harrington_2014.pdf

Harrington, S.E. (2015). *The Economics and Regulation of Captive Reinsurance in Life Insurance*. American Council of Life Insurers. https://www.acli.com/-/media/acli/public/files/pdfs-public-site/public-public-policy/captives/the_economics_and_regulation_of_captive_reinsurance_in_life_insurance_harrington_2015.pdf

Captive International. Letters of Credit (LOCs): The Basics. https://www.captive.com/captives-101/letters-of-credit-(locs)-the-basics (confirming ~0.75% annual fee for LOCs)

WilmerHale. (2015, Jan. 25). Life and Annuity Series: Captive Reinsurance Class Actions. https://www.wilmerhale.com/en/insights/client-alerts/2015-01-25-life-and-annuity-series-captive-reinsurance-class-actions

The Regulatory Review. (2014, May 14). Regulators Place Spotlight on Shadow Insurance. https://www.theregreview.org/2014/05/14/14-santiago-shadow-insurance/

Insurance Journal. (2013, June 12). N.Y. Says Life Insurers' Use of 'Shadow Insurance' Could Hurt Policyholders. https://www.insurancejournal.com/news/east/2013/06/12/295170.htm

Bressler, Amery & Ross, P.C. NY Department of Financial Services is Keeping "Shadow Insurance" Alive. https://www.bressler.com/publication-640

### F. Vermont Captive Insurance Resources

Vermont Captive Insurance Association. Captive Basics. https://www.vermontcaptive.com/captive/

Vermont Department of Financial Regulation. Formation & Licensing. https://dfr.vermont.gov/captive-insurance/formation-licensing

---
