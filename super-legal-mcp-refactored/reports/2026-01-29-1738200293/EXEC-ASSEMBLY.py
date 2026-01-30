#!/usr/bin/env python3
"""
EXECUTIVE ASSEMBLY SCRIPT
Self-contained script to merge all Wave 1-5 remediation outputs
Handles large files that cannot be processed by Agent SDK Read tool
"""

import re
import os
import shutil
from pathlib import Path
from datetime import datetime

def main():
    print("="*80)
    print("MEMORANDUM ASSEMBLY - Wave 1-5 Remediation Integration")
    print("="*80)
    print()

    # Setup paths
    session_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293")
    source_file = session_dir / "final-memorandum.md"
    target_file = session_dir / "final-memorandum-v2.md"
    remediation_dir = session_dir / "remediation-outputs"
    report_file = session_dir / "assembly-report.md"

    # Validate inputs
    if not source_file.exists():
        print(f"ERROR: Source file not found: {source_file}")
        return False

    if not remediation_dir.exists():
        print(f"ERROR: Remediation directory not found: {remediation_dir}")
        return False

    # Step 1: Copy source to target
    print(f"[1/4] Copying {source_file.name} to {target_file.name}...")
    shutil.copy2(source_file, target_file)
    print(f"      ✓ File copied ({os.path.getsize(target_file):,} bytes)")
    print()

    # Step 2: Load target content
    print("[2/4] Loading target file into memory...")
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_word_count = len(content.split())
    original_line_count = content.count('\n')
    print(f"      ✓ Loaded: {len(content):,} bytes, {original_word_count:,} words, {original_line_count:,} lines")
    print()

    # Step 3: Process remediation files
    print("[3/4] Processing remediation files...")
    print()

    stats = {
        "tasks_processed": 0,
        "tasks_skipped": 0,
        "edits_applied": 0,
        "edits_failed": 0
    }

    detailed_log = []

    # Define task processing order
    tasks = [
        # Wave 1: CREAC structures (full section replacements)
        ("W1-CREAC-001", "Wave 1", "Section IV.A CREAC"),
        ("W1-CREAC-002", "Wave 1", "Section IV.B CREAC"),
        ("W1-CREAC-004", "Wave 1", "Section IV.D CREAC"),
        ("W1-CREAC-005", "Wave 1", "Section IV.E CREAC"),
        ("W1-CREAC-006", "Wave 1", "Section IV.F CREAC"),

        # Wave 2: Content additions
        ("W2-QP-001", "Wave 2", "Questions Presented Section"),
        ("W2-QP-002", "Wave 2", "Brief Answers Section"),
        ("W2-RISK-001", "Wave 2", "Risk Table IV.A"),
        ("W2-RISK-002", "Wave 2", "Risk Table IV.B"),
        ("W2-RISK-003", "Wave 2", "Risk Table IV.C"),
        ("W2-RISK-004", "Wave 2", "Risk Table IV.D"),
        ("W2-RISK-005", "Wave 2", "Risk Table IV.E"),
        ("W2-RISK-006", "Wave 2", "Risk Table IV.F"),
        ("W2-PROV-001", "Wave 2", "Draft Provision #1"),
        ("W2-PROV-002", "Wave 2", "Draft Provision #2"),
        ("W2-PROV-003", "Wave 2", "Draft Provision #3"),

        # Wave 3: Citation enhancements (analysis only - skip)
        # W3 files are verification reports, not edit files

        # Wave 4: Quality enhancements
        ("W4-XREF-001", "Wave 4", "Cross-Reference Matrix"),
        ("W4-PROV-004", "Wave 4", "Precedent Citations in Provisions"),
        ("W4-PROV-005", "Wave 4", "Basket/Cap/Survival Terms"),
        ("W4-BRIEF-001", "Wave 4", "Brief Answer #1 Condensed"),
        ("W4-OBJ-001", "Wave 4", "Advocacy Neutralization"),
        ("W4-FMT-001", "Wave 4", "Title Case Fixes"),
        ("W4-QUANT-001", "Wave 4", "Discount Rate Citations"),

        # Wave 5: Final polish
        ("W5-TOC-001", "Wave 5", "Table of Contents"),
        ("W5-FOOT-001", "Wave 5", "Footnote Verification"),
        ("W5-SCENARIO-001", "Wave 5", "Scenario Analysis"),
        ("W5-CITE-001", "Wave 5", "Citation Signals"),
        ("W5-CITE-002", "Wave 5", "Short-Form Citations"),
    ]

    for task_id, wave, description in tasks:
        task_file = remediation_dir / f"{task_id}.md"

        if not task_file.exists():
            print(f"   SKIP: {task_id} - File not found")
            stats["tasks_skipped"] += 1
            detailed_log.append(f"**{task_id}** ({wave}): SKIPPED - File not found")
            continue

        print(f"   Processing: {task_id} - {description}")

        try:
            # Read remediation file
            with open(task_file, 'r', encoding='utf-8') as f:
                remediation_content = f.read()

            # Extract edits based on format
            edits_found = 0
            edits_applied = 0
            edits_failed = 0

            # Format 1: ## EDITED_START: Line N ... ## EDITED_END: Line M
            pattern1 = r'## EDITED_START:\s*Line\s*\d+\s*\n(.*?)\n## EDITED_END:\s*Line\s*\d+'
            matches1 = list(re.finditer(pattern1, remediation_content, re.DOTALL))

            if matches1:
                for match in matches1:
                    section_content = match.group(1).strip()
                    edits_found += 1

                    # Extract section header to locate in main document
                    header_match = re.search(r'^##\s+IV\.[A-F]\.', section_content, re.MULTILINE)
                    if header_match:
                        section_header = header_match.group(0)

                        # Find and replace this section in content
                        # Look for the section and the next section
                        section_pattern = re.escape(section_header) + r'.*?(?=\n##\s+IV\.[A-F]\.|\n##\s+V\.|\Z)'
                        section_match = re.search(section_pattern, content, re.DOTALL)

                        if section_match:
                            content = content[:section_match.start()] + section_content + content[section_match.end():]
                            edits_applied += 1
                        else:
                            edits_failed += 1
                            print(f"        ✗ Could not locate section: {section_header}")
                    else:
                        edits_failed += 1
                        print(f"        ✗ Could not identify section header in edit")

            # Format 2: ## EDIT N: Description\n\n[content]
            pattern2 = r'## EDIT\s+\d+:([^\n]+)\n\n((?:(?!## EDIT|## SUMMARY|## VERIFICATION|## INSTRUCTIONS|## QUALITY|## REMEDI).*\n?)+)'
            matches2 = list(re.finditer(pattern2, remediation_content, re.DOTALL | re.MULTILINE))

            if matches2:
                for match in matches2:
                    edit_desc = match.group(1).strip()
                    edit_content = match.group(2).strip()
                    edits_found += 1

                    # Determine what to replace based on edit description and content
                    success = False

                    # Extract first meaningful line from edit content
                    first_line = edit_content.split('\n')[0].strip()

                    # Strategy: Look for the first line in the document and replace from there
                    # to the next section of equal or higher level
                    if first_line.startswith('#'):
                        header_level = len(re.match(r'^#+', first_line).group())
                        header_text = re.escape(first_line.strip('#').strip())

                        # Find this header in the content
                        header_pattern = r'^#' + '{' + str(header_level) + r'}\s+' + header_text
                        header_match = re.search(header_pattern, content, re.MULTILINE)

                        if header_match:
                            # Find the end of this section (next header of same or higher level)
                            end_pattern = r'\n#' + '{1,' + str(header_level) + r'}\s+[^#]'
                            end_match = re.search(end_pattern, content[header_match.start():])

                            if end_match:
                                end_pos = header_match.start() + end_match.start()
                            else:
                                end_pos = len(content)

                            # Replace the section
                            content = content[:header_match.start()] + edit_content + '\n\n' + content[end_pos:]
                            edits_applied += 1
                            success = True

                    if not success:
                        edits_failed += 1
                        print(f"        ✗ Could not apply edit: {edit_desc[:50]}")

            if edits_found == 0:
                # This might be an analysis file (like W3 files)
                print(f"        → No edits found (analysis file)")
                stats["tasks_skipped"] += 1
                detailed_log.append(f"**{task_id}** ({wave}): No edits found (analysis only)")
            else:
                print(f"        ✓ Applied {edits_applied}/{edits_found} edits")
                stats["tasks_processed"] += 1
                stats["edits_applied"] += edits_applied
                stats["edits_failed"] += edits_failed
                detailed_log.append(f"**{task_id}** ({wave}): {edits_applied}/{edits_found} edits applied")

        except Exception as e:
            print(f"        ✗ ERROR: {e}")
            stats["tasks_skipped"] += 1
            detailed_log.append(f"**{task_id}** ({wave}): ERROR - {e}")

    print()
    print(f"   Summary: {stats['tasks_processed']} tasks processed, {stats['edits_applied']} edits applied, {stats['edits_failed']} failed")
    print()

    # Step 4: Write updated content and generate report
    print("[4/4] Writing updated file and generating report...")

    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)

    final_word_count = len(content.split())
    final_line_count = content.count('\n')
    final_size = os.path.getsize(target_file)

    print(f"      ✓ Updated file written ({final_size:,} bytes)")
    print(f"      ✓ Word count: {final_word_count:,} (original: {original_word_count:,}, delta: {final_word_count - original_word_count:+,})")
    print(f"      ✓ Line count: {final_line_count:,} (original: {original_line_count:,}, delta: {final_line_count - original_line_count:+,})")
    print()

    # Generate verification metrics
    print("   Running verification checks...")

    verification = {}
    verification['creac_conclusions'] = len(re.findall(r'^### Conclusion\b', content, re.MULTILINE))
    verification['questions_sections'] = content.count("## II. QUESTIONS PRESENTED")
    verification['risk_tables'] = len(re.findall(r'\|\s*Finding\s*\|\s*Severity\s*\|\s*Probability\s*\|', content))
    verification['draft_provisions'] = len(re.findall(r'\*\*Draft Provision', content, re.IGNORECASE))
    verification['verification_tags'] = len(re.findall(r'\[VERIFIED:', content))
    verification['pincites'] = len(re.findall(r'\d+\s+U\.S\.\s+\d+,\s+\d+', content))
    verification['xref_matrix'] = 1 if ("CROSS-REFERENCE MATRIX" in content or "Cross-Reference Matrix" in content) else 0
    verification['precedent_cites'] = len(re.findall(r'\[See comparable:', content))
    verification['footnote_section'] = 1 if ("## CONSOLIDATED FOOTNOTES" in content or "## FOOTNOTES" in content) else 0
    verification['scenario_analysis'] = 1 if ("Scenario Analysis" in content or "SCENARIO ANALYSIS" in content) else 0
    verification['placeholders'] = len(re.findall(r'\[(?:XREF|TBD|TODO)\]', content))

    print(f"      - CREAC Conclusions: {verification['creac_conclusions']} (expected ≥50)")
    print(f"      - Questions Presented: {verification['questions_sections']} (expected ≥1)")
    print(f"      - Risk Tables: {verification['risk_tables']} (expected ≥6)")
    print(f"      - Draft Provisions: {verification['draft_provisions']} (expected ≥3)")
    print(f"      - Verification Tags: {verification['verification_tags']}")
    print(f"      - Pincites: {verification['pincites']}")
    print(f"      - Cross-Ref Matrix: {verification['xref_matrix']} (expected 1)")
    print(f"      - Precedent Citations: {verification['precedent_cites']}")
    print(f"      - Footnote Section: {verification['footnote_section']} (expected 1)")
    print(f"      - Scenario Analysis: {verification['scenario_analysis']} (expected 1)")
    print(f"      - Placeholders: {verification['placeholders']} (expected 0)")
    print()

    # Generate report
    success_rate = (stats['edits_applied'] / (stats['edits_applied'] + stats['edits_failed']) * 100) if (stats['edits_applied'] + stats['edits_failed']) > 0 else 0

    report = f"""# ASSEMBLY REPORT - Wave 1-5 Remediation Integration

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Source**: final-memorandum.md
**Target**: final-memorandum-v2.md

## Summary Statistics

- Tasks processed: {stats['tasks_processed']}
- Tasks skipped: {stats['tasks_skipped']}
- Edits applied: {stats['edits_applied']}
- Edits failed: {stats['edits_failed']}
- Success rate: {success_rate:.1f}%

## File Metrics

| Metric | Original | Final | Delta |
|--------|----------|-------|-------|
| File size | {os.path.getsize(source_file):,} bytes | {final_size:,} bytes | {final_size - os.path.getsize(source_file):+,} bytes |
| Word count | {original_word_count:,} | {final_word_count:,} | {final_word_count - original_word_count:+,} |
| Line count | {original_line_count:,} | {final_line_count:,} | {final_line_count - original_line_count:+,} |

## Verification Results

| Check | Expected | Found | Status |
|-------|----------|-------|--------|
| CREAC Conclusions | ≥50 | {verification['creac_conclusions']} | {'PASS' if verification['creac_conclusions'] >= 50 else 'FAIL'} |
| Questions Presented | ≥1 | {verification['questions_sections']} | {'PASS' if verification['questions_sections'] >= 1 else 'FAIL'} |
| Risk Tables | ≥6 | {verification['risk_tables']} | {'PASS' if verification['risk_tables'] >= 6 else 'FAIL'} |
| Draft Provisions | ≥3 | {verification['draft_provisions']} | {'PASS' if verification['draft_provisions'] >= 3 else 'FAIL'} |
| Verification Tags | ≥500 | {verification['verification_tags']} | {'PASS' if verification['verification_tags'] >= 500 else 'FAIL'} |
| Pincites | ≥400 | {verification['pincites']} | {'PASS' if verification['pincites'] >= 400 else 'FAIL'} |
| Cross-Reference Matrix | 1 | {verification['xref_matrix']} | {'PASS' if verification['xref_matrix'] == 1 else 'FAIL'} |
| Precedent Citations | ≥10 | {verification['precedent_cites']} | {'PASS' if verification['precedent_cites'] >= 10 else 'FAIL'} |
| Footnote Section | 1 | {verification['footnote_section']} | {'PASS' if verification['footnote_section'] == 1 else 'FAIL'} |
| Scenario Analysis | 1 | {verification['scenario_analysis']} | {'PASS' if verification['scenario_analysis'] == 1 else 'FAIL'} |
| Placeholders | 0 | {verification['placeholders']} | {'PASS' if verification['placeholders'] == 0 else 'FAIL'} |

## Processing Log

"""

    for log_entry in detailed_log:
        report += f"- {log_entry}\n"

    report += f"""

## Status

- All waves processed: {'YES' if stats['tasks_processed'] >= 20 else 'NO'}
- Success rate: {success_rate:.1f}%
- Ready for validation: {'YES' if success_rate >= 90 and verification['placeholders'] == 0 else 'NO'}

## Output Files

- **final-memorandum-v2.md**: {final_size:,} bytes
- **assembly-report.md**: This file

"""

    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"      ✓ Report written to: {report_file}")
    print()

    print("="*80)
    print("ASSEMBLY COMPLETE")
    print("="*80)
    print()
    print(f"Output files:")
    print(f"  - {target_file}")
    print(f"  - {report_file}")
    print()
    print(f"Statistics:")
    print(f"  - Success rate: {success_rate:.1f}%")
    print(f"  - Edits applied: {stats['edits_applied']}")
    print(f"  - Placeholders remaining: {verification['placeholders']}")
    print()

    return True

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
