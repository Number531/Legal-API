#!/usr/bin/env python3
"""
ASSEMBLY SCRIPT - Wave 1-5 Remediation Integration
Merges all remediation outputs into final-memorandum-v2.md
"""

import re
import os
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

class RemediationEdit:
    """Represents a single edit from a remediation file"""
    def __init__(self, task_id: str, edit_type: str, section: str, content: str):
        self.task_id = task_id
        self.edit_type = edit_type  # "REPLACEMENT" or "INSERTION"
        self.section = section
        self.content = content.strip()
        self.applied = False
        self.error = None

class AssemblyProcessor:
    def __init__(self, session_dir: str):
        self.session_dir = Path(session_dir)
        self.remediation_dir = self.session_dir / "remediation-outputs"
        self.source_file = self.session_dir / "final-memorandum.md"
        self.target_file = self.session_dir / "final-memorandum-v2.md"
        self.report_file = self.session_dir / "assembly-report.md"

        self.edits_by_wave: Dict[str, List[RemediationEdit]] = {
            "Wave 1": [],
            "Wave 2": [],
            "Wave 3": [],
            "Wave 4": [],
            "Wave 5": []
        }

        self.stats = {
            "total_edits": 0,
            "applied": 0,
            "failed": 0,
            "skipped": 0,
            "tasks_processed": 0
        }

    def parse_remediation_file(self, filepath: Path) -> List[RemediationEdit]:
        """Extract all edits from a remediation file"""
        edits = []
        task_id = filepath.stem

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"ERROR reading {filepath.name}: {e}")
            return edits

        # Different formats for different files:

        # Format 1: EDITED_START/EDITED_END with line numbers (W1-CREAC files)
        pattern1 = r'## EDITED_START:\s*Line\s*(\d+)\s*\n(.*?)\n## EDITED_END:\s*Line\s*\d+'
        matches1 = re.finditer(pattern1, content, re.DOTALL)
        for match in matches1:
            line_num = match.group(1)
            section_content = match.group(2).strip()
            edits.append(RemediationEdit(task_id, "INSERTION", f"Line {line_num}", section_content))

        # Format 2: ## EDIT N: with complete section replacement (W2, W4, W5 files)
        pattern2 = r'## EDIT\s+\d+:([^\n]+)\n+((?:(?!## EDIT|## SUMMARY|## VERIFICATION|## INSTRUCTIONS|## QUALITY).*\n)+)'
        matches2 = re.finditer(pattern2, content, re.DOTALL | re.MULTILINE)
        for match in matches2:
            section_desc = match.group(1).strip()
            section_content = match.group(2).strip()
            # Remove any trailing summary sections
            section_content = re.sub(r'\n## (?:SUMMARY|VERIFICATION|INSTRUCTIONS|QUALITY).*', '', section_content, flags=re.DOTALL)
            edits.append(RemediationEdit(task_id, "REPLACEMENT", section_desc, section_content))

        if not edits:
            print(f"WARNING: No edits found in {filepath.name}")

        return edits

    def categorize_task(self, task_id: str) -> str:
        """Determine which wave a task belongs to"""
        if task_id.startswith("W1-"):
            return "Wave 1"
        elif task_id.startswith("W2-"):
            return "Wave 2"
        elif task_id.startswith("W3-"):
            return "Wave 3"
        elif task_id.startswith("W4-"):
            return "Wave 4"
        elif task_id.startswith("W5-"):
            return "Wave 5"
        else:
            return "Unknown"

    def load_all_edits(self):
        """Load all remediation files and extract edits"""
        print("\n=== LOADING REMEDIATION FILES ===\n")

        # Define processing order
        task_order = [
            # Wave 1: CREAC Headers (full section replacements)
            "W1-CREAC-001", "W1-CREAC-002", "W1-CREAC-004",
            "W1-CREAC-005", "W1-CREAC-006",
            # Wave 2: Content Additions
            "W2-QP-001", "W2-QP-002",
            "W2-RISK-001", "W2-RISK-002", "W2-RISK-003",
            "W2-RISK-004", "W2-RISK-005", "W2-RISK-006",
            "W2-PROV-001", "W2-PROV-002", "W2-PROV-003",
            # Wave 3: Citation Enhancements
            "W3-TAG-001", "W3-PINCITE-001", "W3-PAREN-001",
            # Wave 4: Quality Enhancements
            "W4-XREF-001", "W4-PROV-004", "W4-PROV-005",
            "W4-BRIEF-001", "W4-OBJ-001", "W4-FMT-001", "W4-QUANT-001",
            # Wave 5: Final Polish
            "W5-TOC-001", "W5-FOOT-001", "W5-SCENARIO-001",
            "W5-CITE-001", "W5-CITE-002"
        ]

        for task_id in task_order:
            filepath = self.remediation_dir / f"{task_id}.md"

            if not filepath.exists():
                print(f"SKIP: {task_id}.md not found")
                self.stats["skipped"] += 1
                continue

            edits = self.parse_remediation_file(filepath)
            wave = self.categorize_task(task_id)

            self.edits_by_wave[wave].extend(edits)
            self.stats["tasks_processed"] += 1
            self.stats["total_edits"] += len(edits)

            print(f"✓ {task_id}: {len(edits)} edits loaded")

    def find_section_boundaries(self, content: str, section_header: str) -> Tuple[int, int]:
        """Find start and end positions of a section"""
        # Try to match the section header
        patterns = [
            # Exact match
            re.escape(section_header),
            # Section number variations
            r'##\s+' + re.escape(section_header.replace('## ', '')),
            # Roman numerals
            r'##\s+[IVX]+\.\s*' + re.escape(section_header.split('.')[-1].strip()),
        ]

        start_pos = -1
        for pattern in patterns:
            match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
            if match:
                start_pos = match.start()
                break

        if start_pos == -1:
            return -1, -1

        # Find the end (next section at same or higher level)
        header_level = len(re.match(r'^#+', section_header).group()) if section_header.startswith('#') else 2
        next_section_pattern = r'\n' + '#' * header_level + r'\s+[^#\n]'

        next_match = re.search(next_section_pattern, content[start_pos + len(section_header):])
        if next_match:
            end_pos = start_pos + len(section_header) + next_match.start()
        else:
            end_pos = len(content)

        return start_pos, end_pos

    def apply_edit(self, edit: RemediationEdit, content: str) -> Tuple[str, bool, str]:
        """Apply a single edit to the content"""

        if edit.edit_type == "INSERTION":
            # For CREAC insertions, we're replacing entire sections
            # These are marked with line numbers but actually contain full section text

            # Extract the section header from the content
            section_match = re.search(r'^##\s+[IVX]+\.[A-Z]\.', edit.content, re.MULTILINE)
            if not section_match:
                # Try alternative format
                section_match = re.search(r'^##\s+IV\.[A-F]\.', edit.content, re.MULTILINE)

            if section_match:
                section_header = section_match.group(0)
                start_pos, end_pos = self.find_section_boundaries(content, section_header)

                if start_pos != -1:
                    # Replace the section
                    new_content = content[:start_pos] + edit.content + content[end_pos:]
                    return new_content, True, None
                else:
                    return content, False, f"Section '{section_header}' not found"
            else:
                return content, False, "Could not identify section header in edit content"

        elif edit.edit_type == "REPLACEMENT":
            # For replacements, we need to identify what to replace based on the section description

            # Common section identifiers
            section_markers = {
                "Complete Section II Questions Presented": (r'## II\. QUESTIONS PRESENTED.*?(?=\n## [IVX]+\.|\Z)', re.DOTALL),
                "Brief Answer #1": (r'### Brief Answer #1.*?(?=\n### Brief Answer #[2-9]|\n## [IVX]+\.|\Z)', re.DOTALL),
                "Executive Summary - Risk Assessment Table": (r'### Risk Assessment.*?(?=\n### [^#]|\n## [IVX]+\.|\Z)', re.DOTALL),
                "Section IV.A - Risk Assessment Table": (r'### C\. Risk Assessment.*?(?=\n### [D-Z]\.|\n## IV\.[B-F]\.|\Z)', re.DOTALL),
                "Cross-Reference Matrix": (r'## VII\. CROSS-REFERENCE MATRIX.*?(?=\n## [IVX]+\.|\Z)', re.DOTALL),
                "Scenario Analysis": (r'## VIII\. SCENARIO ANALYSIS.*?(?=\n## [IVX]+\.|\Z)', re.DOTALL),
            }

            # Try to match the section description
            for marker, (pattern, flags) in section_markers.items():
                if marker.lower() in edit.section.lower():
                    match = re.search(pattern, content, flags)
                    if match:
                        new_content = content[:match.start()] + edit.content + content[match.end():]
                        return new_content, True, None

            # If no specific marker found, try a generic approach
            # Look for the section title in the edit content
            first_line = edit.content.split('\n')[0]
            if first_line.startswith('#'):
                # Try to find and replace this section
                section_level = len(re.match(r'^#+', first_line).group())
                escaped_header = re.escape(first_line.strip('#').strip())
                pattern = r'^#' + '{' + str(section_level) + r'}\s+' + escaped_header + r'.*?(?=\n#' + '{1,' + str(section_level) + r'}\s+[^#]|\Z)'

                match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
                if match:
                    new_content = content[:match.start()] + edit.content + content[match.end():]
                    return new_content, True, None

            return content, False, f"Could not locate section to replace: {edit.section}"

        return content, False, "Unknown edit type"

    def apply_all_edits(self):
        """Apply all edits to the target file"""
        print("\n=== APPLYING EDITS ===\n")

        # Copy source to target
        print(f"Copying {self.source_file.name} to {self.target_file.name}...")
        shutil.copy2(self.source_file, self.target_file)

        # Read target file
        with open(self.target_file, 'r', encoding='utf-8') as f:
            content = f.read()

        original_size = len(content)
        print(f"Original file size: {original_size:,} bytes\n")

        # Apply edits wave by wave
        for wave_num in range(1, 6):
            wave_name = f"Wave {wave_num}"
            edits = self.edits_by_wave[wave_name]

            if not edits:
                print(f"--- {wave_name}: No edits ---")
                continue

            print(f"--- {wave_name}: {len(edits)} edits ---")
            wave_applied = 0
            wave_failed = 0

            for i, edit in enumerate(edits, 1):
                content, success, error = self.apply_edit(edit, content)

                if success:
                    edit.applied = True
                    wave_applied += 1
                    self.stats["applied"] += 1
                    print(f"  ✓ [{i}/{len(edits)}] {edit.task_id} - {edit.section[:50]}")
                else:
                    edit.error = error
                    wave_failed += 1
                    self.stats["failed"] += 1
                    print(f"  ✗ [{i}/{len(edits)}] {edit.task_id} - {edit.section[:50]}: {error}")

            print(f"  Wave summary: Applied {wave_applied}, Failed {wave_failed}")

            # Write after each wave
            with open(self.target_file, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"  ✓ Progress saved\n")

        final_size = len(content)
        size_change = final_size - original_size
        print(f"Final file size: {final_size:,} bytes ({size_change:+,} bytes)")

    def verify_results(self) -> Dict[str, any]:
        """Run verification checks on the final file"""
        print("\n=== VERIFICATION ===\n")

        with open(self.target_file, 'r', encoding='utf-8') as f:
            content = f.read()

        results = {}

        # Wave 1: CREAC structures
        conclusion_count = len(re.findall(r'^### Conclusion\b', content, re.MULTILINE))
        results['creac_conclusions'] = conclusion_count
        results['wave1_pass'] = conclusion_count >= 50
        print(f"Wave 1 (CREAC): {conclusion_count} '### Conclusion' headers (expected ≥50): {'PASS' if results['wave1_pass'] else 'FAIL'}")

        # Wave 2: Content additions
        questions_count = content.count("## II. QUESTIONS PRESENTED") + content.count("## QUESTIONS PRESENTED")
        risk_tables = len(re.findall(r'\|\s*Finding\s*\|\s*Severity\s*\|\s*Probability\s*\|', content))
        draft_provisions = len(re.findall(r'\*\*Draft Provision[:\s]', content, re.IGNORECASE))
        results['questions_presented'] = questions_count
        results['risk_tables'] = risk_tables
        results['draft_provisions'] = draft_provisions
        results['wave2_pass'] = questions_count >= 1 and risk_tables >= 6 and draft_provisions >= 3
        print(f"Wave 2 (Content): Questions={questions_count}, Risk Tables={risk_tables}, Provisions={draft_provisions}: {'PASS' if results['wave2_pass'] else 'FAIL'}")

        # Wave 3: Citation enhancements
        verification_tags = len(re.findall(r'\[VERIFIED:', content))
        pincites = len(re.findall(r'\d+\s+U\.S\.\s+\d+,\s+\d+', content))
        parentheticals = len(re.findall(r'\([^)]*holding that[^)]*\)', content, re.IGNORECASE))
        results['verification_tags'] = verification_tags
        results['pincites'] = pincites
        results['parentheticals'] = parentheticals
        results['wave3_pass'] = verification_tags >= 500 and pincites >= 400
        print(f"Wave 3 (Citations): Tags={verification_tags}, Pincites={pincites}, Parentheticals={parentheticals}: {'PASS' if results['wave3_pass'] else 'FAIL'}")

        # Wave 4: Quality enhancements
        xref_matrix = "CROSS-REFERENCE MATRIX" in content or "Cross-Reference Matrix" in content
        precedent_cites = len(re.findall(r'\[See comparable:', content))
        neutralizations = len(re.findall(r'(?:presents|involves|raises|creates)\s+(?:risk|exposure|concern)', content, re.IGNORECASE))
        results['xref_matrix'] = xref_matrix
        results['precedent_citations'] = precedent_cites
        results['neutralizations'] = neutralizations
        results['wave4_pass'] = xref_matrix and precedent_cites >= 10
        print(f"Wave 4 (Quality): XRef Matrix={xref_matrix}, Precedents={precedent_cites}, Neutralizations={neutralizations}: {'PASS' if results['wave4_pass'] else 'FAIL'}")

        # Wave 5: Final polish
        page_refs = len(re.findall(r'\(p\.\s*\d+\)', content))
        footnote_section = "## CONSOLIDATED FOOTNOTES" in content or "## FOOTNOTES" in content
        scenario_analysis = "Scenario Analysis" in content or "SCENARIO ANALYSIS" in content
        short_form_correct = len(re.findall(r'\*Id\.\*(?:\s+at\s+\d+)?', content))
        results['page_references'] = page_refs
        results['footnote_section'] = footnote_section
        results['scenario_analysis'] = scenario_analysis
        results['short_form_citations'] = short_form_correct
        results['wave5_pass'] = footnote_section and scenario_analysis
        print(f"Wave 5 (Polish): PageRefs={page_refs}, Footnotes={footnote_section}, Scenarios={scenario_analysis}, ShortForm={short_form_correct}: {'PASS' if results['wave5_pass'] else 'FAIL'}")

        # Placeholders check
        placeholders = len(re.findall(r'\[(?:XREF|TBD|TODO)\]', content))
        results['placeholders'] = placeholders
        print(f"\nPlaceholders remaining: {placeholders} (expected 0)")

        # Word count
        word_count = len(content.split())
        line_count = content.count('\n')
        results['word_count'] = word_count
        results['line_count'] = line_count
        print(f"Word count: {word_count:,} (original: ~111,939)")
        print(f"Line count: {line_count:,} (original: ~9,495)")

        return results

    def generate_report(self, verification: Dict):
        """Generate the assembly report"""
        print("\n=== GENERATING REPORT ===\n")

        report_lines = [
            "# ASSEMBLY REPORT - Wave 1-5 Remediation Integration",
            "",
            f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Source**: final-memorandum.md",
            f"**Target**: final-memorandum-v2.md",
            f"**Remediation Tasks Processed**: {self.stats['tasks_processed']}",
            f"**Tasks Skipped**: {self.stats['skipped']}",
            "",
            "## Summary Statistics",
            "",
            "| Wave | Tasks | Edits Applied | Edits Failed | Success Rate |",
            "|------|-------|---------------|--------------|--------------|"
        ]

        for wave_num in range(1, 6):
            wave_name = f"Wave {wave_num}"
            edits = self.edits_by_wave[wave_name]
            applied = sum(1 for e in edits if e.applied)
            failed = sum(1 for e in edits if not e.applied)
            tasks = len(set(e.task_id for e in edits))
            success_rate = (applied / len(edits) * 100) if edits else 0

            wave_label = {
                "Wave 1": "Wave 1 (CREAC)",
                "Wave 2": "Wave 2 (Content)",
                "Wave 3": "Wave 3 (Citations)",
                "Wave 4": "Wave 4 (Quality)",
                "Wave 5": "Wave 5 (Polish)"
            }[wave_name]

            report_lines.append(
                f"| {wave_label} | {tasks} | {applied} | {failed} | {success_rate:.1f}% |"
            )

        total_success_rate = (self.stats['applied'] / self.stats['total_edits'] * 100) if self.stats['total_edits'] > 0 else 0
        report_lines.extend([
            f"| **TOTAL** | **{self.stats['tasks_processed']}** | **{self.stats['applied']}** | **{self.stats['failed']}** | **{total_success_rate:.1f}%** |",
            "",
            "## Detailed Processing Log",
            ""
        ])

        # Detailed per-task logs
        for wave_num in range(1, 6):
            wave_name = f"Wave {wave_num}"
            edits = self.edits_by_wave[wave_name]

            if not edits:
                continue

            report_lines.extend([
                f"### {wave_name}",
                ""
            ])

            # Group by task
            tasks = {}
            for edit in edits:
                if edit.task_id not in tasks:
                    tasks[edit.task_id] = []
                tasks[edit.task_id].append(edit)

            for task_id in sorted(tasks.keys()):
                task_edits = tasks[task_id]
                applied = sum(1 for e in task_edits if e.applied)
                failed = sum(1 for e in task_edits if not e.applied)

                report_lines.extend([
                    f"**{task_id}**",
                    f"- Edits in file: {len(task_edits)}",
                    f"- Edits applied: {applied}",
                    f"- Edits failed: {failed}"
                ])

                if failed > 0:
                    report_lines.append("- Failures:")
                    for edit in task_edits:
                        if not edit.applied:
                            report_lines.append(f"  - {edit.section}: {edit.error}")

                report_lines.append("")

        # Verification results
        report_lines.extend([
            "## Verification Results",
            "",
            "**Wave 1 Verification** (CREAC structures):",
            f"- Expected: ≥50 '### Conclusion' headers",
            f"- Found: {verification['creac_conclusions']}",
            f"- Status: {'PASS' if verification['wave1_pass'] else 'FAIL'}",
            "",
            "**Wave 2 Verification** (Content additions):",
            f"- Questions Presented: Expected ≥1, Found {verification['questions_presented']}",
            f"- Risk Tables: Expected ≥6, Found {verification['risk_tables']}",
            f"- Draft Provisions: Expected ≥3, Found {verification['draft_provisions']}",
            f"- Status: {'PASS' if verification['wave2_pass'] else 'FAIL'}",
            "",
            "**Wave 3 Verification** (Citation enhancements):",
            f"- Verification tags: Expected ≥500, Found {verification['verification_tags']}",
            f"- Pincites: Expected ≥400, Found {verification['pincites']}",
            f"- Parentheticals: Expected ≥450, Found {verification['parentheticals']}",
            f"- Status: {'PASS' if verification['wave3_pass'] else 'FAIL'}",
            "",
            "**Wave 4 Verification** (Quality enhancements):",
            f"- Cross-reference matrix: Expected 1, Found {1 if verification['xref_matrix'] else 0}",
            f"- Precedent citations: Expected ≥10, Found {verification['precedent_citations']}",
            f"- Advocacy neutralizations: Expected ≥10, Found {verification['neutralizations']}",
            f"- Status: {'PASS' if verification['wave4_pass'] else 'FAIL'}",
            "",
            "**Wave 5 Verification** (Final polish):",
            f"- Page references: Found {verification['page_references']} (to be removed)",
            f"- Footnotes section: {'Present' if verification['footnote_section'] else 'Missing'}",
            f"- Scenario analysis: {'Present' if verification['scenario_analysis'] else 'Missing'}",
            f"- Short-form citations: Found {verification['short_form_citations']}",
            f"- Status: {'PASS' if verification['wave5_pass'] else 'FAIL'}",
            ""
        ])

        # Failed edits section
        all_failed = [e for wave_edits in self.edits_by_wave.values() for e in wave_edits if not e.applied]

        if all_failed:
            report_lines.extend([
                "## Failed Edits",
                "",
                f"Total failed edits: {len(all_failed)}",
                ""
            ])

            for edit in all_failed[:20]:  # Limit to first 20
                report_lines.extend([
                    f"**{edit.task_id}** - {edit.section}",
                    f"- Error: {edit.error}",
                    f"- Content preview (first 100 chars): {edit.content[:100].replace(chr(10), ' ')}...",
                    ""
                ])

            if len(all_failed) > 20:
                report_lines.append(f"*... and {len(all_failed) - 20} more*")
                report_lines.append("")
        else:
            report_lines.extend([
                "## Failed Edits",
                "",
                "No failed edits - all changes applied successfully!",
                ""
            ])

        # Final metrics
        report_lines.extend([
            "## Final Metrics",
            "",
            f"**final-memorandum-v2.md**:",
            f"- Word count: {verification['word_count']:,} (original: ~111,939)",
            f"- Line count: {verification['line_count']:,} (original: ~9,495)",
            f"- File size: {os.path.getsize(self.target_file):,} bytes (original: ~858,920)",
            f"- Placeholders remaining: {verification['placeholders']}",
            "",
            "## Status",
            "",
            f"- All waves processed: {'YES' if self.stats['tasks_processed'] >= 25 else 'NO'}",
            f"- All verifications passed: {'YES' if all([verification['wave1_pass'], verification['wave2_pass'], verification['wave3_pass'], verification['wave4_pass'], verification['wave5_pass']]) else 'NO'}",
            f"- Success rate: {total_success_rate:.1f}%",
            f"- Ready for VALIDATE-001: {'YES' if total_success_rate >= 90 and verification['placeholders'] == 0 else 'NO'}",
            ""
        ])

        # Write report
        with open(self.report_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))

        print(f"✓ Report written to: {self.report_file}")

    def run(self):
        """Execute the full assembly process"""
        print("="*70)
        print("MEMORANDUM ASSEMBLY - Wave 1-5 Integration")
        print("="*70)

        # Validate inputs
        if not self.source_file.exists():
            print(f"ERROR: Source file not found: {self.source_file}")
            return False

        if not self.remediation_dir.exists():
            print(f"ERROR: Remediation directory not found: {self.remediation_dir}")
            return False

        # Execute assembly
        self.load_all_edits()
        self.apply_all_edits()
        verification = self.verify_results()
        self.generate_report(verification)

        print("\n" + "="*70)
        print("ASSEMBLY COMPLETE")
        print("="*70)
        print(f"\nOutput files:")
        print(f"  - {self.target_file}")
        print(f"  - {self.report_file}")
        print(f"\nStatistics:")
        print(f"  - Tasks processed: {self.stats['tasks_processed']}")
        print(f"  - Edits applied: {self.stats['applied']}/{self.stats['total_edits']}")
        print(f"  - Success rate: {(self.stats['applied']/self.stats['total_edits']*100) if self.stats['total_edits'] > 0 else 0:.1f}%")

        return True

if __name__ == "__main__":
    processor = AssemblyProcessor("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293")
    success = processor.run()
    exit(0 if success else 1)
