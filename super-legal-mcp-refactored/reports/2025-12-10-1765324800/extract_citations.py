#!/usr/bin/env python3
"""
Extract and analyze citations from section reports for G1.3 validation.
"""

import re
import json
from pathlib import Path
from collections import defaultdict

# Files to analyze
FILES = [
    "executive-summary.md",
    "section-reports/section-IV-A-nrc-regulatory.md",
    "section-reports/section-IV-B-foreign-ownership.md",
    "section-reports/section-IV-C-environmental.md",
    "section-reports/section-IV-D-price-anderson.md",
    "section-reports/section-IV-E-doe-litigation.md",
    "section-reports/section-IV-F-decommissioning.md",
    "section-reports/section-IV-G-securities-financial.md",
    "section-reports/section-IV-H-spent-fuel.md",
    "section-reports/section-IV-I-commercial-ppa.md",
    "section-reports/section-IV-J-employment.md",
    "section-reports/section-IV-K-tax-structure.md",
    "section-reports/section-IV-L-security-safeguards.md"
]

# Citation patterns
PATTERNS = {
    'verification_tags': r'\[VERIFIED:[^\]]+\]',
    'inferred_tags': r'\[INFERRED:[^\]]+\]',
    'methodology_tags': r'\[METHODOLOGY:[^\]]+\]',
    'assumed_tags': r'\[ASSUMED:[^\]]+\]',
    'usc_citations': r'\b\d+\s+U\.S\.C\.\s*§+\s*\d+',
    'cfr_citations': r'\b\d+\s+C\.F\.R\.\s*§+\s*[\d\.]+',
    'federal_reporter': r'\b\d+\s+F\.\s*\d*d\s+\d+',
    'section_symbols': r'§+\s*\d+',
}

def extract_citations(file_path):
    """Extract all citation patterns from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return None

    results = {}
    for pattern_name, pattern in PATTERNS.items():
        matches = re.findall(pattern, content)
        results[pattern_name] = {
            'count': len(matches),
            'samples': list(set(matches))[:10]  # First 10 unique samples
        }

    return results

def validate_bluebook_format(citation):
    """Check if citation follows Bluebook 21st edition format."""
    issues = []

    # Check for proper spacing in F.2d, F.3d (not F. 2d, F. 3d)
    if re.search(r'F\.\s+\d+d', citation):
        issues.append("Improper spacing in Federal Reporter citation (should be F.3d not F. 3d)")

    # Check for section symbol spacing
    if re.search(r'§\d', citation):
        issues.append("Missing space after section symbol (should be § 184 not §184)")

    # Check CFR format (should be 10 C.F.R. § 50.80)
    if 'C.F.R.' in citation and not re.search(r'\d+\s+C\.F\.R\.\s*§', citation):
        issues.append("Improper CFR format (should be '10 C.F.R. § 50.80')")

    return issues

def main():
    base_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2025-12-10-1765324800")

    all_results = {}
    total_stats = defaultdict(int)

    for file_name in FILES:
        file_path = base_dir / file_name
        print(f"Processing: {file_name}")

        results = extract_citations(file_path)
        if results is None:
            print(f"  [SKIP] File not found")
            continue

        all_results[file_name] = results

        # Accumulate totals
        for pattern_name, data in results.items():
            total_stats[pattern_name] += data['count']

        # Print summary for this file
        total_tags = sum(data['count'] for key, data in results.items()
                        if 'tags' in key)
        print(f"  Total verification tags: {total_tags}")

    # Output summary
    print("\n" + "="*80)
    print("AGGREGATE CITATION STATISTICS")
    print("="*80)

    for pattern_name, count in sorted(total_stats.items()):
        print(f"{pattern_name:25s}: {count:5d}")

    # Calculate tag coverage
    total_tags = sum(v for k, v in total_stats.items() if 'tags' in k)
    verified_pct = (total_stats['verification_tags'] / total_tags * 100) if total_tags > 0 else 0

    print(f"\n{'='*80}")
    print(f"Total Tags: {total_tags}")
    print(f"Verified Tag Coverage: {verified_pct:.1f}%")
    print(f"{'='*80}")

    # Save detailed results
    output_file = base_dir / "citation_extraction_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            'by_file': all_results,
            'totals': dict(total_stats),
            'coverage_pct': verified_pct
        }, f, indent=2)

    print(f"\nDetailed results saved to: {output_file}")

if __name__ == "__main__":
    main()
