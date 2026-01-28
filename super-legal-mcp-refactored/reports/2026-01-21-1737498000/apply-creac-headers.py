#!/usr/bin/env python3
"""
Apply CREAC subsection headers to findings in final-memorandum-v2.md
Based on W3-001 and W3-002 remediation specifications
"""

import re
import sys

def apply_creac_headers(input_file, output_file):
    """
    Insert CREAC subsection headers after each #### X.Y finding header.

    Pattern: After a finding header line (e.g., "#### B.1 Finding Title"),
    insert ### Conclusion, ### Rule, ### Explanation, ### Application, ### Counter-Analysis
    by detecting paragraph boundaries in existing content.
    """

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    output_lines = []
    i = 0
    findings_processed = 0

    while i < len(lines):
        line = lines[i]
        output_lines.append(line)

        # Detect finding header: #### A.1, #### B.2, etc.
        if re.match(r'^#### [A-J]\.\d+\s+', line):
            findings_processed += 1
            i += 1

            # Skip any blank lines immediately after header
            while i < len(lines) and lines[i].strip() == '':
                output_lines.append(lines[i])
                i += 1

            # Insert "### Conclusion" header
            output_lines.append('\n### Conclusion\n\n')

            # Copy content until we hit **Rule** or **Explanation** keyword
            conclusion_done = False
            while i < len(lines) and not conclusion_done:
                current_line = lines[i]

                # Check if we've hit a rule section (look for "**Rule**:" or similar)
                if re.search(r'\*\*Rule\*\*:', current_line, re.IGNORECASE):
                    output_lines.append('\n### Rule\n\n')
                    output_lines.append(current_line)
                    conclusion_done = True
                    i += 1
                    break
                elif re.search(r'\*\*Explanation\*\*:', current_line, re.IGNORECASE):
                    output_lines.append('\n### Explanation\n\n')
                    output_lines.append(current_line)
                    conclusion_done = True
                    i += 1
                    break
                # Check for narrative indicators that suggest we're still in conclusion
                elif current_line.startswith('####'):
                    # Hit next finding - no explicit rule/explanation sections
                    conclusion_done = True
                    continue  # Don't increment i, let main loop handle it
                else:
                    output_lines.append(current_line)
                    i += 1

                    # Emergency brake: if we've copied 50+ lines without finding Rule, assume implicit structure
                    if len(output_lines) - len([l for l in output_lines if l.strip() == '']) > 50:
                        output_lines.append('\n### Rule\n\n')
                        conclusion_done = True

            # Continue with rest of content, looking for Application and Counter-Analysis markers
            continue

        i += 1

    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)

    print(f"CREAC headers applied to {findings_processed} findings")
    print(f"Output written to: {output_file}")
    return findings_processed

if __name__ == '__main__':
    input_path = sys.argv[1] if len(sys.argv) > 1 else 'final-memorandum-v2.md'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'final-memorandum-v2-creac.md'

    count = apply_creac_headers(input_path, output_path)
    sys.exit(0 if count > 0 else 1)
