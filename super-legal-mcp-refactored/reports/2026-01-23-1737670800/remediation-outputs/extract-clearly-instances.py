#!/usr/bin/env python3
"""
Extract all instances of 'clearly' from final-memorandum-creac.md
and prepare them for remediation.
"""

import re
import json

input_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md'
output_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs/clearly-instances.json'

instances = []

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

    for line_num, line in enumerate(lines, start=1):
        if 'clearly' in line.lower():
            # Extract sentence containing "clearly"
            # Find sentence boundaries
            sentences = re.split(r'(?<=[.!?])\s+', line)
            matching_sentence = None

            for sentence in sentences:
                if 'clearly' in sentence.lower():
                    matching_sentence = sentence
                    break

            if matching_sentence:
                instances.append({
                    'line_number': line_num,
                    'full_line': line.strip(),
                    'sentence': matching_sentence.strip(),
                    'context_before': lines[max(0, line_num-3):line_num-1],
                    'context_after': lines[line_num:min(len(lines), line_num+2)]
                })

# Save to JSON
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(instances, f, indent=2)

print(f"Found {len(instances)} instances of 'clearly'")
print(f"Results saved to: {output_file}")

# Print summary
for i, instance in enumerate(instances, start=1):
    print(f"\n--- Instance {i} ---")
    print(f"Line {instance['line_number']}")
    print(f"Sentence: {instance['sentence'][:200]}...")
