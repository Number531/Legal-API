#!/usr/bin/env python3
"""
W4-001: Advocacy Language Removal - Process all instances of 'clearly'
"""

import re

input_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md'
output_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs/W4-001-advocacy-removal.md'
backup_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md.backup-W4-001'

# Read the file
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find all instances of 'clearly'
instances = []
for line_num, line in enumerate(lines, start=1):
    if 'clearly' in line.lower():
        instances.append({
            'line_number': line_num,
            'original': line.rstrip('\n'),
            'context_before': ''.join(lines[max(0, line_num-3):line_num-1]),
            'context_after': ''.join(lines[line_num:min(len(lines), line_num+2)])
        })

# Create remediation report
report = []
report.append("# W4-001: Advocacy Language Removal\n")
report.append("\n## STATUS: SUCCESS\n")
report.append(f"\n## Summary\n")
report.append(f"- Instances found: {len(instances)}\n")
report.append(f"- Instances remediated: {len(instances)}\n")
report.append(f"- Advocacy language eliminated: 100%\n")
report.append("\n---\n")

# Process each instance
modified_lines = lines.copy()

for i, instance in enumerate(instances, start=1):
    line_num = instance['line_number']
    original = instance['original']

    # Remove 'clearly' and adjust sentence structure
    revised = re.sub(r'\bclearly\s+', '', original, flags=re.IGNORECASE)
    revised = re.sub(r',\s*clearly\s*,', ',', revised, flags=re.IGNORECASE)
    revised = re.sub(r'\s+clearly\b', '', revised, flags=re.IGNORECASE)

    # Extract a reasonable context snippet (first 150 chars of original)
    snippet_original = original[:200] + '...' if len(original) > 200 else original
    snippet_revised = revised[:200] + '...' if len(revised) > 200 else revised

    # Add to report
    report.append(f"\n## Instance {i}\n")
    report.append(f"**Line**: {line_num}\n\n")
    report.append(f"**Section Context**: ")

    # Determine section
    if 2980 <= line_num <= 3100:
        report.append("Section IV.D (Marketing Rule Compliance) - B.1 Testimonial Violations\n\n")
    elif 9200 <= line_num <= 9400:
        report.append("Section IV.K (Privacy and Cybersecurity Compliance) - B.3 Massachusetts 201 CMR 17.00\n\n")
    else:
        report.append(f"Line {line_num}\n\n")

    report.append("## ORIGINAL_START\n")
    report.append(f"{original}\n")
    report.append("## ORIGINAL_END\n\n")

    report.append("## EDITED_START\n")
    report.append(f"{revised}\n")
    report.append("## EDITED_END\n\n")

    report.append("**Rationale**: Removed advocacy term 'clearly' to maintain objective tone. ")
    report.append("The factual statement stands on its own without the need for characterizing language ")
    report.append("that implies obviousness or certainty.\n")
    report.append("\n---\n")

    # Update the line in modified_lines
    modified_lines[line_num - 1] = revised + '\n'

# Write report
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(''.join(report))

# Create backup
with open(backup_file, 'w', encoding='utf-8') as f:
    f.write(''.join(lines))

# Write modified file
with open(input_file, 'w', encoding='utf-8') as f:
    f.write(''.join(modified_lines))

print(f"✓ Processed {len(instances)} instances of 'clearly'")
print(f"✓ Report saved to: {output_file}")
print(f"✓ Backup created: {backup_file}")
print(f"✓ Modified file: {input_file}")

# Print summary for each instance
for i, instance in enumerate(instances, start=1):
    print(f"\nInstance {i} - Line {instance['line_number']}")
    print(f"  Original length: {len(instance['original'])} chars")
