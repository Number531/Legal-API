#!/usr/bin/env python3
"""
Fact Registry Extraction Script

Purpose: Extract quantified facts from legal memoranda, track source attribution,
detect conflicts across sections, and apply tiebreaker rules per legal-standards.md.

Part of hybrid workflow: Script extracts facts deterministically, agent validates semantically.

Usage:
    python3 scripts/extract-fact-registry.py <memorandum_path> [output_path]

    If output_path is omitted, writes to fact-registry.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~2 seconds for 1MB file

Output:
    fact-registry.json containing:
    - All quantified facts with line numbers and sources
    - Source attribution (EDGAR, Westlaw, PACER, specialist report)
    - Detected conflicts across sections
    - Tiebreaker resolution recommendations

Exit Codes:
    0 = All facts extracted successfully (no conflicts)
    1 = Conflicts detected (review recommended)
    2 = Script error
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import defaultdict


# ============================================
# ENUMS AND DATA CLASSES
# ============================================

class FactType(Enum):
    """Types of quantified facts."""
    DOLLAR_AMOUNT = "dollar_amount"
    PERCENTAGE = "percentage"
    DATE = "date"
    DURATION = "duration"
    COUNT = "count"
    RANGE = "range"


class SourceType(Enum):
    """Source attribution types - ordered by authority."""
    EDGAR = "EDGAR"          # Primary: SEC filings
    PACER = "PACER"          # Primary: Court filings
    WESTLAW = "Westlaw"      # Primary: Legal database
    SPECIALIST = "specialist"  # Secondary: Specialist reports
    ESTIMATE = "estimate"    # Tertiary: Industry estimates
    UNKNOWN = "unknown"


# Source authority hierarchy (higher number = more authoritative)
SOURCE_AUTHORITY = {
    SourceType.EDGAR.value: 100,
    SourceType.PACER.value: 100,
    SourceType.WESTLAW.value: 90,
    SourceType.SPECIALIST.value: 70,
    SourceType.ESTIMATE.value: 50,
    SourceType.UNKNOWN.value: 0,
}


@dataclass
class Fact:
    """Represents an extracted quantified fact."""
    id: str                           # "FACT-001"
    fact_type: str                    # FactType value
    value: str                        # Raw value (e.g., "$45M", "60%")
    normalized_value: Any             # Normalized (e.g., 45000000, 0.60)
    context: str                      # Surrounding text
    line_number: int
    section_id: Optional[str]         # Section reference (e.g., "IV.A")
    source_type: str                  # SourceType value
    source_reference: Optional[str]   # Citation/reference to source
    confidence: str                   # 'HIGH', 'MEDIUM', 'LOW'
    is_range: bool = False            # True if value is a range
    range_low: Optional[float] = None
    range_high: Optional[float] = None


@dataclass
class Conflict:
    """Represents a detected fact conflict."""
    conflict_id: str                  # "CONF-001"
    fact_key: str                     # What fact conflicts (e.g., "deal_value")
    facts_involved: List[str]         # List of Fact IDs
    values: List[str]                 # The conflicting values
    sections: List[str]               # Sections where conflicts occur
    severity: str                     # 'MAJOR', 'MINOR'
    resolution: Optional[str]         # Recommended resolution
    tiebreaker_applied: str           # Which tiebreaker rule was applied


# ============================================
# EXTRACTION PATTERNS
# ============================================

FACT_PATTERNS = {
    # Dollar amounts: $45M, $1.2B, $45,000,000
    'dollar_amount': re.compile(
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([MBKmillion|billion|thousand]*)',
        re.IGNORECASE
    ),

    # Dollar ranges: $45M-$50M, $45M to $50M
    'dollar_range': re.compile(
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([MBK]?)\s*[-–—to]+\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([MBK]?)',
        re.IGNORECASE
    ),

    # Percentages: 60%, 60-75%
    'percentage': re.compile(
        r'(\d{1,3}(?:\.\d+)?)\s*%(?:\s*[-–—to]+\s*(\d{1,3}(?:\.\d+)?)\s*%)?',
        re.IGNORECASE
    ),

    # Dates: January 15, 2026, FY2024, 01/15/2026
    'date': re.compile(
        r'(?:FY\s*)?(\d{4})|'
        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})|'
        r'(\d{1,2})/(\d{1,2})/(\d{4})',
        re.IGNORECASE
    ),

    # Durations: 3-year, 18 months, 24-month period
    'duration': re.compile(
        r'(\d+)\s*[-–]?\s*(year|month|day|week)s?(?:\s+period)?',
        re.IGNORECASE
    ),

    # Counts: 500 employees, 12 subsidiaries
    'count': re.compile(
        r'(\d{1,3}(?:,\d{3})*)\s+(employees?|subsidiaries|contracts?|agreements?|shareholders?|'
        r'facilities|properties|patents?|trademarks?|locations?|entities|claims?)',
        re.IGNORECASE
    ),
}

# Section header pattern
SECTION_PATTERN = re.compile(
    r'^#+\s*(?:Section\s+)?(IV\.)?([A-Z])(?:\.(\d+))?\.?\s*(.*)$',
    re.IGNORECASE | re.MULTILINE
)

# Source attribution patterns
SOURCE_PATTERNS = {
    'EDGAR': re.compile(r'(?:EDGAR|Form\s+10-[KQ]|SEC\s+filing|CIK)', re.IGNORECASE),
    'PACER': re.compile(r'(?:PACER|Docket|ECF|Case\s+No\.)', re.IGNORECASE),
    'Westlaw': re.compile(r'(?:Westlaw|WL|LexisNexis)', re.IGNORECASE),
    'specialist': re.compile(r'(?:specialist|analyst|report)', re.IGNORECASE),
    'estimate': re.compile(r'(?:estimate|approximately|roughly|about)', re.IGNORECASE),
}


# ============================================
# NORMALIZATION FUNCTIONS
# ============================================

def normalize_dollar_amount(value_str: str, suffix: str) -> float:
    """Convert dollar string to numeric value."""
    # Remove commas
    value = float(value_str.replace(',', ''))

    # Apply suffix multiplier
    suffix_lower = suffix.lower() if suffix else ''
    if suffix_lower in ('m', 'million'):
        value *= 1_000_000
    elif suffix_lower in ('b', 'billion'):
        value *= 1_000_000_000
    elif suffix_lower in ('k', 'thousand'):
        value *= 1_000

    return value


def normalize_percentage(value_str: str) -> float:
    """Convert percentage string to decimal."""
    return float(value_str) / 100


def detect_source_type(line: str, context_lines: List[str], line_num: int) -> Tuple[str, Optional[str]]:
    """Detect source attribution from surrounding context."""
    # Check current line and nearby lines
    check_range = range(max(0, line_num - 3), min(len(context_lines), line_num + 3))
    context_text = ' '.join(context_lines[i] if i < len(context_lines) else '' for i in check_range)

    for source_type, pattern in SOURCE_PATTERNS.items():
        if pattern.search(context_text):
            # Try to extract specific reference
            ref_match = pattern.search(context_text)
            return source_type, ref_match.group(0) if ref_match else None

    return SourceType.UNKNOWN.value, None


def determine_confidence(source_type: str, has_citation: bool) -> str:
    """Determine confidence level based on source and citation presence."""
    if source_type in (SourceType.EDGAR.value, SourceType.PACER.value, SourceType.WESTLAW.value):
        return 'HIGH' if has_citation else 'MEDIUM'
    elif source_type == SourceType.SPECIALIST.value:
        return 'MEDIUM'
    else:
        return 'LOW'


# ============================================
# EXTRACTION FUNCTIONS
# ============================================

def extract_section_id(lines: List[str], line_num: int) -> Optional[str]:
    """Find the section ID for a given line."""
    # Search backwards for section header
    for i in range(line_num - 1, max(0, line_num - 100), -1):
        match = SECTION_PATTERN.match(lines[i])
        if match:
            prefix = match.group(1) or 'IV.'
            letter = match.group(2)
            number = match.group(3)
            section_id = f"{prefix}{letter}"
            if number:
                section_id += f".{number}"
            return section_id
    return None


def extract_facts_from_text(lines: List[str]) -> List[Fact]:
    """
    Extract all quantified facts from document.

    Args:
        lines: Document lines

    Returns:
        List of Fact objects
    """
    facts = []
    fact_count = 0

    for line_num, line in enumerate(lines):
        # Extract dollar ranges first (more specific)
        for match in FACT_PATTERNS['dollar_range'].finditer(line):
            fact_count += 1
            low_val, low_suffix, high_val, high_suffix = match.groups()

            normalized_low = normalize_dollar_amount(low_val, low_suffix)
            normalized_high = normalize_dollar_amount(high_val, high_suffix or low_suffix)

            source_type, source_ref = detect_source_type(line, lines, line_num)
            has_citation = bool(re.search(r'\[.*?\]|\(.*?citation.*?\)', line, re.IGNORECASE))

            facts.append(Fact(
                id=f"FACT-{fact_count:03d}",
                fact_type=FactType.DOLLAR_AMOUNT.value,
                value=match.group(0),
                normalized_value={'low': normalized_low, 'high': normalized_high},
                context=line.strip()[:150],
                line_number=line_num + 1,
                section_id=extract_section_id(lines, line_num),
                source_type=source_type,
                source_reference=source_ref,
                confidence=determine_confidence(source_type, has_citation),
                is_range=True,
                range_low=normalized_low,
                range_high=normalized_high
            ))

        # Extract single dollar amounts (skip if already captured as range)
        range_positions = {m.start() for m in FACT_PATTERNS['dollar_range'].finditer(line)}
        for match in FACT_PATTERNS['dollar_amount'].finditer(line):
            if match.start() in range_positions:
                continue

            fact_count += 1
            val, suffix = match.groups()
            normalized = normalize_dollar_amount(val, suffix)

            source_type, source_ref = detect_source_type(line, lines, line_num)
            has_citation = bool(re.search(r'\[.*?\]|\(.*?citation.*?\)', line, re.IGNORECASE))

            facts.append(Fact(
                id=f"FACT-{fact_count:03d}",
                fact_type=FactType.DOLLAR_AMOUNT.value,
                value=match.group(0),
                normalized_value=normalized,
                context=line.strip()[:150],
                line_number=line_num + 1,
                section_id=extract_section_id(lines, line_num),
                source_type=source_type,
                source_reference=source_ref,
                confidence=determine_confidence(source_type, has_citation)
            ))

        # Extract percentages
        for match in FACT_PATTERNS['percentage'].finditer(line):
            fact_count += 1
            val, high_val = match.groups()

            source_type, source_ref = detect_source_type(line, lines, line_num)
            has_citation = bool(re.search(r'\[.*?\]', line))

            is_range = high_val is not None
            if is_range:
                normalized = {
                    'low': normalize_percentage(val),
                    'high': normalize_percentage(high_val)
                }
                range_low = normalize_percentage(val)
                range_high = normalize_percentage(high_val)
            else:
                normalized = normalize_percentage(val)
                range_low = None
                range_high = None

            facts.append(Fact(
                id=f"FACT-{fact_count:03d}",
                fact_type=FactType.PERCENTAGE.value,
                value=match.group(0),
                normalized_value=normalized,
                context=line.strip()[:150],
                line_number=line_num + 1,
                section_id=extract_section_id(lines, line_num),
                source_type=source_type,
                source_reference=source_ref,
                confidence=determine_confidence(source_type, has_citation),
                is_range=is_range,
                range_low=range_low,
                range_high=range_high
            ))

        # Extract dates
        for match in FACT_PATTERNS['date'].finditer(line):
            fact_count += 1
            source_type, source_ref = detect_source_type(line, lines, line_num)

            facts.append(Fact(
                id=f"FACT-{fact_count:03d}",
                fact_type=FactType.DATE.value,
                value=match.group(0),
                normalized_value=match.group(0),
                context=line.strip()[:150],
                line_number=line_num + 1,
                section_id=extract_section_id(lines, line_num),
                source_type=source_type,
                source_reference=source_ref,
                confidence=determine_confidence(source_type, False)
            ))

        # Extract durations
        for match in FACT_PATTERNS['duration'].finditer(line):
            fact_count += 1
            amount, unit = match.groups()
            source_type, source_ref = detect_source_type(line, lines, line_num)

            facts.append(Fact(
                id=f"FACT-{fact_count:03d}",
                fact_type=FactType.DURATION.value,
                value=match.group(0),
                normalized_value={'amount': int(amount), 'unit': unit.lower()},
                context=line.strip()[:150],
                line_number=line_num + 1,
                section_id=extract_section_id(lines, line_num),
                source_type=source_type,
                source_reference=source_ref,
                confidence=determine_confidence(source_type, False)
            ))

        # Extract counts
        for match in FACT_PATTERNS['count'].finditer(line):
            fact_count += 1
            amount, entity = match.groups()
            source_type, source_ref = detect_source_type(line, lines, line_num)

            facts.append(Fact(
                id=f"FACT-{fact_count:03d}",
                fact_type=FactType.COUNT.value,
                value=match.group(0),
                normalized_value={'count': int(amount.replace(',', '')), 'entity': entity.lower()},
                context=line.strip()[:150],
                line_number=line_num + 1,
                section_id=extract_section_id(lines, line_num),
                source_type=source_type,
                source_reference=source_ref,
                confidence=determine_confidence(source_type, False)
            ))

    return facts


# ============================================
# CONFLICT DETECTION
# ============================================

def generate_fact_key(fact: Fact) -> str:
    """Generate a key for grouping similar facts for conflict detection."""
    # Create key based on type and context keywords
    context_lower = fact.context.lower()

    # Extract key terms
    key_terms = []
    if 'deal' in context_lower or 'acquisition' in context_lower or 'purchase' in context_lower:
        key_terms.append('deal_value')
    elif 'employee' in context_lower:
        key_terms.append('employee_count')
    elif 'exposure' in context_lower or 'liability' in context_lower:
        key_terms.append('exposure')
    elif 'closing' in context_lower:
        key_terms.append('closing_date')
    elif 'aum' in context_lower or 'asset' in context_lower:
        key_terms.append('aum')

    if key_terms:
        return f"{fact.fact_type}:{key_terms[0]}"
    return f"{fact.fact_type}:{fact.section_id or 'unknown'}"


def values_conflict(fact1: Fact, fact2: Fact) -> bool:
    """Determine if two facts have conflicting values."""
    # Same section = not a conflict (same fact repeated)
    if fact1.section_id == fact2.section_id:
        return False

    # Handle ranges
    if fact1.is_range and not fact2.is_range:
        # Point value within range = not a conflict
        if isinstance(fact2.normalized_value, (int, float)):
            if fact1.range_low <= fact2.normalized_value <= fact1.range_high:
                return False
        return True

    if fact2.is_range and not fact1.is_range:
        if isinstance(fact1.normalized_value, (int, float)):
            if fact2.range_low <= fact1.normalized_value <= fact2.range_high:
                return False
        return True

    # Both ranges
    if fact1.is_range and fact2.is_range:
        # Overlapping ranges = not a conflict
        if fact1.range_low <= fact2.range_high and fact2.range_low <= fact1.range_high:
            return False
        return True

    # Both point values - compare with tolerance
    if isinstance(fact1.normalized_value, (int, float)) and isinstance(fact2.normalized_value, (int, float)):
        tolerance = 0.05  # 5% tolerance
        if fact1.normalized_value == 0 or fact2.normalized_value == 0:
            return fact1.normalized_value != fact2.normalized_value
        ratio = abs(fact1.normalized_value - fact2.normalized_value) / max(abs(fact1.normalized_value), abs(fact2.normalized_value))
        return ratio > tolerance

    # String comparison for dates, etc.
    return str(fact1.normalized_value) != str(fact2.normalized_value)


def apply_tiebreaker(facts: List[Fact]) -> Tuple[Fact, str]:
    """
    Apply tiebreaker rules per legal-standards.md.

    Tiebreaker hierarchy:
    1. Most recent iteration wins
    2. Higher confidence wins
    3. Primary source wins (EDGAR > specialist > estimate)

    Returns:
        Tuple of (winning fact, tiebreaker rule applied)
    """
    if len(facts) == 1:
        return facts[0], "single_value"

    # Sort by authority (higher = better)
    facts_with_score = []
    for fact in facts:
        score = SOURCE_AUTHORITY.get(fact.source_type, 0)
        # Add confidence bonus
        if fact.confidence == 'HIGH':
            score += 30
        elif fact.confidence == 'MEDIUM':
            score += 15
        # Later line numbers = more recent
        score += fact.line_number / 10000

        facts_with_score.append((fact, score))

    facts_with_score.sort(key=lambda x: x[1], reverse=True)
    winner = facts_with_score[0][0]

    # Determine which rule was applied
    if winner.source_type in (SourceType.EDGAR.value, SourceType.PACER.value):
        rule = "primary_source_wins"
    elif winner.confidence == 'HIGH':
        rule = "higher_confidence_wins"
    else:
        rule = "most_recent_wins"

    return winner, rule


def detect_conflicts(facts: List[Fact]) -> List[Conflict]:
    """
    Detect conflicts across facts.

    Returns:
        List of detected conflicts
    """
    conflicts = []
    conflict_count = 0

    # Group facts by key
    fact_groups = defaultdict(list)
    for fact in facts:
        key = generate_fact_key(fact)
        fact_groups[key].append(fact)

    # Check each group for conflicts
    for key, group_facts in fact_groups.items():
        if len(group_facts) < 2:
            continue

        # Compare all pairs
        conflicting_facts = []
        for i, fact1 in enumerate(group_facts):
            for fact2 in group_facts[i+1:]:
                if values_conflict(fact1, fact2):
                    if fact1 not in conflicting_facts:
                        conflicting_facts.append(fact1)
                    if fact2 not in conflicting_facts:
                        conflicting_facts.append(fact2)

        if conflicting_facts:
            conflict_count += 1

            # Apply tiebreaker
            winner, rule = apply_tiebreaker(conflicting_facts)

            # Determine severity
            max_diff = 0
            for fact in conflicting_facts:
                if isinstance(fact.normalized_value, (int, float)) and isinstance(winner.normalized_value, (int, float)):
                    diff = abs(fact.normalized_value - winner.normalized_value)
                    if winner.normalized_value != 0:
                        diff_pct = diff / abs(winner.normalized_value)
                        max_diff = max(max_diff, diff_pct)

            severity = 'MAJOR' if max_diff > 0.1 else 'MINOR'  # >10% difference = MAJOR

            conflicts.append(Conflict(
                conflict_id=f"CONF-{conflict_count:03d}",
                fact_key=key,
                facts_involved=[f.id for f in conflicting_facts],
                values=[f.value for f in conflicting_facts],
                sections=[f.section_id or 'unknown' for f in conflicting_facts],
                severity=severity,
                resolution=f"Use {winner.id} ({winner.value}) from {winner.source_type}",
                tiebreaker_applied=rule
            ))

    return conflicts


# ============================================
# MAIN EXTRACTION FUNCTION
# ============================================

def extract_fact_registry(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main extraction function.

    Args:
        input_path: Path to memorandum markdown file
        output_path: Path for JSON output (default: fact-registry.json)

    Returns:
        Dict containing extraction results
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "fact-registry.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Extract facts
    facts = extract_facts_from_text(lines)

    # Detect conflicts
    conflicts = detect_conflicts(facts)

    # Group facts by type
    by_type = defaultdict(int)
    for fact in facts:
        by_type[fact.fact_type] += 1

    # Group facts by source
    by_source = defaultdict(int)
    for fact in facts:
        by_source[fact.source_type] += 1

    # Group facts by confidence
    by_confidence = defaultdict(int)
    for fact in facts:
        by_confidence[fact.confidence] += 1

    result = {
        'metadata': {
            'source_file': str(input_path),
            'extraction_timestamp': __import__('datetime').datetime.now().isoformat(),
            'script_version': '1.0.0'
        },
        'statistics': {
            'total_facts': len(facts),
            'conflict_count': len(conflicts),
            'facts_by_type': dict(by_type),
            'facts_by_source': dict(by_source),
            'facts_by_confidence': dict(by_confidence)
        },
        'facts': [asdict(f) for f in facts],
        'conflicts': [asdict(c) for c in conflicts],
        'conflict_resolutions': [
            {
                'conflict_id': c.conflict_id,
                'recommended_value': c.resolution,
                'tiebreaker_rule': c.tiebreaker_applied
            }
            for c in conflicts
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
        description='Extract fact registry from legal memorandum.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 extract-fact-registry.py final-memorandum.md
  python3 extract-fact-registry.py final-memorandum.md fact-registry.json

Exit codes:
  0 = All facts extracted (no conflicts)
  1 = Conflicts detected (review recommended)
  2 = Script error
        '''
    )
    parser.add_argument('memorandum_path', help='Path to memorandum markdown file')
    parser.add_argument('output_path', nargs='?', help='Output JSON file (default: fact-registry.json)')

    args = parser.parse_args()

    try:
        result = extract_fact_registry(args.memorandum_path, args.output_path)
        stats = result['statistics']

        # Print summary
        print(f"\nFact Registry Extraction Complete")
        print("=" * 50)
        print(f"Total facts: {stats['total_facts']}")
        print(f"Conflicts detected: {stats['conflict_count']}")

        print(f"\nBy type:")
        for ftype, count in stats['facts_by_type'].items():
            print(f"  {ftype}: {count}")

        print(f"\nBy source:")
        for source, count in stats['facts_by_source'].items():
            print(f"  {source}: {count}")

        print(f"\nBy confidence:")
        for conf, count in stats['facts_by_confidence'].items():
            print(f"  {conf}: {count}")

        if result['conflicts']:
            print(f"\nConflicts detected:")
            for conflict in result['conflicts'][:5]:
                print(f"  {conflict['conflict_id']}: {conflict['fact_key']}")
                print(f"    Values: {conflict['values']}")
                print(f"    Sections: {conflict['sections']}")
                print(f"    Resolution: {conflict['resolution']}")
            if len(result['conflicts']) > 5:
                print(f"  ... and {len(result['conflicts']) - 5} more conflicts")

        print(f"\nOutput written to: {result['output_file']}")

        # Exit code
        if stats['conflict_count'] > 0:
            print(f"\n[WARNING] {stats['conflict_count']} conflicts require review")
            sys.exit(1)
        else:
            print(f"\n[OK] No conflicts detected")
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
