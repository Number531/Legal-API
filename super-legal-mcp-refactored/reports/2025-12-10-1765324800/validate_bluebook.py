#!/usr/bin/env python3
"""
Validate Bluebook format compliance for citations in section reports.
"""

import re
from pathlib import Path
from collections import defaultdict

FILES = [
    ("Executive Summary", "executive-summary.md"),
    ("IV.A NRC Regulatory", "section-reports/section-IV-A-nrc-regulatory.md"),
    ("IV.B Foreign Ownership", "section-reports/section-IV-B-foreign-ownership.md"),
    ("IV.C Environmental", "section-reports/section-IV-C-environmental.md"),
    ("IV.D Price-Anderson", "section-reports/section-IV-D-price-anderson.md"),
    ("IV.E DOE Litigation", "section-reports/section-IV-E-doe-litigation.md"),
    ("IV.F Decommissioning", "section-reports/section-IV-F-decommissioning.md"),
    ("IV.G Securities/Financial", "section-reports/section-IV-G-securities-financial.md"),
    ("IV.H Spent Fuel", "section-reports/section-IV-H-spent-fuel.md"),
    ("IV.I Commercial/PPA", "section-reports/section-IV-I-commercial-ppa.md"),
    ("IV.J Employment", "section-reports/section-IV-J-employment.md"),
    ("IV.K Tax Structure", "section-reports/section-IV-K-tax-structure.md"),
    ("IV.L Security/Safeguards", "section-reports/section-IV-L-security-safeguards.md"),
]

def check_citation_issues(content):
    """Check for Bluebook format issues in content."""
    issues = {
        'spacing_federal_reporter': [],
        'spacing_section_symbol': [],
        'cfr_format': [],
        'usc_format': [],
        'missing_pinpoint': [],
    }

    # Issue 1: Improper spacing in Federal Reporter (F. 3d should be F.3d)
    bad_spacing = re.finditer(r'(\d+\s+F\.\s+\d+d\s+\d+)', content)
    for match in bad_spacing:
        issues['spacing_federal_reporter'].append(match.group(1))

    # Issue 2: Missing space after section symbol (§184 should be § 184)
    bad_section = re.finditer(r'(§\d+)', content)
    for match in bad_section:
        issues['spacing_section_symbol'].append(match.group(1))

    # Issue 3: Check USC citations for format
    usc_cites = re.finditer(r'\b(\d+\s+U\.S\.C\.\s*§+\s*\d+[a-z]*)', content)
    for match in usc_cites:
        cite = match.group(1)
        # Check proper spacing
        if not re.match(r'\d+\s+U\.S\.C\.\s+§\s+\d+', cite):
            issues['usc_format'].append(cite)

    # Issue 4: Check CFR citations
    cfr_cites = re.finditer(r'\b(\d+\s+C\.F\.R\.\s*§*\s*[\d\.]+)', content)
    for match in cfr_cites:
        cite = match.group(1)
        # Proper format: 10 C.F.R. § 50.80
        if not re.match(r'\d+\s+C\.F\.R\.\s+§\s+[\d\.]+', cite):
            issues['cfr_format'].append(cite)

    # Issue 5: Federal Reporter citations without pinpoint pages
    fed_cite_no_pin = re.finditer(r'\b\d+\s+F\.\d+d\s+\d+(?!\s*,\s*\d+)', content)
    for match in fed_cite_no_pin:
        # Check if next characters suggest missing pinpoint
        start = match.end()
        next_chars = content[start:start+30]
        if not re.match(r'^\s*\(', next_chars):  # If not followed by parenthetical
            issues['missing_pinpoint'].append(match.group(0))

    return issues

def validate_verification_tags(content):
    """Check coverage of verification tags."""
    # Count different tag types
    verified = len(re.findall(r'\[VERIFIED:[^\]]+\]', content))
    inferred = len(re.findall(r'\[INFERRED:[^\]]+\]', content))
    methodology = len(re.findall(r'\[METHODOLOGY:[^\]]+\]', content))
    assumed = len(re.findall(r'\[ASSUMED:[^\]]+\]', content))

    # Count citations that should have tags (statutes, cases, regulations)
    usc_count = len(re.findall(r'\b\d+\s+U\.S\.C\.\s*§+\s*\d+', content))
    cfr_count = len(re.findall(r'\b\d+\s+C\.F\.R\.\s*§+\s*[\d\.]+', content))
    case_count = len(re.findall(r'\b\d+\s+F\.\s*\d*d\s+\d+', content))

    total_cites = usc_count + cfr_count + case_count
    total_tags = verified + inferred + methodology + assumed

    return {
        'verified': verified,
        'inferred': inferred,
        'methodology': methodology,
        'assumed': assumed,
        'total_tags': total_tags,
        'total_cites': total_cites,
        'coverage_pct': (total_tags / total_cites * 100) if total_cites > 0 else 0
    }

def main():
    base_dir = Path("/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2025-12-10-1765324800")

    all_results = []
    global_stats = {
        'total_files': 0,
        'total_issues': 0,
        'files_with_issues': 0,
        'tag_stats': defaultdict(int),
    }

    for section_name, file_name in FILES:
        file_path = base_dir / file_name
        if not file_path.exists():
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        issues = check_citation_issues(content)
        tag_coverage = validate_verification_tags(content)

        total_file_issues = sum(len(v) for v in issues.values())

        result = {
            'section': section_name,
            'file': file_name,
            'issues': {k: len(v) for k, v in issues.items()},
            'issue_samples': {k: v[:3] for k, v in issues.items()},  # First 3 samples
            'total_issues': total_file_issues,
            'tag_coverage': tag_coverage,
        }

        all_results.append(result)

        global_stats['total_files'] += 1
        global_stats['total_issues'] += total_file_issues
        if total_file_issues > 0:
            global_stats['files_with_issues'] += 1

        for key, val in tag_coverage.items():
            global_stats['tag_stats'][key] += val

    # Generate report
    print("\n" + "="*80)
    print("BLUEBOOK FORMAT VALIDATION REPORT")
    print("="*80)

    for result in all_results:
        print(f"\n{result['section']}")
        print("-" * 60)
        print(f"  Total Issues: {result['total_issues']}")

        if result['total_issues'] > 0:
            for issue_type, count in result['issues'].items():
                if count > 0:
                    print(f"    {issue_type}: {count}")
                    samples = result['issue_samples'][issue_type]
                    for sample in samples[:2]:
                        print(f"      Example: {sample}")

        tc = result['tag_coverage']
        print(f"  Verification Tags: {tc['verified']}")
        print(f"  Tag Coverage: {tc['coverage_pct']:.1f}% ({tc['total_tags']}/{tc['total_cites']})")

    print("\n" + "="*80)
    print("GLOBAL STATISTICS")
    print("="*80)
    print(f"Total Files Analyzed: {global_stats['total_files']}")
    print(f"Files with Issues: {global_stats['files_with_issues']}")
    print(f"Total Format Issues: {global_stats['total_issues']}")

    ts = global_stats['tag_stats']
    print(f"\nVerification Tag Statistics:")
    print(f"  [VERIFIED]: {ts['verified']}")
    print(f"  [INFERRED]: {ts['inferred']}")
    print(f"  [METHODOLOGY]: {ts['methodology']}")
    print(f"  [ASSUMED]: {ts['assumed']}")
    print(f"  Total Tags: {ts['total_tags']}")
    print(f"  Total Citations: {ts['total_cites']}")
    print(f"  Coverage: {(ts['total_tags']/ts['total_cites']*100) if ts['total_cites'] > 0 else 0:.1f}%")

    # Determine pass/fail
    issues_pct = (global_stats['total_issues'] / (ts['total_cites'] or 1)) * 100
    tag_coverage_pct = (ts['verified'] / ts['total_tags']) * 100 if ts['total_tags'] > 0 else 0

    print("\n" + "="*80)
    print("VALIDATION DECISION")
    print("="*80)

    criteria_met = 0
    criteria_total = 3

    print(f"Criteria 1: >95% citations have tags")
    overall_coverage = (ts['total_tags'] / ts['total_cites']) * 100 if ts['total_cites'] > 0 else 0
    if overall_coverage > 95:
        print(f"  PASS: {overall_coverage:.1f}% coverage")
        criteria_met += 1
    else:
        print(f"  FAIL: {overall_coverage:.1f}% coverage (target >95%)")

    print(f"\nCriteria 2: <5% citations with formatting issues")
    if issues_pct < 5:
        print(f"  PASS: {issues_pct:.1f}% issue rate")
        criteria_met += 1
    else:
        print(f"  FAIL: {issues_pct:.1f}% issue rate (target <5%)")

    print(f"\nCriteria 3: >70% VERIFIED tags (vs INFERRED/ASSUMED)")
    if tag_coverage_pct > 70:
        print(f"  PASS: {tag_coverage_pct:.1f}% verified")
        criteria_met += 1
    else:
        print(f"  FAIL: {tag_coverage_pct:.1f}% verified (target >70%)")

    print(f"\n{'='*80}")
    if criteria_met == criteria_total:
        print("OVERALL STATUS: PASS")
        print("RECOMMENDATION: PROCEED TO G1.4 (Assembly)")
    else:
        print(f"OVERALL STATUS: ISSUES_FOUND ({criteria_met}/{criteria_total} criteria met)")
        print("RECOMMENDATION: REMEDIATE CITATIONS")

if __name__ == "__main__":
    main()
