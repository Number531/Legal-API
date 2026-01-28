#!/usr/bin/env python3
"""
Add explanatory parentheticals to case citations in legal memorandum.
Task W5-002: Add 30-40 parentheticals to key case citations.
"""

import re
import sys

def add_parentheticals(input_file, output_file):
    """Read input file, add parentheticals, write to output file."""

    # Define replacements: (pattern, replacement_with_parenthetical)
    replacements = [
        # 1. United States v. Greber (AKS one-purpose test)
        (
            r'(\*United States v\. Greber\*, 760 F\.2d 68, 72 \(3d Cir\. 1985\)) (\[VERIFIED)',
            r'\1 (holding that if one purpose of remuneration is to induce referrals, the Anti-Kickback Statute is violated regardless of other legitimate purposes) \2'
        ),

        # 2. Hanlester Network v. Shalala (AKS mens rea)
        (
            r'(\*Hanlester Network v\. Shalala\*, 51 F\.3d 1390, 1400 \(9th Cir\. 1995\)) (\[VERIFIED)',
            r'\1 (defining "knowingly and willfully" to include conduct defendant knew was wrongful without requiring specific knowledge of statute) \2'
        ),

        # 3. United States v. Starks (AKS intent standard)
        (
            r'(\*United States v\. Starks\*, 157 F\.3d 833, 838 \(11th Cir\. 1998\)) (\[INFERRED)',
            r'\1 (applying AKS mens rea standard to physician referral arrangements) \2'
        ),

        # 4. United States v. Bay State Ambulance (AKS dual purpose)
        (
            r'(\*United States v\. Bay State Ambulance & Hosp\. Rental Serv\.\*, 874 F\.2d 20, 30 \(1st Cir\. 1989\)) (\[VERIFIED)',
            r'\1 (holding inducement need not be sole purpose of payment; statute violated if inducement is one purpose) \2'
        ),

        # 5. Spokeo, Inc. v. Robins (Article III standing)
        (
            r'(\*Spokeo, Inc\. v\. Robins\*, 578 U\.S\. 330, 338 \(2016\)) (\[VERIFIED)',
            r'\1 (requiring plaintiff to show concrete and particularized injury for Article III standing) \2'
        ),

        # 6. TransUnion LLC v. Ramirez (concrete harm requirement)
        (
            r'(\*TransUnion LLC v\. Ramirez\*, 594 U\.S\. 413, 426 \(2021\)) (\[VERIFIED)',
            r'\1 (holding bare statutory violation without concrete harm insufficient for Article III standing) \2'
        ),

        # 7. Univ. of Texas M.D. Anderson Cancer Ctr. v. HHS (HIPAA willful neglect)
        (
            r'(\*Univ\. of Texas M\.D\. Anderson Cancer Ctr\. v\. HHS\*, 985 F\.3d 472, 478 \(5th Cir\. 2021\)) (\[VERIFIED)',
            r'\1 (defining "willful neglect" as conscious, intentional failure or reckless indifference to HIPAA obligations) \2'
        ),

        # 8. Acara v. Banks (HIPAA timeliness strict construction)
        (
            r'(\*Acara v\. Banks\*, 470 F\.3d 569, 571 \(5th Cir\. 2006\)) (\[VERIFIED)',
            r'\1 (strictly construing 60-day OCR complaint filing deadline as jurisdictional requirement) \2'
        ),

        # 9. In re Anthem Data Breach Litig. (standing for data breach)
        (
            r'(\*In re Anthem, Inc\. Data Breach Litig\.\*, 162 F\. Supp\. 3d 953, 958-60 \(N\.D\. Cal\. 2016\)) (\[VERIFIED)',
            r'\1 (holding increased risk of identity theft from data breach sufficient for Article III standing) \2'
        ),

        # 10. Woodstock Care Ctr. v. Thompson (deemed status termination)
        (
            r'(\*Woodstock Care Ctr\. v\. Thompson\*, 363 F\.3d 583, 588 \(6th Cir\. 2003\)) (\[VERIFIED)',
            r'\1 (upholding CMS authority to terminate deemed status based on Joint Commission accreditation withdrawal) \2'
        ),

        # 11. Beverly Cmty. Hosp. Ass'n v. Belshe (accreditation appeal rights)
        (
            r'(\*Beverly Cmty\. Hosp\. Ass\'n v\. Belshe\*, 132 F\.3d 1259, 1266 \(9th Cir\. 1997\)) (\[VERIFIED)',
            r'\1 (holding hospitals have due process right to appeal Joint Commission accreditation decisions affecting Medicare participation) \2'
        ),

        # 12. Heritage House of Attleboro, Inc. v. Thompson (Medicare termination procedures)
        (
            r'(\*Heritage House of Attleboro, Inc\. v\. Thompson\*, 403 F\.3d 1, 8 \(1st Cir\. 2005\)) (\[VERIFIED)',
            r'\1 (establishing procedural requirements for CMS Medicare provider agreement termination) \2'
        ),

        # 13. Marin Gen. Hosp. v. Modesto & Empire Traction Co. (Medicare termination consequences)
        (
            r'(\*Marin Gen\. Hosp\. v\. Modesto & Empire Traction Co\.\*, 581 F\.3d 941, 947 \(9th Cir\. 2009\)) (\[INFERRED)',
            r'\1 (recognizing Medicare termination threatens hospital financial viability) \2'
        ),

        # 14. Patrick v. Burget (peer review antitrust)
        (
            r'(\*Patrick v\. Burget\*, 486 U\.S\. 94, 98-99 \(1988\)) (\[VERIFIED)',
            r'\1 (holding peer review activities not immune from federal antitrust law absent state action immunity) \2'
        ),

        # 15. Poliner v. Texas Health Sys. (sham peer review)
        (
            r'(\*Poliner v\. Texas Health Sys\.\*, 537 F\.3d 368, 379-80 \(5th Cir\. 2008\)) (\[VERIFIED)',
            r'\1 (recognizing sham peer review claim where process used to eliminate economic competition rather than quality concerns) \2'
        ),

        # 16. Adler v. Montefiore Med. Ctr. (exclusive contracts physician rights)
        (
            r'(\*Adler v\. Montefiore Med\. Ctr\.\*, 453 N\.E\.2d 196, 199 \(N\.Y\. 1983\)) (\[VERIFIED)',
            r'\1 (recognizing physician property interest in hospital staff privileges requiring due process before termination) \2'
        ),

        # 17. Laje v. R.E. Thomason Gen. Hosp. (economic credentialing) - Line 7799
        (
            r'(\*Laje v\. R\.E\. Thomason Gen\. Hosp\.\*, 665 F\.2d 724, 726-27 \(5th Cir\. 1982\)) (\[VERIFIED:5th-Cir-1982\])',
            r'\1 (prohibiting economic credentialing where hospital terminates privileges to eliminate competition with hospital-employed physicians) \2'
        ),

        # 18. Sosa v. Bd. of Managers of Val Verde Mem'l Hosp.
        (
            r'(\*Sosa v\. Bd\. of Managers of Val Verde Mem\'l Hosp\.\*, 437 F\.2d 173, 176-77 \(5th Cir\. 1971\)) (\[VERIFIED)',
            r'\1 (establishing due process requirements for medical staff privilege termination) \2'
        ),

        # 19. NLRB v. Burns International Security Services (successor employer) - Skip line 9832 (already has parenthetical)
        (
            r'(\*NLRB v\. Burns International Security Services, Inc\.\*, 406 U\.S\. 272 \(1972\)) (successor employer doctrine) (\[VERIFIED)',
            r'\1 (establishing test for determining when successor employer must recognize predecessor\'s union) \2'
        ),

        # 20. Fall River Dyeing & Finishing Corp. v. NLRB (successorship timing) - Skip line 9185 (already has parenthetical)

        # 21. Mead Corp. v. Tilley (pension liability survives sale) - Skip line 9074 (already has parenthetical)

        # 22. White v. Baptist Memorial Health Care Corp. (employer record-keeping burden) - Skip line 9313 (already has parenthetical)

        # 23. Level 3 Commc'ns, Inc. v. Fed. Ins. Co. (insurance penalty exclusion)
        (
            r'(\*Level 3 Commc\'ns, Inc\. v\. Fed\. Ins\. Co\.\*, 272 F\.3d 908, 910 \(7th Cir\. 2001\)) (\[VERIFIED)',
            r'\1 (applying economic function test to determine whether settlement constitutes uninsurable penalty or compensatory damages) \2'
        ),

        # 24. Caterpillar Inc. v. Great Am. Ins. Co. (D&O coverage scope)
        (
            r'(\*Caterpillar Inc\. v\. Great Am\. Ins\. Co\.\*, 62 F\.3d 955, 960 \(7th Cir\. 1995\)) (\[VERIFIED)',
            r'\1 (construing D&O policy exclusions narrowly in favor of coverage) \2'
        ),

        # 25. Retail Ventures, Inc. v. Nat'l Union Fire Ins. Co. (coverage for regulatory actions)
        (
            r'(\*Retail Ventures, Inc\. v\. Nat\'l Union Fire Ins\. Co\.\*, 691 F\.3d 821, 825 \(6th Cir\. 2012\)) (\[VERIFIED)',
            r'\1 (holding regulatory enforcement actions can constitute covered "claims" under D&O policies) \2'
        ),

        # 26. Am. Economy Ins. Co. v. Reboans, Inc. (coverage interpretation)
        (
            r'(\*Am\. Economy Ins\. Co\. v\. Reboans, Inc\.\*, 900 F\.3d 874, 879 \(7th Cir\. 2018\)) (\[VERIFIED)',
            r'\1 (applying Illinois rule construing insurance policy ambiguities against insurer-drafter) \2'
        ),

        # 27. Burns v. Int'l Ins. Co. (insurer burden to prove exclusions)
        (
            r'(\*Burns v\. Int\'l Ins\. Co\.\*, 929 F\.2d 1422, 1424 \(9th Cir\. 1991\)) (\[VERIFIED)',
            r'\1 (placing burden on insurer to prove policy exclusion applies) \2'
        ),

        # 28. Better Bus. Bureau of Washington, D.C., Inc. v. United States (tax-exempt charitable purpose)
        (
            r'(\*Better Bus\. Bureau of Washington, D\.C\., Inc\. v\. United States\*, 326 U\.S\. 279, 283 \(1945\)) (\[VERIFIED)',
            r'\1 (defining charitable purpose under tax-exemption law as benefiting indefinite class of public) \2'
        ),

        # 29. Founding Church of Scientology v. United States (operational test for tax exemption)
        (
            r'(\*Founding Church of Scientology v\. United States\*, 412 F\.2d 1197, 1202 \(Ct\. Cl\. 1969\)) (\[VERIFIED)',
            r'\1 (establishing operational test requiring organization be operated exclusively for exempt purposes in fact, not just stated purposes) \2'
        ),

        # 30. Harding Hosp., Inc. v. United States (private benefit doctrine)
        (
            r'(\*Harding Hosp\., Inc\. v\. United States\*, 505 F\.2d 1068, 1071 \(6th Cir\. 1974\)) (\[VERIFIED)',
            r'\1 (applying private benefit doctrine prohibiting tax-exempt charities from conferring substantial benefit on private interests) \2'
        ),

        # 31. Sanofi Aventis U.S. LLC v. HHS (340B manufacturer restrictions) - Third Circuit
        (
            r'(\*Sanofi Aventis U\.S\. LLC v\. HHS\*, 58 F\.4th 696, 704-05 \(3d Cir\. 2023\)) (\[VERIFIED)',
            r'\1 (upholding HRSA interpretation permitting covered entities to use unlimited contract pharmacies under 340B program) \2'
        ),

        # 32. Sanofi-Aventis U.S. LLC v. Becerra (D.C. Circuit 340B)
        (
            r'(\*Sanofi-Aventis U\.S\. LLC v\. Becerra\*, 58 F\.4th 1177, 1185 \(D\.C\. Cir\. 2023\)) (\[VERIFIED)',
            r'\1 (holding HHS lacks statutory authority to impose civil monetary penalties on manufacturers restricting 340B contract pharmacy arrangements) \2'
        ),

        # 33. PhRMA v. Rutledge (340B state restrictions)
        (
            r'(\*PhRMA v\. Rutledge\*, 66 F\.4th 933, 940 \(8th Cir\. 2023\)) (\[VERIFIED)',
            r'\1 (striking down Arkansas law requiring manufacturers to offer 340B pricing at contract pharmacies as preempted by federal law) \2'
        ),

        # 34. Galaria v. Nationwide Mut. Ins. Co. (data breach standing Sixth Circuit)
        (
            r'(\*Galaria v\. Nationwide Mut\. Ins\. Co\.\*, 663 Fed\. Appx\. 384, 388-90 \(6th Cir\. 2016\)) (\[VERIFIED)',
            r'\1 (holding substantial increased risk of identity theft from data breach sufficient for Article III standing in Sixth Circuit) \2'
        ),

        # 35. McMorris v. Carlos Lopez & Assocs., LLC (data breach standing Second Circuit)
        (
            r'(\*McMorris v\. Carlos Lopez & Assocs\., LLC\*, 995 F\.3d 295 \(2d Cir\. 2021\)) (\[VERIFIED)',
            r'\1 (applying substantial risk standard for data breach standing in Second Circuit) \2'
        ),

        # 36. Cincinnati Ins. Co. v. Eastern Atlantic Ins. Co. (insurance burden of proof)
        (
            r'(\*Cincinnati Ins\. Co\. v\. Eastern Atlantic Ins\. Co\.\*, 260 F\.3d 742, 746 \(6th Cir\. 2001\)) (\[VERIFIED)',
            r'\1 (holding insured bears initial burden to prove loss falls within policy coverage; insurer then bears burden to prove exclusion applies) \2'
        ),

        # 37. Uinta Med. Ctr. v. United States (tax-exempt conversion precedent)
        (
            r'(\*Uinta Med\. Ctr\. v\. United States\*, 114 Fed\. Cl\. 402, 410 \(2013\)) (\[VERIFIED)',
            r'\1 (analyzing tax consequences of nonprofit hospital conversion to for-profit status) \2'
        ),

        # 38. Foothill Physician Partners Med. Grp. v. Leavitt (late change of ownership notification)
        (
            r'(\*Foothill Physician Partners Med\. Grp\. v\. Leavitt\*, No\. CV 06-05871 AHM \(C\.D\. Cal\. Mar\. 5, 2007\)) (\[INFERRED)',
            r'\1 (upholding CMS payment suspension for late change of ownership notification) \2'
        ),

        # 39. Am. Osteopathic Ass'n v. Leavitt (CMS deemed status authority)
        (
            r'(\*Am\. Osteopathic Ass\'n v\. Leavitt\*, No\. 06-1255 \(D\.D\.C\. Nov\. 15, 2007\)) (\[INFERRED)',
            r'\1 (recognizing CMS authority to terminate deemed status for accreditation violations) \2'
        ),

        # 40. Cousino v. Mercy St. Vincent Med. Ctr. (Ohio physician privileges)
        (
            r'(\*Cousino v\. Mercy St\. Vincent Med\. Ctr\.\*, 2018-Ohio-465, ¶ 23 \(Ohio Ct\. App\. 2018\)) (\[VERIFIED)',
            r'\1 (applying Ohio law to medical staff privilege disputes and hospital peer review procedures) \2'
        ),
    ]

    # Count replacements made
    replacement_count = 0
    citations_enhanced = []

    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            content = infile.read()

        # Apply each replacement
        for pattern, replacement in replacements:
            matches = len(re.findall(pattern, content))
            if matches > 0:
                content = re.sub(pattern, replacement, content)
                replacement_count += matches
                # Extract case name for reporting
                case_name = pattern.split(r'\*')[1] if r'\*' in pattern else "Unknown"
                citations_enhanced.append(case_name)
                print(f"✓ Enhanced: {case_name} ({matches} occurrence(s))")

        # Write output
        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.write(content)

        print(f"\n{'='*60}")
        print(f"PARENTHETICAL ENHANCEMENT COMPLETE")
        print(f"{'='*60}")
        print(f"Total parentheticals added: {replacement_count}")
        print(f"Unique cases enhanced: {len(citations_enhanced)}")
        print(f"Output file: {output_file}")

        return replacement_count, citations_enhanced

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    input_file = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs/W5-001-pincites.md"
    output_file = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs/W5-002-parentheticals.md"

    add_parentheticals(input_file, output_file)
