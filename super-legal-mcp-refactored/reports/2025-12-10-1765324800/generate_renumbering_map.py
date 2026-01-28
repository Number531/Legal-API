#!/usr/bin/env python3
"""
Generate sequential footnote renumbering map for consolidated memorandum.
"""

import re
from pathlib import Path
from datetime import datetime

SECTIONS = [
    ("Executive Summary", "executive-summary.md", "Exec", 0),
    ("IV.A NRC Regulatory", "section-reports/section-IV-A-nrc-regulatory.md", "IVA", 179),
    ("IV.B Foreign Ownership", "section-reports/section-IV-B-foreign-ownership.md", "IVB", 125),
    ("IV.C Environmental", "section-reports/section-IV-C-environmental.md", "IVC", 131),
    ("IV.D Price-Anderson", "section-reports/section-IV-D-price-anderson.md", "IVD", 261),
    ("IV.E DOE Litigation", "section-reports/section-IV-E-doe-litigation.md", "IVE", 133),
    ("IV.F Decommissioning", "section-reports/section-IV-F-decommissioning.md", "IVF", 96),
    ("IV.G Securities/Financial", "section-reports/section-IV-G-securities-financial.md", "IVG", 186),
    ("IV.H Spent Fuel", "section-reports/section-IV-H-spent-fuel.md", "IVH", 205),
    ("IV.I Commercial/PPA", "section-reports/section-IV-I-commercial-ppa.md", "IVI", 112),
    ("IV.J Employment", "section-reports/section-IV-J-employment.md", "IVJ", 132),
    ("IV.K Tax Structure", "section-reports/section-IV-K-tax-structure.md", "IVK", 186),
    ("IV.L Security/Safeguards", "section-reports/section-IV-L-security-safeguards.md", "IVL", 266),
]

def main():
    base_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2025-12-10-1765324800")

    print("\n" + "="*80)
    print("GLOBAL FOOTNOTE RENUMBERING MAP")
    print("="*80)
    print(f"Generated: {datetime.now().isoformat()}")
    print()

    global_counter = 1
    renumbering_map = []

    for section_name, file_path, abbrev, tag_count in SECTIONS:
        if tag_count == 0:
            renumbering_map.append({
                'section': section_name,
                'abbrev': abbrev,
                'original_range': "N/A",
                'new_global_range': "N/A",
                'count': 0,
            })
            print(f"{section_name:30s} | No footnotes")
            continue

        start = global_counter
        end = global_counter + tag_count - 1
        global_counter = end + 1

        renumbering_map.append({
            'section': section_name,
            'abbrev': abbrev,
            'original_range': f"1-{tag_count}",
            'new_global_range': f"{start}-{end}",
            'count': tag_count,
            'start': start,
            'end': end,
        })

        print(f"{section_name:30s} | Tags: {tag_count:4d} | Original: 1-{tag_count:4d} | Global: {start:4d}-{end:4d}")

    print()
    print("="*80)
    print(f"TOTAL FOOTNOTES: {global_counter - 1}")
    print("="*80)

    # Generate markdown table
    print("\n\n## Renumbering Table (Markdown Format)")
    print("| Section | Original Range | New Global Range | Count |")
    print("|---------|----------------|------------------|-------|")
    for entry in renumbering_map:
        print(f"| {entry['section']:30s} | {entry['original_range']:14s} | {entry['new_global_range']:16s} | {entry['count']:5d} |")

    # Generate LaTeX table
    print("\n\n## Renumbering Table (LaTeX Format)")
    print("\\begin{longtable}{|l|r|r|r|}")
    print("\\hline")
    print("\\textbf{Section} & \\textbf{Original} & \\textbf{Global} & \\textbf{Count} \\\\")
    print("\\hline")
    for entry in renumbering_map:
        orig = entry['original_range'].replace('-', '--')
        new_range = entry['new_global_range'].replace('-', '--')
        print(f"{entry['section']} & {orig} & {new_range} & {entry['count']} \\\\")
    print("\\hline")
    print(f"\\multicolumn{{3}}{{|r|}}{{\\textbf{{TOTAL}}}} & \\textbf{{{global_counter - 1}}} \\\\")
    print("\\hline")
    print("\\end{longtable}")

    # Generate cross-reference guidance
    print("\n\n## Cross-Reference Conversion Examples")
    print("When consolidating sections, convert internal references as follows:")
    print()

    for entry in renumbering_map:
        if entry['count'] > 0:
            print(f"Section {entry['abbrev']}:")
            print(f"  Original Note 1 → Global Note {entry['start']}")
            print(f"  Original Note {entry['count']} → Global Note {entry['end']}")
            if entry['count'] > 1:
                mid = entry['count'] // 2
                global_mid = entry['start'] + mid - 1
                print(f"  Original Note {mid} → Global Note {global_mid}")
            print()

if __name__ == "__main__":
    main()
