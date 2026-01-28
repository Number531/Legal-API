#!/usr/bin/env python3
import re

# Read input file
with open('/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs/W3-001-VALIDATE-creac-review.md', 'r') as f:
    content = f.read()

# Apply replacements
replacements = {
    # Tuomey
    r"(\*United States ex rel\. Drakeford v\. Tuomey Healthcare Sys\., Inc\.\*, 792 F\.3d 364) (\(4th Cir\. 2015\))": r"\1, 376 \2",

    # Sanofi 696
    r"(\*Sanofi[- ]Aventis U\.S\. LLC v\. HHS\*, 58 F\.4th 696) (\(3[rd]{0,2} Cir\. 2023\))": r"\1, 704-05 \2",

    # Sanofi/Becerra 1177
    r"(\*Sanofi[- ]Aventis U\.S\. LLC v\. Becerra\*, 58 F\.4th 1177) (\(D\.C\. Cir\. 2023\))": r"\1, 1185 \2",

    # PhRMA
    r"(\*PhRMA v\. Rutledge\*, 66 F\.4th 933) (\(8th Cir\. 2023\))": r"\1, 940 \2",

    # Level 3
    r"(\*Level 3 Commc'ns, Inc\. v\. Fed\. Ins\. Co\.\*, 272 F\.3d 908) (\(7th Cir\. 2001\))": r"\1, 910 \2",

    # Parker v. Brown
    r"(\*Parker v\. Brown\*, 317 U\.S\. 341) (\(1943\))": r"\1, 350-51 \2",

    # MD Anderson
    r"(\*Univ\. of Texas M\.D\. Anderson Cancer Ctr\. v\. HHS\*, 985 F\.3d 472) (\(5th Cir\. 2021\))": r"\1, 478 \2",

    # Acara
    r"(\*Acara v\. Banks\*, 470 F\.3d 569) (\(5th Cir\. 2006\))": r"\1, 571 \2",

    # Spokeo
    r"(\*Spokeo, Inc\. v\. Robins\*, 578 U\.S\. 330) (\(2016\))": r"\1, 338 \2",

    # TransUnion
    r"(\*TransUnion LLC v\. Ramirez\*, 594 U\.S\. 413) (\(2021\))": r"\1, 426 \2",

    # Heritage House
    r"(\*Heritage House of Attleboro, Inc\. v\. Thompson\*, 403 F\.3d 1) (\(1st Cir\. 2005\))": r"\1, 8 \2",

    # Marin General
    r"(\*Marin Gen\. Hosp\. v\. Modesto & Empire Traction Co\.\*, 581 F\.3d 941) (\(9th Cir\. 2009\))": r"\1, 947 \2",

    # Retail Ventures
    r"(\*Retail Ventures, Inc\. v\. Nat'l Union Fire Ins\. Co\.\*, 691 F\.3d 821) (\(6th Cir\. 2012\))": r"\1, 825 \2",

    # Caterpillar
    r"(\*Caterpillar Inc\. v\. Great Am\. Ins\. Co\.\*, 62 F\.3d 955) (\(7th Cir\. 1995\))": r"\1, 960 \2",

    # Am. Economy
    r"(\*Am\. Economy Ins\. Co\. v\. Reboans, Inc\.\*, 900 F\.3d 874) (\(7th Cir\. 2018\))": r"\1, 879 \2",
}

total = 0
for pattern, repl in replacements.items():
    content, n = re.subn(pattern, repl, content)
    if n > 0:
        print(f"✓ {n} replacements")
        total += n

# Write output
with open('/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs/W5-001-pincites.md', 'w') as f:
    f.write(content)

print(f"\n✅ Total: {total} pincites added\n")
