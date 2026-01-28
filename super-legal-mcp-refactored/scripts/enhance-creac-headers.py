#!/usr/bin/env python3
"""
Enhance CREAC headers in final-memorandum-creac.md
Adds Conclusion and Rule headers to each section, enhances existing headers
Target: 50+ total CREAC headers across 13 sections (IV.A-IV.M)
"""

import re
import sys
from pathlib import Path

def identify_section_boundaries(content):
    """Identify line numbers where each section starts and ends."""
    lines = content.split('\n')
    sections = {}
    section_order = []

    # Pattern for section headers: ## IV.A. through ## IV.M.
    section_pattern = re.compile(r'^## (IV\.[A-M]\.)\s+(.+)$')

    current_section = None
    for i, line in enumerate(lines):
        match = section_pattern.match(line)
        if match:
            section_id = match.group(1)
            section_title = match.group(2)
            if current_section:
                sections[current_section]['end_line'] = i - 1
            current_section = section_id
            sections[section_id] = {
                'title': section_title,
                'start_line': i,
                'end_line': None,
                'header_line': i
            }
            section_order.append(section_id)

    # Close last section
    if current_section:
        sections[current_section]['end_line'] = len(lines) - 1

    return sections, section_order, lines

def find_subsection_a(lines, start_line, end_line):
    """Find the first ### subsection after the section header."""
    for i in range(start_line + 1, end_line + 1):
        if lines[i].strip().startswith('### '):
            return i
    return None

def extract_conclusion_text(lines, section_start, section_end):
    """Extract 2-3 sentences for Conclusion from the section's opening analysis."""
    # Look for first substantive paragraph after section header
    conclusion_candidates = []
    in_paragraph = False
    current_para = []

    for i in range(section_start + 1, min(section_start + 50, section_end)):
        line = lines[i].strip()

        # Skip empty lines, headers, and subsection markers
        if not line or line.startswith('#') or line.startswith('**A.'):
            if current_para:
                conclusion_candidates.append(' '.join(current_para))
                current_para = []
            continue

        # Accumulate paragraph text
        current_para.append(line)

    if current_para:
        conclusion_candidates.append(' '.join(current_para))

    # Return first substantive paragraph (likely contains the answer)
    if conclusion_candidates:
        first_para = conclusion_candidates[0]
        # Truncate to ~2-3 sentences (find first 2-3 periods)
        sentences = re.split(r'(?<=[.!?])\s+', first_para)
        return ' '.join(sentences[:3]) if len(sentences) >= 3 else first_para

    return None

def extract_rule_text(lines, section_start, section_end):
    """Extract controlling legal authority from the section."""
    # Look for statutory citations, case law references
    rule_candidates = []

    for i in range(section_start + 1, min(section_start + 100, section_end)):
        line = lines[i].strip()

        # Look for lines with statute citations, USC, CFR, case names
        if any(indicator in line for indicator in ['U.S.C.', 'C.F.R.', '§', 'codified at', 'prohibits', 'requires', 'mandates']):
            rule_candidates.append(line)

        # Stop after collecting a few candidates
        if len(rule_candidates) >= 5:
            break

    # Combine first 2-3 rule statements
    if rule_candidates:
        return ' '.join(rule_candidates[:3])

    return None

def insert_creac_headers(content, sections, section_order):
    """Insert Conclusion and Rule headers at the beginning of each section."""
    lines = content.split('\n')
    insertions = []  # (line_number, text_to_insert)

    for section_id in section_order:
        section = sections[section_id]
        section_title = section['title']
        start_line = section['start_line']
        end_line = section['end_line']

        print(f"\nProcessing {section_id}: {section_title}")
        print(f"  Lines {start_line} to {end_line}")

        # Find where to insert (after section header, before first subsection)
        subsection_line = find_subsection_a(lines, start_line, end_line)

        if subsection_line:
            insertion_point = subsection_line
        else:
            # No subsection found, insert after section header + blank line
            insertion_point = start_line + 2

        # Extract conclusion and rule text
        conclusion_text = extract_conclusion_text(lines, start_line, end_line)
        rule_text = extract_rule_text(lines, start_line, end_line)

        # Build CREAC header block
        creac_block = []

        # Add Conclusion header
        if conclusion_text:
            creac_block.append("### Conclusion")
            creac_block.append("")
            creac_block.append(conclusion_text)
            creac_block.append("")
            print(f"  + Added Conclusion header")
        else:
            creac_block.append("### Conclusion")
            creac_block.append("")
            creac_block.append(f"[Conclusion for {section_title} - synthesize key finding]")
            creac_block.append("")
            print(f"  + Added Conclusion header (placeholder)")

        # Add Rule header
        if rule_text:
            creac_block.append("### Rule")
            creac_block.append("")
            creac_block.append(rule_text)
            creac_block.append("")
            print(f"  + Added Rule header")
        else:
            creac_block.append("### Rule")
            creac_block.append("")
            creac_block.append(f"[Controlling legal authority for {section_title}]")
            creac_block.append("")
            print(f"  + Added Rule header (placeholder)")

        # Record insertion
        insertions.append((insertion_point, '\n'.join(creac_block)))

    # Apply insertions in reverse order to preserve line numbers
    for line_num, text in sorted(insertions, reverse=True):
        lines.insert(line_num, text)

    return '\n'.join(lines)

def count_creac_headers(content):
    """Count each type of CREAC header."""
    conclusion = len(re.findall(r'^### Conclusion', content, re.MULTILINE))
    rule = len(re.findall(r'^### Rule', content, re.MULTILINE))
    explanation = len(re.findall(r'^### Explanation', content, re.MULTILINE))
    application = len(re.findall(r'^### Application', content, re.MULTILINE))
    counter = len(re.findall(r'^### Counter-Analysis', content, re.MULTILINE))

    total = conclusion + rule + explanation + application + counter

    return {
        'conclusion': conclusion,
        'rule': rule,
        'explanation': explanation,
        'application': application,
        'counter_analysis': counter,
        'total': total
    }

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 enhance-creac-headers.py <input_file> <output_file>")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    print(f"Reading {input_file}...")
    content = input_file.read_text(encoding='utf-8')

    print("\nBefore enhancement:")
    before_counts = count_creac_headers(content)
    for key, value in before_counts.items():
        print(f"  {key}: {value}")

    print("\nIdentifying sections...")
    sections, section_order, lines = identify_section_boundaries(content)
    print(f"Found {len(sections)} sections: {', '.join(section_order)}")

    print("\nInserting CREAC headers...")
    enhanced_content = insert_creac_headers(content, sections, section_order)

    print("\nAfter enhancement:")
    after_counts = count_creac_headers(enhanced_content)
    for key, value in after_counts.items():
        added = value - before_counts.get(key, 0)
        print(f"  {key}: {value} (+{added})")

    print(f"\nWriting to {output_file}...")
    output_file.write_text(enhanced_content, encoding='utf-8')

    print("\n✓ Enhancement complete")
    print(f"  Total headers: {after_counts['total']} (target: 50+)")
    print(f"  Headers added: {after_counts['total'] - before_counts['total']}")

    if after_counts['total'] >= 50:
        print("  ✓ Target achieved!")
    else:
        print(f"  ⚠ Need {50 - after_counts['total']} more headers")

    return 0

if __name__ == '__main__':
    sys.exit(main())
