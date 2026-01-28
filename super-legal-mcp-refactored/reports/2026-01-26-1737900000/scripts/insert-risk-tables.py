#!/usr/bin/env python3
"""
Insert risk assessment tables into final-memorandum-v2.md
Inserts tables before "### C. Risk Assessment" in each Section IV subsection
"""

import sys

# Insertion points (line numbers where ### C. Risk Assessment appears)
INSERTION_POINTS = {
    'IV.A': 1391,
    'IV.B': 2088,
    'IV.C': 3193,
    'IV.D': 4303,
    'IV.E': 5001,
    'IV.F': 5942,
    'IV.G': 7151,
}

# Risk assessment table content for each section
TABLES = {
    'IV.A': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| Orange County SFF Medicare Termination | CRITICAL | 60% (basis: SFF candidate + repeat IJ citations per 42 C.F.R. § 488.412) | $24.6M (annual Medicare/Medicaid revenue at risk) | Conditional closing provision; $28M-$30M price reduction if excluded; $2.75M annual quality improvement plan |
| DPNA Recurrence Risk (Orange County) | HIGH | 50-60% (basis: SFF enhanced survey 2×/year per CMS SFF protocol) | $1.44M-$2.88M (6-8 month revenue loss, EV calculation) | $10M regulatory escrow, 24-month survival; SFF improvement plan |
| Resident Trust Fund Surety Bond Shortfall | HIGH | 100% (basis: CA statutory requirement Cal. Health & Safety Code § 1569.156) | $5.27M ($4.9M bond gap + $72K interest distribution) | Closing condition: Seller obtains $5.2M surety bond or LOC pre-closing |
| CMS/California AB 1502 Staffing Compliance | HIGH | 75% (basis: CDPH enforcement pattern 2024-2025) | $580K annually (13 CNAs for CA facilities per AB 1502 3.5 PPD minimum) | Hire 13 CNAs within 90 days post-closing; closing representation |
| Civil Monetary Penalties Escalation | MEDIUM | 30% (basis: if 3rd IJ citation triggers per-day CMPs per 42 C.F.R. § 488.438) | $500K-$1.07M (per-day CMPs, upper range statutory maximum) | $10M regulatory escrow covers CMP exposure; SFF improvement plan |
| Life Safety Code Capital Requirements | MEDIUM | 60% (basis: deferred LSC violations typical in aging facilities) | $341K (fire safety system upgrades per NFPA 101) | Pre-closing LSC assessments or $350K escrow holdback |

**Section Total Weighted Exposure:** $22.9M-$24.6M (after correlation adjustments for Orange County concentration)

""",
    'IV.B': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| FCA Settlement (DOJ Intervention) | HIGH | 71.25% (basis: 70-80% intervention × 95% settlement rate per DOJ FCA Statistics 2023) | $8M-$15M (EV: $9.1M based on SNF precedent $385K-$725K per facility) | $12M escrow; seller special indemnification; 60/40 restitution/penalty allocation |
| Corporate Integrity Agreement (5-year NPV) | HIGH | 75% (basis: OIG CIA database 2015-2024 showing 78% CIA rate for $8M+ SNF settlements) | $3.5M-$6M (NPV at 8% discount: IRO audits, compliance officer, annual costs) | Buyer assumes CIA post-closing; $4M purchase price credit for compliance burden |
| Martinez Wrongful Termination (FCA Retaliation) | MEDIUM-HIGH | 45% (basis: FCA anti-retaliation prima facie case per 31 U.S.C. § 3730(h)) | $680K-$1.4M compensatory + punitive $1M-$3M | Separate settlement $500K-$750K; seller indemnity; coordinate with FCA settlement |
| OIG Exclusion Risk (Tail Event) | LOW | 5-10% (basis: first-offense mitigation per OIG exclusion guidelines) | $79.8M (28% Medicare revenue × $285M annual = lost federal program participation) | Settlement compliance; first-offender mitigation argument; CIA acceptance |

**Section Total Weighted Exposure:** $9M-$15.2M (median: $12.1M)

""",
    'IV.C': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| CHOW Approval Delay (Orange County) | HIGH | 45% (basis: SFF candidate enhanced CMS scrutiny per 42 C.F.R. § 489.18) | $24.6M-$49.2M (3-6 month carrying cost @ $8.2M/month facility revenue) | Conditional closing provision permitting Orange County exclusion with $28M-$30M price reduction |
| Medical Director AKS Violation (12 facilities) | HIGH | 70% (basis: Dr. Johnson $180K for 42% referrals exceeds FMV benchmarks per 42 C.F.R. § 1001.952(d)) | $2.16M-$2.88M (disgorgement across 12 medical director contracts @ $180K-$240K each) | Independent FMV valuation; prospective remediation; seller indemnity for pre-closing violations |
| Managed Care Contract Assignments | MEDIUM | 40% (basis: consent delay or rate renegotiation during CHOW approval) | Operational continuity risk (5-15% rate differential possible) | 60-90 day advance notice; CHOW-contingent consents; managed care escrow $1M-$2M |
| Pharmacy/Lab Contract Renegotiation | LOW | 20% (basis: standard assignment provisions in vendor contracts) | $0-$500K (minor rate adjustments possible during assignment) | Standard assignment provisions; 30-day notice to vendors |

**Section Total Weighted Exposure:** $13.5M-$15.1M (excludes Orange County conditional closing, treated separately)

""",
    'IV.D': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| Material Insurance Underinsurance (Worst-Case) | CRITICAL | 25% (basis: multiple claim scenario probability per Monte Carlo 10K iterations) | $60M-$72M (worst-case uninsured: FCA trial + COVID-19 + EPL punitive damages) | $12M-$15M price reduction; post-closing coverage enhancements ($510K-$730K annually) |
| D&O Prior Knowledge Exclusion (FCA Coverage) | HIGH | 70% (basis: Board minutes June 2020 pre-policy inception per Level 3 Commc'ns standard) | $8M-$15M (FCA settlement partially/fully uninsured if post-6/2020 policy inception) | Verify D&O inception date within 48 hours; seller indemnity if post-June 2020 policy |
| COVID-19 Wrongful Deaths (Communicable Disease Exclusion) | HIGH | 60% (basis: 60-70% of 2023-2024 SNF policies contain exclusion per Aon 2024 Report) | $4M-$12M (4 deaths @ $1M-$3M each; 7 additional families may file within SOL) | Verify professional liability exclusion scope; $6M escrow if broad exclusion confirmed |
| Tail Coverage (6-year ERP Required) | HIGH | 100% (basis: 42 C.F.R. § 483.12(c)(3) statutory requirement for claims-made policies) | $1.33M-$1.73M (250-300% of annual premium for 6-year tail per Willis Towers Watson 2024) | Closing condition: Seller purchases tail coverage; 75% seller-funded ($997K-$1.3M seller cost) |

**Section Total Weighted Exposure:** $22.7M-$28.9M (probability-weighted: $18.7M expected uninsured loss)

""",
    'IV.E': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| High Staff Turnover (Current State) | HIGH | 100% (basis: operational reality—85% CNA, 55% LPN, 40% RN per Fact Registry) | $12M annually ($2.5M recruitment + $9.5M agency premium = 23% of EBITDA) | Retention strategy required (see Finding #2); operational cost affecting valuation |
| Retention Strategy Net Annual Cost | HIGH | 100% (basis: required for sustainable operations and CMS Five Star improvement) | $11.35M net annual cost ($16.45M investment - $5.1M savings from reduced turnover) | Operational cost; normalize EBITDA by $11.35M annually for deal valuation |
| CA AB 1502 Staffing Shortfall | HIGH | 75% (basis: CDPH enforcement pattern for 3.5 PPD minimum per Cal. Health & Safety Code §§ 1276.5, 1276.65) | $580K annually (13 CNAs for CA facilities to achieve 3.5 PPD compliance) | Hire 13 CNAs within 90 days post-closing; closing representation of current PPD levels |
| CA Meal/Rest Breaks (Historical Exposure) | HIGH | 60% (basis: class action probability given pattern across 3 CA facilities per Brinker Restaurant precedent) | $600K (3-year look-back: 300 affected employees × $2K average per Cal. Lab. Code §§ 226.7, 512) | $800K escrow, 24-month survival; seller indemnification for pre-closing violations |
| CA Meal/Rest Breaks (Ongoing Annual) | MEDIUM | 60% (basis: ongoing exposure if remediation not implemented post-closing) | $200K annually (if compliance systems not implemented within 90 days) | Automated meal/rest break tracking system; manager training; remediation plan within 60 days |
| WARN Act (Orange County Closure) | HIGH | 12.5% (basis: 60% SFF termination × 70% closure decision × 30% inadequate notice) | $5.2M (350 employees × 60 days × $250/day average wage per 29 U.S.C. § 2104) | Seller indemnity; conditional closing provision (if Orange County excluded, WARN risk eliminated) |

**Section Total Weighted Exposure:** $13.5M-$15.1M (one-time) + $11.93M annually (ongoing operational costs: $11.35M retention + $580K staffing)

""",
    'IV.F': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| HIPAA Security Rule Gaps (Risk Assessment + Encryption) | MEDIUM | 40.5% (basis: 38% outdated risk assessment × 15% unencrypted devices per OCR audit patterns) | $250K-$1.1M (OCR tiered penalties: $100-$50K per violation × 45 C.F.R. § 160.404 tiers) | $160K-$225K remediation: updated risk assessment ($40K-$60K) + device encryption ($120K-$165K) |
| BAA Assignment Gaps (Vendor Contracts) | MEDIUM | 30% (basis: CHOW complexity affecting EMR, cloud storage, therapy provider BAAs) | $50K-$200K (OCR enforcement $100-$50K per BAA violation per 45 C.F.R. § 164.502(e)) | Systematic BAA audit within 30 days; obtain missing BAAs; assignment riders for CHOW |

**Section Total Weighted Exposure:** $64K-$446K (probability-weighted: $56.5K-$393K HIPAA + $7K-$52.5K BAA = $63.5K-$445.5K)

""",
    'IV.G': """
### Risk Assessment Summary

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| Section 338(h)(10) Election Value | MEDIUM-HIGH | 100% (basis: election available and strategically beneficial if negotiated properly) | $50.77M NPV benefit to buyer over 10 years; requires $37M-$50M price increase to seller | Negotiate 40-50% seller allocation (50-50 split: $25.4M each party); net buyer benefit $0.77M-$13.77M |
| FCA Settlement Tax Allocation | HIGH | 75% (basis: DOJ settlement probability creating tax optimization opportunity) | $2.77M tax benefit (basis: 60% restitution deductible per IRC § 162 vs. 40% penalties non-deductible per § 162(f)) | Structure settlement agreement: explicit 60% restitution / 40% penalties allocation clause |
| State Transaction Taxes (AZ TPT + CA Sales Tax) | HIGH | 100% (basis: asset purchase structure triggers state transaction taxes in AZ and CA) | $1.54M gross ($967.5K AZ TPT + $573.75K CA sales tax); $609K net buyer cost after exemptions | Negotiate 60-75% seller reimbursement (from standard 50%); file CA medical device exemptions |

**Section Total Weighted Exposure:** $609K net buyer cost (state taxes); $2.77M tax savings opportunity (FCA allocation); $0.77M-$13.77M net benefit (338(h)(10) election if negotiated at 40% allocation)

""",
}

def insert_tables(input_file, output_file):
    """Insert risk tables into memorandum at specified line numbers"""

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Insert tables in reverse order to preserve line numbers
    sections_sorted = sorted(INSERTION_POINTS.items(), key=lambda x: x[1], reverse=True)

    for section, line_num in sections_sorted:
        # Insert before the line (line_num is 1-indexed, list is 0-indexed)
        insert_pos = line_num - 1
        table_content = TABLES[section]

        # Split table content into lines and add to file
        table_lines = table_content.split('\n')
        for table_line in reversed(table_lines):
            lines.insert(insert_pos, table_line + '\n')

        print(f"✅ Inserted table for Section {section} at line {line_num}")

    # Write output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f"\n✅ Risk tables inserted successfully")
    print(f"📄 Output file: {output_file}")
    print(f"📊 Total tables inserted: {len(TABLES)}")

if __name__ == "__main__":
    input_file = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737900000/final-memorandum-v2.md"
    output_file = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737900000/final-memorandum-v2-tables.md"

    insert_tables(input_file, output_file)
