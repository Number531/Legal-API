#!/usr/bin/env python3
"""
W4-001: Neutralize Advocacy Language
Replaces advocacy terms with neutral phrasing while preserving statutory quotes.
"""

import re
from pathlib import Path

def neutralize_advocacy(input_path: str, output_path: str) -> dict:
    """
    Neutralize advocacy language in memorandum.

    Returns dict with replacements made and statistics.
    """
    replacements = []

    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Track line numbers for reporting
    lines = content.split('\n')

    # REPLACEMENT 1: Line 2225 - "clearly sufficient" in bullet point
    # Context: "- Transfer of majority voting power (clearly sufficient)"
    # This is advocacy language in our analysis, NOT a statutory quote

    old_text_1 = "- Transfer of majority voting power (clearly sufficient)"
    new_text_1 = "- Transfer of majority voting power (sufficient under precedent)"

    if old_text_1 in content:
        content = content.replace(old_text_1, new_text_1, 1)
        replacements.append({
            'line': 2225,
            'original': 'clearly sufficient',
            'replacement': 'sufficient under precedent',
            'context': 'Transfer of majority voting power bullet point'
        })

    # VERIFICATION: Ensure we did NOT modify statutory/regulatory quotes
    # These should remain unchanged:
    # 1. ERISA statute quote: "clearly prudent not to do so"
    # 2. SEC regulation quotes: "Clearly and prominently discloses"

    verify_statutory = [
        ('clearly prudent not to do so', 'ERISA statute quote'),
        ('Clearly and prominently discloses whether', 'SEC Marketing Rule quote'),
        ('Clearly and prominently discloses any compensation', 'SEC Marketing Rule quote'),
        ('Clearly and prominently discloses any material conflicts', 'SEC Marketing Rule quote')
    ]

    preserved = []
    for phrase, description in verify_statutory:
        if phrase in content:
            preserved.append({
                'phrase': phrase,
                'description': description,
                'status': 'PRESERVED (statutory/regulatory quote)'
            })

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # Calculate statistics
    stats = {
        'total_replacements': len(replacements),
        'bytes_original': len(original_content),
        'bytes_modified': len(content),
        'bytes_changed': abs(len(content) - len(original_content)),
        'replacements': replacements,
        'preserved_quotes': preserved
    }

    return stats

def main():
    base_dir = Path('/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000/remediation-outputs')

    input_file = base_dir / 'W3-XREF-INSERT-final-memorandum-xrefs.md'
    output_file = base_dir / 'W4-001-neutral-language.md'

    print("W4-001: Neutralizing Advocacy Language")
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print()

    stats = neutralize_advocacy(str(input_file), str(output_file))

    print(f"✓ Processing complete")
    print(f"  - Total replacements: {stats['total_replacements']}")
    print(f"  - File size: {stats['bytes_original']:,} bytes → {stats['bytes_modified']:,} bytes")
    print(f"  - Change: {stats['bytes_changed']} bytes")
    print()

    print("Replacements Made:")
    for r in stats['replacements']:
        print(f"  Line {r['line']}: '{r['original']}' → '{r['replacement']}'")
        print(f"    Context: {r['context']}")
    print()

    print("Statutory/Regulatory Quotes Preserved:")
    for p in stats['preserved_quotes']:
        print(f"  ✓ {p['description']}: '{p['phrase'][:50]}...'")

    # Verification grep commands
    print()
    print("Verification Commands:")
    print(f"  grep -i 'clearly sufficient' {output_file}")
    print(f"  grep -i 'clearly prudent' {output_file}")
    print(f"  grep -i 'Clearly and prominently' {output_file}")

if __name__ == '__main__':
    main()
