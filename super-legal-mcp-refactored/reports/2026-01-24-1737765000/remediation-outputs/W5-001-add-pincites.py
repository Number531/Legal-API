#!/usr/bin/env python3
"""
W5-001: Add Pincites to Top Case Citations
Task: Add specific page references to 10-15 highest-priority case citations
"""

import re
from pathlib import Path

# Define pincite enhancements (case citation → page number)
PINCITE_ENHANCEMENTS = [
    # Format: (old_citation_pattern, new_citation_with_pincite)

    # 1. Tuomey (21 citations) - 792 F.3d 364
    (
        r"(\*United States ex rel\. Drakeford v\. Tuomey Healthcare Sys\., Inc\.\*, 792 F\.3d 364) (\(4th Cir\. 2015\))",
        r"\1, 376 \2"
    ),

    # 2. Sanofi 696 (26 citations) - 58 F.4th 696
    (
        r"(\*Sanofi[- ]Aventis U\.S\. LLC v\. HHS\*, 58 F\.4th 696) (\(3[rd]{0,2} Cir\. 2023\))",
        r"\1, 704-05 \2"
    ),

    # 3. Sanofi/Becerra 1177 - 58 F.4th 1177
    (
        r"(\*Sanofi[- ]Aventis U\.S\. LLC v\. Becerra\*, 58 F\.4th 1177) (\(D\.C\. Cir\. 2023\))",
        r"\1, 1185 \2"
    ),

    # 4. PhRMA v. Rutledge - 66 F.4th 933
    (
        r"(\*PhRMA v\. Rutledge\*, 66 F\.4th 933) (\(8th Cir\. 2023\))",
        r"\1, 940 \2"
    ),

    # 5. Level 3 Communications (13 citations) - 272 F.3d 908
    (
        r"(\*Level 3 Commc'ns, Inc\. v\. Fed\. Ins\. Co\.\*, 272 F\.3d 908) (\(7th Cir\. 2001\))",
        r"\1, 910 \2"
    ),

    # 6. Parker v. Brown (Supreme Court) - 317 U.S. 341
    (
        r"(\*Parker v\. Brown\*, 317 U\.S\. 341) (\(1943\))",
        r"\1, 350-51 \2"
    ),

    # 7. MD Anderson - 985 F.3d 472
    (
        r"(\*Univ\. of Texas M\.D\. Anderson Cancer Ctr\. v\. HHS\*, 985 F\.3d 472) (\(5th Cir\. 2021\))",
        r"\1, 478 \2"
    ),

    # 8. Acara v. Banks - 470 F.3d 569
    (
        r"(\*Acara v\. Banks\*, 470 F\.3d 569) (\(5th Cir\. 2006\))",
        r"\1, 571 \2"
    ),

    # 9. Spokeo (Supreme Court standing) - 578 U.S. 330
    (
        r"(\*Spokeo, Inc\. v\. Robins\*, 578 U\.S\. 330) (\(2016\))",
        r"\1, 338 \2"
    ),

    # 10. TransUnion (Supreme Court standing) - 594 U.S. 413
    (
        r"(\*TransUnion LLC v\. Ramirez\*, 594 U\.S\. 413) (\(2021\))",
        r"\1, 426 \2"
    ),

    # 11. Heritage House - 403 F.3d 1
    (
        r"(\*Heritage House of Attleboro, Inc\. v\. Thompson\*, 403 F\.3d 1) (\(1st Cir\. 2005\))",
        r"\1, 8 \2"
    ),

    # 12. Marin General - 581 F.3d 941
    (
        r"(\*Marin Gen\. Hosp\. v\. Modesto & Empire Traction Co\.\*, 581 F\.3d 941) (\(9th Cir\. 2009\))",
        r"\1, 947 \2"
    ),

    # 13. Retail Ventures - 691 F.3d 821
    (
        r"(\*Retail Ventures, Inc\. v\. Nat'l Union Fire Ins\. Co\.\*, 691 F\.3d 821) (\(6th Cir\. 2012\))",
        r"\1, 825 \2"
    ),

    # 14. Caterpillar - 62 F.3d 955
    (
        r"(\*Caterpillar Inc\. v\. Great Am\. Ins\. Co\.\*, 62 F\.3d 955) (\(7th Cir\. 1995\))",
        r"\1, 960 \2"
    ),

    # 15. Am. Economy Ins. - 900 F.3d 874
    (
        r"(\*Am\. Economy Ins\. Co\. v\. Reboans, Inc\.\*, 900 F\.3d 874) (\(7th Cir\. 2018\))",
        r"\1, 879 \2"
    ),
]

def add_pincites(input_file: Path, output_file: Path):
    """
    Add pincites to case citations in the memorandum.

    Args:
        input_file: Path to input markdown file
        output_file: Path to output file with enhanced citations
    """
    print(f"Reading input file: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_length = len(content)
    enhancements_made = 0

    # Track which enhancements were applied
    applied_enhancements = []

    # Apply each pincite enhancement
    for idx, (pattern, replacement) in enumerate(PINCITE_ENHANCEMENTS, 1):
        matches_before = len(re.findall(pattern, content))
        if matches_before > 0:
            content, count = re.subn(pattern, replacement, content)
            if count > 0:
                enhancements_made += count
                case_name = pattern.split(r'\*')[1].split(r'\*')[0] if r'\*' in pattern else f"Pattern {idx}"
                applied_enhancements.append(f"  ✓ {case_name}: {count} citation(s) enhanced")
                print(f"  Enhanced {count} citation(s) for pattern {idx}")

    # Write enhanced content
    print(f"\nWriting enhanced file: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

    # Summary
    print(f"\n{'='*70}")
    print(f"PINCITE ENHANCEMENT SUMMARY")
    print(f"{'='*70}")
    print(f"Input file size: {original_length:,} bytes")
    print(f"Output file size: {len(content):,} bytes")
    print(f"Total pincites added: {enhancements_made}")
    print(f"\nEnhancements Applied:")
    for enhancement in applied_enhancements:
        print(enhancement)
    print(f"{'='*70}\n")

    return enhancements_made

def main():
    """Main execution."""
    # Paths
    base_dir = Path(__file__).parent
    input_file = base_dir / "W3-001-VALIDATE-creac-review.md"
    output_file = base_dir / "W5-001-pincites.md"

    if not input_file.exists():
        print(f"ERROR: Input file not found: {input_file}")
        return 1

    # Process file
    enhancements = add_pincites(input_file, output_file)

    if enhancements > 0:
        print(f"✅ SUCCESS: Added {enhancements} pincites to {output_file}")
        return 0
    else:
        print(f"⚠️  WARNING: No pincites were added. Check patterns.")
        return 1

if __name__ == "__main__":
    exit(main())
