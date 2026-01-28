#!/usr/bin/env python3
"""Fix cross-reference placeholders in section IV.F"""

import sys

# Define the 8 replacements
replacements = [
    # Table entries (lines 477-480)
    ('IV.D (Insurance Coverage) at ¶[TBD]', 'See Section IV.D (Insurance Coverage)'),
    ('IV.C (Commercial Contracts) at ¶[TBD]', 'See Section IV.C (Commercial Contracts & CHOW)'),

    # Detailed cross-references section
    ('**Section IV.E (Risk Aggregation)** at ¶[TBD]:', '**Section IV.E (Employment & Labor Relations):**'),
]

# Additional replacements for the long omitted lines (we'll need to search for these patterns)
additional_patterns = [
    ('**Section IV.D (Insurance Coverage)** at ¶[TBD]:', '**Section IV.D (Insurance Coverage):**'),
    ('**Section IV.C (Commercial Contracts)** at ¶[TBD]:', '**Section IV.C (Commercial Contracts & CHOW):**'),
    ('**Section IV.A (CMS Regulatory)** at ¶[TBD]:', '**Section IV.A (CMS Regulatory Compliance & Quality Ratings):**'),
    ('**Section IV.G (Tax Structure)** at ¶[TBD]:', '**Section IV.G (Tax Structure & Transaction Planning):**'),
]

def main():
    file_path = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737900000/section-reports/section-IV-F-privacy-hipaa-compliance.md'

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    replacements_made = 0

    # Apply all replacements
    all_replacements = replacements + additional_patterns
    for old, new in all_replacements:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            replacements_made += count
            print(f"✓ Replaced {count} instance(s) of: {old[:50]}...")

    # Write back
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✅ Successfully made {replacements_made} replacements")
        return 0
    else:
        print("⚠️  No changes made")
        return 1

if __name__ == '__main__':
    sys.exit(main())
