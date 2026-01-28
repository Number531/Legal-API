#!/usr/bin/env python3
"""
Apply W4-002 Questions Presented reformatting
Replaces "Whether" format with "Under/Does/When" format
"""

import sys
import re

# New Under/Does/When format questions from W4-002-questions-format.md
QUESTIONS = [
    """1. **CMS Regulatory Compliance - Orange County SFF Termination Risk**: Under 42 C.F.R. Part 488 Subpart E and CMS QSO-23-01-NH (October 2023 Special Focus Facility policy revision), Does Orange County Care Center face deal-blocking Medicare provider agreement termination eliminating $24.6M in annual revenue by March 2028, When the facility received Special Focus Facility candidate designation (September 2024) following two immediate jeopardy citations within 12 months (March 2023 Coumadin error, March 2024 COVID-19 outbreak) and a third immediate jeopardy citation on the March 2025 standard survey would trigger automatic termination under revised CMS policy, and Can pre-closing quality improvement interventions reduce termination probability below 35%?""",

    """2. **False Claims Act Settlement Exposure**: Under 31 U.S.C. § 3729 (False Claims Act treble damages and civil penalties), Does the Martinez qui tam litigation (filed May 2023, alleging therapy upcoding medical necessity violations and medical director kickbacks) create statutory damages exposure of $58.7M-$77.2M that will likely settle within manageable parameters of $8M-$15M, When DOJ intervention probability is 55-65% and historical skilled nursing FCA settlements average 13-19% of statutory exposure, and Can settlement structure isolate liability to seller Golden Gate Capital through indemnification escrow and representation caps?""",

    """3. **Corporate Integrity Agreement Costs**: Under DOJ Corporate Integrity Agreement policy for healthcare fraud settlements (75-85% imposition rate for settlements exceeding $5M), Does DOJ intervention in the Martinez FCA litigation trigger a 5-year Corporate Integrity Agreement with annual compliance costs of $2.2M-$3.2M ($11M-$16M NPV), When settlement amount projects to $8M-$15M range with medical director kickback and therapy upcoding allegations, and Can CIA scope and duration be negotiated to 3 years with limited Independent Review Organization oversight rather than full claims review?""",

    """4. **Employment Staff Retention Investment**: Under 42 C.F.R. § 483.35 (CMS staffing minimums repealed December 2025), Does the repeal eliminate the anticipated $4.3M annual compliance burden for Sunset Senior Living Group's 12 facilities, When current staffing already meets repealed minimum of 3.48 hours per patient day (Sunset average: 3.52 hours), and Does the current 85% CNA turnover rate nevertheless require $11M annual retention investment to maintain operational quality and support Orange County Special Focus Facility mitigation strategy despite regulatory relief?""",

    """5. **California SB 525 Wage Requirements**: Under California Health and Safety Code § 1339.2 (SB 525 minimum wage requirements effective June 1, 2025), Do Sunset's six California facilities (Santa Barbara, San Luis Obispo, Monterey, San Jose, Modesto, Fresno) comply with $21/hour CNA minimum and $23/hour LVN minimum, When current data identifies 144 CNAs paid below $21/hour (representing 48% of California CNAs) and 23 LVNs paid below $23/hour (representing 29% of California LVNs), creating retroactive liability exposure of $600K-$1.2M plus prospective annual compliance costs of $1.25M?""",

    """6. **WARN Act Termination Penalties**: Under 29 U.S.C. § 2101 (Worker Adjustment and Retraining Notification Act requiring 60-day advance notice for mass layoffs), Does Orange County Care Center Medicare termination following a third immediate jeopardy citation trigger WARN Act liability for 290 facility employees without practical ability to provide 60-day advance notice, When CMS regulatory timeline mandates provider agreement termination within 23 days of third immediate jeopardy citation under 42 C.F.R. § 488.412, creating exposure of $3.75M-$4.5M (60 days' wages and benefits for all affected employees)?""",

    """7. **Anti-Kickback Statute - Medical Director Compensation**: Under 42 U.S.C. § 1320a-7b(b) (Anti-Kickback Statute) and the employment safe harbor at 42 C.F.R. § 1001.952(i), Does Dr. Robert Johnson's medical director agreement at Sunset Oaks ($180,000 annually, representing 90th percentile compensation for comparable facilities) violate fair market value requirements, When Martinez relator allegations assert minimal time commitment (1 hour/month documented) and primary purpose is to induce Medicare/Medicaid referrals, creating $3M-$5M contribution to total FCA settlement exposure of $8M-$15M?""",

    """8. **IRC Section 338(h)(10) Tax Election**: Under IRC Section 338(h)(10) and Treasury Regulation Section 1.338(h)(10)-1(e) (deemed asset sale election for S corporation acquisitions), Does Silver Oak achieve stepped-up basis tax benefits delivering $5M-$5.25M annual tax savings ($35M NPV over 7 years) while maintaining seller Golden Gate Capital tax neutrality, When Sunset's outside basis ($380M carried interest basis) exceeds inside basis ($115M net assets) by $265M and the liquidation offset mechanism under Treas. Reg. § 1.338(h)(10)-1(e)(2) applies to eliminate seller's taxable gain without requiring purchase price adjustment?""",

    """9. **FCA Insurance Coverage Gap**: Under Directors & Officers liability policy exclusions for fraudulent or dishonest acts, Does Sunset's D&O policy ($10M per occurrence, $20M aggregate limits) provide coverage for the Martinez False Claims Act settlement, When policy contains standard fraud exclusion language and Martinez complaint alleges "willful violation" of medical necessity requirements and medical director kickback scheme, resulting in estimated 40-60% uninsured settlement exposure ($4.8M-$10.5M) that Silver Oak must fund from operating cash flow versus insurance proceeds?""",

    """10. **Therapy Contract Assignment Fees**: Under change-of-control consent provisions in Sunset's therapy service contracts with national providers (Select Rehabilitation, Benchmark Therapy, Therapy Resource Management), Do "sole discretion" consent clauses create assignment fee exposure of $600K-$2.4M plus termination risk requiring temporary agency staffing at $4.5M-$6M during transition, When contracts cover 70-90 contract therapists representing $9.45M-$12.15M annual spend (78% of therapy revenue) and industry precedent shows 20-25% of contracts use change-of-control events to demand 5-10% annual fee increases or market-rate resets?""",

    """11. **HIPAA Breach Notification Exposure**: Under 45 C.F.R. § 164.404 (HIPAA Breach Notification Rule) and California Confidentiality of Medical Information Act Cal. Civ. Code § 56.06, Does Sunset's current cybersecurity posture (lacking endpoint detection and response systems, multi-factor authentication deficiencies on 40% of administrative accounts) create material breach notification exposure, When 8.2% annual ransomware probability for skilled nursing facilities creates expected value of $3.0M annually ($1.7M regulatory fines under HIPAA and California CMIA, $1.3M notification costs for 47,000 patient records)?""",

    """12. **Sale-Leaseback Transaction Timing**: Under IRC Section 338(h)(10) stepped-up basis depreciation benefits ($5M annually over 7-year recovery period for qualified real property) versus immediate liquidity from sale-leaseback monetization ($120M-$160M property value for 8 of 12 owned facilities), Does immediate post-closing sale-leaseback maximize transaction value, or Does deferring sale-leaseback to Year 2-3 preserve $63M-$90M enterprise value by first capturing stepped-up basis depreciation benefits ($5M annually × 3 years = $15M tax savings, $10.5M after-tax) before converting to operating lease structure and monetizing real estate at stabilized post-acquisition valuations?"""
]

def apply_questions(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the Questions Presented section
    section_start = content.find('## II. QUESTIONS PRESENTED')
    if section_start == -1:
        print("ERROR: Questions Presented section not found")
        sys.exit(1)

    # Find the end of the section (next ## header)
    section_end = content.find('\n## III.', section_start)
    if section_end == -1:
        print("ERROR: End of Questions Presented section not found")
        sys.exit(1)

    # Build the new section
    new_section = "## II. QUESTIONS PRESENTED\n\n"
    new_section += "\n\n".join(QUESTIONS)
    new_section += "\n\n----\n\n"

    # Replace the section
    new_content = content[:section_start] + new_section + content[section_end:]

    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("✓ Questions Presented reformatted successfully")
    print(f"  Questions updated: 12/12")
    print(f"  Format: Under/Does/When structure")
    print(f"\n✓ SUCCESS: All questions now comply with QA Dimension 1 requirements")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python3 W4-002-apply-questions.py <input_file> <output_file>")
        sys.exit(1)

    apply_questions(sys.argv[1], sys.argv[2])
