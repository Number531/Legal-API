#!/usr/bin/env python3
"""
W4-001: Neutralize Advocacy Language in final-memorandum-creac.md

This script makes surgical edits to remove advocacy language identified by QA diagnostic:
1. Line 83: "compelling strategic value" → "significant strategic value"
2. Line 2651: "clearly meeting" → "meeting"
"""

import sys
from pathlib import Path

def neutralize_advocacy(input_file: Path, output_file: Path) -> dict:
    """
    Remove advocacy language while preserving all other content.

    Returns dict with change summary.
    """
    changes_made = []

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Change 1: Line 83 - "compelling strategic value" → "significant strategic value"
    old_text_1 = "The transaction presents compelling strategic value despite regulatory headwinds."
    new_text_1 = "The transaction presents significant strategic value despite regulatory headwinds."

    if old_text_1 in content:
        content = content.replace(old_text_1, new_text_1)
        changes_made.append({
            'line': 83,
            'old': old_text_1,
            'new': new_text_1,
            'rationale': 'Remove advocacy language; "significant" conveys importance without conclusiveness'
        })
    else:
        print("WARNING: Could not find text for change 1 on line 83", file=sys.stderr)

    # Change 2: Line 2651 - "clearly meeting" → "meeting"
    old_text_2 = "Sunset employs 1,850 total employees across 12 facilities, clearly meeting the 100-employee threshold."
    new_text_2 = "Sunset employs 1,850 total employees across 12 facilities, meeting the 100-employee threshold."

    if old_text_2 in content:
        content = content.replace(old_text_2, new_text_2)
        changes_made.append({
            'line': 2651,
            'old': old_text_2,
            'new': new_text_2,
            'rationale': 'Remove unnecessary intensifier; numeric comparison speaks for itself'
        })
    else:
        print("WARNING: Could not find text for change 2 on line 2651", file=sys.stderr)

    # Write modified content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

    # Verify changes were made
    changes_count = len(changes_made)
    bytes_changed = len(original_content) - len(content)

    return {
        'changes_made': changes_made,
        'changes_count': changes_count,
        'bytes_changed': bytes_changed,
        'success': changes_count == 2
    }

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python3 W4-001-neutralize-advocacy.py <input_file> <output_file>")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    if not input_file.exists():
        print(f"ERROR: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)

    result = neutralize_advocacy(input_file, output_file)

    print(f"✓ Advocacy language neutralization complete")
    print(f"  Changes made: {result['changes_count']}/2")
    print(f"  Bytes changed: {result['bytes_changed']}")

    if result['success']:
        print("\n✓ SUCCESS: All advocacy language instances corrected")
        sys.exit(0)
    else:
        print("\n✗ PARTIAL: Some instances could not be found", file=sys.stderr)
        sys.exit(1)
