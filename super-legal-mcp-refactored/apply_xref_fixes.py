#!/usr/bin/env python3
"""
Targeted remediation script for Section IV.F cross-reference placeholders.
Replaces 8 instances of ¶[TBD] with simplified section references.
"""

import sys
import os

def main():
    file_path = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737900000/section-reports/section-IV-F-privacy-hipaa-compliance.md'

    if not os.path.exists(file_path):
        print(f"ERROR: File not found: {file_path}")
        return 1

    # Read file
    print(f"Reading file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    total_replacements = 0

    # Define all 8 replacements based on the instruction set
    replacements = [
        # Lines 477-480: Table entries
        ('IV.D (Insurance Coverage) at ¶[TBD]', 'See Section IV.D (Insurance Coverage)'),
        ('IV.C (Commercial Contracts) at ¶[TBD]', 'See Section IV.C (Commercial Contracts & CHOW)'),

        # Lines 486, 488, 492, 496: Detailed cross-references
        ('**Section IV.D (Insurance Coverage)** at ¶[TBD]:', '**Section IV.D (Insurance Coverage):**'),
        ('**Section IV.E (Risk Aggregation)** at ¶[TBD]:', '**Section IV.E (Employment & Labor Relations):**'),
        ('**Section IV.C (Commercial Contracts)** at ¶[TBD]:', '**Section IV.C (Commercial Contracts & CHOW):**'),
        ('**Section IV.A (CMS Regulatory)** at ¶[TBD]:', '**Section IV.A (CMS Regulatory Compliance & Quality Ratings):**'),
        ('**Section IV.G (Tax Structure)** at ¶[TBD]:', '**Section IV.G (Tax Structure & Transaction Planning):**'),
    ]

    # Apply replacements
    for old_str, new_str in replacements:
        count = content.count(old_str)
        if count > 0:
            content = content.replace(old_str, new_str)
            total_replacements += count
            print(f"✓ Replaced {count} instance(s): {old_str[:60]}...")
        else:
            print(f"⚠ Not found (0 instances): {old_str[:60]}...")

    # Verify no ¶[TBD] remain
    remaining_tbd = content.count('¶[TBD]')

    if content != original_content:
        # Create backup
        backup_path = file_path + '.backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        print(f"\n✓ Backup created: {backup_path}")

        # Write updated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"\n✅ SUCCESS: Made {total_replacements} replacements")
        print(f"   Remaining ¶[TBD] placeholders: {remaining_tbd}")

        if remaining_tbd > 0:
            print(f"\n⚠️  WARNING: {remaining_tbd} ¶[TBD] placeholders still remain!")
            return 1

        return 0
    else:
        print("\n⚠️  No changes made - patterns not found")
        print(f"   Current ¶[TBD] count: {remaining_tbd}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
