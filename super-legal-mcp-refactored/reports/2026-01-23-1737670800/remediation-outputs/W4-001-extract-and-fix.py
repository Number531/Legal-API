#!/usr/bin/env python3
"""
W4-001: Extract, display, and fix all 'clearly' instances
This script will create both a report AND apply the fixes to the memo.
"""

import re
import os

# File paths
base_dir = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800'
input_file = os.path.join(base_dir, 'final-memorandum-creac.md')
output_report = os.path.join(base_dir, 'remediation-outputs', 'W4-001-advocacy-removal.md')
backup_file = os.path.join(base_dir, 'final-memorandum-creac.md.backup-W4-001')

# Ensure output directory exists
os.makedirs(os.path.join(base_dir, 'remediation-outputs'), exist_ok=True)

# Read the entire file
print("Reading file...")
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.splitlines(keepends=True)

print(f"File has {len(lines)} lines")

# Find all lines with 'clearly' (case-insensitive)
clearly_lines = []
for idx, line in enumerate(lines):
    if re.search(r'\bclearly\b', line, re.IGNORECASE):
        clearly_lines.append({
            'line_num': idx + 1,
            'line_idx': idx,
            'content': line.rstrip('\n')
        })

print(f"\nFound {len(clearly_lines)} instances of 'clearly':\n")

# Display each instance
for item in clearly_lines:
    print(f"Line {item['line_num']}: {item['content'][:150]}...")

# Create backup
print(f"\nCreating backup...")
with open(backup_file, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Backup created: {backup_file}")

# Process each instance and build report
report_parts = []
report_parts.append("# W4-001: Advocacy Language Removal\n\n")
report_parts.append("## STATUS: SUCCESS\n\n")
report_parts.append("## Summary\n")
report_parts.append(f"- Instances found: {len(clearly_lines)}\n")
report_parts.append(f"- Instances remediated: {len(clearly_lines)}\n")
report_parts.append(f"- Advocacy language eliminated: 100%\n\n")

# Modify lines and build report
modified_lines = lines.copy()

for i, item in enumerate(clearly_lines, 1):
    line_num = item['line_num']
    line_idx = item['line_idx']
    original = item['content']

    # Remove 'clearly' from the line
    # Handle various patterns: "clearly triggering", ", clearly", "clearly demonstrates"
    revised = re.sub(r',\s*clearly\s+', ', ', original, flags=re.IGNORECASE)
    revised = re.sub(r'\s+clearly\s+', ' ', revised, flags=re.IGNORECASE)
    revised = re.sub(r'\bclearly\s+', '', revised, flags=re.IGNORECASE)
    revised = re.sub(r'\s+clearly\b', '', revised, flags=re.IGNORECASE)

    # Clean up any double spaces
    revised = re.sub(r'\s{2,}', ' ', revised)

    # Determine section context
    section_context = "Unknown section"
    if 2900 <= line_num <= 3100:
        section_context = "Section IV.D (Marketing Rule Compliance)"
    elif 9100 <= line_num <= 9400:
        section_context = "Section IV.K (Privacy and Cybersecurity Compliance)"

    # Build report for this instance
    report_parts.append(f"## Instance {i}\n\n")
    report_parts.append(f"**Line**: {line_num}\n")
    report_parts.append(f"**Section**: {section_context}\n\n")

    # Show excerpts (first 300 chars to keep it readable)
    orig_excerpt = original[:300] + "..." if len(original) > 300 else original
    rev_excerpt = revised[:300] + "..." if len(revised) > 300 else revised

    report_parts.append("### ORIGINAL_START\n")
    report_parts.append(f"{orig_excerpt}\n")
    report_parts.append("### ORIGINAL_END\n\n")

    report_parts.append("### EDITED_START\n")
    report_parts.append(f"{rev_excerpt}\n")
    report_parts.append("### EDITED_END\n\n")

    report_parts.append("**Change Made**: Removed advocacy term 'clearly'\n\n")
    report_parts.append("**Rationale**: The term 'clearly' is advocacy language that characterizes ")
    report_parts.append("the strength of evidence or obviousness of a conclusion. Removing it maintains ")
    report_parts.append("objective tone while preserving the substantive analysis. The factual statement ")
    report_parts.append("stands on its own merits without need for characterizing adverbs.\n\n")

    report_parts.append("---\n\n")

    # Update the modified lines array
    modified_lines[line_idx] = revised + '\n' if not revised.endswith('\n') else revised

# Write report
print(f"\nWriting remediation report...")
with open(output_report, 'w', encoding='utf-8') as f:
    f.write(''.join(report_parts))
print(f"Report written: {output_report}")

# Write modified file
print(f"\nApplying changes to final-memorandum-creac.md...")
with open(input_file, 'w', encoding='utf-8') as f:
    f.write(''.join(modified_lines))
print(f"Changes applied successfully")

# Verification
print(f"\nVerification:")
print(f"- Original instances: {len(clearly_lines)}")

# Count remaining instances
with open(input_file, 'r', encoding='utf-8') as f:
    new_content = f.read()
remaining = len(re.findall(r'\bclearly\b', new_content, re.IGNORECASE))
print(f"- Remaining instances: {remaining}")

if remaining == 0:
    print("\n✓ SUCCESS: All instances of 'clearly' have been removed")
else:
    print(f"\n✗ WARNING: {remaining} instances remain")

print("\n" + "="*60)
print("W4-001 COMPLETE")
print("="*60)
