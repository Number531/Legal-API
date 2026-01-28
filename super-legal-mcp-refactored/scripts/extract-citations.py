#!/usr/bin/env python3
"""
Citation Extraction and Normalization Script

Purpose: Extract all citations from legal memoranda, normalize to Bluebook 22nd edition
format, score confidence, and generate sequential renumbering map.

Part of hybrid workflow: Script extracts deterministically, agent validates semantically.

Usage:
    python3 scripts/extract-citations.py <memorandum_path> [output_path]

    If output_path is omitted, writes to citation-registry.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~2 seconds for 1MB file

Output:
    citation-registry.json containing:
    - All citations with line numbers and types
    - Normalized Bluebook format
    - Sequential renumbering map (old footnote -> new number)
    - Low-confidence citations flagged for review
    - *Id.* and *supra* reference tracking

Exit Codes:
    0 = All citations processed successfully
    1 = Low-confidence citations detected (review recommended)
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
# ENUMS AND DATA CLASSES
# ============================================

class CitationType(Enum):
    """Types of legal citations."""
    CASE = "case"
    STATUTE = "statute"
    REGULATION = "regulation"
    SEC_FILING = "sec_filing"
    COURT_FILING = "court_filing"
    SHORT_FORM = "short_form"
    ID_REFERENCE = "id_reference"
    SUPRA_REFERENCE = "supra_reference"
    TREATY = "treaty"
    LEGISLATIVE_HISTORY = "legislative_history"
    SECONDARY_SOURCE = "secondary_source"
    UNKNOWN = "unknown"


@dataclass
class Citation:
    """Represents an extracted citation."""
    id: str                                  # "CIT-001"
    original_text: str                       # Raw text from document
    normalized_text: str                     # Bluebook format
    citation_type: str                       # CitationType value
    line_number: int                         # Line in source document
    footnote_number: Optional[int]           # Original footnote number if applicable
    new_sequence_number: int                 # Sequential renumbering
    confidence: float                        # 0.0-1.0 scoring
    pincite: Optional[str]                   # Page/paragraph reference
    components: Dict[str, str] = field(default_factory=dict)  # Parsed parts
    verification_tag: Optional[str] = None   # [VERIFIED:...], [ASSUMED:...], etc.
    references_citation: Optional[str] = None  # For *Id.* and *supra* - which citation it references


# ============================================
# CITATION PATTERNS (10+ Variations)
# ============================================

CITATION_PATTERNS = {
    # Case citations: Party v. Party, Vol Reporter Page (Court Year)
    'case_full': re.compile(
        r'(?:\*)?([A-Z][A-Za-z\'\.\s]+)\s+v\.\s+([A-Z][A-Za-z\'\.\s]+?)(?:\*)?,?\s*'
        r'(\d+)\s+([A-Z][A-Za-z\.]+(?:\s+\d+[a-z]+)?)\s+(\d+)(?:,?\s*(\d+(?:-\d+)?))?'
        r'(?:\s*\(([^)]+)\))?',
        re.IGNORECASE
    ),

    # Case short form: *Party*, Vol Reporter at Page
    'case_short': re.compile(
        r'(?:\*)?([A-Z][A-Za-z\'\s]+)(?:\*)?,?\s*(\d+)\s+([A-Z][A-Za-z\.]+)\s+at\s+(\d+(?:-\d+)?)',
        re.IGNORECASE
    ),

    # Federal statute: 42 U.S.C. S 1983
    'statute_usc': re.compile(
        r'(\d+)\s+U\.?S\.?C\.?\s*[S\u00A7\xA7]?\s*(\d+[a-z]?)(?:\(([^)]+)\))?',
        re.IGNORECASE
    ),

    # State statute: N.Y. Bus. Corp. Law S 1104
    'statute_state': re.compile(
        r'([A-Z][A-Za-z\.]+(?:\s+[A-Z][A-Za-z\.]+)*)\s+[S\u00A7\xA7]\s*(\d+[a-z]?)(?:\(([^)]+)\))?',
        re.IGNORECASE
    ),

    # Federal regulation: 17 C.F.R. S 240.10b-5
    'regulation_cfr': re.compile(
        r'(\d+)\s+C\.?F\.?R\.?\s*[S\u00A7\xA7]?\s*(\d+(?:\.\d+[a-z]?(?:-\d+)?)?)',
        re.IGNORECASE
    ),

    # SEC filing: Form 10-K at 45
    'sec_filing': re.compile(
        r'Form\s+(10-[KQ]|8-K|S-[14]|DEF\s*14A|[A-Z0-9-]+)'
        r'(?:\s+(?:at|p\.|page)\s*(\d+(?:-\d+)?))?',
        re.IGNORECASE
    ),

    # Court filing: Docket No. 1:24-cv-01234, Doc. 45
    'court_filing': re.compile(
        r'(?:Docket\s+)?(?:No\.?\s*)?(\d+:\d+-[a-z]{2}-\d+)'
        r'(?:,?\s*(?:Doc\.|ECF\s+No\.|Dkt\.)\s*(\d+))?',
        re.IGNORECASE
    ),

    # *Id.* reference: *Id.* at 68
    'id_reference': re.compile(
        r'\*?[Ii]d\.?\*?(?:\s+at\s+(\d+(?:-\d+)?))?',
        re.IGNORECASE
    ),

    # *Supra* reference: See supra note 12
    'supra_reference': re.compile(
        r'[Ss]ee\s+\*?supra\*?\s+(?:note\s+)?(\d+)',
        re.IGNORECASE
    ),

    # Treaty: Treaty of [Name], art. [X]
    'treaty': re.compile(
        r'Treaty\s+(?:of\s+)?([A-Z][A-Za-z\s]+),?\s*art\.\s*(\d+|[IVXLC]+)',
        re.IGNORECASE
    ),

    # Legislative history: S. Rep. No. 94-1310
    'legislative_history': re.compile(
        r'([SH]\.?\s*Rep\.|H\.R\.|S\.)\s*(?:No\.?\s*)?(\d+-\d+)',
        re.IGNORECASE
    ),

    # Secondary source: Author, Title, Vol Journal Page (Year)
    'secondary_source': re.compile(
        r'([A-Z][a-z]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+)?),\s*'
        r'(?:\*)?(.+?)(?:\*)?,?\s*(\d+)\s+([A-Z][A-Za-z\.\s]+)\s+(\d+)'
        r'(?:,?\s*(\d+))?\s*\((\d{4})\)',
        re.IGNORECASE
    ),
}

# Footnote pattern to extract footnote numbers
FOOTNOTE_PATTERN = re.compile(r'\[\^?(\d+)\]|\[(\d+)\]|<sup>(\d+)</sup>')

# Verification tag pattern
VERIFICATION_TAG_PATTERN = re.compile(
    r'\[(VERIFIED|INFERRED|ASSUMED|UNVERIFIED):[^\]]+\]',
    re.IGNORECASE
)


# ============================================
# NORMALIZATION FUNCTIONS
# ============================================

def normalize_case_citation(match: re.Match, citation_type: str) -> Tuple[str, Dict[str, str], float]:
    """Normalize case citation to Bluebook format."""
    components = {}
    confidence = 1.0

    if citation_type == 'case_full':
        party1, party2, volume, reporter, page, pincite, court_year = match.groups()
        components = {
            'party1': party1.strip() if party1 else '',
            'party2': party2.strip() if party2 else '',
            'volume': volume,
            'reporter': reporter,
            'page': page,
            'pincite': pincite,
            'court_year': court_year
        }

        # Build normalized citation
        normalized = f"*{party1.strip()} v. {party2.strip()}*, {volume} {reporter} {page}"
        if pincite:
            normalized += f", {pincite}"
        if court_year:
            normalized += f" ({court_year})"

        # Confidence scoring
        if not court_year:
            confidence -= 0.2
        if not pincite:
            confidence -= 0.1

    elif citation_type == 'case_short':
        party, volume, reporter, pincite = match.groups()
        components = {
            'party': party.strip() if party else '',
            'volume': volume,
            'reporter': reporter,
            'pincite': pincite
        }
        normalized = f"*{party.strip()}*, {volume} {reporter} at {pincite}"
        confidence = 0.95  # Short forms are slightly less certain
    else:
        normalized = match.group(0)
        confidence = 0.7

    return normalized, components, confidence


def normalize_statute_citation(match: re.Match, citation_type: str) -> Tuple[str, Dict[str, str], float]:
    """Normalize statute citation to Bluebook format."""
    components = {}
    confidence = 1.0

    if citation_type == 'statute_usc':
        title, section, subsection = match.groups()
        components = {
            'title': title,
            'section': section,
            'subsection': subsection
        }
        normalized = f"{title} U.S.C. \u00A7 {section}"
        if subsection:
            normalized += f"({subsection})"
        confidence = 1.0

    elif citation_type == 'statute_state':
        code_name, section, subsection = match.groups()
        components = {
            'code': code_name,
            'section': section,
            'subsection': subsection
        }
        normalized = f"{code_name} \u00A7 {section}"
        if subsection:
            normalized += f"({subsection})"
        confidence = 0.9  # State statutes vary more
    else:
        normalized = match.group(0)
        confidence = 0.7

    return normalized, components, confidence


def normalize_regulation_citation(match: re.Match) -> Tuple[str, Dict[str, str], float]:
    """Normalize CFR citation to Bluebook format."""
    title, section = match.groups()
    components = {
        'title': title,
        'section': section
    }
    normalized = f"{title} C.F.R. \u00A7 {section}"
    return normalized, components, 1.0


def normalize_sec_filing(match: re.Match) -> Tuple[str, Dict[str, str], float]:
    """Normalize SEC filing citation."""
    form_type, page = match.groups()
    components = {
        'form_type': form_type,
        'page': page
    }
    normalized = f"Form {form_type}"
    if page:
        normalized += f" at {page}"
        confidence = 1.0
    else:
        confidence = 0.8  # Missing page reference
    return normalized, components, confidence


def normalize_court_filing(match: re.Match) -> Tuple[str, Dict[str, str], float]:
    """Normalize court filing citation."""
    docket_no, doc_no = match.groups()
    components = {
        'docket_number': docket_no,
        'document_number': doc_no
    }
    normalized = f"No. {docket_no}"
    if doc_no:
        normalized += f", Doc. {doc_no}"
        confidence = 1.0
    else:
        confidence = 0.85
    return normalized, components, confidence


def normalize_id_reference(match: re.Match) -> Tuple[str, Dict[str, str], float]:
    """Normalize *Id.* reference."""
    pincite = match.group(1)
    components = {'pincite': pincite}
    if pincite:
        normalized = f"*Id.* at {pincite}"
        confidence = 1.0
    else:
        normalized = "*Id.*"
        confidence = 0.95
    return normalized, components, confidence


def normalize_supra_reference(match: re.Match) -> Tuple[str, Dict[str, str], float]:
    """Normalize *supra* reference."""
    note_number = match.group(1)
    components = {'note_number': note_number}
    normalized = f"*See supra* note {note_number}"
    return normalized, components, 1.0


def normalize_citation(match: re.Match, citation_type: str) -> Tuple[str, Dict[str, str], float]:
    """Route to appropriate normalization function."""
    if citation_type in ('case_full', 'case_short'):
        return normalize_case_citation(match, citation_type)
    elif citation_type in ('statute_usc', 'statute_state'):
        return normalize_statute_citation(match, citation_type)
    elif citation_type == 'regulation_cfr':
        return normalize_regulation_citation(match)
    elif citation_type == 'sec_filing':
        return normalize_sec_filing(match)
    elif citation_type == 'court_filing':
        return normalize_court_filing(match)
    elif citation_type == 'id_reference':
        return normalize_id_reference(match)
    elif citation_type == 'supra_reference':
        return normalize_supra_reference(match)
    else:
        # Generic normalization
        return match.group(0), {}, 0.6


def map_citation_type(pattern_name: str) -> str:
    """Map pattern name to CitationType value."""
    type_mapping = {
        'case_full': CitationType.CASE.value,
        'case_short': CitationType.SHORT_FORM.value,
        'statute_usc': CitationType.STATUTE.value,
        'statute_state': CitationType.STATUTE.value,
        'regulation_cfr': CitationType.REGULATION.value,
        'sec_filing': CitationType.SEC_FILING.value,
        'court_filing': CitationType.COURT_FILING.value,
        'id_reference': CitationType.ID_REFERENCE.value,
        'supra_reference': CitationType.SUPRA_REFERENCE.value,
        'treaty': CitationType.TREATY.value,
        'legislative_history': CitationType.LEGISLATIVE_HISTORY.value,
        'secondary_source': CitationType.SECONDARY_SOURCE.value,
    }
    return type_mapping.get(pattern_name, CitationType.UNKNOWN.value)


# ============================================
# EXTRACTION FUNCTIONS
# ============================================

def extract_footnote_number(line: str, line_number: int, context_lines: List[str]) -> Optional[int]:
    """Extract footnote number if this line is a footnote."""
    match = FOOTNOTE_PATTERN.search(line)
    if match:
        # Return first non-None group
        for group in match.groups():
            if group:
                return int(group)
    return None


def extract_verification_tag(line: str) -> Optional[str]:
    """Extract verification tag from line if present."""
    match = VERIFICATION_TAG_PATTERN.search(line)
    if match:
        return match.group(0)
    return None


def extract_citations_from_text(lines: List[str]) -> List[Citation]:
    """
    Extract all citations from document.

    Args:
        lines: Document lines

    Returns:
        List of Citation objects
    """
    citations = []
    citation_count = 0
    last_full_citation = None  # Track for *Id.* references
    footnote_map = {}  # Map footnote numbers to citations for *supra*

    for line_num, line in enumerate(lines, 1):
        # Check for footnote context
        footnote_num = extract_footnote_number(line, line_num, lines)

        # Check for verification tag
        verification_tag = extract_verification_tag(line)

        # Try each pattern
        for pattern_name, pattern in CITATION_PATTERNS.items():
            for match in pattern.finditer(line):
                citation_count += 1

                # Normalize citation
                normalized, components, confidence = normalize_citation(match, pattern_name)

                # Get citation type
                citation_type = map_citation_type(pattern_name)

                # Extract pincite if available
                pincite = components.get('pincite') or components.get('page')

                # Track reference for *Id.* citations
                references = None
                if citation_type == CitationType.ID_REFERENCE.value:
                    if last_full_citation:
                        references = last_full_citation.id
                elif citation_type == CitationType.SUPRA_REFERENCE.value:
                    note_num = components.get('note_number')
                    if note_num and note_num in footnote_map:
                        references = footnote_map[note_num]

                citation = Citation(
                    id=f"CIT-{citation_count:03d}",
                    original_text=match.group(0),
                    normalized_text=normalized,
                    citation_type=citation_type,
                    line_number=line_num,
                    footnote_number=footnote_num,
                    new_sequence_number=citation_count,
                    confidence=confidence,
                    pincite=pincite,
                    components=components,
                    verification_tag=verification_tag,
                    references_citation=references
                )

                citations.append(citation)

                # Track this as last full citation for *Id.* references
                if citation_type in (CitationType.CASE.value, CitationType.STATUTE.value,
                                    CitationType.REGULATION.value):
                    last_full_citation = citation

                # Map footnote for *supra* references
                if footnote_num:
                    footnote_map[str(footnote_num)] = citation.id

    return citations


def build_renumbering_map(citations: List[Citation]) -> Dict[int, int]:
    """
    Build map from original footnote numbers to sequential numbers.

    Args:
        citations: List of extracted citations

    Returns:
        Dict mapping old footnote number to new sequential number
    """
    renumber_map = {}
    seen_footnotes = set()

    for citation in citations:
        if citation.footnote_number and citation.footnote_number not in seen_footnotes:
            renumber_map[citation.footnote_number] = citation.new_sequence_number
            seen_footnotes.add(citation.footnote_number)

    return renumber_map


def extract_citations(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main extraction function.

    Args:
        input_path: Path to memorandum markdown file
        output_path: Path for JSON output (default: citation-registry.json)

    Returns:
        Dict containing extraction results
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "citation-registry.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Extract citations
    citations = extract_citations_from_text(lines)

    # Build renumbering map
    renumber_map = build_renumbering_map(citations)

    # Calculate statistics
    total_citations = len(citations)
    low_confidence = [c for c in citations if c.confidence < 0.7]
    low_confidence_count = len(low_confidence)

    # Group by type
    by_type = {}
    for citation in citations:
        ctype = citation.citation_type
        if ctype not in by_type:
            by_type[ctype] = 0
        by_type[ctype] += 1

    # Track *Id.* and *supra* references
    id_references = [c for c in citations if c.citation_type == CitationType.ID_REFERENCE.value]
    supra_references = [c for c in citations if c.citation_type == CitationType.SUPRA_REFERENCE.value]

    result = {
        'metadata': {
            'source_file': str(input_path),
            'extraction_timestamp': __import__('datetime').datetime.now().isoformat(),
            'script_version': '1.0.0'
        },
        'statistics': {
            'total_citations': total_citations,
            'low_confidence_count': low_confidence_count,
            'citations_by_type': by_type,
            'id_references_count': len(id_references),
            'supra_references_count': len(supra_references),
            'unique_footnotes': len(renumber_map)
        },
        'citations': [asdict(c) for c in citations],
        'low_confidence_citations': [asdict(c) for c in low_confidence],
        'renumbering_map': {str(k): v for k, v in renumber_map.items()},
        'id_reference_chain': [
            {'citation_id': c.id, 'references': c.references_citation}
            for c in id_references
        ],
        'supra_reference_chain': [
            {'citation_id': c.id, 'references': c.references_citation}
            for c in supra_references
        ]
    }

    # Write output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    result['output_file'] = output_path
    return result


# ============================================
# CLI ENTRY POINT
# ============================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Extract and normalize citations from legal memorandum.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 extract-citations.py final-memorandum.md
  python3 extract-citations.py final-memorandum.md citation-registry.json

Exit codes:
  0 = All citations processed (proceed with confidence)
  1 = Low-confidence citations detected (review recommended)
  2 = Script error
        '''
    )
    parser.add_argument('memorandum_path', help='Path to memorandum markdown file')
    parser.add_argument('output_path', nargs='?', help='Output JSON file (default: citation-registry.json)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')

    args = parser.parse_args()

    try:
        result = extract_citations(args.memorandum_path, args.output_path)
        stats = result['statistics']

        # Print summary
        print(f"\nCitation Extraction Complete")
        print("=" * 50)
        print(f"Total citations: {stats['total_citations']}")
        print(f"Low confidence: {stats['low_confidence_count']}")
        print(f"Unique footnotes: {stats['unique_footnotes']}")

        print(f"\nBy type:")
        for ctype, count in stats['citations_by_type'].items():
            print(f"  {ctype}: {count}")

        print(f"\nReference tracking:")
        print(f"  *Id.* references: {stats['id_references_count']}")
        print(f"  *supra* references: {stats['supra_references_count']}")

        if result['low_confidence_citations']:
            print(f"\nLow-confidence citations (review recommended):")
            for lc in result['low_confidence_citations'][:5]:
                print(f"  Line {lc['line_number']}: {lc['original_text'][:60]}... (conf: {lc['confidence']:.2f})")
            if len(result['low_confidence_citations']) > 5:
                print(f"  ... and {len(result['low_confidence_citations']) - 5} more")

        print(f"\nOutput written to: {result['output_file']}")

        # Exit code based on low confidence count
        if stats['low_confidence_count'] > 0:
            print(f"\n[WARNING] {stats['low_confidence_count']} citations require manual review")
            sys.exit(1)
        else:
            print(f"\n[OK] All citations extracted successfully")
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
