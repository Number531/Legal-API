#!/usr/bin/env python3
"""
Footnote Numbering Analysis Script
Extracts and analyzes footnote numbering from final-memorandum.md
"""

import re
from collections import defaultdict

def analyze_footnotes(file_path):
    """Extract and analyze all footnote numbers"""

    footnote_numbers = []
    line_numbers = []
    duplicates = defaultdict(list)

    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            # Match footnote pattern: "^N. " where N is a number
            match = re.match(r'^(\d+)\.\s+', line)
            if match:
                fn_num = int(match.group(1))
                footnote_numbers.append(fn_num)
                line_numbers.append(line_num)
                duplicates[fn_num].append(line_num)

    # Analysis
    total_footnotes = len(footnote_numbers)
    unique_numbers = set(footnote_numbers)
    max_number = max(footnote_numbers) if footnote_numbers else 0
    min_number = min(footnote_numbers) if footnote_numbers else 0

    # Find gaps (missing numbers in sequence 1-562)
    expected_range = set(range(1, 563))
    actual_set = set(footnote_numbers)
    missing_numbers = sorted(expected_range - actual_set)

    # Find duplicate numbers
    duplicate_numbers = {num: lines for num, lines in duplicates.items() if len(lines) > 1}

    # Check if numbering is sequential
    is_sequential = (footnote_numbers == list(range(1, total_footnotes + 1)))

    return {
        'total_footnotes': total_footnotes,
        'unique_count': len(unique_numbers),
        'max_number': max_number,
        'min_number': min_number,
        'missing_numbers': missing_numbers,
        'duplicate_numbers': duplicate_numbers,
        'is_sequential': is_sequential,
        'footnote_list': list(zip(footnote_numbers, line_numbers)),
        'expected_count': 562
    }

def main():
    file_path = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-29-1738200293/final-memorandum.md'

    print("=" * 80)
    print("FOOTNOTE NUMBERING ANALYSIS")
    print("=" * 80)
    print()

    results = analyze_footnotes(file_path)

    print(f"Total footnote markers found: {results['total_footnotes']}")
    print(f"Expected footnote count: {results['expected_count']}")
    print(f"Unique numbers used: {results['unique_count']}")
    print(f"Number range: {results['min_number']} to {results['max_number']}")
    print(f"Sequential numbering: {'YES' if results['is_sequential'] else 'NO'}")
    print()

    # Gap Analysis
    if results['missing_numbers']:
        print(f"GAPS DETECTED: {len(results['missing_numbers'])} missing numbers")
        print(f"Missing numbers: {', '.join(map(str, results['missing_numbers'][:20]))}")
        if len(results['missing_numbers']) > 20:
            print(f"  ... and {len(results['missing_numbers']) - 20} more")
    else:
        print("GAPS: None (all numbers 1-562 present)")
    print()

    # Duplicate Analysis
    if results['duplicate_numbers']:
        print(f"DUPLICATES DETECTED: {len(results['duplicate_numbers'])} numbers used multiple times")
        for num in sorted(results['duplicate_numbers'].keys())[:10]:
            lines = results['duplicate_numbers'][num]
            print(f"  Number {num} appears {len(lines)} times at lines: {', '.join(map(str, lines))}")
        if len(results['duplicate_numbers']) > 10:
            print(f"  ... and {len(results['duplicate_numbers']) - 10} more duplicates")
    else:
        print("DUPLICATES: None")
    print()

    # First and last 10 footnotes
    print("First 10 footnotes:")
    for i, (num, line) in enumerate(results['footnote_list'][:10]):
        print(f"  {i+1}. Footnote #{num} at line {line}")
    print()

    print("Last 10 footnotes:")
    for i, (num, line) in enumerate(results['footnote_list'][-10:], start=len(results['footnote_list'])-9):
        print(f"  {i}. Footnote #{num} at line {line}")
    print()

    # Status
    print("=" * 80)
    if results['missing_numbers'] or results['duplicate_numbers']:
        print("STATUS: FAIL - Issues detected")
    elif results['total_footnotes'] != results['expected_count']:
        print(f"STATUS: FAIL - Count mismatch (found {results['total_footnotes']}, expected {results['expected_count']})")
    else:
        print("STATUS: PASS - All footnotes 1-562 present, sequential, no duplicates")
    print("=" * 80)

if __name__ == '__main__':
    main()
