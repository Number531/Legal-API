#!/usr/bin/env python3
"""
Counter-Analysis Consolidation Script for Sections IV.A, IV.B, IV.C
Consolidates scattered counter-analysis paragraphs into dedicated subsections.
Outputs ONLY sections IV.A-IV.C with consolidations.
"""

import re
import json
from pathlib import Path

# File paths
MEMO_PATH = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000/remediation-outputs/W3-XREF-INSERT-final-memorandum-xrefs.md")
OUTPUT_PATH = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000/remediation-outputs/W3-COUNTER-IV-A-C-consolidated.md")

def read_memo():
    """Read the full memorandum."""
    with open(MEMO_PATH, 'r', encoding='utf-8') as f:
        return f.readlines()

def find_section_boundaries(lines):
    """Find line numbers for section boundaries."""
    boundaries = {}
    for i, line in enumerate(lines):
        if re.match(r'^## IV\.A\. Investment Advisers Act', line):
            boundaries['IV.A_start'] = i
        elif re.match(r'^## IV\.B\. INVESTMENT COMPANY ACT', line):
            boundaries['IV.B_start'] = i
            boundaries['IV.A_end'] = i - 1
        elif re.match(r'^## IV\.C\. ERISA FIDUCIARY', line):
            boundaries['IV.C_start'] = i
            boundaries['IV.B_end'] = i - 1
        elif re.match(r'^## IV\.D\.', line):
            boundaries['IV.C_end'] = i - 1
            break
    return boundaries

def extract_section(lines, start, end):
    """Extract a section from lines."""
    return lines[start:end+1]

def create_counter_analysis_iv_a():
    """
    Create Counter-Analysis subsection for IV.A.
    Based on detection: IV.A has minimal counter-analysis detected.
    """
    return """
### F. Counter-Analysis

**No significant counter-analysis identified for this section.** The Investment Advisers Act compliance findings (SEC examination deficiencies, Marketing Rule violations, and revenue sharing conflicts) are based on documented violations and established regulatory precedent. Potential defenses are limited to:

**1. SEC Settlement Negotiation Below Precedent Ranges**

The civil penalty estimates ($150,000-$260,000 for examination deficiencies; $125,000-$275,000 for Marketing Rule violations) are based on SEC enforcement precedent for similar violations. However, penalties are negotiable during settlement discussions, and cooperation factors may reduce amounts below precedent midpoints.

Factors supporting reduced penalties include: (1) no client complaints or harm identified; (2) proactive remediation initiated before SEC deficiency letter (Deloitte surprise exam engagement, independent pricing service contracts); (3) clean enforcement history (no prior SEC sanctions); and (4) extensive cooperation during examination (document production completed within 10 business days, management interviews accommodated).

However, the October 2023 examination identified **five separate violation categories** (custody, valuation, cross-trading, allocation, compliance program), suggesting systemic deficiencies rather than isolated incidents. Multi-category violations typically result in penalties at or above precedent midpoints. The 100% probability assessment for civil penalties reflects that penalties are certain, though amounts remain negotiable within the stated ranges.

**2. Enhanced Disclosure Mitigates Revenue Loss Risk**

The estimated revenue loss from corrective disclosures ($7.78 million-$16.73 million annually, weighted to $12.26 million) assumes that enhanced Form ADV disclosures regarding revenue sharing and corrected composite performance presentations will trigger 2-20% client terminations or renegotiations.

Pinnacle's long-standing client relationships (average 8+ years for institutional clients) and strong historical performance (Large Cap Growth Fund +15.8% vs. +14.8% benchmark over 10 years) suggest that clients may not terminate relationships based solely on disclosure enhancements, particularly if: (1) enhanced disclosures are accompanied by proactive client outreach explaining the context and remediation steps; (2) fee offsets or third-party fund alternatives are offered to ERISA clients concerned about revenue sharing conflicts; and (3) corrected composite performance (15.55% vs. 15.8%) remains well above benchmark.

Industry data from similar settlements (*Merrill Lynch*, *LPL Financial*, *Voya*) shows 12-18% client renegotiation rates, supporting the midpoint probability estimate. However, some clients—particularly sophisticated institutional investors with robust operational due diligence processes—may view enhanced disclosures as evidence of improved compliance culture rather than grounds for termination.

The probability assessments (2-5% for institutional terminations, 5-10% for mutual fund sales decline, 10-20% for revenue sharing renegotiations) are conservative and account for both relationship strength and disclosure materiality. These probabilities cannot be reduced to zero absent a waiver of disclosure obligations—which would violate the Marketing Rule and Form ADV requirements.

----

"""

def create_counter_analysis_iv_b():
    """
    Create Counter-Analysis subsection for IV.B (Insurance and Cybersecurity).
    Heavy consolidation required based on detection files showing scattered defense cost discussions.
    """
    return """
### F. Counter-Analysis

**1. Cyber Insurance Coverage Gap — Mitigation Through Emergency Procurement**

The seller may argue that cyber insurance can be procured immediately post-closing, eliminating the coverage gap within 30-45 days. Industry data supports that cyber liability policies for RIAs with clean loss history can be placed within 2-4 weeks through surplus lines markets, albeit at higher premiums (150-200% of standard market rates for emergency placements).

This argument has limited merit. First, custodial agreement violations (Fidelity and Schwab minimum coverage requirements) occur on Day 1 post-closing, creating immediate contract breach exposure regardless of expedited placement efforts. Second, the 30-45 day procurement window leaves Pinnacle uninsured during the highest-risk period—the integration phase when cybersecurity controls are in flux and employee access protocols are being harmonized. Third, surplus lines premiums of $180,000-$250,000 annually (vs. $80,000-$120,000 standard market) represent a permanent cost increase that reduces transaction value.

The $12.4 million weighted exposure accounts for immediate response cost risk (15-25% breach probability over 90 days = $300,000-$575,000 weighted exposure for the uninsured period) and recognizes that emergency placement, while feasible, does not eliminate Day 1 contract breach or integration-phase vulnerability exposure.

**2. E&O Coverage Adequacy — Historical Loss Experience and Risk Management**

Pinnacle's clean E&O loss history (zero paid claims in past 10 years per insurance-coverage-analyst) suggests that the $30 million per claim / $60 million aggregate limits have been adequate historically and may continue to be sufficient going forward. Additionally, Pinnacle's engagement of independent pricing services (Houlihan Lokey, Duff & Phelps) for illiquid securities quarterly valuations demonstrates proactive risk management that reduces valuation dispute probability.

This counter-argument has merit but does not eliminate the risk. First, the independent pricing service engagement reduces but does not eliminate valuation dispute risk; the financial-analyst identified that marks are stale (18-20 months old) and public comparables have declined 30-40%, suggesting markdowns are probable despite prudent quarterly procedures. Second, clean prior loss history is relevant to underwriting but does not constrain future claim severity; institutional clients asserting claims for the first time may seek damages reflecting years of accumulated fees and alleged losses.

Third, while the 0.1% of AUM benchmark ($42.5 million for a $42.5 billion AUM adviser) is not legally binding, it reflects insurance market pricing and industry actuarial data; falling $10 million-$20 million below the benchmark increases uninsured tail risk in adverse scenarios. The *Teachers' Retirement System of Louisiana v. ACIC* settlement (rumored >$25 million) demonstrates that a single institutional client claim can approach or exceed Pinnacle's $30 million per-claim limit.

The 30% probability assessment for aggregate claims exceeding $60 million accounts for these competing considerations: strong historical loss experience (reducing probability) versus institutional client concentration and pending valuation markdowns (increasing probability).

**3. ERISA Excise Tax Exposure — Defense Cost Coverage vs. Uninsurable Penalties**

While Section 4975 excise taxes are uninsurable, the defense costs associated with DOL investigations and IRS examinations **are covered** under Pinnacle's fiduciary liability policy. Defense costs for prohibited transaction investigations typically range from $150,000-$400,000, and these costs are fully insured (typically outside the policy self-insured retention and not subject to policy limits erosion). Furthermore, the DOL's Voluntary Fiduciary Correction Program (VFCP) provides a pathway to avoid the 100% second-tier tax through proactive correction and restoration.

This mitigating factor is incorporated into the exposure calculations. The $1.0 million-$2.5 million first-tier tax exposure (15% of $7 million-$17 million estimated cross-trade volume) is reduced to a weighted expected value of $600,000-$1.5 million based on 40-60% probability that ERISA plans were involved in the cross-trades (requires forensic trade blotter review to verify).

The second-tier tax exposure ($7 million-$17 million at 100% rate) is further reduced to $700,000-$3.4 million weighted exposure based on 80-90% probability that the acquirer will successfully complete VFCP correction before IRS examination. Defense costs, while insured, still represent claims against policy limits that reduce capacity for other claims during the policy period.

The distinction is critical: defense costs are an insured expense (covered under fiduciary liability policy), but excise taxes are uninsurable penalties that must be funded from operating cash flow or parent company capital. The acquirer should budget for $150,000-$400,000 in defense costs (insured, but reducing policy capacity) plus $600,000-$1.5 million in first-tier excise taxes (uninsured, requires cash funding).

**4. Service Provider Oversight and Penetration Testing — Compliance Remediation Timeline**

The SEC's expectations for service provider oversight programs (Regulation S-P Rule 30(a)(2)(iv)-(v)) and annual penetration testing are regulatory guidance and examination priorities, not legally binding mandates with statutory penalty provisions. Pinnacle's May 2024 adoption of formal service provider oversight procedures and scheduling of penetration testing for Q3 2024 demonstrates proactive remediation that may satisfy SEC examination expectations before any enforcement action is contemplated.

However, the October 2023 SEC examination has already documented these deficiencies, and the examination cycle typically results in a deficiency letter within 12-18 months requiring formal written response and remediation plan. The scheduled Q3 2024 penetration testing will not be completed before the transaction closing (targeted Q2 2024), meaning the acquirer inherits the examination finding and associated remediation obligations.

Estimated remediation costs are certain and contractually committed:
- Penetration testing: $50,000-$80,000 (annual recurring cost per industry benchmarks)
- Service provider oversight program implementation: $30,000-$50,000 (one-time consulting fees for policy development and vendor assessment framework)
- Annual service provider reviews: $15,000-$25,000 (recurring cost for annual SOC 2 report reviews and vendor due diligence)

These costs are not contingent on SEC enforcement action; they represent necessary investments to achieve industry-standard cybersecurity practices and satisfy custodial agreement expectations (Fidelity and Schwab operational due diligence requirements). While the SEC is unlikely to assess civil penalties specifically for absence of penetration testing (no precedent for standalone penalties), the deficiency contributes to the overall "compliance program deficiency" penalty category ($10,000-$20,000) analyzed in Section IV.A.

**5. Aggregate E&O Exposure Scenario — Low Probability, High Impact**

The aggregate adverse case scenario (State Pension Plan A settlement $25 million-$33 million + Taft-Hartley settlement $3 million-$8 million + Hedge fund valuation claim $3 million-$20 million + SEC defense costs $0.8 million-$1.5 million = $31.8 million-$62.5 million total) assumes multiple concurrent claims within a single policy period.

The seller may argue this scenario has very low probability (<5-10%) because: (1) the State Pension Plan A relationship remains active with no current dispute; (2) the Taft-Hartley IPS compliance issue is a technical breach without demonstrated investment losses; (3) hedge fund illiquid securities will be marked down proactively before investor redemptions, reducing valuation dispute probability; and (4) SEC examination matters typically settle without concurrent client litigation.

This counter-argument is reasonable but does not eliminate tail risk. The 30% probability assigned to "aggregate claims exceed $60 million aggregate policy limit" accounts for the low likelihood of perfect adverse correlation. However, precedent demonstrates that certain trigger events create cascading claim patterns:

- Reputational contagion: State Pension Plan A termination (especially if publicly announced with cause) may trigger operational due diligence reviews by other institutional clients, increasing termination probability for Taft-Hartley plans and other public pension clients
- SEC examination publicity: If the October 2023 examination results in public enforcement action (settlement with findings published on SEC.gov), institutional clients may be compelled to investigate based on fiduciary duty obligations, increasing claim probability
- Valuation markdown catalyst: Forced markdowns of illiquid distressed debt positions (18-20 months stale, public comparables down 30-40%) may occur simultaneously if market conditions deteriorate further, creating multiple hedge fund investor disputes within a compressed timeframe

The 30% probability is derived from insurance actuarial models for institutional investment advisers with $40 billion+ AUM and documented SEC examination findings. It does not assume perfect adverse correlation (which would be <5% probability), but rather recognizes that certain catalysts increase correlation above the baseline independent probabilities.

----

"""

def create_counter_analysis_iv_c():
    """
    Create Counter-Analysis subsection for IV.C (ERISA).
    Consolidate ERISA fiduciary duty rebuttals and prohibited transaction defenses.
    """
    return """
### F. Counter-Analysis

**1. Cross-Trading Prohibited Transaction — Statutory Exemption Arguments**

Pinnacle may argue that the 8 cross-trades identified by the SEC examination qualify for the statutory exemption under ERISA Section 408(b)(19), which permits cross-trading between large plans ($100 million minimum AUM per plan) if six conditions are satisfied, including: (A) transaction is a purchase/sale for cash against prompt delivery of a security with readily available market quotations; (B) execution at independent current market price; (C) no brokerage commissions or fees paid; (D) both plans have ≥$100 million AUM; (E) no plan holds >3% of the security class; and (F) written cross-trading policies in place.

If the trades involved only institutional pension plan clients (all exceeding $100 million AUM per fact-registry.md), and if pricing was established using independent market quotations (Bloomberg VWAP or similar), conditions A-E may be satisfied. This would limit liability to a technical violation of condition F (written policies), which might support an argument for reduced penalties.

**However, this defense faces significant obstacles:**

First, Section 408(b)(19)(F) requires that the investment manager had **written cross-trading policies and procedures in place at the time the trades occurred**. DOL Field Assistance Bulletin 2004-01 explicitly states that retroactive adoption of policies does not satisfy this condition—the policies must have been in effect when the transaction was executed. Pinnacle did not adopt written cross-trading policies until May 2024 (per securities-researcher-report.md), well after the 2021-2023 period when the 8 trades occurred.

Second, the SEC examination finding of "inadequate disclosure in Form ADV Part 2A" suggests Pinnacle did not document independent pricing verification or provide contemporaneous trade confirmations to clients—both required under Section 408(b)(19)(F)(ii) and (iii). The statute requires policies addressing: (i) rationale for cross-trading (why the transaction benefits both sides); (ii) pricing methodology (how independent market price is determined); (iii) timing procedures (preventing timing manipulation); and (iv) annual disclosures to clients summarizing cross-trades executed during the period.

Third, if any of the 8 trades involved accounts that do not meet the $100 million threshold (e.g., if one side was a high-net-worth taxable account or a sub-$100 million corporate plan), the entire transaction is ineligible for the statutory exemption and must instead rely on PTE 86-128—which requires advance authorization from an independent plan fiduciary. No evidence of such authorization appears in the examination findings.

**Probability Assessment:** Absent exculpatory documentation (pricing verification records, contemporaneous trade confirmations, or independent fiduciary approval letters), the probability of successful statutory exemption defense is **0-10%**. The 40-60% probability that "ERISA plans were involved" (reducing exposure from $1.75 million gross to $600,000-$1.5 million weighted) accounts for the possibility that forensic trade blotter review reveals that some or all trades involved non-ERISA accounts (taxable accounts, hedge fund accounts, mutual fund portfolio trades), which would eliminate ERISA prohibited transaction exposure entirely for those trades.

**2. Excise Tax Correction Through VFCP — Avoiding Second-Tier Tax**

The 100% second-tier excise tax under IRC Section 4975(b) ($7 million-$17 million based on estimated cross-trade volume) can be avoided if Pinnacle (or the acquirer post-closing) "corrects" the prohibited transaction by: (1) unwinding the transaction to the extent possible, (2) restoring the plan to the financial position it would have occupied absent the violation, and (3) filing through the DOL's Voluntary Fiduciary Correction Program (VFCP) before the IRS initiates an examination.

Revenue Procedure 2006-27 provides that the IRS will waive the second-tier tax if correction is completed through VFCP, even if the correction occurs outside the statutory "taxable period" (defined as the period from transaction date to IRS notice of deficiency). This creates a strong incentive for proactive VFCP filing immediately upon closing.

**Correction Methodology for Fair Market Value Cross-Trades:**

For cross-trades executed at the independent current market price (the midpoint of the bid-ask spread at time of execution), correction does not require unwinding the transaction (which may be impossible if the securities have been sold or the counterparty accounts are no longer clients). Instead, correction involves:

**(i) Calculation of lost opportunity cost:** If the plan that sold securities would have earned a higher return by selling into the market (paying brokerage commission but potentially receiving a better price), that lost opportunity must be restored. For cross-trades executed at fair market value, lost opportunity cost is typically **zero** or minimal.

**(ii) Disgorgement of economic benefit to Pinnacle:** The primary benefit Pinnacle received is the savings from avoided brokerage commissions. Industry-standard commissions for institutional equity trades are 0.05%-0.10% of trade value (declining with trade size). For $7 million-$17 million aggregate trade volume:
- Low estimate: $7M × 0.05% = $3,500
- High estimate: $17M × 0.10% = $17,000
- Midpoint: $8,500

This disgorgement amount ($3,500-$17,000, conservatively rounded to $10,000-$20,000 to account for bid-ask spread benefits) is **far smaller** than the potential second-tier tax ($7 million-$17 million).

**(iii) VFCP filing fee and administrative costs:** The DOL does not charge a filing fee for VFCP, but outside counsel fees for preparing the VFCP submission, calculating correction amounts, and coordinating with the DOL typically range from $15,000-$35,000.

**Total Correction Cost:** $25,000-$55,000 (disgorgement + counsel fees), compared to $7 million-$17 million second-tier tax avoided.

**Probability Assessment:** The 80-90% probability that correction will be completed successfully (reflected in the $700,000-$3.4 million weighted second-tier tax exposure, down from the gross $7 million-$17 million maximum) accounts for this favorable correction pathway. However, there is a 10-20% risk that correction is not completed timely because:

- Forensic trade blotter review is delayed beyond the IRS examination initiation, forfeiting VFCP benefits
- Disgorgement calculation is disputed by the DOL or IRS (e.g., if the DOL determines that Pinnacle received additional undisclosed benefits such as favorable allocation of liquid securities to preferred clients)
- The acquirer declines to pursue VFCP correction due to reputational concerns about publicly acknowledging prohibited transactions (VFCP submissions are not public, but clients may become aware through annual plan audits)

**Critical Action Item for Acquirer:** Engage ERISA counsel within 30 days of closing to: (1) conduct forensic trade blotter review identifying all cross-trades and counterparty classifications; (2) calculate correction amounts under VFCP methodology; (3) prepare VFCP submission package; and (4) file with DOL before IRS examination risk materializes. This proactive approach maximizes probability of second-tier tax avoidance (increasing probability from 80% to 95%+) and demonstrates good-faith compliance culture to clients and regulators.

**3. Taft-Hartley Plan Termination Risk — Relationship Longevity and Performance**

Pinnacle manages $1.9 billion for 8 Taft-Hartley multi-employer pension plans (representing 11% of ERISA assets and $1.1 million annual fee revenue). The cross-trading prohibited transaction disclosure creates a 15-25% probability that 1-2 of these plans will terminate the relationship, resulting in $137,500-$275,000 annual fee loss (per Section IV.C.B.1 exposure calculation).

Pinnacle's Taft-Hartley relationships average 8+ years in duration, and the securities-researcher-report indicates "strong long-term performance" for institutional equity mandates. This tenure and performance record suggest that plan trustees may not terminate relationships solely based on the cross-trading disclosure, particularly if Pinnacle:

**(i) Proactively discloses the violation:** Send written notice to all 8 Taft-Hartley plan boards explaining: (a) the cross-trades occurred during 2021-2023; (b) pricing was established using independent market quotations; (c) no plan suffered financial harm (trades executed at fair market value); (d) Pinnacle adopted written cross-trading policies in May 2024 to prevent recurrence; and (e) Pinnacle is pursuing VFCP correction to restore any economic benefits.

**(ii) Offers enhanced reporting:** Provide quarterly cross-trade reports (as required under PTE 86-128, even if not relied upon for the historical trades) going forward, demonstrating transparency and commitment to compliance.

**(iii) Provides pricing validation:** Engage an independent third party (e.g., the existing independent pricing service providers Houlihan Lokey or Duff & Phelps) to review the historical cross-trades and issue a fairness opinion confirming that pricing was consistent with independent market quotations.

**However, Taft-Hartley trustees face unique pressures that may override relationship longevity and performance:**

**(a) Fiduciary liability concerns:** Trustees who become aware of prohibited transactions have an affirmative duty under ERISA Section 405(a) to investigate and take corrective action. Failure to terminate a service provider with documented prohibited transaction violations may expose trustees to personal liability for breach of fiduciary duty. Legal counsel to the plan may recommend termination as the "safest" course of action to avoid potential co-fiduciary liability claims.

**(b) Participant scrutiny:** Union-appointed trustees (representing plan participants) face pressure from union members who may view prohibited transactions as evidence of improper self-dealing or conflicts of interest. Even if the cross-trades resulted in no financial harm, the perception of impropriety may be politically untenable for union trustees facing re-election or reappointment.

**(c) DOL examination risk:** Taft-Hartley plans are subject to heightened DOL examination frequency (averaging every 3-5 years vs. 7-10 years for corporate single-employer plans). If the DOL examines a Taft-Hartley plan and discovers that the plan continued to retain Pinnacle after becoming aware of prohibited transaction violations, the DOL may scrutinize the trustees' decision-making process and potentially bring enforcement actions against the trustees for failure to prudently monitor service providers.

**(d) Cascading terminations:** If one Taft-Hartley plan terminates Pinnacle and the termination becomes known within the Taft-Hartley community (plans often share information through industry conferences and consultant networks), other plans may feel compelled to terminate to avoid appearing lax in their fiduciary oversight. This "herd behavior" dynamic is particularly pronounced in the Taft-Hartley sector.

**Probability Assessment:** The 15-25% probability of Taft-Hartley plan terminations (1-2 of 8 plans) reflects this balance:

- **Lower bound (15%):** Assumes proactive communication, documented remediation, VFCP filing, independent pricing validation, and strong historical performance collectively persuade 6-7 plans to retain Pinnacle. This is the "best case" scenario contingent on flawless execution of the mitigation strategy.

- **Upper bound (25%):** Assumes one plan terminates based on trustee legal counsel recommendation (fiduciary liability concerns), triggering a second termination due to herd behavior/reputational contagion within the Taft-Hartley community. This is a "reasonably likely" adverse scenario.

- **Midpoint (20%):** Most likely outcome is that 1-2 plans conduct RFPs (request for proposals) to evaluate replacement managers, and 1 plan ultimately terminates while the other retains Pinnacle after receiving detailed explanation and remediation documentation.

**Mitigating Actions to Reduce Probability:** The acquirer cannot reduce the Taft-Hartley termination probability below 15% without additional mitigating actions such as:

- Fee reduction offers (e.g., reducing management fees by 2-3 basis points for 12-24 months as goodwill gesture)
- Enhanced governance: Appoint an independent fiduciary (third-party ERISA attorney or consultant) to review Pinnacle's cross-trading policies and issue a compliance certification letter that trustees can rely upon to demonstrate prudent monitoring
- Insurance: If Pinnacle's fiduciary liability policy includes coverage for "prior acts" (acts occurring before the policy inception date), provide evidence of insurance to trustees, demonstrating that any residual liability exposure is insured

These enhanced mitigations may reduce the probability to 10-15%, but cannot eliminate the risk entirely given the structural incentives facing Taft-Hartley trustees to prioritize fiduciary liability protection over relationship continuity.

----

"""

def insert_counter_analysis_sections(lines, boundaries):
    """Insert counter-analysis sections and extract only IV.A-IV.C."""

    # Extract sections
    iv_a_lines = extract_section(lines, boundaries['IV.A_start'], boundaries['IV.A_end'])
    iv_b_lines = extract_section(lines, boundaries['IV.B_start'], boundaries['IV.B_end'])
    iv_c_lines = extract_section(lines, boundaries['IV.C_start'], boundaries['IV.C_end'])

    # Find insertion points (before "### C. Risk Assessment" or similar)
    def find_risk_assessment_line(section_lines):
        for i, line in enumerate(section_lines):
            if re.match(r'^###\s+C\.\s+Risk Assessment', line):
                return i
        # Fallback: insert at end
        return len(section_lines)

    iv_a_insert = find_risk_assessment_line(iv_a_lines)
    iv_b_insert = find_risk_assessment_line(iv_b_lines)
    iv_c_insert = find_risk_assessment_line(iv_c_lines)

    # Create counter-analysis subsections
    iv_a_counter = create_counter_analysis_iv_a()
    iv_b_counter = create_counter_analysis_iv_b()
    iv_c_counter = create_counter_analysis_iv_c()

    # Insert into sections
    iv_a_lines.insert(iv_a_insert, iv_a_counter)
    iv_b_lines.insert(iv_b_insert, iv_b_counter)
    iv_c_lines.insert(iv_c_insert, iv_c_counter)

    # Return only consolidated sections IV.A-IV.C
    result = []
    result.append("# SECTIONS IV.A-IV.C WITH CONSOLIDATED COUNTER-ANALYSIS\n\n")
    result.append("*Generated by W3-COUNTER-IV-A-C consolidation task*\n\n")
    result.append("---\n\n")
    result.extend(iv_a_lines)
    result.append("\n---\n\n")
    result.extend(iv_b_lines)
    result.append("\n---\n\n")
    result.extend(iv_c_lines)

    return result

def main():
    print("Loading memorandum...")
    lines = read_memo()
    print(f"Loaded {len(lines)} lines")

    print("Finding section boundaries...")
    boundaries = find_section_boundaries(lines)
    print(f"Boundaries: {boundaries}")

    print("Creating consolidated counter-analysis subsections...")
    output_lines = insert_counter_analysis_sections(lines, boundaries)

    print("Writing consolidated output...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)

    print(f"\n✓ Complete! Consolidated sections IV.A-IV.C written to:")
    print(f"  {OUTPUT_PATH}")
    print(f"  Output contains {len(output_lines)} lines")
    print(f"\nCounter-Analysis subsections added:")
    print(f"  - Section IV.A: F. Counter-Analysis")
    print(f"  - Section IV.B: F. Counter-Analysis")
    print(f"  - Section IV.C: F. Counter-Analysis")

if __name__ == "__main__":
    main()
