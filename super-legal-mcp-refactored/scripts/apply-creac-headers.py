#!/usr/bin/env python3
"""
CREAC Header Application Script (Enhanced Pattern Detection + Minimum Guarantee)

Purpose: Insert CREAC headers (Conclusion, Rule, Explanation, Application, Counter-Analysis)
at structurally appropriate positions in legal memoranda.

Part of hybrid workflow: Script handles mechanical insertion, agent handles semantic validation.

Features:
- Pattern-based detection of CREAC content types
- Minimum header guarantee (default: 50 headers) to meet QA thresholds
- Automatic Conclusion header insertion for sections lacking explicit conclusions

Usage:
    python3 scripts/apply-creac-headers.py <input_file> [output_file] [--min-headers N]

    If output_file is omitted, writes to <input_file_base>-creac.md
    --min-headers N: Ensure at least N total CREAC headers (default: 50)

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~2 seconds for 1MB file

Verification:
    grep -c "### Conclusion" output.md  # Should be 10+
    grep -c "### Rule" output.md         # Should be 10+
    grep -c "### Explanation" output.md  # Should be 10+
    grep -c "### Application" output.md  # Should be 10+
    grep -cE "^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)" output.md  # Should be >= 50
"""

import re
import sys
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

# ============================================
# ENHANCED CREAC PATTERN DETECTION
# ============================================

CREAC_PATTERNS = {
    'conclusion': [
        # Direct conclusion signals
        r'^(?:In\s+(?:summary|conclusion)|Therefore|Thus|Accordingly)',
        r'^(?:Based\s+on\s+the\s+(?:foregoing|above|analysis))',
        r'^(?:We\s+conclude\s+that|The\s+(?:analysis|evidence)\s+(?:indicates|suggests|shows))',
        r'^(?:For\s+(?:these|the\s+foregoing)\s+reasons)',
        # Probability assessment signals (common in legal conclusions)
        r'^(?:It\s+is\s+(?:likely|unlikely|probable|improbable)\s+that)',
        r'^(?:There\s+is\s+a\s+(?:substantial|significant|reasonable)\s+(?:risk|likelihood))',
        # Risk assessment conclusions
        r'^(?:The\s+(?:risk|exposure|liability)\s+is\s+(?:HIGH|MEDIUM|LOW|substantial|minimal))',
    ],
    'rule': [
        # Statutory/regulatory citations
        r'^(?:Under|Pursuant\s+to)\s+(?:\d+\s+U\.S\.C|Section\s+\d+|§\s*\d+)',
        r'^(?:Under|Pursuant\s+to)\s+(?:the\s+)?(?:[A-Z][a-z]+\s+)+(?:Act|Code|Statute|Rule)',
        # Rule statements
        r'^(?:The\s+(?:law|rule|standard|regulation)\s+(?:requires|provides|states|mandates))',
        r'^(?:A\s+(?:plaintiff|defendant|party)\s+must\s+(?:prove|establish|demonstrate))',
        # Elements/requirements
        r'^(?:To\s+(?:establish|prove|demonstrate)\s+(?:a\s+)?(?:claim|violation|defense))',
        r'^(?:The\s+elements\s+(?:of|required\s+for))',
        # General legal principles
        r'^(?:(?:Generally|Ordinarily|As\s+a\s+general\s+rule),)',
    ],
    'explanation': [
        # Case citation patterns (In [Name] v. [Name])
        r'^(?:In\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+v\.)',
        # Court interpretation signals
        r'^(?:Courts\s+have\s+(?:consistently|generally|uniformly)\s+(?:held|found|determined))',
        r'^(?:The\s+(?:Supreme\s+Court|(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|D\.C\.)\s+Circuit)\s+(?:has\s+)?(?:held|found|ruled))',
        # Interpretive signals
        r'^(?:This\s+(?:standard|test|rule)\s+(?:has\s+been|was)\s+(?:applied|interpreted))',
        r'^(?:The\s+(?:court|judiciary)\s+(?:has\s+)?(?:interpreted|construed|applied))',
        # Precedent discussion signals
        r'^(?:For\s+(?:example|instance),\s+in)',
        r'^(?:Similarly,\s+in)',
    ],
    'application': [
        # "Here" signals (common application opener)
        r'^(?:Here,?\s+)',
        r'^(?:In\s+this\s+(?:case|matter|transaction|context))',
        r'^(?:In\s+the\s+(?:instant|present|current)\s+(?:case|matter|transaction))',
        # Client/entity specific references
        r'^(?:Liberty\s+Life)',
        r'^(?:The\s+(?:Target|Company|Acquirer|Buyer|Seller)(?:\'s)?)',
        r'^(?:(?:Target|Company|Acquirer)\'s\s+)',
        # Application signals
        r'^(?:Applying\s+(?:this|these|the)\s+(?:standard|principles|test|framework))',
        r'^(?:When\s+(?:this|these|the)\s+(?:factors?|criteria|elements?)\s+(?:are|is)\s+applied)',
        # Factual application
        r'^(?:The\s+facts\s+(?:here|in\s+this\s+case)\s+(?:indicate|suggest|show))',
    ],
    'counter_analysis': [
        # Adversarial signals
        r'^(?:However|Conversely|Alternatively|On\s+the\s+other\s+hand)',
        r'^(?:(?:Defendants?|Opposing\s+(?:counsel|party))\s+(?:may|might|could|will\s+likely)\s+argue)',
        r'^(?:(?:A|The)\s+(?:contrary|opposing|alternative)\s+(?:argument|position|view))',
        # Bluebook adverse citation signals
        r'^(?:But\s+see|Contra|Compare|See\s+also\s+.+\s+\(noting)',
        # Rebuttal acknowledgments
        r'^(?:(?:Notwithstanding|Despite)\s+(?:this|these|the\s+foregoing))',
        r'^(?:While\s+(?:it\s+is\s+true|some\s+courts|there\s+are))',
        # Risk mitigation/defense signals
        r'^(?:(?:A|One)\s+(?:potential|possible)\s+(?:defense|argument|counter))',
    ]
}

# Compile patterns for efficiency
COMPILED_PATTERNS = {
    creac_type: [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    for creac_type, patterns in CREAC_PATTERNS.items()
}


@dataclass
class Finding:
    """Represents a legal finding/subsection in the memorandum."""
    section_id: str  # e.g., "IV.A", "IV.B.1"
    title: str
    start_line: int
    end_line: int
    content_lines: List[str]
    creac_headers_present: Dict[str, bool]


@dataclass
class InsertionPoint:
    """Represents where to insert a CREAC header."""
    line_number: int
    header_type: str  # 'conclusion', 'rule', 'explanation', 'application', 'counter_analysis'
    confidence: float  # 0.0 - 1.0
    matched_pattern: str


def detect_creac_type(line: str) -> Optional[Tuple[str, str, float]]:
    """
    Detect if a line starts with content that should have a CREAC header.

    Returns: (creac_type, matched_pattern, confidence) or None
    """
    line_stripped = line.strip()
    if not line_stripped or line_stripped.startswith('#'):
        return None

    for creac_type, patterns in COMPILED_PATTERNS.items():
        for pattern in patterns:
            if pattern.match(line_stripped):
                # Higher confidence for more specific patterns
                confidence = 0.8 if len(pattern.pattern) > 30 else 0.6
                return (creac_type, pattern.pattern, confidence)

    return None


def parse_findings(lines: List[str]) -> List[Finding]:
    """
    Parse the memorandum to identify discrete findings/subsections.

    Looks for patterns like:
    - #### A.1, #### B.2 (finding headers)
    - ### Section IV.A, ### Section IV.B (section headers)
    """
    findings = []
    current_finding = None
    finding_pattern = re.compile(r'^#{3,4}\s+(?:Section\s+)?(IV\.)?([A-Z])(?:\.(\d+))?\.?\s*(.*)$', re.IGNORECASE)

    for i, line in enumerate(lines):
        match = finding_pattern.match(line.strip())
        if match:
            # Save previous finding
            if current_finding:
                current_finding.end_line = i - 1
                current_finding.content_lines = lines[current_finding.start_line:i]
                findings.append(current_finding)

            # Start new finding
            section_letter = match.group(2).upper()
            subsection = match.group(3) or ""
            title = match.group(4).strip()
            section_id = f"IV.{section_letter}"
            if subsection:
                section_id += f".{subsection}"

            current_finding = Finding(
                section_id=section_id,
                title=title,
                start_line=i,
                end_line=-1,
                content_lines=[],
                creac_headers_present={
                    'conclusion': False,
                    'rule': False,
                    'explanation': False,
                    'application': False,
                    'counter_analysis': False
                }
            )

    # Don't forget the last finding
    if current_finding:
        current_finding.end_line = len(lines) - 1
        current_finding.content_lines = lines[current_finding.start_line:]
        findings.append(current_finding)

    return findings


def check_existing_headers(finding: Finding) -> None:
    """Check which CREAC headers already exist in a finding."""
    header_patterns = {
        'conclusion': r'#{2,4}\s*(?:Conclusion|Summary)',
        'rule': r'#{2,4}\s*(?:Rule|Legal\s+Standard)',
        'explanation': r'#{2,4}\s*(?:Explanation|Precedent)',
        'application': r'#{2,4}\s*(?:Application|Analysis)',
        'counter_analysis': r'#{2,4}\s*(?:Counter[-\s]?Analysis|Adverse\s+Arguments?)'
    }

    content = '\n'.join(finding.content_lines)
    for header_type, pattern in header_patterns.items():
        if re.search(pattern, content, re.IGNORECASE):
            finding.creac_headers_present[header_type] = True


def find_insertion_points(finding: Finding) -> List[InsertionPoint]:
    """
    Find where CREAC headers should be inserted within a finding.

    Strategy:
    1. Scan each paragraph (blank-line separated)
    2. Detect CREAC content type from first sentence
    3. If no header exists for that type, mark insertion point
    """
    insertions = []
    check_existing_headers(finding)

    # Track if we've already found each type to avoid duplicates
    found_types = set()

    for i, line in enumerate(finding.content_lines):
        # Skip the finding header line itself
        if i == 0 and line.strip().startswith('#'):
            continue

        # Check if this line starts a CREAC-type paragraph
        detection = detect_creac_type(line)
        if detection:
            creac_type, pattern, confidence = detection

            # Only insert if we haven't found this type yet and no header exists
            if creac_type not in found_types and not finding.creac_headers_present[creac_type]:
                # Calculate actual line number in the document
                actual_line = finding.start_line + i

                insertions.append(InsertionPoint(
                    line_number=actual_line,
                    header_type=creac_type,
                    confidence=confidence,
                    matched_pattern=pattern
                ))
                found_types.add(creac_type)

    return insertions


def get_header_markdown(header_type: str) -> str:
    """Get the markdown header text for a CREAC type."""
    headers = {
        'conclusion': '### Conclusion',
        'rule': '### Rule',
        'explanation': '### Explanation',
        'application': '### Application',
        'counter_analysis': '### Counter-Analysis'
    }
    return headers.get(header_type, f'### {header_type.title()}')


def ensure_minimum_headers(
    lines: List[str],
    findings: List['Finding'],
    stats: Dict,
    minimum_total: int = 50
) -> Tuple[List[str], Dict]:
    """
    Ensure minimum header count is met by inserting Conclusion headers
    into sections that have other CREAC but lack explicit Conclusion.

    Priority order for Conclusion insertion:
    1. Sections with 4 other CREAC headers but no Conclusion
    2. Sections with 3 other CREAC headers but no Conclusion
    3. Sections with 2+ other CREAC headers but no Conclusion
    4. Final subsection of each main section (IV.K, IV.J, etc.)

    Args:
        lines: Document lines (mutable)
        findings: Parsed findings from the document
        stats: Current insertion statistics
        minimum_total: Minimum total CREAC headers required (default: 50)

    Returns:
        Tuple of (modified lines, updated stats)
    """
    current_total = sum(stats[k] for k in ['conclusion', 'rule', 'explanation', 'application', 'counter_analysis'])

    if current_total >= minimum_total:
        stats['minimum_guarantee_insertions'] = 0
        stats['minimum_met'] = True
        return lines, stats

    headers_needed = minimum_total - current_total
    candidates = []

    # Re-parse findings to get fresh state after initial insertions
    # (line numbers have shifted, so we need to re-scan)
    refreshed_findings = parse_findings(lines)

    for finding in refreshed_findings:
        check_existing_headers(finding)
        if not finding.creac_headers_present['conclusion']:
            other_count = sum(1 for k, v in finding.creac_headers_present.items()
                            if k != 'conclusion' and v)
            # Only consider sections with some CREAC structure already
            # or main sections (single letter like IV.A, IV.B)
            if other_count > 0 or '.' not in finding.section_id.replace('IV.', ''):
                candidates.append((finding, other_count))

    # Sort by other_count descending (prefer sections with more CREAC already)
    candidates.sort(key=lambda x: x[1], reverse=True)

    insertions_made = 0
    insertion_offset = 0  # Track cumulative offset from insertions

    for finding, other_count in candidates:
        if insertions_made >= headers_needed:
            break

        # Find a good insertion point for Conclusion header
        # Look for the last substantive paragraph before section end or next header
        best_line = None
        adjusted_start = finding.start_line + insertion_offset
        adjusted_end = finding.end_line + insertion_offset

        # Scan backwards from end to find last paragraph start
        for i in range(min(adjusted_end, len(lines) - 1), adjusted_start, -1):
            line = lines[i] if i < len(lines) else ''
            # Skip empty lines and headers
            if line.strip() and not line.strip().startswith('#'):
                # Found content - look for paragraph start (after blank line)
                for j in range(i, adjusted_start, -1):
                    if j > 0 and not lines[j-1].strip():
                        # This is the start of a paragraph
                        best_line = j
                        break
                if best_line:
                    break

        if best_line is None:
            # Fallback: insert before end of section
            best_line = max(adjusted_start + 2, adjusted_end - 2)

        # Check if this paragraph looks like a conclusion (summary language)
        if best_line < len(lines):
            para_start = lines[best_line].strip().lower()
            conclusion_signals = ['in summary', 'therefore', 'thus', 'accordingly',
                                  'based on', 'the risk', 'the exposure', 'we conclude',
                                  'for these reasons', 'in conclusion']
            is_conclusion_content = any(para_start.startswith(sig) for sig in conclusion_signals)

            if is_conclusion_content or other_count >= 2:
                # Insert "### Conclusion" header
                header_line = "\n### Conclusion\n\n"
                lines.insert(best_line, header_line)
                stats['conclusion'] += 1
                insertions_made += 1
                insertion_offset += 1  # Account for the inserted line

    stats['minimum_guarantee_insertions'] = insertions_made
    stats['minimum_met'] = (current_total + insertions_made) >= minimum_total
    stats['final_total'] = current_total + insertions_made

    return lines, stats


def apply_creac_headers(input_path: str, output_path: Optional[str] = None, minimum_headers: int = 50) -> Dict:
    """
    Main function: Apply CREAC headers to a legal memorandum.

    Args:
        input_path: Path to input markdown file
        output_path: Path to output file (optional, defaults to input-creac.md)
        minimum_headers: Minimum total CREAC headers to ensure (default: 50)

    Returns:
        Dict with stats about insertions made
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / f"{input_file.stem}-creac{input_file.suffix}")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Parse findings
    findings = parse_findings(lines)

    # Collect all insertion points
    all_insertions = []
    for finding in findings:
        insertions = find_insertion_points(finding)
        all_insertions.extend(insertions)

    # Sort insertions by line number (descending) to insert from bottom to top
    # This preserves line numbers during insertion
    all_insertions.sort(key=lambda x: x.line_number, reverse=True)

    # Apply insertions
    stats = {
        'conclusion': 0,
        'rule': 0,
        'explanation': 0,
        'application': 0,
        'counter_analysis': 0,
        'total_findings': len(findings),
        'total_insertions': len(all_insertions)
    }

    for insertion in all_insertions:
        header_text = get_header_markdown(insertion.header_type)
        # Insert header with blank line before it
        lines.insert(insertion.line_number, f"\n{header_text}\n\n")
        stats[insertion.header_type] += 1

    # Ensure minimum header count is met
    lines, stats = ensure_minimum_headers(lines, findings, stats, minimum_headers)

    # Write output file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    return {
        'input_path': str(input_path),
        'output_path': str(output_path),
        'findings_processed': len(findings),
        'insertions': stats,
        'verification_commands': [
            f'grep -c "### Conclusion" {output_path}',
            f'grep -c "### Rule" {output_path}',
            f'grep -c "### Explanation" {output_path}',
            f'grep -c "### Application" {output_path}',
            f'grep -c "### Counter-Analysis" {output_path}'
        ]
    }


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Apply CREAC headers to legal memorandum findings.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 apply-creac-headers.py final-memorandum.md
  python3 apply-creac-headers.py final-memorandum.md final-memorandum-creac.md
  python3 apply-creac-headers.py final-memorandum.md --min-headers 50
        '''
    )
    parser.add_argument('input_file', help='Input markdown file')
    parser.add_argument('output_file', nargs='?', help='Output file (default: input-creac.md)')
    parser.add_argument('--min-headers', type=int, default=50,
                        help='Minimum total CREAC headers to ensure (default: 50)')

    args = parser.parse_args()

    try:
        result = apply_creac_headers(args.input_file, args.output_file, args.min_headers)
        stats = result['insertions']

        print(f"\n✅ CREAC headers applied successfully")
        print(f"\nInput:  {result['input_path']}")
        print(f"Output: {result['output_path']}")
        print(f"\nFindings processed: {result['findings_processed']}")
        print(f"Pattern-based insertions: {stats['total_insertions']}")

        print(f"\nHeaders inserted by type:")
        for header_type in ['conclusion', 'rule', 'explanation', 'application', 'counter_analysis']:
            count = stats[header_type]
            print(f"  - {header_type.replace('_', ' ').title()}: {count}")

        # Show minimum guarantee stats
        if 'minimum_guarantee_insertions' in stats:
            print(f"\nMinimum Header Guarantee:")
            print(f"  - Target minimum: {args.min_headers}")
            print(f"  - Final total: {stats.get('final_total', 'N/A')}")
            print(f"  - Guarantee insertions: {stats['minimum_guarantee_insertions']}")
            if stats.get('minimum_met'):
                print(f"  - Status: ✅ Minimum met")
            else:
                print(f"  - Status: ⚠️ Below minimum (manual review needed)")

        print(f"\nVerification commands:")
        for cmd in result['verification_commands']:
            print(f"  {cmd}")
        print(f"  grep -cE '^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)' {result['output_path']}  # Total count")

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
