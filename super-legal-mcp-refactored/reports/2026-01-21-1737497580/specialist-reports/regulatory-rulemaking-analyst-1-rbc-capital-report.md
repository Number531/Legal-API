# PRIVILEGED AND CONFIDENTIAL
# ATTORNEY WORK PRODUCT

---

# STATE INSURANCE REGULATION & RISK-BASED CAPITAL ANALYSIS

**Prepared For:** Legal Memorandum Synthesis — Project Chronos
**Prepared By:** Federal Regulatory Research Specialist (Regulatory Rulemaking Analyst)
**Date:** 2026-01-21
**Re:** Liberty Life Insurance Company RBC Capital Adequacy, NAIC Model Act Compliance, Nebraska DOI Requirements
**Status:** 🔄 Research in Progress

---

## RESEARCH TRACEABILITY METADATA

| Field | Value |
|-------|-------|
| **Report ID** | 2026-01-21-regulatory-rulemaking-analyst-1-rbc-capital |
| **Subagent** | regulatory-rulemaking-analyst |
| **Model** | claude-sonnet-4-5-20250929 |
| **Research Started** | 2026-01-21T17:00:00Z |
| **Research Completed** | [Pending] |
| **Session Directory** | /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737497580/ |

---

## I. EXECUTIVE SUMMARY

*Research in progress - summary will be added upon completion.*

---

## II. SCOPE OF RESEARCH

### A. Research Questions Addressed

This report addresses the following critical regulatory and capital adequacy issues for Liberty Life Insurance Company (LLIC):

1. **NAIC Risk-Based Capital Model Act Requirements**: Analysis of C1 (Asset Risk), C2 (Insurance Risk), C3 (Interest Rate Risk), and C4 (Business Risk) components, ACL calculation methodology, and regulatory action levels (200% CAL, 150% RAL, 100% ACL, 70% MCL)

2. **Nebraska Insurance Code RBC Plan Filing Requirements**: Nebraska Revised Statutes § 44-101 et seq. analysis, Nebraska DOI review procedures, approval timelines (90-120 days), and criteria for "satisfactory" RBC plans

3. **LLIC Current RBC Position Verification**: Confirmation of Total Adjusted Capital (TAC) $1.85B, Authorized Control Level (ACL) $982M, resulting 188% RBC ratio, and component breakdown

4. **Root Cause Analysis of RBC Decline**: Investigation of factors driving RBC ratio from 245% (2019) to 188% (2024), including low interest rate environment, GMWB hedging losses, and IUL litigation reserves

5. **Capital Injection Remediation Plan**: Analysis of proposed $150M capital injection via surplus notes or subordinated debt, post-injection RBC ratio calculation (204%), and Nebraska DOI approval likelihood

6. **Alternative Remediation Strategies**: Evaluation of options if capital injection is delayed, including increased reinsurance cessions, reduced new business production, and asset sales

7. **Regulatory Consequences Analysis**: Assessment of continued Company Action Level status implications, including dividend restrictions, enhanced quarterly reporting, rating agency implications, and progression to Regulatory Action Level if RBC deteriorates further

8. **Statutory Accounting Principles (SAP) vs. GAAP Reconciliation**: Complete reconciliation of GAAP equity ($2.25B) to SAP surplus ($1.85B) with detailed analysis of DAC, reserves, unrealized losses, and non-admitted assets

### B. Databases and Sources Consulted

- NAIC Model Laws and Regulations Database (RBC for Insurers Model Act, Accounting Practices and Procedures Manual)
- Nebraska Legislative Database (Revised Statutes § 44-101 et seq.)
- Nebraska Department of Insurance regulations and administrative guidance
- State insurance regulatory precedent via legal research databases
- Federal Register and CFR (for federal preemption and coordination issues)
- Industry publications and regulatory analysis

### C. Limitations and Caveats

- Complete LLIC annual statements (statutory and GAAP) not provided; analysis based on user-provided financial summaries
- Nebraska DOI internal examination reports and preliminary findings not publicly available
- Actual RBC Plan filed November 2024 full text not available for review
- Reinsurance treaty agreements referenced but not reviewed in full (see T2 specialist report)
- Vermont captive reinsurance structure detailed analysis assigned to separate specialist (T2)

---

## III. FACTUAL BACKGROUND

### A. Liberty Life Insurance Company Overview

**[Research findings will be appended here]**

---

## IV. DETAILED ANALYSIS

### A. NAIC Risk-Based Capital Model Act #312 — Framework and Components

#### 1. Legislative Framework and Purpose

The NAIC Risk-Based Capital (RBC) for Insurers Model Act #312, initially adopted in 1993 (latest revision 2012), establishes a formula-based minimum capital requirement for life and health insurers based on the inherent risks in an insurer's mix of products and operations.¹ The RBC system was developed to provide regulators with a consistent, objective tool for early identification of potentially troubled insurers requiring regulatory attention.²

The fundamental principle underlying RBC is that an insurer's minimum capital requirement should be proportional to the amount and types of risk assumed by the company.³ Unlike fixed minimum capital requirements that apply uniformly regardless of company operations, the RBC formula adjusts capital requirements based on asset quality, underwriting risk, interest rate exposure, and business operations.⁴

#### 2. Life Insurance RBC Formula Components (C1-C4)

The 2024 Life RBC formula calculates Authorized Control Level (ACL) risk-based capital using four principal risk categories, aggregated using a covariance adjustment to avoid double-counting correlated risks:⁵

**C1 — Asset Risk**

The C1 component addresses investment losses beyond those covered in statutory policy reserves, representing risks associated with the insurer's invested assets.⁶ Asset risk captures the possibility that a bond issuer will default on interest or principal payments, that asset values will decline due to market conditions, or that investments will become impaired.⁷

C1 is subdivided into:
- **C1o (Other Asset Risk)**: Covers bonds, mortgages, real estate, policy loans, and other invested assets. Risk charges vary by NAIC designation for bonds (NAIC 1 for highest quality through NAIC 6 for in or near default), with below-investment-grade bonds (NAIC 3-5, equivalent to BB/B ratings) carrying substantially higher capital charges than investment-grade securities.⁸
- **C1cs (Common Stock Risk)**: Covers non-affiliated common stock and non-insurance affiliate equity, with risk charges reflecting equity volatility.⁹

For LLIC's $14.6B bond portfolio with $1.02B in below-investment-grade bonds (NAIC 3-5 designations), the C1o component would apply elevated capital charges to the below-IG holdings, contributing materially to LLIC's C1 asset risk of $420M as stated in the assignment parameters.¹⁰

**C2 — Insurance/Underwriting Risk**

The C2 component provides for claim losses exceeding those anticipated and funded through statutory policy reserves.¹¹ Insurance risk represents underwriting risk—the possibility that actual mortality (for life insurance), morbidity (for health insurance), or longevity (for annuities) experience will be worse than pricing assumptions.¹²

For a life insurer like LLIC with $8.5B individual life reserves, $1.95B group life reserves, and $2.6B annuity reserves, the C2 component would capture:
- Mortality risk on term life and whole life products (risk that death claims exceed reserves)
- Longevity risk on annuity products (risk that annuitants live longer than expected, requiring more payments)
- Lapse risk (risk that policy lapses differ from pricing assumptions, particularly for universal life products where lapses affect profitability)¹³

LLIC's C2 insurance risk component of $380M reflects these mortality and longevity exposures across the product portfolio.¹⁴

**C3 — Interest Rate/Asset-Liability Mismatch Risk**

The C3 component addresses interest rate risk and asset-liability mismatch risk not contemplated in statutory policy reserves.¹⁵ This component is critical for life insurers that guarantee interest rates on products (fixed annuities, universal life) while investing in fixed-income assets subject to market interest rate fluctuations.¹⁶

C3 includes three sub-components:
- **C3a (Interest Rate Risk)**: Captures duration mismatch between assets and liabilities. For LLIC, with assets of 10.8 years duration and liabilities of 11.5 years duration, the -0.7 year negative duration gap means liabilities are more sensitive to interest rate changes than assets, creating reinvestment risk if rates decline.¹⁷
- **C3b (Health Credit Risk)**: Applies primarily to health insurers.¹⁸
- **C3c (Market Risk)**: Captures variable annuity guarantee risk, including Guaranteed Minimum Withdrawal Benefits (GMWB), Guaranteed Minimum Death Benefits (GMDB), and similar guarantees. For LLIC's $800M variable annuity separate account with 65% GMWB penetration, the C3c component would reflect the risk that equity market declines or low interest rates make guarantees more expensive to hedge.¹⁹

NAIC RBC-related efforts prioritized during 2025 include recommendations for appropriate treatment of longevity risk transfers, continued development of the economic scenario generator (ESG), and potential alignment of C3 Phase 1 and C3 Phase 2 interest rate risk methodologies, indicating ongoing refinement of interest rate risk measurement.²⁰

LLIC's C3 interest rate risk component of $285M reflects both duration gap exposure (C3a) and variable annuity guarantee risk (C3c).²¹

**C4 — Business Risk**

The C4 component provides for general business risks not expected or contemplated in statutory policy reserves, including risks from litigation, regulatory assessments, guaranty fund assessments, and administrative inefficiencies.²²

For LLIC, business risk factors would include:
- Litigation exposure (Thompson v. Liberty Life IUL class action with settlement range $25M-$45M)
- Guaranty fund assessments (state life and annuity guaranty associations levy assessments on solvent insurers when member insurers fail, averaging $1.5M-$2M annually for LLIC)
- Operational risks and administrative expenses²³

LLIC's C4 business risk component of $95M reflects these operational and litigation exposures.²⁴

#### 3. RBC Formula Calculation Methodology

The Authorized Control Level (ACL) RBC is calculated using the following covariance-adjusted formula to avoid double-counting correlated risks:²⁵

**ACL = C0 + C4a + √[(C1o + C3a)² + (C1cs + C3c)² + C2² + C3b² + C4b²]**

Where:
- C0 = Off-balance sheet items (reinsurance, guarantees)
- C4a = Certain business risk charges applied before covariance adjustment
- The square root operation reflects correlation between risk categories, recognizing that not all risks materialize simultaneously²⁶

This formula design means that total RBC covers moderately adverse risk levels, calibrated to approximately 1.7 standard deviations of potential losses, representing roughly a 95% confidence level.²⁷

#### 4. RBC Action Levels — Regulatory Intervention Triggers

The NAIC Model Act establishes four escalating intervention levels, each defined as a multiple of the Authorized Control Level (ACL):²⁸

| Action Level | RBC Ratio | ACL Multiple | Regulatory Response | Statutory Authority |
|--------------|-----------|--------------|---------------------|---------------------|
| **Company Action Level (CAL)** | 200% | 2.0 × ACL | Insurer must file RBC Plan within 45 days | NAIC Model Act § 3(A) |
| **Regulatory Action Level (RAL)** | 150% | 1.5 × ACL | Commissioner issues Corrective Order requiring specific actions | NAIC Model Act § 3(B) |
| **Authorized Control Level (ACL)** | 100% | 1.0 × ACL | Commissioner authorized (not required) to seize company | NAIC Model Act § 3(C) |
| **Mandatory Control Level (MCL)** | 70% | 0.7 × ACL | Commissioner MUST seize company | NAIC Model Act § 3(D) |

**Company Action Level (200% RBC Ratio)** — LLIC's Current Status

When an insurer's Total Adjusted Capital (TAC) falls between 150% and 200% of its ACL, a Company Action Level Event occurs.²⁹ Nebraska Revised Statute § 44-6011 defines "company action level risk-based capital" as "the product of 2.0 and its authorized control level risk-based capital."³⁰

At the Company Action Level, the insurer must:
1. Prepare and submit to the commissioner a comprehensive financial plan (RBC Plan) within 45 days
2. Identify conditions contributing to the company's financial situation
3. Propose corrections for areas of substantial regulatory concern
4. Provide financial projections with and without proposed corrections
5. List key assumptions underlying projections³¹

The commissioner reviews the RBC Plan and notifies the company whether the plan is "satisfactory." If the commissioner determines the plan is not satisfactory, the company must prepare and submit a revised plan.³²

LLIC's current position at 188% RBC ratio ($1.85B TAC ÷ $982M ACL = 188.39%) falls within the Company Action Level range (150%-200%), triggering the mandatory RBC Plan filing requirement.³³

**Regulatory Action Level (150% RBC Ratio)**

If an insurer's TAC falls between 100% and 150% of ACL, a Regulatory Action Level Event occurs.³⁴ Nebraska Revised Statute § 44-6011 defines "regulatory action level risk-based capital" as "the product of 1.5 and its authorized control level risk-based capital."³⁵

At this level, after examination or analysis, the commissioner issues a Corrective Order specifying required actions, which may include:
- Restrictions on dividend payments
- Limitations on new business growth
- Requirements for additional capital contributions
- Restrictions on investment activities
- Enhanced monitoring and quarterly financial reporting³⁶

This represents a significantly more intrusive level of regulatory oversight than Company Action Level status.

**Authorized Control Level (100% RBC Ratio) and Mandatory Control Level (70% RBC Ratio)**

These represent the most severe intervention levels:
- At 100% RBC ratio (ACL), the commissioner is authorized to place the insurer under regulatory control (conservatorship or receivership), though seizure is not mandatory.³⁷
- At 70% RBC ratio (MCL), Nebraska Revised Statute § 44-6011 defines "mandatory control level risk-based capital" as "the product of 0.7 and the authorized control level risk-based capital," and the commissioner MUST place the insurer under regulatory control.³⁸

These action levels are designed to provide escalating regulatory intervention before an insurer reaches insolvency, protecting policyholders and the state guaranty fund system.³⁹

---

**SOURCES:**

¹ NAIC, Insurance Topics — Risk-Based Capital, https://content.naic.org/insurance-topics/risk-based-capital (last visited Jan. 21, 2026) [VERIFIED].

² NAIC, Risk-Based Capital (RBC) for Insurers Model Act #312 (2012 revision), https://content.naic.org/sites/default/files/model-law-312.pdf at 1 [VERIFIED].

³ *Id.* at 2.

⁴ *Id.*

⁵ Indiana Dep't of Ins., RBC Risk-Based Capital Forecasting and Instructions 2024 — Life/Fraternal, https://www.in.gov/idoi/files/RBCL24-INpdf.pdf at 3-4 (2024) [VERIFIED].

⁶ NAIC, Risk-Based Capital Topics, *supra* note 1.

⁷ NAIC, RBC for Insurers Model Act, *supra* note 2, at 3.

⁸ Indiana Dep't of Ins., 2024 Life RBC Instructions, *supra* note 5, at C1 section.

⁹ *Id.*

¹⁰ Assignment parameters state LLIC holds $1.02B below-investment-grade bonds requiring higher C1o capital charges.

¹¹ NAIC, RBC for Insurers Model Act, *supra* note 2, at 3.

¹² Indiana Dep't of Ins., 2024 Life RBC Instructions, *supra* note 5, at C2 section.

¹³ *Id.*

¹⁴ Assignment parameters state LLIC C2 insurance risk is $380M.

¹⁵ NAIC, RBC for Insurers Model Act, *supra* note 2, at 3.

¹⁶ Indiana Dep't of Ins., 2024 Life RBC Instructions, *supra* note 5, at C3 section.

¹⁷ Assignment parameters state LLIC assets duration 10.8 years vs. liabilities duration 11.5 years (-0.7 year gap).

¹⁸ Indiana Dep't of Ins., 2024 Life RBC Instructions, *supra* note 5, at C3b section.

¹⁹ Assignment parameters state LLIC has $800M VA separate account with 65% GMWB penetration.

²⁰ NAIC, Insurance Topics — Risk-Based Capital, https://content.naic.org/insurance-topics/risk-based-capital (2025 priorities) [VERIFIED].

²¹ Assignment parameters state LLIC C3 interest rate risk is $285M.

²² NAIC, RBC for Insurers Model Act, *supra* note 2, at 3.

²³ Assignment parameters reference Thompson v. Liberty Life class action and guaranty fund assessments $1.5M-$2M annually.

²⁴ Assignment parameters state LLIC C4 business risk is $95M.

²⁵ Indiana Dep't of Ins., 2024 Life RBC Instructions, *supra* note 5, at 4.

²⁶ *Id.*

²⁷ Actuarial Presentation on RBC, https://math.illinois.edu/system/files/inline-files/Risk%20Based%20Capital_1.pdf at 12 (May 11, 2018) [VERIFIED — total RBC covers approximately 1.7 standard deviations, roughly 95% confidence level].

²⁸ NAIC, RBC for Insurers Model Act, *supra* note 2, at 4-5.

²⁹ *Id.* at 4.

³⁰ Neb. Rev. Stat. § 44-6011 (2024), https://nebraskalegislature.gov/laws/statutes.php?statute=44-6011 [VERIFIED].

³¹ Indiana Dep't of Ins., 2024 Life RBC Instructions, *supra* note 5, at 2; NAIC Model Act § 3(A).

³² *Id.*

³³ Assignment parameters state LLIC current RBC ratio 188% (TAC $1.85B ÷ ACL $982M).

³⁴ NAIC, RBC for Insurers Model Act, *supra* note 2, at 4-5.

³⁵ Neb. Rev. Stat. § 44-6011, *supra* note 30.

³⁶ Texas Dep't of Ins., Risk-Based Capital and Surplus Regulations, 28 Tex. Admin. Code § 7.59 (2008), https://www.tdi.texas.gov/rules/2007/0118-059.html (example of state regulatory action level powers) [VERIFIED — analogous to Nebraska authority].

³⁷ NAIC, RBC for Insurers Model Act, *supra* note 2, at 5.

³⁸ Neb. Rev. Stat. § 44-6011, *supra* note 30.

³⁹ NAIC, Insurance Topics — Risk-Based Capital, *supra* note 1.

---

---

## V. RISK FACTORS AND CONCERNS

**[To be populated during research]**

---

## VI. CONCLUSIONS AND RECOMMENDATIONS

**[To be completed upon finalization]**

---

## VII. SOURCE CITATIONS

**[Citations appended with each finding]**

---

## VIII. SOURCE VERIFICATION LOG

### A. Primary Sources Accessed
| # | Source Type | Identifier | Access Method | Retrieval Date | Verification Status |
|---|-------------|------------|---------------|----------------|---------------------|
| [To be populated] | | | | | |

### B. Search Queries Executed
| Query # | Database | Search Terms | Filters Applied | Results Returned | Results Used |
|---------|----------|--------------|-----------------|------------------|--------------|
| [To be populated] | | | | | |

---

## IX. RESEARCH QUALITY ATTESTATION

**[To be completed upon finalization]**

---

*Report generated by regulatory-rulemaking-analyst for legal memorandum synthesis*
*Generated: 2026-01-21T17:00:00Z*
