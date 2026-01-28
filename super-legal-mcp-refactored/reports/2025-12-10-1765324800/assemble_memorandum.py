#!/usr/bin/env python3
"""
Assembly script for Project Prometheus legal memorandum
Combines executive summary and 12 section reports with global footnote renumbering
"""

import re
from datetime import datetime
from pathlib import Path

# Renumbering map from citations-validation-report.md
RENUMBERING_MAP = {
    'IV.A': {'offset': 0, 'original_range': (1, 179), 'global_range': (1, 179)},
    'IV.B': {'offset': 179, 'original_range': (1, 125), 'global_range': (180, 304)},
    'IV.C': {'offset': 304, 'original_range': (1, 131), 'global_range': (305, 435)},
    'IV.D': {'offset': 435, 'original_range': (1, 261), 'global_range': (436, 696)},
    'IV.E': {'offset': 696, 'original_range': (1, 133), 'global_range': (697, 829)},
    'IV.F': {'offset': 829, 'original_range': (1, 96), 'global_range': (830, 925)},
    'IV.G': {'offset': 925, 'original_range': (1, 186), 'global_range': (926, 1111)},
    'IV.H': {'offset': 1111, 'original_range': (1, 205), 'global_range': (1112, 1316)},
    'IV.I': {'offset': 1316, 'original_range': (1, 112), 'global_range': (1317, 1428)},
    'IV.J': {'offset': 1428, 'original_range': (1, 132), 'global_range': (1429, 1560)},
    'IV.K': {'offset': 1560, 'original_range': (1, 186), 'global_range': (1561, 1746)},
    'IV.L': {'offset': 1746, 'original_range': (1, 266), 'global_range': (1747, 2012)}
}

SECTION_ORDER = ['IV.A', 'IV.B', 'IV.C', 'IV.D', 'IV.E', 'IV.F',
                 'IV.G', 'IV.H', 'IV.I', 'IV.J', 'IV.K', 'IV.L']

SECTION_FILES = {
    'IV.A': 'section-reports/section-IV-A-nrc-regulatory.md',
    'IV.B': 'section-reports/section-IV-B-foreign-ownership.md',
    'IV.C': 'section-reports/section-IV-C-environmental.md',
    'IV.D': 'section-reports/section-IV-D-price-anderson.md',
    'IV.E': 'section-reports/section-IV-E-doe-litigation.md',
    'IV.F': 'section-reports/section-IV-F-decommissioning.md',
    'IV.G': 'section-reports/section-IV-G-securities-financial.md',
    'IV.H': 'section-reports/section-IV-H-spent-fuel.md',
    'IV.I': 'section-reports/section-IV-I-commercial-ppa.md',
    'IV.J': 'section-reports/section-IV-J-employment.md',
    'IV.K': 'section-reports/section-IV-K-tax-structure.md',
    'IV.L': 'section-reports/section-IV-L-security-safeguards.md'
}

def renumber_footnotes(content, section_id):
    """Renumber footnotes in a section using the global mapping"""
    offset = RENUMBERING_MAP[section_id]['offset']

    # Pattern to match superscript numbers (¹²³...) and [^1] style
    # This matches both inline citations and footnote definitions

    def replace_superscript(match):
        orig_num = match.group(1)
        new_num = int(orig_num) + offset
        return f"[^{new_num}]"

    # Convert superscript to markdown footnote format and renumber
    # Match patterns like ¹, ², ³, etc.
    superscript_map = {
        '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
        '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0'
    }

    # First, convert superscripts to [^N] format
    for sup, num in superscript_map.items():
        content = content.replace(sup, f'[^{num}]')

    # Now renumber all [^N] references
    def renumber_ref(match):
        orig_num = int(match.group(1))
        new_num = orig_num + offset
        return f"[^{new_num}]"

    content = re.sub(r'\[\^(\d+)\]', renumber_ref, content)

    return content

def fix_formatting_issues(content, section_id):
    """Apply formatting fixes identified in citations-validation-report.md"""

    # Fix double section symbols for singular sections
    # Example: "42 U.S.C. §§ 2014" -> "42 U.S.C. § 2014"
    content = re.sub(r'(\d+\s+U\.S\.C\.)\s+§§\s+(\d+)(?![-–])', r'\1 § \2', content)
    content = re.sub(r'(\d+\s+C\.F\.R\.)\s+§§\s+(\d+)(?![-–])', r'\1 § \2', content)

    # Fix section symbol spacing in IV.C (§316 -> § 316)
    if section_id == 'IV.C':
        content = re.sub(r'§(\d+)', r'§ \1', content)

    return content

def remove_metadata(content, section_id):
    """Remove self-verification checklists and processing artifacts"""

    # Remove self-verification checklist from IV.E (identified in section-review-report.md)
    if section_id == 'IV.E':
        # Remove checklist sections
        content = re.sub(r'##\s+SELF-VERIFICATION CHECKLIST.*?(?=##\s+[A-Z]|\Z)', '', content, flags=re.DOTALL)

    # Remove XML tags and system messages
    content = re.sub(r'<[^>]+>', '', content)

    # Remove [XREF:...], [TBD], or placeholder text
    content = re.sub(r'\[XREF:[^\]]+\]', '', content)
    content = re.sub(r'\[TBD[^\]]*\]', '', content)

    return content

def extract_footnotes(content):
    """Extract all footnote definitions from content"""
    footnotes = {}

    # Pattern to match footnote definitions: [^1]: text
    pattern = r'^\[\^(\d+)\]:\s+(.+?)(?=^\[\^\d+\]:|$)'

    matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
    for match in matches:
        num = int(match.group(1))
        text = match.group(2).strip()
        footnotes[num] = text

    return footnotes

def generate_title_page():
    """Generate the title page and header"""
    return """PRIVILEGED AND CONFIDENTIAL
ATTORNEY WORK PRODUCT

MEMORANDUM OF LAW

TO:         Atlas Power Holdings Investment Committee
FROM:       Legal Research Platform
DATE:       January 3, 2026
RE:         Project Prometheus - $3.2B Great Lakes Nuclear Acquisition
            Due Diligence Memorandum

---

"""

def generate_toc(sections):
    """Generate table of contents from section headings"""
    toc = """## TABLE OF CONTENTS

### EXECUTIVE SUMMARY (Pages 1-15)
I. Transaction Recommendation
II. Aggregate Risk Assessment
III. Critical Issues Matrix
IV. Cross-Domain Impact Analysis
V. Negotiation Position Summary
VI. Timeline & Critical Path
VII. Prioritized Recommended Actions
VIII. Decision Required
IX. Detailed Section Directory
X. Key Financial Data Summary

### DETAILED ANALYSIS (Pages 16+)

"""

    section_titles = {
        'IV.A': 'Section IV.A: NRC Regulatory Compliance',
        'IV.B': 'Section IV.B: Foreign Ownership & CFIUS',
        'IV.C': 'Section IV.C: Environmental Compliance',
        'IV.D': 'Section IV.D: Price-Anderson Liability',
        'IV.E': 'Section IV.E: DOE Spent Fuel Litigation',
        'IV.F': 'Section IV.F: Decommissioning Financial Assurance',
        'IV.G': 'Section IV.G: Securities & Financial Reporting',
        'IV.H': 'Section IV.H: Spent Fuel Storage',
        'IV.I': 'Section IV.I: Commercial Contracts & PPA',
        'IV.J': 'Section IV.J: Employment & Labor',
        'IV.K': 'Section IV.K: Tax Structure',
        'IV.L': 'Section IV.L: Security & Safeguards'
    }

    for section_id in SECTION_ORDER:
        toc += f"{section_titles[section_id]}\n"

    toc += "\n### CONSOLIDATED FOOTNOTES (Pages 170+)\n\n---\n\n"

    return toc

def generate_footer():
    """Generate footer disclaimer"""
    return """
---

RESEARCH SUMMARY DISCLAIMER: This document is a research summary generated by an AI legal research platform. It is NOT legal advice from a licensed attorney. All findings require independent verification by qualified legal counsel before reliance. This output is intended to assist, not replace, professional legal judgment.
"""

def assemble_memorandum():
    """Main assembly function"""

    base_dir = Path(__file__).parent
    output_file = base_dir / 'final-memorandum.md'

    print("Starting memorandum assembly...")

    # Generate metadata header
    timestamp = datetime.utcnow().isoformat() + 'Z'
    metadata = f"""<!-- ASSEMBLY METADATA
Generated: {timestamp}
Session: 2025-12-10-1765324800
Sections: 12 + Executive Summary
Footnotes: 2,012 (globally numbered)
Word Count: [Computing...]
Status: ASSEMBLED
-->

"""

    # Start building the memorandum
    memo = metadata
    memo += generate_title_page()

    # Read executive summary
    print("Adding executive summary...")
    exec_summary_path = base_dir / 'executive-summary.md'
    with open(exec_summary_path, 'r', encoding='utf-8') as f:
        exec_summary = f.read()

    memo += exec_summary
    memo += "\n\n---\n\n"

    # Add TOC placeholder (we'll generate after reading sections)
    print("Generating table of contents...")
    memo += generate_toc(SECTION_ORDER)

    # Process each section
    all_footnotes = {}

    for section_id in SECTION_ORDER:
        print(f"Processing {section_id}...")
        section_path = base_dir / SECTION_FILES[section_id]

        with open(section_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove metadata
        content = remove_metadata(content, section_id)

        # Fix formatting issues
        content = fix_formatting_issues(content, section_id)

        # Extract footnotes before renumbering
        section_footnotes = extract_footnotes(content)

        # Renumber footnotes
        content = renumber_footnotes(content, section_id)

        # Store renumbered footnotes
        offset = RENUMBERING_MAP[section_id]['offset']
        for orig_num, text in section_footnotes.items():
            new_num = orig_num + offset
            all_footnotes[new_num] = text

        # Remove footnote definitions from content (we'll add them at the end)
        content = re.sub(r'^\[\^\d+\]:.*?$', '', content, flags=re.MULTILINE)

        # Add section to memo
        memo += f"\n\n## {section_id.upper()}\n\n"
        memo += content
        memo += "\n\n---\n\n"

    # Add consolidated footnotes section
    print("Adding consolidated footnotes...")
    memo += "\n\n## CONSOLIDATED FOOTNOTES\n\n"

    for num in sorted(all_footnotes.keys()):
        memo += f"[^{num}]: {all_footnotes[num]}\n\n"

    # Add footer
    memo += generate_footer()

    # Calculate word count
    word_count = len(re.findall(r'\w+', memo))
    memo = memo.replace('[Computing...]', f'{word_count:,}')

    # Write output
    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(memo)

    print(f"\n✓ Assembly complete!")
    print(f"  - Word count: {word_count:,}")
    print(f"  - Footnotes: {len(all_footnotes)}")
    print(f"  - Output: {output_file}")

    return output_file, word_count, len(all_footnotes)

if __name__ == '__main__':
    assemble_memorandum()
