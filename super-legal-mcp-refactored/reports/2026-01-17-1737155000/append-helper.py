#!/usr/bin/env python3
"""
Helper script to append Section IV.B to final-memorandum.md
Workaround for Agent SDK file size limitations
"""

import os
import sys

# Define paths
base_dir = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-17-1737155000"
final_memo_path = os.path.join(base_dir, "final-memorandum.md")
temp_section_path = os.path.join(base_dir, "temp-section-IV-B.md")
marker_path = os.path.join(base_dir, "section-IV-B-appended.marker")

def main():
    print(f"Appending {temp_section_path} to {final_memo_path}...")

    # Read the temp section content
    with open(temp_section_path, 'r', encoding='utf-8') as f:
        section_content = f.read()

    # Append to final memorandum
    with open(final_memo_path, 'a', encoding='utf-8') as f:
        f.write(section_content)

    # Count lines in result
    with open(final_memo_path, 'r', encoding='utf-8') as f:
        line_count = sum(1 for _ in f)

    print(f"✓ Append successful")
    print(f"✓ New line count: {line_count}")
    print(f"✓ Expected: 967 + 501 = 1468 lines")

    # Create marker file
    with open(marker_path, 'w') as f:
        import datetime
        f.write(f"Section IV.B appended successfully at {datetime.datetime.now()}\n")
        f.write(f"Final line count: {line_count}\n")

    print(f"✓ Marker file created: {marker_path}")

    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
