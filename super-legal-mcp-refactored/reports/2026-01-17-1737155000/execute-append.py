#!/usr/bin/env python3
"""
Execute append operation directly
"""
import os
import sys
from datetime import datetime
from pathlib import Path

def count_lines(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)

def count_words(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(len(line.split()) for line in f)

base_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-17-1737155000")
os.chdir(base_dir)

print("=" * 50)
print("Final Memorandum - Section Append")
print("=" * 50)
print()

final_memo = "final-memorandum.md"

# Check current state
if not os.path.exists(final_memo):
    print(f"ERROR: {final_memo} not found")
    sys.exit(1)

initial_lines = count_lines(final_memo)
initial_words = count_words(final_memo)
print(f"Initial state: {initial_lines:,} lines, {initial_words:,} words")
print()

# Define sections
sections = [
    ("temp-section-IV-B.md", "Section IV.B (Insurance Product Compliance)"),
    ("section-reports/section-IV-C-securities.md", "Section IV.C (Securities & Investment Compliance)"),
    ("section-reports/section-IV-D-litigation.md", "Section IV.D (Litigation Exposure)"),
    ("section-reports/section-IV-E-contracts.md", "Section IV.E (Material Contracts & Reinsurance)"),
    ("section-reports/section-IV-F-tax.md", "Section IV.F (Tax Structure & Optimization)"),
    ("section-reports/section-IV-G-employment.md", "Section IV.G (Employment & Agent Retention)"),
    ("section-reports/section-IV-H-financial.md", "Section IV.H (Financial Analysis & Valuation)"),
]

success = 0
for i, (section_file, section_name) in enumerate(sections, 1):
    print(f"[{i}/{len(sections)}] {section_name}")

    # Try primary file first, then fallback
    if section_file == "temp-section-IV-B.md" and not os.path.exists(section_file):
        section_file = "section-reports/section-IV-B-insurance.md"

    if not os.path.exists(section_file):
        print(f"  ✗ ERROR: {section_file} not found")
        continue

    try:
        with open(section_file, 'r', encoding='utf-8') as f:
            content = f.read()

        with open(final_memo, 'a', encoding='utf-8') as f:
            f.write(content)

        section_lines = count_lines(section_file)
        print(f"  ✓ Appended ({section_lines:,} lines)")
        success += 1
    except Exception as e:
        print(f"  ✗ ERROR: {e}")

print()
print("=" * 50)
print(f"Result: {success}/{len(sections)} sections appended")
print("=" * 50)
print()

# Final stats
final_lines = count_lines(final_memo)
final_words = count_words(final_memo)
final_size = os.path.getsize(final_memo) / 1024

print(f"Final statistics:")
print(f"  Lines: {final_lines:,} (added {final_lines - initial_lines:,})")
print(f"  Words: {final_words:,} (added {final_words - initial_words:,})")
print(f"  Size:  {final_size:.1f} KB")
print()

# Create marker
if success == len(sections):
    with open("sections-appended.marker", 'w') as f:
        f.write(f"All sections appended at {datetime.now()}\n")
        f.write(f"Final: {final_lines:,} lines, {final_words:,} words\n")
    print("✓ Completion marker created")
else:
    print(f"⚠ Partial completion: {success}/{len(sections)}")

print()
print("Verifying section headers:")
with open(final_memo, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if line.startswith("## IV."):
            print(f"  Line {i:5d}: {line.strip()[:70]}")

print()
print("✓ Append operation complete")
