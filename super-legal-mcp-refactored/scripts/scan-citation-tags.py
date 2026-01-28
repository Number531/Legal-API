#!/usr/bin/env python3
"""
Citation Verification Tag Scanner

Purpose: Scan memorandum for verification tag coverage, detect gaps,
flag HIGH-severity citations without VERIFIED tags, and calculate QA deductions.

Part of hybrid workflow: Script detects tags deterministically, agent validates semantically.

Usage:
    python3 scripts/scan-citation-tags.py <memorandum_path> [output_path]

    If output_path is omitted, writes to citation-tag-report.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~1 second for 1MB file

Output:
    citation-tag-report.json containing:
    - Coverage percentage by tag type
    - Missing tags list with line numbers
    - HIGH-severity citations with UNVERIFIED status
    - QA deduction calculations per memorandum-qa.md

Exit Codes:
    0 = All checks pass (>= 90% coverage, no HIGH unverified)
    1 = Gaps detected (review recommended)
    2 = Script error
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum


# ============================================
# VERIFICATION TAG DEFINITIONS (from citations.md)
# ============================================

class VerificationTag(Enum):
    """Canonical verification tag types."""
    VERIFIED_URL = "VERIFIED:url"
    VERIFIED_FILING = "VERIFIED:filing"
    INFERRED_PRECEDENT = "INFERRED:precedent"
    ASSUMED_INDUSTRY = "ASSUMED:industry"
    ASSUMED_LEGISLATIVE_INTENT = "ASSUMED:legislative-intent"
    UNVERIFIED_NEEDS_RESEARCH = "UNVERIFIED:needs-research"


# Tag patterns for detection
TAG_PATTERNS = {
    'VERIFIED_URL': re.compile(r'\[VERIFIED:(?:url|Westlaw|PACER|LexisNexis)[^\]]*\]', re.IGNORECASE),
    'VERIFIED_FILING': re.compile(r'\[VERIFIED:(?:filing|EDGAR|SEC)[^\]]*\]', re.IGNORECASE),
    'INFERRED_PRECEDENT': re.compile(r'\[INFERRED:precedent[^\]]*\]', re.IGNORECASE),
    'ASSUMED_INDUSTRY': re.compile(r'\[ASSUMED:industry[^\]]*\]', re.IGNORECASE),
    'ASSUMED_LEGISLATIVE_INTENT': re.compile(r'\[ASSUMED:legislative-intent[^\]]*\]', re.IGNORECASE),
    'UNVERIFIED_NEEDS_RESEARCH': re.compile(r'\[UNVERIFIED:needs-research[^\]]*\]', re.IGNORECASE),
}

# Generic tag pattern (any verification tag)
ANY_TAG_PATTERN = re.compile(
    r'\[(VERIFIED|INFERRED|ASSUMED|UNVERIFIED):[^\]]+\]',
    re.IGNORECASE
)

# Citation patterns to detect citations that need tags
CITATION_INDICATORS = [
    re.compile(r'\d+\s+[A-Z][A-Za-z\.]+\s+\d+'),  # Volume Reporter Page
    re.compile(r'\d+\s+U\.?S\.?C\.?\s*[S\u00A7]'),  # USC citations
    re.compile(r'\d+\s+C\.?F\.?R\.?\s*[S\u00A7]'),  # CFR regulations
    re.compile(r'Form\s+10-[KQ]', re.IGNORECASE),  # SEC filings
    re.compile(r'\*[A-Z][a-z]+\*'),  # Italicized case names
    re.compile(r'v\.\s+[A-Z]'),  # Case name indicators
]

# HIGH severity indicators in risk tables
HIGH_SEVERITY_PATTERN = re.compile(
    r'\|\s*[^|]*\|\s*(?:CRITICAL|HIGH)\s*\|',
    re.IGNORECASE
)


@dataclass
class TagOccurrence:
    """Represents a detected verification tag."""
    tag_type: str
    tag_text: str
    line_number: int
    has_evidence: bool  # Whether tag includes proper evidence (e.g., database ID)
    evidence_quality: str  # 'full', 'partial', 'none'


@dataclass
class UntaggedCitation:
    """Represents a citation without verification tag."""
    line_number: int
    citation_text: str
    nearby_context: str  # Surrounding text for context
    in_high_severity_section: bool


@dataclass
class HighSeverityUnverified:
    """HIGH/CRITICAL finding with UNVERIFIED tag."""
    line_number: int
    finding_description: str
    severity: str
    tag_text: str


# ============================================
# QA DEDUCTION RULES (from memorandum-qa.md)
# ============================================

QA_DEDUCTION_RULES = {
    'missing_tag': {
        'deduction_per_citation': 0.5,  # -0.5% per citation
        'cap': 3.0,  # Maximum -3%
    },
    'high_severity_unverified': {
        'deduction_per_citation': 1.0,  # -1% per citation
        'cap': 2.0,  # Maximum -2%
    },
    'tag_without_evidence': {
        'deduction_per_citation': 0.25,  # -0.25% per citation
        'cap': 1.0,  # Maximum -1%
    },
    'assumed_percentage_threshold': 5.0,  # >5% ASSUMED triggers -1%
    'unverified_hard_fail_threshold': 10.0,  # >10% UNVERIFIED triggers HARD_FAIL
}


# ============================================
# DETECTION FUNCTIONS
# ============================================

def detect_tags(lines: List[str]) -> Dict[str, List[TagOccurrence]]:
    """
    Detect all verification tags in document.

    Returns:
        Dict mapping tag type to list of occurrences
    """
    tags_by_type = {tag_type: [] for tag_type in TAG_PATTERNS.keys()}

    for line_num, line in enumerate(lines, 1):
        for tag_type, pattern in TAG_PATTERNS.items():
            for match in pattern.finditer(line):
                tag_text = match.group(0)

                # Check evidence quality
                has_evidence, evidence_quality = check_tag_evidence(tag_text, tag_type)

                occurrence = TagOccurrence(
                    tag_type=tag_type,
                    tag_text=tag_text,
                    line_number=line_num,
                    has_evidence=has_evidence,
                    evidence_quality=evidence_quality
                )
                tags_by_type[tag_type].append(occurrence)

    return tags_by_type


def check_tag_evidence(tag_text: str, tag_type: str) -> Tuple[bool, str]:
    """
    Check if verification tag has proper evidence.

    Returns:
        Tuple of (has_evidence: bool, evidence_quality: str)
    """
    # Check for database identifiers
    has_id = bool(re.search(r'[A-Z]+-[\d-]+|\d{4}-WL-\d+|\d+-\d+-cv-\d+', tag_text))

    if tag_type in ('VERIFIED_URL', 'VERIFIED_FILING'):
        # VERIFIED tags should have specific record IDs
        if has_id:
            return True, 'full'
        elif ':' in tag_text and tag_text.count('-') >= 1:
            return True, 'partial'
        else:
            return False, 'none'

    elif tag_type.startswith('INFERRED'):
        # INFERRED should have basis description
        if 'precedent-' in tag_text.lower() or 'analogous' in tag_text.lower():
            return True, 'full'
        else:
            return True, 'partial'  # INFERRED is more lenient

    elif tag_type.startswith('ASSUMED'):
        # ASSUMED tags are acceptable without specific evidence
        return True, 'full'

    elif tag_type.startswith('UNVERIFIED'):
        # UNVERIFIED must be marked for follow-up
        return True, 'full'

    return True, 'partial'


def detect_untagged_citations(lines: List[str], tags_by_type: Dict[str, List[TagOccurrence]]) -> List[UntaggedCitation]:
    """
    Find citations that lack verification tags.

    Returns:
        List of untagged citations
    """
    untagged = []

    # Build set of tagged line numbers
    tagged_lines = set()
    for tag_list in tags_by_type.values():
        for tag in tag_list:
            # Consider nearby lines as "tagged"
            for offset in range(-2, 3):
                tagged_lines.add(tag.line_number + offset)

    # Track if we're in a HIGH severity section
    in_high_section = False
    high_section_end = 0

    for line_num, line in enumerate(lines, 1):
        # Check for HIGH severity markers
        if HIGH_SEVERITY_PATTERN.search(line):
            in_high_section = True
            high_section_end = line_num + 20  # Assume HIGH section spans ~20 lines

        if line_num > high_section_end:
            in_high_section = False

        # Skip if line is already tagged
        if line_num in tagged_lines:
            continue

        # Check if line contains citation indicators
        for pattern in CITATION_INDICATORS:
            match = pattern.search(line)
            if match:
                # Check if there's a tag on this line
                if not ANY_TAG_PATTERN.search(line):
                    untagged.append(UntaggedCitation(
                        line_number=line_num,
                        citation_text=match.group(0),
                        nearby_context=line.strip()[:100],
                        in_high_severity_section=in_high_section
                    ))
                break  # Only count once per line

    return untagged


def detect_high_severity_unverified(lines: List[str], tags_by_type: Dict[str, List[TagOccurrence]]) -> List[HighSeverityUnverified]:
    """
    Find HIGH/CRITICAL severity findings that have UNVERIFIED tags.

    Returns:
        List of HIGH/CRITICAL findings with UNVERIFIED status
    """
    high_unverified = []

    # Get all UNVERIFIED tag line numbers
    unverified_lines = {tag.line_number: tag for tag in tags_by_type.get('UNVERIFIED_NEEDS_RESEARCH', [])}

    in_table = False
    current_severity = None

    for line_num, line in enumerate(lines, 1):
        # Detect table rows
        if '|' in line:
            # Check for HIGH/CRITICAL in severity column
            severity_match = re.search(r'\|\s*(CRITICAL|HIGH)\s*\|', line, re.IGNORECASE)
            if severity_match:
                current_severity = severity_match.group(1).upper()

                # Check if there's an UNVERIFIED tag near this line
                for offset in range(-3, 4):
                    check_line = line_num + offset
                    if check_line in unverified_lines:
                        # Extract finding description
                        parts = line.split('|')
                        finding = parts[1].strip() if len(parts) > 1 else line.strip()

                        high_unverified.append(HighSeverityUnverified(
                            line_number=line_num,
                            finding_description=finding[:100],
                            severity=current_severity,
                            tag_text=unverified_lines[check_line].tag_text
                        ))
                        break

    return high_unverified


# ============================================
# QA CALCULATION FUNCTIONS
# ============================================

def calculate_coverage(tags_by_type: Dict[str, List[TagOccurrence]], total_citations: int) -> Dict[str, float]:
    """Calculate coverage percentage by tag type."""
    if total_citations == 0:
        return {tag_type: 100.0 for tag_type in tags_by_type.keys()}

    coverage = {}
    total_tags = sum(len(tags) for tags in tags_by_type.values())

    # Overall coverage
    coverage['overall'] = min(100.0, (total_tags / max(total_citations, 1)) * 100)

    # By type
    for tag_type, tags in tags_by_type.items():
        coverage[tag_type] = len(tags)

    # Calculate VERIFIED vs non-VERIFIED
    verified_count = len(tags_by_type.get('VERIFIED_URL', [])) + len(tags_by_type.get('VERIFIED_FILING', []))
    coverage['verified_percentage'] = (verified_count / max(total_tags, 1)) * 100 if total_tags > 0 else 0

    # Calculate UNVERIFIED percentage
    unverified_count = len(tags_by_type.get('UNVERIFIED_NEEDS_RESEARCH', []))
    coverage['unverified_percentage'] = (unverified_count / max(total_tags, 1)) * 100 if total_tags > 0 else 0

    # Calculate ASSUMED percentage
    assumed_count = len(tags_by_type.get('ASSUMED_INDUSTRY', [])) + len(tags_by_type.get('ASSUMED_LEGISLATIVE_INTENT', []))
    coverage['assumed_percentage'] = (assumed_count / max(total_tags, 1)) * 100 if total_tags > 0 else 0

    return coverage


def calculate_qa_deductions(
    untagged: List[UntaggedCitation],
    high_unverified: List[HighSeverityUnverified],
    tags_by_type: Dict[str, List[TagOccurrence]],
    coverage: Dict[str, float]
) -> Dict:
    """
    Calculate QA deductions per memorandum-qa.md rules.

    Returns:
        Dict with deduction breakdown and totals
    """
    deductions = {
        'missing_tag': {
            'count': len(untagged),
            'raw_deduction': len(untagged) * QA_DEDUCTION_RULES['missing_tag']['deduction_per_citation'],
            'capped_deduction': min(
                len(untagged) * QA_DEDUCTION_RULES['missing_tag']['deduction_per_citation'],
                QA_DEDUCTION_RULES['missing_tag']['cap']
            )
        },
        'high_severity_unverified': {
            'count': len(high_unverified),
            'raw_deduction': len(high_unverified) * QA_DEDUCTION_RULES['high_severity_unverified']['deduction_per_citation'],
            'capped_deduction': min(
                len(high_unverified) * QA_DEDUCTION_RULES['high_severity_unverified']['deduction_per_citation'],
                QA_DEDUCTION_RULES['high_severity_unverified']['cap']
            )
        },
        'tag_without_evidence': {
            'count': 0,
            'raw_deduction': 0.0,
            'capped_deduction': 0.0
        },
        'high_assumed_percentage': {
            'triggered': coverage.get('assumed_percentage', 0) > QA_DEDUCTION_RULES['assumed_percentage_threshold'],
            'deduction': 1.0 if coverage.get('assumed_percentage', 0) > QA_DEDUCTION_RULES['assumed_percentage_threshold'] else 0.0
        },
        'hard_fail_triggered': coverage.get('unverified_percentage', 0) > QA_DEDUCTION_RULES['unverified_hard_fail_threshold']
    }

    # Count tags without proper evidence
    for tag_type, tags in tags_by_type.items():
        for tag in tags:
            if tag.evidence_quality == 'none':
                deductions['tag_without_evidence']['count'] += 1

    deductions['tag_without_evidence']['raw_deduction'] = (
        deductions['tag_without_evidence']['count'] *
        QA_DEDUCTION_RULES['tag_without_evidence']['deduction_per_citation']
    )
    deductions['tag_without_evidence']['capped_deduction'] = min(
        deductions['tag_without_evidence']['raw_deduction'],
        QA_DEDUCTION_RULES['tag_without_evidence']['cap']
    )

    # Calculate total
    deductions['total_deduction'] = (
        deductions['missing_tag']['capped_deduction'] +
        deductions['high_severity_unverified']['capped_deduction'] +
        deductions['tag_without_evidence']['capped_deduction'] +
        deductions['high_assumed_percentage']['deduction']
    )

    return deductions


# ============================================
# MAIN SCAN FUNCTION
# ============================================

def scan_citation_tags(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main scanning function.

    Args:
        input_path: Path to memorandum markdown file
        output_path: Path for JSON output (default: citation-tag-report.json)

    Returns:
        Dict containing scan results
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "citation-tag-report.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Detect tags
    tags_by_type = detect_tags(lines)

    # Count total citations (approximate)
    total_citations = 0
    for line in lines:
        for pattern in CITATION_INDICATORS:
            total_citations += len(pattern.findall(line))

    # Detect untagged citations
    untagged = detect_untagged_citations(lines, tags_by_type)

    # Detect HIGH severity with UNVERIFIED
    high_unverified = detect_high_severity_unverified(lines, tags_by_type)

    # Calculate coverage
    coverage = calculate_coverage(tags_by_type, total_citations)

    # Calculate QA deductions
    qa_deductions = calculate_qa_deductions(untagged, high_unverified, tags_by_type, coverage)

    result = {
        'metadata': {
            'source_file': str(input_path),
            'scan_timestamp': __import__('datetime').datetime.now().isoformat(),
            'script_version': '1.0.0'
        },
        'statistics': {
            'total_citations_detected': total_citations,
            'total_tags_found': sum(len(tags) for tags in tags_by_type.values()),
            'untagged_citations': len(untagged),
            'high_severity_unverified': len(high_unverified)
        },
        'coverage_percentage': coverage.get('overall', 0.0),
        'coverage_by_type': {
            'VERIFIED_URL': len(tags_by_type.get('VERIFIED_URL', [])),
            'VERIFIED_FILING': len(tags_by_type.get('VERIFIED_FILING', [])),
            'INFERRED_PRECEDENT': len(tags_by_type.get('INFERRED_PRECEDENT', [])),
            'ASSUMED_INDUSTRY': len(tags_by_type.get('ASSUMED_INDUSTRY', [])),
            'ASSUMED_LEGISLATIVE_INTENT': len(tags_by_type.get('ASSUMED_LEGISLATIVE_INTENT', [])),
            'UNVERIFIED_NEEDS_RESEARCH': len(tags_by_type.get('UNVERIFIED_NEEDS_RESEARCH', []))
        },
        'coverage_percentages': {
            'verified_percentage': coverage.get('verified_percentage', 0.0),
            'unverified_percentage': coverage.get('unverified_percentage', 0.0),
            'assumed_percentage': coverage.get('assumed_percentage', 0.0)
        },
        'tags_by_type': {
            tag_type: [asdict(tag) for tag in tags]
            for tag_type, tags in tags_by_type.items()
        },
        'untagged_citations': [asdict(u) for u in untagged],
        'high_severity_unverified': [asdict(h) for h in high_unverified],
        'qa_deductions': qa_deductions,
        'triggers_hard_fail': qa_deductions['hard_fail_triggered'],
        'recommendations': generate_recommendations(coverage, untagged, high_unverified, qa_deductions)
    }

    # Write output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    result['output_file'] = output_path
    return result


def generate_recommendations(
    coverage: Dict[str, float],
    untagged: List[UntaggedCitation],
    high_unverified: List[HighSeverityUnverified],
    qa_deductions: Dict
) -> List[str]:
    """Generate actionable recommendations."""
    recommendations = []

    if coverage.get('overall', 100) < 90:
        recommendations.append(
            f"Tag coverage is {coverage.get('overall', 0):.1f}%. Add verification tags to reach 90% threshold."
        )

    if len(untagged) > 0:
        high_priority = [u for u in untagged if u.in_high_severity_section]
        if high_priority:
            recommendations.append(
                f"{len(high_priority)} citations in HIGH-severity sections lack tags. Prioritize these for verification."
            )

    if len(high_unverified) > 0:
        recommendations.append(
            f"{len(high_unverified)} HIGH/CRITICAL findings have UNVERIFIED status. "
            "Research and verify before submission (-1% QA deduction each, max -2%)."
        )

    if qa_deductions['high_assumed_percentage']['triggered']:
        recommendations.append(
            f"ASSUMED tags exceed 5% threshold. Consider converting some to VERIFIED where possible."
        )

    if qa_deductions['hard_fail_triggered']:
        recommendations.append(
            "CRITICAL: UNVERIFIED percentage exceeds 10%. This triggers HARD_FAIL. "
            "Must verify citations before QA can pass."
        )

    return recommendations


# ============================================
# CLI ENTRY POINT
# ============================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Scan memorandum for verification tag coverage.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 scan-citation-tags.py final-memorandum.md
  python3 scan-citation-tags.py final-memorandum.md citation-tag-report.json

Exit codes:
  0 = All checks pass (>= 90% coverage, no HIGH unverified)
  1 = Gaps detected (review recommended)
  2 = Script error
        '''
    )
    parser.add_argument('memorandum_path', help='Path to memorandum markdown file')
    parser.add_argument('output_path', nargs='?', help='Output JSON file (default: citation-tag-report.json)')

    args = parser.parse_args()

    try:
        result = scan_citation_tags(args.memorandum_path, args.output_path)
        stats = result['statistics']
        coverage = result['coverage_percentage']
        qa = result['qa_deductions']

        # Print summary
        print(f"\nCitation Tag Scan Complete")
        print("=" * 50)
        print(f"Total citations detected: {stats['total_citations_detected']}")
        print(f"Total tags found: {stats['total_tags_found']}")
        print(f"Coverage: {coverage:.1f}%")

        print(f"\nTags by type:")
        for tag_type, count in result['coverage_by_type'].items():
            print(f"  {tag_type}: {count}")

        print(f"\nIssues:")
        print(f"  Untagged citations: {stats['untagged_citations']}")
        print(f"  HIGH severity + UNVERIFIED: {stats['high_severity_unverified']}")

        print(f"\nQA Deductions:")
        print(f"  Missing tags: -{qa['missing_tag']['capped_deduction']:.1f}%")
        print(f"  HIGH unverified: -{qa['high_severity_unverified']['capped_deduction']:.1f}%")
        print(f"  Tags without evidence: -{qa['tag_without_evidence']['capped_deduction']:.2f}%")
        print(f"  Total deduction: -{qa['total_deduction']:.1f}%")

        if result['triggers_hard_fail']:
            print(f"\n[HARD_FAIL] UNVERIFIED exceeds 10% - blocking issue!")

        if result['recommendations']:
            print(f"\nRecommendations:")
            for rec in result['recommendations']:
                print(f"  - {rec}")

        print(f"\nOutput written to: {result['output_file']}")

        # Exit code
        if result['triggers_hard_fail'] or coverage < 90 or stats['high_severity_unverified'] > 0:
            sys.exit(1)
        else:
            print(f"\n[OK] Tag coverage acceptable")
            sys.exit(0)

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(2)


if __name__ == '__main__':
    main()
