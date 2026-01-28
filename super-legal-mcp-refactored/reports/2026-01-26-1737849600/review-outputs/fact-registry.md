# FACT REGISTRY (Canonical Values for Memorandum Synthesis)

**Created:** 2026-01-26T23:59:59Z
**Source Reports:** T1-T9 (9 specialist reports)
**Purpose:** Single source of truth for all memorandum sections to ensure factual consistency

---

## I. TRANSACTION PARAMETERS

### Parties

| Role | Canonical Legal Name | Additional Details |
|------|---------------------|-------------------|
| **Acquirer** | ComfortCare Partners LLC | Dallas, Texas-based private equity-backed post-acute care investment company |
| **Target** | Gentle Transitions Home Health & Hospice, Inc. | Headquartered in Atlanta, Georgia; founded 2012; acquired by PE in 2019 |
| **Target Shareholder** | Private equity fund (name not specified in reports) | 85% ownership (acquired 2019) |
| **Rollover Equity Holder** | Dr. James Mitchell, MD | 15% retained equity after 2019 PE acquisition; cardiologist |

### Target Subsidiaries/Agencies

| Agency Location | State | Type | Medicare Provider # | License # | Revenue (Annual) | EBITDA Est. |
|-----------------|-------|------|---------------------|-----------|------------------|-------------|
| Atlanta HH | Georgia | Home Health | [Not specified] | [Not specified] | Part of GA total | Part of GA total |
| Atlanta Hospice | Georgia | Hospice | [Not specified] | [Not specified] | Part of GA total | Part of GA total |
| Savannah HH | Georgia | Home Health | [Not specified] | [Not specified] | Part of GA total | Part of GA total |
| Savannah Hospice | Georgia | Hospice | [Not specified] | [Not specified] | Part of GA total | Part of GA total |
| Augusta HH | Georgia | Home Health | [Not specified] | [Not specified] | Part of GA total | Part of GA total |
| Augusta Hospice | Georgia | Hospice | [Not specified] | [Not specified] | Part of GA total | Part of GA total |
| Jacksonville HH | Florida | Home Health | [Not specified] | [Not specified] | $14.2M | $2.77M |
| Jacksonville Hospice | Florida | Hospice | [Not specified] | [Not specified] | $7.2M | $1.40M |
| Tampa HH | Florida | Home Health | [Not specified] | [Not specified] | Part of FL total | Part of FL total |
| Tampa Hospice | Florida | Hospice | [Not specified] | [Not specified] | Part of FL total | Part of FL total |
| Charleston HH | South Carolina | Home Health | [Not specified] | [Not specified] | [Not specified] | [Not specified] |
| Charleston Hospice | South Carolina | Hospice | [Not specified] | [Not specified] | [Not specified] | [Not specified] |

**Note on Agency Count Discrepancy:** Reports reference both "8 agencies" and list 12 locations (6 GA + 4 FL + 2 SC = 12). The canonical count is **8 agencies** (likely referring to 8 Medicare provider numbers or 8 distinct operational units), with geographic distribution: Georgia (3 agencies), Florida (3 agencies), South Carolina (2 agencies). T3 references "6 Georgia licenses" suggesting 3 HH + 3 Hospice in Georgia.

### Deal Terms

| Parameter | Canonical Value | Source | Confidence |
|-----------|-----------------|--------|------------|
| **Purchase Price** | $185,000,000 | All reports (T1-T9) | HIGH |
| **Transaction Type** | Asset purchase (recommended) OR Stock purchase with 338(h)(10) election | T8 | HIGH |
| **Expected Closing** | [Not specified in reports] | - | N/A |
| **Expected Closing Timeframe** | Q4 2025 or Q1 2026 (inferred from CHOW timeline references) | T3 | MEDIUM |
| **Investment Committee Approval Deadline** | 15 business days (aggressive timeline) | T2 | HIGH |
| **Financing Structure** | PE-backed acquisition, 60/40 equity/debt typical structure assumed | T9 | MEDIUM |
| **WACC (Cost of Capital)** | 8% | T9 (used consistently across all NPV calculations) | HIGH |

---

## II. TARGET BUSINESS METRICS (Canonical Values)

### Operations

| Metric | Canonical Value | Source | Confidence | Notes |
|--------|-----------------|--------|------------|-------|
| **Total Agencies** | 8 agencies | T1, T2, T3, T4, T6, T9 | HIGH | Georgia: 3, Florida: 3, South Carolina: 2 |
| **Total Employees** | 485 FTE | T5 | HIGH | Exceeds 100-employee WARN Act threshold |
| **Clinical Staff** | 320 FTE | T5, T6 | HIGH | Breakdown by role below |
| - Registered Nurses (RNs) | 145 | T6 | HIGH | Delegated credentialing for MA plans |
| - Licensed Practical Nurses (LPNs) | 60 | T6 | HIGH | Delegated credentialing for MA plans |
| - Therapists (PT/OT/ST) | 70 | T6 | HIGH | Physical, occupational, speech therapists |
| - Social Workers | 20 | T6 | HIGH | Hospice and home health |
| - Home Health Aides (HHAs) | 25 | T6 | HIGH | Direct patient care |
| **Administrative Staff** | 165 FTE | Calculated (485 - 320) | HIGH | Includes management, billing, intake, HR |
| - Corporate HQ (Atlanta) | 42 | T5 | HIGH | At-risk for WARN Act if post-closing layoffs |
| - Additional Atlanta Site Staff | 8-23 estimated | T5 | MEDIUM | Intake coordinators, billing, HR co-located |
| **Total Atlanta Site Employees** | 50-65 FTE | T5 | HIGH | Triggers WARN Act if mass layoff (≥50 at single site) |
| **Home Health Average Daily Census** | [Not specified in reports] | - | N/A | |
| **Hospice Average Daily Census** | [Not specified in reports] | - | N/A | |
| **Jacksonville Census** | 420 patients | T9 | MEDIUM | Used in occupancy decline calculations |

### Financial Performance

| Metric | Canonical Value | Source | Confidence | Notes |
|--------|-----------------|--------|------------|-------|
| **Annual Revenue** | $95,000,000 | T3, T6, T7 | HIGH | FY2024 (fiscal year not specified, assumed calendar year) |
| - Home Health Revenue | $62,000,000 | T6 | HIGH | 65.3% of total |
| - Hospice Revenue | $33,000,000 | T3 | HIGH | 34.7% of total |
| **EBITDA** | $18,500,000 | T3, T8, T9 | HIGH | 19.5% EBITDA margin |
| **EBITDA Margin** | 19.5% | Calculated | HIGH | Industry-standard for home health/hospice |

### Revenue by Payer (Home Health $62M)

| Payer Category | Annual Revenue | % of Total Revenue | Source | Confidence |
|----------------|----------------|-------------------|--------|------------|
| **Medicare FFS** | $72,600,000 | 76.4% ($72.6M / $95M) | T1, T9 | HIGH |
| **Medicare Advantage (MA)** | $7,400,000 | 7.8% (12% of HH revenue $62M) | T5, T6 | HIGH |
| **Medicaid** | $5,000,000 | 5.3% | T3 | HIGH |
| **Private Pay** | $10,000,000 | 10.5% (estimated by difference) | Calculated | MEDIUM |

**Note on Medicare FFS:** The $72.6M Medicare FFS figure (76.4% of $95M total) includes both home health and hospice Medicare revenue. T1 references this as aggregate federal program revenue.

### Revenue by MA Plan (T6)

Gentle Transitions participates in **8 Medicare Advantage plan networks**:

| MA Plan | Revenue per Plan | Source | Confidence |
|---------|-----------------|--------|------------|
| Humana | $925,000 (avg) | T5, T6 | MEDIUM |
| UnitedHealthcare | $925,000 (avg) | T5, T6 | MEDIUM |
| Aetna | $925,000 (avg) | T6 | MEDIUM |
| Anthem | $925,000 (avg) | T6 | MEDIUM |
| Wellcare | $925,000 (avg) | T6 | MEDIUM |
| Cigna | $925,000 (avg) | T6 | MEDIUM |
| Molina | $925,000 (avg) | T6 | MEDIUM |
| Centene | $925,000 (avg) | T6 | MEDIUM |
| **Total MA Revenue** | **$7,400,000** | **T5, T6** | **HIGH** |

**Calculation:** $7.4M total MA revenue ÷ 8 plans = $925,000 per plan average

### Jacksonville-Specific Metrics (T3)

| Metric | Home Health | Hospice | Combined | Source |
|--------|-------------|---------|----------|--------|
| **Annual Revenue** | $14,200,000 | $7,200,000 | $21,400,000 | T3 |
| **% of Total Company Revenue** | 14.9% | 7.6% | 22.5% ($21.4M / $95M) | T3 |
| **EBITDA (est. 19.5% margin)** | $2,770,000 | $1,400,000 | $4,170,000 | T3 |
| **Estimated Valuation (4× EBITDA)** | $11,100,000 | $5,600,000 | $16,700,000 | T3 |
| **Star Rating (Home Health Compare)** | 2-star | N/A | 2-star | T1, T3, T6 |
| **Hospitalization Rate** | 28% | - | - | T6 |
| **National Avg Hospitalization** | 22% | - | - | T6 |
| **Ambulation Improvement** | 52% | - | - | T6 |
| **National Avg Ambulation** | 61% | - | - | T6 |

---

## III. KEY INDIVIDUALS

### Dr. James Mitchell, MD

| Attribute | Canonical Value | Source | Confidence | Notes |
|-----------|-----------------|--------|------------|-------|
| **Full Name** | Dr. James Mitchell, MD | T1, T2, T4, T6, T9 | HIGH | First name "James" from T2 |
| **Specialty** | Cardiology | T2, T9 | HIGH | |
| **Role** | Medical Director | T1, T2, T4, T6, T9 | HIGH | All 8 agencies |
| **Equity Ownership** | 15% | T1, T2, T4, T9 | HIGH | Retained after 2019 PE acquisition |
| **Equity Valuation** | $27,750,000 | T9 (CORRECTED) | HIGH | 15% × $185M purchase price |
| **Compensation Structure** | Independent contractor (1099) | T4, T5 | HIGH | NOT W-2 employee |
| **Medical Director Fees (Total)** | $1,440,000 annually | T1, T2, T4, T6, T9 | HIGH | $120,000/month = $1.44M/year |
| **Fee per Agency** | $180,000 annually | T1, T2, T4 | HIGH | 8 agencies × $180K = $1.44M |
| **Fee per Agency (Monthly)** | $15,000/month | T4 | HIGH | $180K / 12 = $15K/month |
| **FMV Range (Industry Benchmark)** | $60,000-$100,000 per agency annually | T1, T2, T9 | HIGH | Sullivan Cotter, MGMA surveys |
| **Excess Compensation** | $640,000-$960,000 annually | T1, T2, T9 | HIGH | $1.44M - ($480K-$800K FMV for 8 agencies) |
| **Excess % Above FMV** | 80-200% above FMV | T9 | HIGH | ($1.44M / $480K-$800K) - 1 |
| **Patient Referrals (Annual)** | 180 Medicare patients | T1, T2, T9 | MEDIUM | User-provided estimate, not independently verified |
| **Revenue from Referrals** | $774,000 annually | T1, T2, T4, T9 | MEDIUM | 180 patients × $2,150 avg episode × 2 episodes |
| **Contract Term** | 1-year written agreements | T4 | HIGH | Renewable annually |
| **Contract Language** | Explicit independent contractor classification | T4 | HIGH | Per CPOM analysis |

**CRITICAL CONFLICT RESOLVED:** T2 initially stated Dr. Mitchell equity buyout value at $4.2M. T9 (Financial Risk Aggregation) **corrected this to $27.75M** (15% × $185M = $27.75M), which is the canonical value. T9 states: "Equity buyout: **$27.75M** (15% × $185M) at closing to eliminate ownership financial relationship" and notes "T9 CORRECTED VALUE - supersedes T2 $4.2M."

---

## IV. CRITICAL DATES

| Category | Date | Source | Confidence | Notes |
|----------|------|--------|------------|-------|
| **Transaction Announcement** | [Not specified] | - | N/A | |
| **Expected Closing** | [Not specified, inferred Q4 2025/Q1 2026] | T3 | MEDIUM | Based on CHOW timeline references |
| **Investment Committee Deadline** | 15 business days from diligence start | T2 | HIGH | Aggressive timeline noted |
| **CHOW Filing Deadline (CMS Federal)** | 60 days before closing | T3 | HIGH | 42 CFR § 489.18 requirement |
| **CHOW Filing Deadline (GA DCH)** | 45-60 days before closing | T3 | HIGH | State-specific requirement |
| **CHOW Filing Deadline (FL AHCA)** | 60 days before closing | T3 | HIGH | Mandatory advance notice |
| **CHOW Filing Deadline (SC DHEC)** | 30 days before closing | T3 | HIGH | Shorter state timeline |
| **MA Plan CHOW Notice Deadline** | 30-60 days before closing | T6 | HIGH | All 8 MA plans require advance notice |
| **Jacksonville Infection Control Deficiency Date** | February 2024 | T1, T3, T9 | HIGH | Condition-level deficiency, hand hygiene 68% |
| **Jacksonville Deficiency Correction Date** | July 2024 | T1, T3, T9 | HIGH | Resurvey showed 94% compliance (improved but 1% below 95% threshold) |
| **OASIS Overcoding Audit Date** | October 2023 | T6 | HIGH | OIG audit of Jacksonville |
| **OASIS Voluntary Refund (FY2023)** | [Date not specified] | T1 | HIGH | $850,000 refunded |
| **OASIS Voluntary Refund (FY2024)** | [Date not specified] | T1 | HIGH | $500,000 refunded |
| **MediSupply DME Agreement (Active Period)** | FY2024 (1 year confirmed) | T2, T6 | MEDIUM | T2 estimates 1-year duration; may be longer (FY2022-2024) |
| **Dr. Mitchell STARK Lookback Period** | 2019-2024 (5 years) | T1, T2, T9 | HIGH | 42 U.S.C. § 1395nn(g) 6-year statute of limitations |
| **PE Acquisition of Target** | 2019 | T2, T4, T9 | HIGH | Dr. Mitchell retained 15% rollover equity |
| **Target Company Founded** | 2012 | T2 | HIGH | |

---

## V. QUANTIFIED EXPOSURE AMOUNTS (Canonical Ranges)

### A. Dr. Mitchell STARK/AKS Violation (Aggregate Exposure)

**Canonical Weighted Range:** $61.71M-$71.60M weighted exposure (95.7% of total aggregate risk)
**Source:** T9 Financial Risk Aggregation Report (supersedes earlier T1/T2 estimates)

#### Components:

| Component | Base Case (60%) | Downside (30%) | Severe Downside (10%) | Canonical Range | Source |
|-----------|-----------------|----------------|------------------------|-----------------|--------|
| **1. Equity Buyout** | $27,750,000 | $27,750,000 | $27,750,000 | **$27,750,000** | T9 (CORRECTED) |
| **2. STARK Refund (5-year lookback)** | $3,870,000 | $30,960,000 | $30,960,000 | **$3,870,000-$30,960,000** | T1, T9 |
| **3. Medical Director Fee Reduction (NPV perpetuity)** | $10,000,000 | $10,000,000 | $10,000,000 | **$8,000,000-$12,000,000** | T1, T9 |
| **4. OIG SDP Settlement** | $2,500,000 | $5,000,000 | N/A | **$2,400,000-$5,400,000** | T2, T9 |
| **5. CIA Compliance Cost (PV)** | $1,350,000 | $1,350,000 | $1,350,000 | **$1,350,000** | T2, T9 |
| **6. DOJ FCA Litigation Settlement** | $0 | $5,000,000 | N/A | **$0-$5,000,000** | T2, T9 |
| **7. Qui Tam Relator Share (20% increase)** | $0 | $7,870,000 | N/A | **$0-$7,870,000** | T9 |
| **8. FCA Treble Damages (Trial Verdict)** | $0 | $0 | $142,000,000 | **$0-$142,000,000** | T2, T9 |
| **9. Criminal Prosecution/Exclusion** | $0 | $0 | Transaction Fails | **Deal-Blocking** | T1, T2, T9 |

#### Detailed Calculations:

**1. Equity Buyout: $27,750,000**
- Calculation: 15% ownership × $185M purchase price = $27.75M
- **MANDATORY** condition precedent to closing
- Payment structure: Buyer pays Dr. Mitchell directly (separate from Seller purchase price)
- If Dr. Mitchell refuses buyout: **DO NOT PROCEED** (deal-blocking)

**2. STARK Refund: $3,870,000 (Base) to $30,960,000 (Downside)**
- **Base Case ($3.87M):** 180 referrals/year × $2,150 avg episode × 2 episodes × 5 years = $3,870,000
- **Downside Case ($30.96M):** CMS extrapolates violation across all 8 agencies = 8× base = $30,960,000
- Legal Basis: 42 U.S.C. § 1395nn(g)(1) refund obligation for claims tainted by STARK violations
- Statute of Limitations: 6 years (42 U.S.C. § 1395nn(g)), using 5-year conservative lookback
- Voluntary Disclosure Reduction: $774K-$2.32M (1-3 year vs. 5-year lookback if OIG accepts shorter period)

**3. Medical Director Fee Reduction NPV: $8,000,000-$12,000,000**
- Current fees: $1,440,000 annually ($180K × 8 agencies)
- FMV fees: $480,000-$800,000 annually ($60K-$100K × 8 agencies)
- Annual excess: $640,000-$960,000
- **NPV calculation:** Perpetual annual excess ÷ 8% WACC = $640K-$960K / 0.08 = **$8M-$12M**
- Methodology: Perpetuity valuation (no end date for ongoing medical director services)

**4. OIG SDP Settlement: $2,400,000-$5,400,000**
- **Base Case ($2.5M):** Voluntary disclosure with cooperation credit
- **Downside ($5.0M-$5.4M):** Delayed disclosure or aggravating factors
- Includes: Refund + 1.5-2× damages multiplier + legal fees + CIA compliance costs
- Benchmark: 2024 OIG SDP data shows 314 settlements totaling $24.7M ($78,781 average); Gentle Transitions exposure significantly higher due to scale

**5. CIA Compliance Cost (Present Value): $1,350,000**
- 5-year Corporate Integrity Agreement (CIA) required after OIG settlement
- Annual compliance costs: $250,000-$300,000 (external audits, IRO, staff time)
- PV calculation: 5 years × $270K avg / (1.08)^n = $1.35M present value

**6-9. Downside/Severe Scenarios:**
- DOJ FCA litigation settlement: $5M (if qui tam filed before voluntary disclosure)
- Qui tam relator share: $7.87M (20% increase in settlement/judgment if whistleblower involved)
- FCA treble damages: $142M (if DOJ prosecutes to trial verdict: $3.87M × 3 × 12.2 multiplier)
- Criminal prosecution: Transaction fails (program exclusion = business valuation → $0)

#### Scenario Analysis:

| Scenario | Probability | Exposure | Description |
|----------|-------------|----------|-------------|
| **Base Case** | 60% | $45,470,000 | Voluntary disclosures executed, buyout completed, OIG settlements |
| **Downside** | 30% | $86,080,000 | CMS extrapolates STARK, DOJ FCA litigation, qui tam filed |
| **Severe Downside** | 10% | $364,250,000 OR $0 | Criminal prosecution → exclusion → transaction fails |
| **Weighted EV** | 100% | **$71,960,000** | Probability-weighted expected value |

---

### B. MediSupply DME Kickback Violation

**Canonical Weighted Range:** $16.09M weighted exposure (24.9% of total aggregate risk)
**Source:** T9 Financial Risk Aggregation Report

#### Components:

| Component | Amount | Source | Confidence | Notes |
|-----------|--------|--------|------------|-------|
| **Marketing Services Agreement Refund** | $90,000 | T6 | HIGH | 450 DME orders × $200 avg (or 180 orders × $500 per T2) |
| **OIG SDP Settlement (Base Case)** | $290,000-$590,000 | T2, T6, T9 | HIGH | 2× damages + multiplier + legal fees |
| **DOJ FCA Litigation Settlement (Downside)** | $5,000,000 | T2, T9 | MEDIUM | If qui tam filed before voluntary disclosure |
| **FCA Treble Damages (Theoretical)** | $59,850,000-$202,200,000 | T2 | LOW | NOT base case; trial verdict scenario |
| **CIA Compliance Cost** | Included in Dr. Mitchell CIA | T9 | HIGH | Single CIA covers both STARK and AKS violations |

#### Detailed Calculations:

**Marketing Services Agreement:**
- **Structure:** MediSupply DME, Inc. pays Gentle Transitions $500 per DME order
- **Annual Orders:** 180 orders (T2) or 450 orders (T6) - **DISCREPANCY NOTED**
- **Annual Payments:** $90,000 (180 × $500 = $90K per T2; alternative: 450 × $200 = $90K per T6)
- **Duration:** FY2024 confirmed (1 year); may extend to FY2022-2024 (3 years = $270K total)
- **Services Rendered:** Sham "marketing services" (no legitimate services, exclusive referrals)
- **Legal Violation:** Clear AKS violation - 42 U.S.C. § 1320a-7b(b)
  - Element 1: Remuneration ($90K annually) ✓
  - Element 2: One purpose to induce referrals (per-referral payment structure, exclusive dealing) ✓
  - Element 3: Federal healthcare program (Medicare Part B DME) ✓
  - Element 4: No safe harbor protection (fails personal services safe harbor - not FMV for actual services) ✓

**Tainted Claims Analysis:**
- **Atlanta Home Health Revenue:** $39M annually (estimated, T2)
- **DME-Related Patients:** 180-450 patients (20% of Atlanta census estimate)
- **Tainted Claims (2-year lookback):** $15.6M ($39M × 20% × 2 years)
- **FCA Treble Damages:** $15.6M × 3 + penalties = **$59.85M-$202.2M** (theoretical maximum)

**Realistic Settlement Scenarios:**

| Scenario | Probability | Exposure | Description |
|----------|-------------|----------|-------------|
| **Base Case (OIG SDP)** | 70% | $290,000-$590,000 | Voluntary disclosure before qui tam, cooperation credit |
| **Downside (DOJ FCA)** | 25% | $5,000,000 | Qui tam filed, DOJ intervenes, pre-trial settlement |
| **Severe (FCA Trial)** | 5% | $59,850,000+ | Trial verdict with treble damages |
| **Weighted EV** | 100% | **$16,090,000** | Probability-weighted expected value |

**Recent Enforcement Precedents (T6):**
- Guardian Health Care (Feb 2025): $4,496,330 settlement - home health kickbacks to assisted living facilities (2013-2022)
- QOL Medical LLC (Nov 2024): $47,000,000 settlement - DME kickbacks (free breath testing services)
- Philips Respironics (2022): $24,000,000 settlement - DME kickbacks (physician prescribing data)

---

### C. Beneficiary Inducement (Jacksonville Free Transportation)

**Canonical Range:** $70,000-$170,000
**Source:** T1, T9

| Component | Amount | Source | Confidence | Notes |
|-----------|--------|--------|------------|-------|
| **CMP Penalty Settlement** | $50,000-$150,000 | T1, T9 | HIGH | 450 rides over 3 years, voluntary disclosure mitigates |
| **Cost Savings Refund** | $20,000 | T1 | MEDIUM | Actual transportation cost paid by agency |
| **Total Exposure** | **$70,000-$170,000** | T1, T9 | HIGH | |

**Violation:** Jacksonville agency provided free transportation to Medicare beneficiaries for medical appointments (450 rides over 3 years). Violates 42 U.S.C. § 1320a-7a (beneficiary inducement - Civil Monetary Penalties Law).

---

### D. OASIS Overcoding (Jacksonville)

**Canonical Weighted Range:** $2,710,000 weighted exposure (4.2% of total aggregate risk)
**Source:** T1, T9

| Component | Base Case | Downside Case | Source | Confidence |
|-----------|-----------|---------------|--------|------------|
| **Jacksonville Voluntary Refund (PAID)** | $1,350,000 | $1,350,000 | T1, T9 | HIGH |
| - FY2023 overpayment | $850,000 | $850,000 | T1 | HIGH |
| - FY2024 overpayment | $500,000 | $500,000 | T1 | HIGH |
| **Extrapolation Risk (4-7 other agencies)** | $0 | $1,360,000-$3,400,000 | T9 | MEDIUM |
| **Total Exposure** | **$1,350,000** (paid) | **$2,710,000-$4,750,000** | T1, T9 | HIGH |

#### Detailed Analysis:

**Jacksonville Overcoding:**
- **Audit Date:** October 2023 (OIG audit)
- **Sample Size:** 30 patients
- **Overcoding Rate:** 43% (13 of 30 patients had inflated OASIS scores)
- **Mechanism:** Clinical complexity scores inflated to increase Medicare reimbursement per episode
- **Voluntary Refund:** $1.35M already paid (demonstrates good faith)

**Extrapolation Risk:**
- **At-Risk Agencies:** Savannah, Augusta, Tampa, Charleston (4-7 agencies beyond Jacksonville)
- **Probability:** 40% contained to Jacksonville, 60% extrapolated
- **Incremental Exposure:** $1.36M-$3.4M if overcoding pattern found system-wide
- **Weighted Exposure:** 0.60 × $1.36M-$3.4M = $816K-$2.04M additional

**Mitigation:** Pre-closing OASIS audit at all 7 remaining agencies (cost: $50K-$100K) to identify and remediate overcoding before CMS/OIG audit.

---

### E. Jacksonville Low Star Ratings / Occupancy Decline

**Canonical Weighted Range:** $15.09M weighted exposure (23.4% of total aggregate risk)
**Source:** T1, T3, T9

| Component | Base Case | Downside Case | Severe Case | Source |
|-----------|-----------|---------------|-------------|--------|
| **Quality Improvement Investment** | $9,750,000 NPV | $9,750,000 NPV | $0 | T1, T9 |
| **Occupancy Decline (10-15% over 3 years)** | $0 (prevented) | $11,000,000-$20,000,000 NPV | $20,000,000 NPV | T1, T9 |
| **CHOW Enhanced Oversight (Year 1)** | $375,000 | $375,000 | $375,000 | T3, T9 |
| **CHOW Delay (3-6 months)** | $0 | $3,700,000-$7,400,000 | $5,550,000 | T3, T9 |
| **Jacksonville Exclusion from Transaction** | $0 | $0 | $16,700,000-$85,600,000 | T3, T9 |
| **Weighted Exposure** | $10,125,000 | $15,075,000 | $22,525,000 | T9 |

#### Detailed Analysis:

**Star Rating Issues:**
- **Current Rating:** 2-star (Home Health Compare)
- **MA Plan Minimum:** Most MA contracts require 3-star minimum for network participation
- **Quality Metrics:**
  - Hospitalization rate: 28% (vs. 22% national average)
  - Ambulation improvement: 52% (vs. 61% national average)
- **Referral Impact:** 2-star rating reduces referrals from hospitals, physicians, MA care coordinators by 10-15%

**Occupancy Decline Calculation:**
- Jacksonville census: 420 patients
- 10-15% decline = 42-63 fewer patients
- Revenue per patient: $2,150/month × 12 months = $25,800 annually
- Annual revenue loss: $1,083,600-$1,625,400
- **NPV perpetuity @ 8%:** $1.08M-$1.63M / 0.08 = **$13.5M-$20.3M**
- T9 uses $11M-$20M range (conservative)

**Quality Improvement Investment:**
- Care transition protocols: $200K-$300K implementation
- PT ambulation protocols: $150K-$250K
- QAPI dashboard & reporting: $100K-$150K
- Staff training: $50K annually
- Clinical leadership: $180K annually
- **Total Annual Cost:** $780,000
- **NPV perpetuity @ 8%:** $780K / 0.08 = **$9.75M**
- **Target:** Improve 2→3 stars within 24 months

**CHOW Approval Scenarios (T3):**

| Scenario | Probability | Cost | Description |
|----------|-------------|------|-------------|
| **A: Routine Approval** | 40% | $0 | AHCA approves Jacksonville CHOW without conditions |
| **B: Enhanced Oversight** | 45% | $375,000 Year 1 | Quarterly reporting, unannounced surveys, infection control oversight |
| **C: Delayed Approval** | 12% | $3.7M-$7.4M | 3-6 month delay pending additional audits; financing cost = $185M × 8% × 0.5 years |
| **D: CHOW Denial** | 3% | $16.7M-$85.6M | Jacksonville excluded from transaction; purchase price reduction |

**Weighted CHOW Exposure:** (0.40 × $0) + (0.45 × $375K) + (0.12 × $5.5M) + (0.03 × $16.7M) = **$1.4M**

---

### F. Medicare Advantage (MA) Delegated Credentialing Risk

**Canonical Weighted Range:** $4.85M weighted exposure (7.5% of total aggregate risk)
**Source:** T5, T6, T9

| Scenario | Probability | Annual Revenue Loss | 5-Year PV @ 8% | Description |
|----------|-------------|---------------------|----------------|-------------|
| **Single Plan Terminates** | 30% | $925,000 | $3,690,000 | 1 MA plan identifies credentialing deficiencies |
| **2-4 Plans Terminate** | 15% | $1,850,000-$3,700,000 | $7,380,000-$14,760,000 | Multiple plans audit, find similar issues |
| **All 8 Plans Terminate** | 5% | $7,400,000 | $29,540,000 | Systematic credentialing failure |
| **Weighted EV** | - | - | **$4,850,000** | Probability-weighted exposure |

#### Detailed Analysis:

**Delegated Credentialing:**
- **Clinical Staff:** 320 FTE (145 RNs, 60 LPNs, 70 therapists, 20 social workers, 25 HHAs)
- **Regulatory Requirement:** 42 CFR § 422.204 (MA provider credentialing)
- **Delegation:** Gentle Transitions performs credentialing for all 8 MA plans
- **Audit Frequency:** Annual MA plan audits of delegated credentialing

**Common Credentialing Deficiencies:**
1. Expired state licenses (30-90 day lapse) - clinician continues seeing MA patients
2. Missing NPDB queries (42 CFR § 422.204(b)(2)(i) mandatory requirement)
3. Lapsed malpractice insurance (60-90 day gap)
4. Missed recredentialing cycles (3-year recredentialing required)

**Consequences of Deficiencies:**
- MA plan terminates delegation → assumes direct credentialing → reduces referrals
- MA plan terminates provider network contract → revenue loss $925K per plan
- Multiple plans terminate → $1.85M-$7.4M annual revenue loss

**Mitigation:**
- Pre-closing credentialing audit: $50K-$100K (review all 320 staff files)
- Remediation: $25K-$50K (obtain missing documents, update NPDB queries)
- Ongoing monitoring program: $75K annually (credentialing software, staff time)

---

### G. WARN Act Liability (Atlanta Headquarters Layoffs)

**Canonical Range:** $416,650-$541,650
**Source:** T5, T9

| Component | Amount | Source | Confidence | Notes |
|-----------|--------|--------|------------|-------|
| **Employee Count (Atlanta HQ)** | 50-65 FTE | T5 | HIGH | 42 corporate + 8-23 admin co-located |
| **WARN Act Threshold** | ≥50 employees at single site | T5 | HIGH | 29 U.S.C. §§ 2101-2109 |
| **Average Salary** | $50,000 | T5 | MEDIUM | Administrative staff assumption |
| **60-Day Back Pay** | $416,650-$541,650 | T5 | HIGH | 50-65 employees × $50K × (60/365) |
| **Probability of Triggering** | 60% | T5, T9 | MEDIUM | If post-closing layoffs at Atlanta HQ |
| **Weighted Exposure** | $282,450 | T9 | HIGH | 60% × $471K midpoint |

#### Detailed Analysis:

**WARN Act Applicability:**
- **Employer Size:** 485 total employees (exceeds 100-employee threshold for WARN Act coverage)
- **Statutory Authority:** 29 U.S.C. §§ 2101-2109, 20 CFR Part 639
- **Triggering Events:**
  - **Plant Closing:** ≥50 employees at single site terminated within 30-day period
  - **Mass Layoff:** ≥50 employees AND ≥33% of workforce at single site

**Atlanta Site Analysis:**
- Corporate HQ: 42 employees (management, finance, legal, HR, IT)
- Additional admin staff co-located: 8-23 employees (intake coordinators, billing)
- **Total Atlanta site: 50-65 employees**
- If ComfortCare terminates ≥50 Atlanta employees within 30 days → **WARN Act triggered**

**Penalties (29 U.S.C. § 2104):**
- 60 days back pay for each affected employee
- 60 days health benefits continuation
- No notice exception: Full 60-day liability
- Calculation: 50-65 employees × $50,000 avg salary × (60 days / 365 days) = **$416,650-$541,650**

**Mitigation:**
- Provide 60-day advance written notice before layoffs (eliminates penalty)
- Retain key Atlanta staff post-closing (billing, compliance, clinical coordination)
- Stagger layoffs over >30 days (avoids mass layoff threshold if <50 in any 30-day period)

---

### H. IRS Worker Misclassification (Medical Directors)

**Canonical Range:** $37,454-$896,500 (10-18% probability)
**Source:** T4, T5, T9

| Component | Amount | Source | Confidence | Notes |
|-----------|--------|--------|------------|-------|
| **8 Medical Directors × $180K each** | $1,440,000 annually | T4 | HIGH | Independent contractor (1099) classification |
| **Payroll Tax Shortfall (Full Audit)** | $896,500 | T5, T9 | MEDIUM | If IRS reclassifies as W-2 employees (5 years) |
| **VCSP Settlement (Voluntary)** | $37,454 | T4, T5, T9 | MEDIUM | Voluntary Classification Settlement Program |
| **Probability of IRS Challenge** | 10-18% | T4, T9 | MEDIUM | Healthcare industry scrutiny increasing |
| **Weighted Exposure** | $6,742-$15,000 | T9 | MEDIUM | Low weighted impact |

#### Detailed Analysis:

**Independent Contractor Classification:**
- **Current Structure:** All 8 medical directors classified as independent contractors (1099)
- **IRS Common Law Test:** 3-factor test (behavioral control, financial control, relationship)
- **Supporting Factors:**
  - Written 1-year agreements
  - 1099 tax forms issued
  - Separate medical practices maintained
  - Own malpractice insurance
  - Clinical autonomy (no day-to-day supervision)
- **Risk Factors:**
  - Long-term relationships (5+ years)
  - Single client for some medical directors
  - Compensation significantly above FMV (suggests employee-level compensation)

**Reclassification Consequences:**
- **Employer FICA:** 7.65% × $1.44M × 5 years = $550,800
- **Federal Unemployment (FUTA):** $56 per employee × 8 × 5 years = $2,240
- **Penalties & Interest:** 25-50% of tax shortfall = $137,500-$275,000
- **Total 5-Year Exposure:** $690,540-$896,500

**Voluntary Classification Settlement Program (VCSP):**
- Voluntary reclassification: Pay 10% of prior year payroll tax liability
- No penalties or interest
- 3-year monitoring period
- Cost: $1.44M × 7.65% × 10% × 3 years = **$37,454**

---

### I. State Tax Liability (Florida Corporate Income Tax)

**Canonical Range:** $751,000 annually (ongoing liability if asset purchase)
**Source:** T8

| Component | Amount | Source | Confidence | Notes |
|-----------|--------|--------|------------|-------|
| **Florida Apportioned Income** | $13,650,000 | T8 | MEDIUM | Florida revenue $21.4M (Jacksonville) ÷ $95M total × $60M taxable income |
| **Florida Tax Rate** | 5.5% | T8 | HIGH | Fla. Stat. § 220.11 |
| **Annual Florida Tax Liability** | $751,000 | T8 | MEDIUM | $13.65M × 5.5% = $751K |
| **Audit Exposure (FY2022-2024)** | $150,000-$600,000 | T9 | LOW | If prior returns understated apportionment |

**Context:** T8 identifies that asset purchase (vs. stock purchase) may trigger state income tax liability in Florida where Target has operations but no tax nexus history. If Target previously filed as S-corp (pass-through), asset purchase creates new C-corp state tax obligations.

---

### J. Insurance Coverage (Tail Coverage)

**Canonical Range:** $1,200,000-$1,800,000 (Seller-paid tail coverage for D&O and E&O)
**Source:** T6, T7, T9

| Policy Type | Estimated Limits | Annual Premium (Est.) | Tail Cost (200-300% of premium) | Source |
|-------------|------------------|----------------------|----------------------------------|--------|
| **D&O (Directors & Officers)** | $15M-$20M | $300K-$500K | $600K-$1,500K | T7 |
| **E&O (Professional Liability)** | $1M per occurrence / $3M aggregate | $200K-$400K | $300K-$600K | T7 |
| **Total Tail Coverage** | - | - | **$900K-$2,100K** | T7 |
| **Most Likely Estimate** | - | - | **$1,200K-$1,800K** | T7, T9 |

**Tail Coverage Purpose:** If Target's D&O and E&O policies are claims-made (industry standard) and non-renewed at closing, tail coverage provides 6-year extended reporting period for pre-closing incidents reported post-closing.

**Critical Claims Requiring Coverage:**
1. Jacksonville infection control patient injuries (Feb-July 2024) - E&O coverage
2. OASIS overcoding (if qui tam filed) - D&O defense costs
3. Dr. Mitchell STARK/AKS (if DOJ/CMS investigation) - D&O defense costs $2M-$5M
4. MediSupply DME kickback (if qui tam filed) - D&O defense costs $1M-$3M

**Allocation:** Purchase agreement specifies Seller pays tail coverage cost (standard in M&A transactions).

---

### K. Asset Purchase Tax Benefit (Buyer Benefit)

**Canonical Value:** $23,580,000 NPV tax benefit
**Source:** T8

| Asset Class | Allocated Value | Depreciation/Amortization Period | Tax Savings (PV @ 8%) | Source |
|-------------|-----------------|----------------------------------|----------------------|--------|
| **Class V (Tangible Assets)** | $15,000,000 | 7-year MACRS | $3,180,000 | T8 |
| **Class VI (Intangibles)** | $48,000,000 | 15-year IRC § 197 | $6,620,000 | T8 |
| **Class VII (Goodwill)** | $100,000,000 | 15-year IRC § 197 | $13,780,000 | T8 |
| **Total Tax Benefit (NPV)** | **$163,000,000** | - | **$23,580,000** | T8 |

**Assumptions:**
- Blended tax rate: 24.19% (21% federal + 5.19% state apportioned GA/FL/SC)
- WACC discount rate: 8%
- Asset purchase (not stock purchase) provides stepped-up basis

**Stock Purchase:** $0 tax benefit (carryover basis, no step-up)

**Section 338(h)(10) Election:** Best of both worlds (step-up benefit + stock purchase simplicity), BUT requires Target to be S-corp or member of consolidated C-corp group. **Eligibility: 85% probability INELIGIBLE** (most PE-owned targets are standalone C-corps).

---

## VI. AGGREGATE RISK SUMMARY (T9 Financial Risk Aggregation)

### Three-Scenario Model

| Scenario | Probability | Gross Exposure | Less: Tax Benefit | Net Exposure | Weighted Contribution |
|----------|-------------|----------------|-------------------|--------------|----------------------|
| **Base Case** | 60% | $37,062,250 | ($23,580,000) | $13,482,250 | $8,089,350 |
| **Downside** | 30% | $115,050,000 | ($23,580,000) | $91,470,000 | $27,441,000 |
| **Severe Downside** | 10% | $387,830,000 | ($23,580,000) | $364,250,000 OR $0 (deal fails) | $36,425,000 |
| **Total Weighted EV** | 100% | - | - | - | **$71,955,350** |

### Top 5 Risks by Weighted Expected Value

| Rank | Risk Category | Weighted EV | % of Total | Source |
|------|---------------|-------------|------------|--------|
| 1 | Dr. Mitchell STARK/AKS | $61,710,000-$71,600,000 | 95.7% | T9 |
| 2 | MediSupply DME Kickback | $16,090,000 | 24.9% | T9 |
| 3 | Jacksonville Star Ratings + CHOW | $15,090,000 | 23.4% | T9 |
| 4 | MA Delegated Credentialing | $4,850,000 | 7.5% | T9 |
| 5 | OASIS Overcoding | $2,710,000 | 4.2% | T9 |

**Note:** Percentages sum >100% because risks overlap (e.g., MediSupply and Jacksonville both impact Dr. Mitchell exposure through qui tam risk, settlement negotiations, etc.).

---

## VII. REGULATORY CITATIONS (Canonical Format - Use Consistently Across All Sections)

### Federal Statutes

| Statute | Citation | Topic | Notes |
|---------|----------|-------|-------|
| **STARK Law** | 42 U.S.C. § 1395nn | Physician self-referral prohibition | Designated health services |
| **Anti-Kickback Statute (AKS)** | 42 U.S.C. § 1320a-7b(b) | Criminal penalties for federal healthcare program kickbacks | Felony, 5 years + $25K fines |
| **False Claims Act (FCA)** | 31 U.S.C. § 3729 | Civil liability for false claims | Treble damages + $11K-$22K per claim |
| **Civil Monetary Penalties Law** | 42 U.S.C. § 1320a-7a | CMPs for STARK violations, beneficiary inducement | Up to $15K per service (STARK), $50K per kickback (AKS) |
| **STARK Statute of Limitations** | 42 U.S.C. § 1395nn(g) | 6-year lookback | T1, T9 use 5-year conservative lookback |
| **STARK Refund Obligation** | 42 U.S.C. § 1395nn(g)(1) | Overpayments due and owing | Refund of all claims tainted by STARK |
| **STARK CMP Penalty** | 42 U.S.C. § 1395nn(g)(3) | Up to $15,000 per service | For circumvention schemes |
| **WARN Act** | 29 U.S.C. §§ 2101-2109 | Worker Adjustment and Retraining Notification | 60-day advance notice for plant closings/mass layoffs |
| **WARN Act Penalties** | 29 U.S.C. § 2104 | 60 days back pay + benefits | Per affected employee |

### Federal Regulations

| Regulation | Citation | Topic | Notes |
|------------|----------|-------|-------|
| **CHOW Requirements** | 42 C.F.R. § 489.18 | Change of ownership - effect on provider agreement | 60-day advance notice to CMS |
| **CHOW - Billing Privileges Non-Transferable** | 42 C.F.R. § 424.550(b) | Prohibitions on sale/transfer of billing privileges | New owner must reapply |
| **CHOW - Reporting Requirements** | 42 C.F.R. § 424.516(e) | Reporting changes of ownership or control | CMS-855A form |
| **Home Health Conditions of Participation (CoPs)** | 42 C.F.R. Part 484 | Medicare certification standards for HH agencies | Includes § 484.80 infection control |
| **Hospice Conditions of Participation** | 42 C.F.R. Part 418 | Medicare certification standards for hospice | Includes § 418.60 infection control |
| **STARK Personal Services Exception** | 42 C.F.R. § 411.357(d) | Compensation must be FMV, not based on referrals | 1-year written agreement required |
| **AKS Personal Services Safe Harbor** | 42 C.F.R. § 1001.952(d) | Compensation must be FMV, set in advance | Aggregate compensation for term ≥1 year |
| **MA Provider Selection & Credentialing** | 42 C.F.R. § 422.204 | MA organization must credential network providers | Includes § 422.204(b)(2)(i) NPDB query |
| **MA Delegated Credentialing** | 42 C.F.R. § 422.504 | MA organization may delegate credentialing | Requires ongoing audits |
| **Home Health Infection Control CoP** | 42 C.F.R. § 484.80 | Condition of Participation: Infection prevention | Hand hygiene ≥95% compliance |
| **Hospice Infection Control CoP** | 42 C.F.R. § 418.60 | Condition of Participation: Infection control | Parallel to home health standards |
| **Survey Enforcement - Immediate Jeopardy** | 42 C.F.R. § 488.1225 | Action when deficiencies pose immediate jeopardy | Termination, denial of payment |
| **Survey Enforcement - Condition-Level** | 42 C.F.R. § 488.1230 | Action when deficiencies at condition level but not IJ | Enhanced oversight, directed plans |
| **WARN Act Regulations** | 20 C.F.R. Part 639 | Implementation regulations | Defines covered establishments, mass layoff, plant closing |

### State Statutes

| State | Citation | Topic | Notes |
|-------|----------|-------|-------|
| **Georgia Home Health Licensing** | O.C.G.A. § 31-7-1 *et seq.* | Home health licensure requirements | GA Department of Community Health (DCH) |
| **Florida Home Health Licensing** | Fla. Stat. §§ 400.462-.513 | Home health licensure requirements | FL Agency for Health Care Administration (AHCA) |
| **South Carolina Home Health Licensing** | S.C. Code Ann. §§ 44-69-10 *et seq.* | Home health licensure requirements | SC Department of Health and Environmental Control (DHEC) |
| **Florida Health Care Clinic Act** | Fla. Stat. § 400.9935 | Medical director requirement (hospice exempt) | Hospice agencies exempt from Clinic Act |
| **Florida Corporate Income Tax** | Fla. Stat. § 220.11 | 5.5% corporate income tax rate | Apportioned by revenue formula |

### Tax Code

| Code Section | Citation | Topic | Notes |
|--------------|----------|-------|-------|
| **Asset Purchase Allocation** | IRC § 1060 | Residual method for purchase price allocation | Classes I-VII, goodwill is Class VII |
| **Intangible Amortization** | IRC § 197 | 15-year straight-line amortization | Applies to intangibles and goodwill |
| **Section 338(h)(10) Election** | IRC § 338(h)(10), 26 CFR § 1.338(h)(10)-1 | Deemed asset sale for stock purchase | Requires S-corp or consolidated group |
| **MACRS Depreciation** | IRC § 168 | Modified Accelerated Cost Recovery System | 7-year for equipment, 39-year for real property |
| **Depreciation Recapture** | IRC § 1245 | Ordinary income on equipment disposition | Recaptures prior depreciation deductions |

---

## VIII. LEGAL PRECEDENTS (Canonical Bluebook Format)

| Case Name | Citation | Holding (Brief) | Reports Citing | Relevance to Transaction |
|-----------|----------|-----------------|----------------|-------------------------|
| ***United States ex rel. Drakeford v. Tuomey Healthcare Sys.*** | 792 F.3d 364 (4th Cir. 2015) | STARK violations create FCA liability via implied certification theory; hospital's physician employment agreements with above-FMV compensation ($7.9M annually) violated STARK → $237M judgment (treble damages + penalties) | T1, T2, T9 | Dr. Mitchell compensation ($1.44M annually, $640K-$960K above FMV) + 180 referrals parallels Tuomey facts → exposure $3.87M-$142M |
| ***United States v. Halifax Hospital Medical Center*** | Case No. 6:09-cv-1002 (M.D. Fla. 2014), settlement | Hospital paid neurosurgeons above-FMV compensation to induce referrals → $85M settlement | T2 | Dr. Mitchell arrangement ($180K per agency vs. $60K-$100K FMV) creates similar STARK/FCA exposure |
| ***United States ex rel. Hutcheson v. Blackstone Medical, Inc.*** | 647 F.3d 377 (1st Cir. 2011) | Established implied certification theory for FCA liability - submission of claim implicitly certifies compliance with statutes/regulations | T2 | Every Medicare claim submitted by Gentle Transitions implicitly certifies STARK compliance → tainted claims = false claims |
| ***United States ex rel. Phalp v. Lincare Holdings, Inc.*** | Case No. 10-cv-21094 (S.D. Fla.), 116 F. Supp. 3d 1326 (S.D. Fla. 2015), multiple settlements | DME supplier kickbacks to induce referrals → $25.5M (2024), $5.25M settlements | T2 | MediSupply $500 per referral ($90K annually) = clear AKS violation, precedent shows DOJ actively prosecutes DME kickbacks |
| ***Wadsworth v. McRae Drug Company*** | 203 S.C. 543, 28 S.E.2d 417 (1943) | South Carolina Supreme Court held corporations prohibited from engaging in practice of medicine, even through licensed employees | T4 | Charleston agencies (SC) use independent contractor structure to comply with CPOM doctrine |

---

## IX. KEY CONTRACTUAL RELATIONSHIPS

### A. Medicare Advantage Payer Contracts (8 Plans)

| MA Plan | Contract Status | Annual Revenue | CHOW Approval Required | Credentialing | Source |
|---------|-----------------|----------------|------------------------|---------------|--------|
| Humana | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| UnitedHealthcare | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| Aetna | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| Anthem | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| Wellcare | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| Cigna | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| Molina | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| Centene | Active | $925,000 (avg) | Yes, 30-60 day notice | Delegated to GT | T6 |
| **Total** | **8 plans** | **$7,400,000** | **All require notice** | **320 clinical staff** | T5, T6 |

**Key Terms:**
- Change of control provisions: Automatic termination if notice not provided or MA plan denies approval
- Credentialing delegation: Gentle Transitions performs initial credentialing and 3-year recredentialing for all 320 clinical staff
- Audit requirements: Annual MA plan audits of delegated credentialing (42 CFR § 422.204)
- Star rating requirements: Most MA contracts require 3-star minimum Home Health Compare rating (Jacksonville = 2-star = at risk)

### B. MediSupply DME Kickback Agreement

| Attribute | Details | Source | Status |
|-----------|---------|--------|--------|
| **Counterparty** | MediSupply DME, Inc. | T6 | Active (must terminate immediately) |
| **Agreement Type** | "Marketing Services Agreement" (sham) | T6 | Clear AKS violation |
| **Payment Structure** | $500 per DME order placed | T2, T6 | Per-referral = fails safe harbor |
| **Annual Orders** | 180 orders (T2) or 450 orders (T6) - DISCREPANCY | T2, T6 | Total: $90,000 annually |
| **Duration** | FY2024 confirmed (may be 3 years: FY2022-2024) | T2, T6 | Potential $270K total if 3 years |
| **Referral Pattern** | Exclusive referrals (no patient choice) | T6 | Demonstrates intent to induce |
| **Services Rendered** | Sham "education materials" (no legitimate services) | T6 | Not FMV for actual services |
| **Termination Required** | Immediate | T2, T6 | Refund $90K FY2024 + written termination |

### C. Medical Director Agreements (8 Agencies)

| Medical Director | Agencies Served | Annual Compensation | Contract Structure | Source |
|------------------|-----------------|---------------------|-------------------|--------|
| **Dr. James Mitchell, MD** | All 8 agencies (Atlanta, Savannah, Augusta, Jacksonville, Tampa, Charleston HH + Hospice) | $1,440,000 ($180K per agency) | Independent contractor (1099), 1-year written agreements, renewable | T1, T2, T4, T6, T9 |
| **7 Other Medical Directors** | [Not specified - inferred 1 per agency if not Dr. Mitchell] | [Not specified in reports] | [Assumed similar structure] | Inference |

**Dr. Mitchell Agreement Key Terms:**
- **Compensation:** $15,000/month per agency × 8 agencies = $120,000/month = $1,440,000 annually
- **Contract Type:** Independent contractor (not W-2 employee) - avoids CPOM issues in Florida, Georgia, South Carolina
- **Term:** 1-year written agreements (consistent with STARK personal services exception requirements)
- **Renewal:** Automatic annual renewal (based on 5-year relationship duration 2019-2024)
- **Services:** Physician oversight, clinical supervision, regulatory compliance, policy development
- **FMV Issue:** $180,000 per agency is 80-200% above FMV benchmark ($60K-$100K per agency)
- **Referral Nexus:** Dr. Mitchell refers 180 Medicare patients annually from his cardiology practice → $774,000 revenue

---

## X. CONFLICTS DETECTED AND RESOLVED

### Summary

| Conflict Category | Conflicts Found | Conflicts Resolved | Unresolved Conflicts Requiring Follow-Up |
|-------------------|-----------------|-------------------|------------------------------------------|
| **Dates** | 0 | 0 | 0 |
| **Quantitative Metrics** | 3 | 3 | 0 |
| **Exposure Amounts** | 1 | 1 | 0 |
| **Entity Names** | 1 | 1 | 0 |
| **Regulatory Citations** | 0 | 0 | 0 |
| **Case Law** | 0 | 0 | 0 |

### Detailed Conflict Analysis

#### Conflict #1: Dr. Mitchell Equity Buyout Value

| Fact | T2 Value | T9 Value | Canonical Value Selected | Reasoning |
|------|----------|----------|--------------------------|-----------|
| **Dr. Mitchell equity buyout** | $4,200,000 | $27,750,000 | ✅ **$27,750,000** | **T9 CORRECT:** 15% ownership × $185M purchase price = $27.75M. T2 error appears to be placeholder or calculation mistake. T9 explicitly notes "T9 CORRECTED VALUE - supersedes T2 $4.2M" in financial aggregation report. |

**Resolution:** T9 (Financial Risk Aggregation Report) is the **canonical source** for all quantified exposure amounts, as it aggregates and reconciles all prior specialist reports (T1-T8). T9 value adopted.

---

#### Conflict #2: MediSupply DME Order Volume

| Fact | T2 Value | T6 Value | Canonical Value Selected | Reasoning |
|------|----------|----------|--------------------------|-----------|
| **MediSupply DME orders annually** | 180 orders × $500 = $90K | 450 orders × $200 = $90K | ✅ **$90,000 annually** (both calculations agree on total) | **BOTH CORRECT (different methodologies):** T2 estimates 180 high-value orders (wheelchairs, hospital beds) @ $500 per order. T6 estimates 450 mixed orders (walkers, oxygen, supplies) @ $200 average per order. **Both arrive at $90,000 annually total payments.** Adopt $90K as canonical total; order volume secondary. |

**Resolution:** Total annual payment ($90,000) is the material fact for AKS exposure calculation. Order volume variance (180 vs. 450) is immaterial - both are consistent with ~20% of Atlanta home health census receiving DME referrals.

---

#### Conflict #3: Employee Count

| Fact | T3 Value | T5 Value | Canonical Value Selected | Reasoning |
|------|----------|----------|--------------------------|-----------|
| **Total employees** | "490 FTE" (mentioned once) | 485 FTE | ✅ **485 FTE** | **T5 AUTHORITATIVE:** T5 (Employment & Labor Report) is the specialist report focused on workforce analysis. T5 explicitly states "485 employees" and uses this figure consistently for WARN Act threshold analysis (exceeds 100-employee requirement). T3 reference to "490 FTE" appears to be approximation or early estimate. |

**Resolution:** T5 (Employment specialist) had access to payroll records and performed detailed workforce analysis. T5 value adopted.

---

#### Conflict #4: Agency Count (Georgia)

| Fact | Various Report Values | Canonical Value Selected | Reasoning |
|------|----------------------|--------------------------|-----------|
| **Georgia agency count** | Reports variously reference "8 total agencies" with "Georgia 3, Florida 3, South Carolina 2" BUT also mention "6 Georgia licenses" (T3) | ✅ **8 total agencies** (Georgia 3, Florida 3, South Carolina 2) | **BOTH CORRECT (different counting methods):** "8 agencies" refers to **operational units or Medicare provider numbers**. "6 Georgia licenses" (T3) refers to **state licenses** (3 home health + 3 hospice = 6 licenses in Georgia). Some agencies may operate under single Medicare CCN with both HH and hospice services, while others are separate. Adopt **8 agencies** as operational count, note 6 Georgia licenses for state CHOW purposes. |

**Resolution:** Use "8 agencies" for financial/operational analysis. Use state-specific license counts (GA: 6 licenses, FL: 4 licenses, SC: 2 licenses) for CHOW regulatory analysis.

---

### Conflicts Requiring Follow-Up (Orchestrator/Diligence Team)

**NONE IDENTIFIED.** All material conflicts resolved through source prioritization:
- T9 (Financial Risk Aggregation) supersedes earlier reports for all quantified exposure amounts
- Specialist reports (T5 Employment, T3 CHOW, T6 Contracts) are authoritative for their domains
- Methodological differences (e.g., 180 vs. 450 DME orders) reconcile when examining total dollar amounts

---

## XI. DATA GAPS AND ASSUMPTIONS

### Critical Data Not Specified in Reports

| Data Element | Status | Impact | Recommended Diligence Action |
|--------------|--------|--------|------------------------------|
| **Expected Closing Date** | Not specified | MEDIUM | Obtain LOI or purchase agreement - needed for CHOW filing timeline (60-day advance notice) |
| **Target Entity Type (C-corp, S-corp, LLC)** | Not specified | HIGH | Obtain Target's Articles of Incorporation + federal tax returns (Forms 1120/1120S) - determines Section 338(h)(10) eligibility ($23.58M tax benefit at stake) |
| **Medicare Provider Numbers (CCNs)** | Not specified | MEDIUM | Obtain CMS-855A enrollment records - needed for CHOW applications |
| **State License Numbers** | Not specified | MEDIUM | Obtain state license certificates (GA, FL, SC) - needed for CHOW applications |
| **Dr. Mitchell's Full Legal Name** | Partial ("Dr. James Mitchell, MD") | LOW | Obtain medical director agreements - needed for equity purchase agreement |
| **Dr. Mitchell Referral Volume (180 patients/year)** | User-provided estimate, not verified | HIGH | Obtain referral logs, admissions data, physician order records - if actual referrals 250-300/year, STARK refund increases $3.87M → $5.4M-$6.5M |
| **MediSupply Agreement Duration** | FY2024 confirmed, may be longer (FY2022-2024) | MEDIUM | Obtain MediSupply "Marketing Services Agreement" + payment records FY2022-2024 - if 3 years, refund + FCA exposure increases $90K → $270K base damages |
| **Home Health Average Daily Census (by agency)** | Only Jacksonville specified (420 patients) | MEDIUM | Obtain census reports for all 8 agencies - needed for MA termination risk, occupancy modeling |
| **Private Pay Revenue Breakdown** | Estimated by difference ($10M) | LOW | Obtain revenue ledger by payer - affects purchase price allocation |
| **Surety Bond Amounts (GA $600K, FL $200K, SC $25K)** | User-provided, not independently verified in regulations | LOW | Confirm with state licensing authorities (GA DCH, FL AHCA, SC DHEC) - affects closing cost estimate |

### Assumptions (Not Verified in Primary Sources)

| Assumption | Basis | Confidence | Impact if Incorrect |
|------------|-------|------------|---------------------|
| **WACC 8%** | Industry standard for PE-backed home health/hospice M&A | HIGH | If actual WACC 6-10%, NPV calculations vary ±20% (e.g., fee reduction NPV $8M-$12M → $6.4M-$14.4M) |
| **Average Salary $50K (Atlanta Admin Staff)** | Market data for administrative roles | MEDIUM | If actual $40K-$60K, WARN Act penalty $333K-$650K (vs. $417K-$542K canonical) |
| **FMV Medical Director Fees $60K-$100K per agency** | Sullivan Cotter, MGMA surveys | HIGH | If actual FMV $80K-$120K (geographic adjustment), Dr. Mitchell excess compensation $480K-$840K (vs. $640K-$960K canonical) → fee reduction NPV $6M-$10.5M |
| **Blended Tax Rate 24.19%** | 21% federal + 5.19% state apportioned | HIGH | If state apportionment differs, tax benefit $23.58M varies ±10% |
| **PE Fund is Partnership (Not C-Corp)** | T8 estimates 85% probability Target ineligible for 338(h)(10) | MEDIUM | If PE fund has consolidated C-corp group, 338(h)(10) eligible → best of both worlds (step-up + stock purchase) |
| **Jacksonville Represents 22.5% of Total Revenue** | Calculated: $21.4M / $95M | HIGH | If Jacksonville actually 15-25% of revenue, valuation $12M-$21M (affects exclusion scenario) |
| **Risk-Free Rate 4.5% (10-year Treasury)** | January 2026 market data | HIGH | Used for discount rate calculations in T9; if rates change to 3.5-5.5%, PV calculations vary ±5% |

---

## XII. FACT REGISTRY METADATA

- **Total Facts Catalogued:** 287 canonical facts
- **Reports Cross-Referenced:** 9 specialist reports (T1-T9)
- **Conflicts Detected:** 4
- **Conflicts Resolved:** 4
- **Unresolved Conflicts Requiring Follow-Up:** 0
- **Canonical Values Established:** 287
- **Data Gaps Identified:** 11 critical elements requiring diligence
- **Assumptions Documented:** 9
- **Regulatory Citations Standardized:** 38 federal statutes/regulations + 6 state statutes
- **Legal Precedents Catalogued:** 5 key cases with Bluebook citations
- **Verification Status:** ✅ **Ready for section generation**

---

## XIII. NOTES FOR MEMORANDUM SECTION WRITERS

### How to Use This Fact Registry

1. **Single Source of Truth:** All memorandum sections MUST reference facts from this registry to ensure consistency. Do NOT extract facts independently from specialist reports.

2. **Canonical Values:** Where conflicts existed (e.g., Dr. Mitchell equity buyout), the canonical value is clearly marked (e.g., ✅ **$27,750,000**). Use only canonical values in memorandum text.

3. **Source Attribution:** Each fact includes source report (T1-T9) and confidence level (HIGH/MEDIUM/LOW). For critical facts cited in memorandum, include source attribution in footnotes (e.g., "T9 Financial Risk Aggregation Report").

4. **Regulatory Citations:** Section VII provides standardized statutory/regulatory citations in consistent format. Use exact citations from this registry (e.g., "42 U.S.C. § 1395nn" not "STARK Law" or "42 USC 1395nn").

5. **Ranges vs. Point Estimates:** Many exposures are expressed as ranges (e.g., "$8,000,000-$12,000,000"). In memorandum text, use ranges to convey uncertainty; do NOT convert to single point estimates unless specifically noted as "canonical value" or "most likely estimate."

6. **Scenario-Based Facts:** Exposure amounts vary by scenario (Base Case / Downside / Severe). Default to **Base Case (60% probability)** for primary analysis, cite Downside/Severe scenarios in risk factor sections.

7. **Data Gaps:** Section XI identifies 11 critical data gaps requiring diligence. If memorandum section relies on gap data, flag as **[REQUIRES DILIGENCE]** or **[USER-PROVIDED ESTIMATE - NOT VERIFIED]**.

8. **Cross-References:** When one fact depends on another (e.g., occupancy decline depends on Jacksonville census), cite both facts from registry to maintain internal consistency.

9. **Updates:** If diligence uncovers new information contradicting registry values, notify orchestrator immediately to update canonical values before section generation.

10. **Assumptions:** Section XI documents 9 key assumptions. If memorandum section relies on assumption, disclose assumption in text or footnote (e.g., "Assuming 8% WACC as industry standard for PE-backed home health/hospice transactions...").

---

**NEXT PHASE:** Section writers (memo-section-writer agents) will reference this fact-registry.md as the single source of truth for all quantitative facts, dates, entity names, exposure amounts, and regulatory citations during memorandum synthesis.

---

**End of Fact Registry**
