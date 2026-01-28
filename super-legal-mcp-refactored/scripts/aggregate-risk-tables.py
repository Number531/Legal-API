#!/usr/bin/env python3
"""
Risk Table Aggregation Script

Purpose: Parse risk assessment tables from all sections, normalize severity/probability/exposure,
calculate aggregate exposure, and identify deal-blocking risks.

Part of hybrid workflow: Script aggregates deterministically, agent validates semantically.

Usage:
    python3 scripts/aggregate-risk-tables.py <memorandum_path> [output_path]

    If output_path is omitted, writes to risk-summary.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~1 second for 1MB file

Output:
    risk-summary.json containing:
    - Severity distribution (CRITICAL, HIGH, MEDIUM, LOW)
    - Exposure by severity
    - Aggregate and weighted exposure totals
    - Deal-blocking risks (HIGH/CRITICAL + HIGH probability)
    - Incomplete table detection

Exit Codes:
    0 = All risk tables processed successfully
    1 = Incomplete tables or deal-blocking risks detected
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

class Severity(Enum):
    """Risk severity levels."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNKNOWN = "UNKNOWN"


class Probability(Enum):
    """Probability levels."""
    HIGH = "HIGH"        # >60%
    MEDIUM = "MEDIUM"    # 30-60%
    LOW = "LOW"          # <30%
    UNKNOWN = "UNKNOWN"


# Probability multipliers for weighted exposure
PROBABILITY_WEIGHTS = {
    Probability.HIGH.value: 0.75,      # Midpoint of 60-90%
    Probability.MEDIUM.value: 0.45,    # Midpoint of 30-60%
    Probability.LOW.value: 0.15,       # Midpoint of 0-30%
    Probability.UNKNOWN.value: 0.50,   # Default to 50%
}

# Severity ordering for sorting
SEVERITY_ORDER = {
    Severity.CRITICAL.value: 4,
    Severity.HIGH.value: 3,
    Severity.MEDIUM.value: 2,
    Severity.LOW.value: 1,
    Severity.UNKNOWN.value: 0,
}


@dataclass
class RiskFinding:
    """Represents a parsed risk finding from a table."""
    id: str                           # "RISK-001"
    section_id: str                   # "IV.A"
    domain: Optional[str]             # Risk domain/category
    description: str                  # Finding description
    severity: str                     # Severity level
    probability: str                  # Probability level
    probability_pct: Optional[float]  # Numeric probability if provided
    exposure: float                   # Dollar exposure
    exposure_raw: str                 # Original exposure text
    line_number: int
    is_deal_blocking: bool = False
    mitigation: Optional[str] = None
    table_complete: bool = True       # Whether row had all expected columns


@dataclass
class RiskTable:
    """Represents a risk assessment table."""
    section_id: str
    table_start_line: int
    table_end_line: int
    columns_detected: List[str]
    findings_count: int
    is_complete: bool
    missing_columns: List[str] = field(default_factory=list)


# ============================================
# PARSING PATTERNS
# ============================================

# Section header pattern
SECTION_PATTERN = re.compile(
    r'^#+\s*(?:Section\s+)?(IV\.)?([A-Z])(?:\.(\d+))?\.?\s*(.*)$',
    re.IGNORECASE | re.MULTILINE
)

# Table header detection
TABLE_HEADER_PATTERNS = [
    # Standard risk table headers
    re.compile(r'\|\s*(?:Domain|Category|Risk)\s*\|\s*(?:Finding|Description|Issue)\s*\|', re.IGNORECASE),
    re.compile(r'\|\s*(?:Finding|Description)\s*\|\s*(?:Severity|Risk)\s*\|\s*(?:Probability|Likelihood)\s*\|', re.IGNORECASE),
    re.compile(r'\|\s*Risk\s*\|\s*Severity\s*\|.*Exposure', re.IGNORECASE),
]

# Table separator line
TABLE_SEPARATOR = re.compile(r'^\s*\|[\s\-:|]+\|[\s\-:|]+\|\s*$')

# Severity extraction
SEVERITY_PATTERN = re.compile(r'\b(CRITICAL|HIGH|MEDIUM|LOW)\b', re.IGNORECASE)

# Probability extraction (percentage or level)
PROBABILITY_PCT_PATTERN = re.compile(r'(\d{1,3})(?:\.\d+)?\s*%')
PROBABILITY_LEVEL_PATTERN = re.compile(r'\b(HIGH|MEDIUM|LOW|LIKELY|UNLIKELY|PROBABLE)\b', re.IGNORECASE)
PROBABILITY_RANGE_PATTERN = re.compile(r'(\d{1,3})\s*[-–—to]+\s*(\d{1,3})\s*%')

# Exposure extraction
EXPOSURE_PATTERN = re.compile(
    r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([MBKmillion|billion|thousand]*)',
    re.IGNORECASE
)
EXPOSURE_RANGE_PATTERN = re.compile(
    r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([MBK]?)\s*[-–—to]+\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([MBK]?)',
    re.IGNORECASE
)

# Required columns for complete risk table
REQUIRED_COLUMNS = ['severity', 'exposure']
EXPECTED_COLUMNS = ['domain', 'finding', 'severity', 'probability', 'exposure']


# ============================================
# NORMALIZATION FUNCTIONS
# ============================================

def normalize_dollar_amount(value_str: str, suffix: str) -> float:
    """Convert dollar string to numeric value."""
    value = float(value_str.replace(',', ''))

    suffix_lower = suffix.lower() if suffix else ''
    if suffix_lower in ('m', 'million'):
        value *= 1_000_000
    elif suffix_lower in ('b', 'billion'):
        value *= 1_000_000_000
    elif suffix_lower in ('k', 'thousand'):
        value *= 1_000

    return value


def parse_probability(cell: str) -> Tuple[str, Optional[float]]:
    """
    Parse probability from cell text.

    Returns:
        Tuple of (probability level, numeric percentage if available)
    """
    # Check for range first
    range_match = PROBABILITY_RANGE_PATTERN.search(cell)
    if range_match:
        low, high = int(range_match.group(1)), int(range_match.group(2))
        midpoint = (low + high) / 2
        if midpoint > 60:
            return Probability.HIGH.value, midpoint / 100
        elif midpoint > 30:
            return Probability.MEDIUM.value, midpoint / 100
        else:
            return Probability.LOW.value, midpoint / 100

    # Check for single percentage
    pct_match = PROBABILITY_PCT_PATTERN.search(cell)
    if pct_match:
        pct = float(pct_match.group(1))
        if pct > 60:
            return Probability.HIGH.value, pct / 100
        elif pct > 30:
            return Probability.MEDIUM.value, pct / 100
        else:
            return Probability.LOW.value, pct / 100

    # Check for level keyword
    level_match = PROBABILITY_LEVEL_PATTERN.search(cell)
    if level_match:
        level = level_match.group(1).upper()
        if level in ('HIGH', 'LIKELY', 'PROBABLE'):
            return Probability.HIGH.value, 0.75
        elif level in ('MEDIUM',):
            return Probability.MEDIUM.value, 0.45
        elif level in ('LOW', 'UNLIKELY'):
            return Probability.LOW.value, 0.15

    return Probability.UNKNOWN.value, None


def parse_exposure(cell: str) -> Tuple[float, str]:
    """
    Parse exposure amount from cell text.

    Returns:
        Tuple of (normalized amount, raw text)
    """
    # Check for range first (use midpoint)
    range_match = EXPOSURE_RANGE_PATTERN.search(cell)
    if range_match:
        low_val, low_suffix, high_val, high_suffix = range_match.groups()
        low = normalize_dollar_amount(low_val, low_suffix)
        high = normalize_dollar_amount(high_val, high_suffix or low_suffix)
        return (low + high) / 2, range_match.group(0)

    # Single amount
    exp_match = EXPOSURE_PATTERN.search(cell)
    if exp_match:
        val, suffix = exp_match.groups()
        return normalize_dollar_amount(val, suffix), exp_match.group(0)

    return 0.0, ''


def parse_severity(cell: str) -> str:
    """Parse severity from cell text."""
    match = SEVERITY_PATTERN.search(cell)
    if match:
        return match.group(1).upper()
    return Severity.UNKNOWN.value


# ============================================
# TABLE PARSING FUNCTIONS
# ============================================

def detect_table_boundaries(lines: List[str], start_idx: int) -> Tuple[int, int]:
    """
    Detect the end of a table starting at start_idx.

    Returns:
        Tuple of (start_line, end_line) - 1-indexed
    """
    start_line = start_idx + 1  # Convert to 1-indexed
    end_line = start_line

    for i in range(start_idx + 1, len(lines)):
        line = lines[i].strip()

        # Table continues if line starts with |
        if line.startswith('|'):
            end_line = i + 1
        # Empty line or non-table content ends the table
        elif line and not TABLE_SEPARATOR.match(line):
            break
        # Skip empty lines within tables
        elif not line:
            continue

    return start_line, end_line


def parse_table_row(row: str, column_mapping: Dict[str, int]) -> Optional[Dict[str, str]]:
    """
    Parse a table row into column values.

    Args:
        row: Table row text
        column_mapping: Dict mapping column name to index

    Returns:
        Dict of column name to cell value, or None if not a valid data row
    """
    # Skip separator rows
    if TABLE_SEPARATOR.match(row):
        return None

    # Split by |
    cells = [c.strip() for c in row.split('|')]

    # Remove empty first/last cells from | delimiters
    if cells and not cells[0]:
        cells = cells[1:]
    if cells and not cells[-1]:
        cells = cells[:-1]

    # Skip header rows (usually first row after separator)
    if any(kw in ' '.join(cells).lower() for kw in ['domain', 'finding', 'severity', 'probability', 'exposure', 'risk']):
        if len([c for c in cells if c]) >= 3:  # Looks like a header
            return None

    # Build result dict
    result = {}
    for col_name, col_idx in column_mapping.items():
        if col_idx < len(cells):
            result[col_name] = cells[col_idx]
        else:
            result[col_name] = ''

    return result


def detect_columns(header_line: str) -> Dict[str, int]:
    """
    Detect column names and their indices from header line.

    Returns:
        Dict mapping column name to index
    """
    cells = [c.strip().lower() for c in header_line.split('|')]
    # Remove empty first/last
    if cells and not cells[0]:
        cells = cells[1:]
    if cells and not cells[-1]:
        cells = cells[:-1]

    mapping = {}

    for i, cell in enumerate(cells):
        if 'domain' in cell or 'category' in cell:
            mapping['domain'] = i
        elif 'finding' in cell or 'description' in cell or 'issue' in cell or 'risk' in cell:
            mapping['finding'] = i
        elif 'severity' in cell:
            mapping['severity'] = i
        elif 'probability' in cell or 'likelihood' in cell:
            mapping['probability'] = i
        elif 'exposure' in cell or 'amount' in cell or 'impact' in cell:
            mapping['exposure'] = i
        elif 'mitigation' in cell or 'recommendation' in cell:
            mapping['mitigation'] = i

    return mapping


def extract_section_id(lines: List[str], line_num: int) -> str:
    """Find the section ID for a given line."""
    for i in range(line_num, max(0, line_num - 100), -1):
        match = SECTION_PATTERN.match(lines[i])
        if match:
            prefix = match.group(1) or 'IV.'
            letter = match.group(2)
            return f"{prefix}{letter}"
    return "unknown"


# ============================================
# MAIN AGGREGATION FUNCTIONS
# ============================================

def parse_risk_tables(lines: List[str]) -> Tuple[List[RiskFinding], List[RiskTable]]:
    """
    Parse all risk tables from document.

    Returns:
        Tuple of (list of RiskFinding, list of RiskTable metadata)
    """
    findings = []
    tables = []
    finding_count = 0

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for table header
        is_table_header = False
        for pattern in TABLE_HEADER_PATTERNS:
            if pattern.search(line):
                is_table_header = True
                break

        # Also check for generic table start (row with severity keywords)
        if not is_table_header and '|' in line:
            # Check if next line is separator
            if i + 1 < len(lines) and TABLE_SEPARATOR.match(lines[i + 1]):
                # Check if subsequent rows have risk-related content
                if i + 2 < len(lines) and SEVERITY_PATTERN.search(lines[i + 2]):
                    is_table_header = True

        if is_table_header:
            # Detect table boundaries
            start_line, end_line = detect_table_boundaries(lines, i)

            # Detect columns from header
            column_mapping = detect_columns(line)

            # Check for missing required columns
            missing_cols = [c for c in REQUIRED_COLUMNS if c not in column_mapping]
            is_complete = len(missing_cols) == 0

            # Get section ID
            section_id = extract_section_id(lines, i)

            # Parse each row
            table_findings = []
            for j in range(i + 1, min(end_line, len(lines))):
                row_line = lines[j]

                # Skip separator
                if TABLE_SEPARATOR.match(row_line):
                    continue

                row_data = parse_table_row(row_line, column_mapping)
                if row_data is None:
                    continue

                # Extract values
                severity = parse_severity(row_data.get('severity', ''))
                if severity == Severity.UNKNOWN.value:
                    # Try to find severity anywhere in the row
                    severity = parse_severity(row_line)

                probability, prob_pct = parse_probability(row_data.get('probability', ''))
                exposure, exposure_raw = parse_exposure(row_data.get('exposure', ''))
                if exposure == 0:
                    # Try to find exposure anywhere in the row
                    exposure, exposure_raw = parse_exposure(row_line)

                # Get finding description
                description = row_data.get('finding', '') or row_data.get('domain', '')
                if not description:
                    # Use first non-empty cell that isn't severity/probability/exposure
                    for cell_name, cell_val in row_data.items():
                        if cell_name not in ('severity', 'probability', 'exposure') and cell_val:
                            description = cell_val
                            break

                if not description:
                    continue  # Skip rows without description

                finding_count += 1

                # Determine if deal-blocking
                is_deal_blocking = (
                    severity in (Severity.CRITICAL.value, Severity.HIGH.value) and
                    probability == Probability.HIGH.value
                )

                finding = RiskFinding(
                    id=f"RISK-{finding_count:03d}",
                    section_id=section_id,
                    domain=row_data.get('domain', ''),
                    description=description[:200],
                    severity=severity,
                    probability=probability,
                    probability_pct=prob_pct,
                    exposure=exposure,
                    exposure_raw=exposure_raw,
                    line_number=j + 1,
                    is_deal_blocking=is_deal_blocking,
                    mitigation=row_data.get('mitigation', ''),
                    table_complete=is_complete and bool(severity) and exposure > 0
                )
                table_findings.append(finding)

            findings.extend(table_findings)

            # Record table metadata
            tables.append(RiskTable(
                section_id=section_id,
                table_start_line=start_line,
                table_end_line=end_line,
                columns_detected=list(column_mapping.keys()),
                findings_count=len(table_findings),
                is_complete=is_complete,
                missing_columns=missing_cols
            ))

            # Skip to end of table
            i = end_line
        else:
            i += 1

    return findings, tables


def calculate_aggregates(findings: List[RiskFinding]) -> Dict:
    """
    Calculate aggregate statistics from findings.

    Returns:
        Dict with severity distribution, exposure totals, etc.
    """
    # Severity distribution
    severity_dist = defaultdict(int)
    for f in findings:
        severity_dist[f.severity] += 1

    # Exposure by severity
    exposure_by_severity = defaultdict(float)
    for f in findings:
        exposure_by_severity[f.severity] += f.exposure

    # Calculate aggregate exposure
    aggregate_exposure = sum(f.exposure for f in findings)

    # Calculate probability-weighted exposure
    weighted_exposure = 0.0
    for f in findings:
        weight = f.probability_pct if f.probability_pct else PROBABILITY_WEIGHTS.get(f.probability, 0.5)
        weighted_exposure += f.exposure * weight

    # Deal-blocking risks
    deal_blocking = [f for f in findings if f.is_deal_blocking]

    # Incomplete findings
    incomplete = [f for f in findings if not f.table_complete]

    return {
        'severity_distribution': dict(severity_dist),
        'exposure_by_severity': {k: round(v, 2) for k, v in exposure_by_severity.items()},
        'aggregate_exposure': round(aggregate_exposure, 2),
        'weighted_exposure': round(weighted_exposure, 2),
        'deal_blocking_count': len(deal_blocking),
        'incomplete_count': len(incomplete),
        'total_findings': len(findings)
    }


def aggregate_risk_tables(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main aggregation function.

    Args:
        input_path: Path to memorandum markdown file
        output_path: Path for JSON output (default: risk-summary.json)

    Returns:
        Dict containing aggregation results
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "risk-summary.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Parse risk tables
    findings, tables = parse_risk_tables(lines)

    # Calculate aggregates
    aggregates = calculate_aggregates(findings)

    # Get deal-blocking risks details
    deal_blocking_risks = [
        {
            'id': f.id,
            'section': f.section_id,
            'description': f.description[:100],
            'severity': f.severity,
            'probability': f.probability,
            'exposure': f.exposure,
            'exposure_formatted': f.exposure_raw
        }
        for f in findings if f.is_deal_blocking
    ]

    # Get incomplete tables
    incomplete_tables = [
        {
            'section': t.section_id,
            'line': t.table_start_line,
            'missing_columns': t.missing_columns,
            'findings_affected': t.findings_count
        }
        for t in tables if not t.is_complete
    ]

    # Sort findings by severity then exposure
    sorted_findings = sorted(
        findings,
        key=lambda f: (SEVERITY_ORDER.get(f.severity, 0), f.exposure),
        reverse=True
    )

    result = {
        'metadata': {
            'source_file': str(input_path),
            'aggregation_timestamp': __import__('datetime').datetime.now().isoformat(),
            'script_version': '1.0.0'
        },
        'statistics': {
            'total_findings': aggregates['total_findings'],
            'tables_parsed': len(tables),
            'incomplete_tables': len(incomplete_tables),
            'deal_blocking_risks': aggregates['deal_blocking_count']
        },
        'severity_distribution': aggregates['severity_distribution'],
        'exposure_by_severity': aggregates['exposure_by_severity'],
        'aggregate_exposure': aggregates['aggregate_exposure'],
        'weighted_exposure': aggregates['weighted_exposure'],
        'deal_blocking_risks': deal_blocking_risks,
        'incomplete_tables': incomplete_tables,
        'findings': [asdict(f) for f in sorted_findings],
        'tables': [asdict(t) for t in tables],
        'top_exposures': [
            {
                'id': f.id,
                'section': f.section_id,
                'description': f.description[:80],
                'severity': f.severity,
                'exposure': f.exposure
            }
            for f in sorted_findings[:10]
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
        description='Aggregate risk tables from legal memorandum.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 aggregate-risk-tables.py final-memorandum.md
  python3 aggregate-risk-tables.py final-memorandum.md risk-summary.json

Exit codes:
  0 = All risk tables processed successfully
  1 = Incomplete tables or deal-blocking risks detected
  2 = Script error
        '''
    )
    parser.add_argument('memorandum_path', help='Path to memorandum markdown file')
    parser.add_argument('output_path', nargs='?', help='Output JSON file (default: risk-summary.json)')

    args = parser.parse_args()

    try:
        result = aggregate_risk_tables(args.memorandum_path, args.output_path)
        stats = result['statistics']

        # Print summary
        print(f"\nRisk Table Aggregation Complete")
        print("=" * 50)
        print(f"Tables parsed: {stats['tables_parsed']}")
        print(f"Total findings: {stats['total_findings']}")
        print(f"Incomplete tables: {stats['incomplete_tables']}")
        print(f"Deal-blocking risks: {stats['deal_blocking_risks']}")

        print(f"\nSeverity distribution:")
        for sev, count in result['severity_distribution'].items():
            exposure = result['exposure_by_severity'].get(sev, 0)
            print(f"  {sev}: {count} findings (${exposure:,.0f})")

        print(f"\nExposure summary:")
        print(f"  Aggregate exposure: ${result['aggregate_exposure']:,.0f}")
        print(f"  Weighted exposure:  ${result['weighted_exposure']:,.0f}")

        if result['deal_blocking_risks']:
            print(f"\nDeal-blocking risks (HIGH/CRITICAL + HIGH probability):")
            for risk in result['deal_blocking_risks'][:5]:
                print(f"  {risk['id']}: {risk['description'][:50]}...")
                print(f"    {risk['severity']} severity, {risk['probability']} probability, {risk['exposure_formatted']}")
            if len(result['deal_blocking_risks']) > 5:
                print(f"  ... and {len(result['deal_blocking_risks']) - 5} more")

        if result['incomplete_tables']:
            print(f"\nIncomplete tables (missing required columns):")
            for table in result['incomplete_tables']:
                print(f"  {table['section']} (line {table['line']}): missing {table['missing_columns']}")

        print(f"\nTop 5 exposures:")
        for exp in result['top_exposures'][:5]:
            print(f"  {exp['id']}: ${exp['exposure']:,.0f} - {exp['description'][:40]}...")

        print(f"\nOutput written to: {result['output_file']}")

        # Exit code
        if stats['incomplete_tables'] > 0 or stats['deal_blocking_risks'] > 0:
            if stats['deal_blocking_risks'] > 0:
                print(f"\n[WARNING] {stats['deal_blocking_risks']} deal-blocking risks identified")
            if stats['incomplete_tables'] > 0:
                print(f"\n[WARNING] {stats['incomplete_tables']} incomplete risk tables")
            sys.exit(1)
        else:
            print(f"\n[OK] All risk tables complete")
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
