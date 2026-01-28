#!/usr/bin/env python3
"""
Append All Remaining Sections to Final Memorandum
Workaround for Agent SDK file size limitations

This script appends sections IV.B through IV.H to final-memorandum.md
Created: 2026-01-17
Purpose: Complete Phase 8 - Final Memorandum Synthesis & Assembly
"""

import os
import sys
from datetime import datetime
from pathlib import Path

def count_lines(filepath):
    """Count lines in a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)

def count_words(filepath):
    """Count words in a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(len(line.split()) for line in f)

def append_section(final_memo, section_file, section_name):
    """Append a section to the final memorandum"""
    print(f"Appending {section_name}...")

    if not os.path.exists(section_file):
        print(f"  ✗ ERROR: {section_file} not found")
        return False

    with open(section_file, 'r', encoding='utf-8') as f:
        content = f.read()

    with open(final_memo, 'a', encoding='utf-8') as f:
        f.write(content)

    lines = count_lines(section_file)
    print(f"  ✓ {section_name} appended ({lines} lines)")
    return True

def main():
    base_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-17-1737155000")
    os.chdir(base_dir)

    print("=" * 50)
    print("Final Memorandum - Section Append Script")
    print("=" * 50)
    print()

    final_memo = "final-memorandum.md"

    # Verify final-memorandum.md exists
    if not os.path.exists(final_memo):
        print(f"ERROR: {final_memo} not found")
        return 1

    print(f"Current state: {count_lines(final_memo)} lines, {count_words(final_memo)} words")
    print()

    # Define sections to append
    sections = [
        ("temp-section-IV-B.md", "Section IV.B (Insurance Product Compliance)", "temp or section-reports/section-IV-B-insurance.md"),
        ("section-reports/section-IV-C-securities.md", "Section IV.C (Securities & Investment Compliance)", None),
        ("section-reports/section-IV-D-litigation.md", "Section IV.D (Litigation Exposure)", None),
        ("section-reports/section-IV-E-contracts.md", "Section IV.E (Material Contracts & Reinsurance)", None),
        ("section-reports/section-IV-F-tax.md", "Section IV.F (Tax Structure & Optimization)", None),
        ("section-reports/section-IV-G-employment.md", "Section IV.G (Employment & Agent Retention)", None),
        ("section-reports/section-IV-H-financial.md", "Section IV.H (Financial Analysis & Valuation)", None),
    ]

    success_count = 0
    total_count = len(sections)

    for i, (section_file, section_name, fallback) in enumerate(sections, 1):
        print(f"[{i}/{total_count}] {section_name}")

        # Try primary file first
        if os.path.exists(section_file):
            if append_section(final_memo, section_file, section_name):
                success_count += 1
        elif fallback:
            # Try fallback
            for alt_file in fallback.split(" or "):
                if os.path.exists(alt_file):
                    if append_section(final_memo, alt_file, section_name):
                        success_count += 1
                    break
            else:
                print(f"  ✗ ERROR: Neither {section_file} nor {fallback} found")
        else:
            print(f"  ✗ ERROR: {section_file} not found")

    print()
    print("=" * 50)
    print(f"Append complete: {success_count}/{total_count} sections")
    print("=" * 50)
    print()

    # Final statistics
    final_lines = count_lines(final_memo)
    final_words = count_words(final_memo)
    final_size = os.path.getsize(final_memo) / 1024  # KB

    print(f"Final memorandum statistics:")
    print(f"  Lines: {final_lines:,}")
    print(f"  Words: {final_words:,}")
    print(f"  Size:  {final_size:.1f} KB")
    print()

    # Create completion marker
    marker_file = "sections-appended.marker"
    with open(marker_file, 'w') as f:
        f.write(f"Sections IV.B through IV.H appended successfully at {datetime.now()}\n")
        f.write(f"Final statistics: {final_lines:,} lines, {final_words:,} words\n")
        f.write(f"Success rate: {success_count}/{total_count} sections\n")

    print(f"✓ Completion marker created: {marker_file}")
    print()

    # Verify section headers
    print("Verifying section headers:")
    with open(final_memo, 'r') as f:
        for i, line in enumerate(f, 1):
            if line.startswith("## IV."):
                section = line.split()[1].rstrip('.')
                print(f"  Line {i:4d}: {line.strip()[:60]}")

    print()
    print("=" * 50)
    print("Next Steps:")
    print("=" * 50)
    print("1. Generate Cross-Reference Matrix (Section V)")
    print("2. Consolidate Footnotes (Section VI)")
    print("3. Compile Limitations and Assumptions (Section VII)")
    print("4. Add final footer and disclaimer")
    print()

    return 0 if success_count == total_count else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
