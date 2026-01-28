#!/usr/bin/env python3
"""
Pre-QA Validation Pipeline

Purpose: Run all validation scripts before QA diagnostic to catch issues proactively.
Exits non-zero if blocking issues found, allowing CI/agent to remediate first.

Part of hybrid workflow: Script validates, agent remediates, QA scores.

Usage:
    python3 scripts/pre-qa-validate.py <memorandum_path>

Exit codes:
    0 = All checks pass (proceed to QA)
    1 = Blocking issues found (remediate first)
    2 = Script error

Token Impact: $0.00 (deterministic scripts, no LLM calls)
Speed: ~3 seconds for all validations

Checks performed:
    1. CREAC Header Count (minimum: 50)
    2. Draft Provision Coverage (minimum: 100% for HIGH/CRITICAL)
    3. Executive Summary Word Count (maximum: 3500)
    4. Placeholder Detection (must be 0)
    5. Citation Tag Coverage (minimum: 90%)
    6. HIGH Severity Verified (minimum: 100%)
    7. Fact Conflicts (maximum: 0)
    8. Risk Table Completeness (minimum: 100%)
"""

import subprocess
import sys
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

# ============================================
# CONFIGURATION
# ============================================

SCRIPTS_DIR = Path(__file__).parent

THRESHOLDS = {
    'creac_headers_min': 50,
    'provision_coverage_min': 100.0,  # Percentage for HIGH/CRITICAL
    'word_count_exec_summary_max': 3500,
    'placeholders_max': 0,
    # P5-P6 thresholds
    'citation_tag_coverage_min': 90.0,
    'high_severity_verified_min': 100.0,
    'fact_conflicts_max': 0,
    'risk_table_completeness_min': 100.0,
}

# Checks that block QA if failed
BLOCKING_CHECKS = {
    'creac_headers', 'provision_coverage', 'placeholders'
}

# Non-blocking checks - scripts run for data gathering, agent validates and enhances
# Script output alone is insufficient (~23% complete for CREAC, ~14% for citations)
# Hybrid workflow: script provides baseline, agent achieves full coverage
DISABLED_CHECKS = {
    'citation_tag_coverage', 'high_severity_verified',
    'fact_conflicts', 'risk_table_completeness'
}

# Checks that warn but don't block
WARNING_CHECKS = {'word_count_exec_summary', 'citation_confidence'}


# ============================================
# VALIDATION FUNCTIONS
# ============================================

def count_creac_headers(memo_path: str) -> int:
    """Count CREAC headers using grep."""
    try:
        cmd = f'grep -cE "^### (Conclusion|Rule|Explanation|Application|Counter-Analysis)" "{memo_path}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return int(result.stdout.strip()) if result.stdout.strip() else 0
    except Exception:
        return 0


def check_provision_coverage(memo_path: str) -> Tuple[float, Dict]:
    """Run provision validator and return coverage percentage."""
    provision_script = SCRIPTS_DIR / 'validate-provisions.py'

    if not provision_script.exists():
        return 100.0, {'error': 'validate-provisions.py not found'}

    try:
        result = subprocess.run(
            ['python3', str(provision_script), memo_path],
            capture_output=True,
            text=True,
            timeout=30
        )

        # Parse coverage from output
        match = re.search(r'Coverage:\s*(\d+(?:\.\d+)?)%', result.stdout)
        coverage = float(match.group(1)) if match else 0.0

        # Try to read detailed results from JSON
        memo_dir = Path(memo_path).parent
        json_path = memo_dir / 'provision-gaps.json'
        details = {}
        if json_path.exists():
            with open(json_path, 'r') as f:
                details = json.load(f)

        return coverage, details

    except subprocess.TimeoutExpired:
        return 0.0, {'error': 'Provision check timed out'}
    except Exception as e:
        return 0.0, {'error': str(e)}


def count_exec_summary_words(memo_path: str) -> int:
    """Count words in executive summary section."""
    try:
        with open(memo_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract executive summary section
        # Look for "## I. EXECUTIVE SUMMARY" to "## II."
        patterns = [
            r'## I\.\s*EXECUTIVE SUMMARY.*?(?=## II\.)',
            r'## EXECUTIVE SUMMARY.*?(?=## (?:II\.|QUESTIONS PRESENTED))',
            r'# EXECUTIVE SUMMARY.*?(?=# (?:II\.|QUESTIONS))',
        ]

        exec_summary = None
        for pattern in patterns:
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            if match:
                exec_summary = match.group(0)
                break

        if exec_summary:
            # Count words (exclude markdown formatting)
            text = re.sub(r'[#*|`\[\]()]', ' ', exec_summary)
            words = len(text.split())
            return words

        return 0

    except Exception:
        return 0


def count_placeholders(memo_path: str) -> Tuple[int, List[str]]:
    """Count placeholder patterns that shouldn't exist in final doc."""
    placeholder_patterns = [
        r'\[TBD\]',
        r'\[TODO\]',
        r'\[PLACEHOLDER\]',
        r'\[INSERT.*?\]',
        r'\[ADD.*?\]',
        r'\[SECTION.*?\]',
        r'\[CONTINUE.*?\]',
        r'\[XX\]',
        r'\[\?\]',
        r'\$\[.*?\]',
        r'\[XREF:',
    ]

    try:
        with open(memo_path, 'r', encoding='utf-8') as f:
            content = f.read()

        found = []
        for pattern in placeholder_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            found.extend(matches)

        return len(found), found[:10]  # Return first 10 examples

    except Exception:
        return 0, []


def check_citation_tag_coverage(memo_path: str) -> Tuple[float, int, Dict]:
    """
    Run citation tag scanner and return coverage percentage.

    Returns:
        Tuple of (coverage_percentage, high_unverified_count, details)
    """
    script = SCRIPTS_DIR / 'scan-citation-tags.py'
    if not script.exists():
        return 100.0, 0, {'error': 'scan-citation-tags.py not found'}

    try:
        result = subprocess.run(
            ['python3', str(script), memo_path],
            capture_output=True, text=True, timeout=30
        )

        memo_dir = Path(memo_path).parent
        json_path = memo_dir / 'citation-tag-report.json'
        if json_path.exists():
            with open(json_path, 'r') as f:
                data = json.load(f)
            coverage = data.get('coverage_percentage', 0.0)
            high_unverified = len(data.get('high_severity_unverified', []))
            return coverage, high_unverified, data

        return 0.0, 0, {'error': 'Output not found'}

    except subprocess.TimeoutExpired:
        return 0.0, 0, {'error': 'Citation tag scan timed out'}
    except Exception as e:
        return 0.0, 0, {'error': str(e)}


def check_fact_conflicts(memo_path: str) -> Tuple[int, Dict]:
    """
    Run fact registry extractor and return conflict count.

    Returns:
        Tuple of (conflict_count, details)
    """
    script = SCRIPTS_DIR / 'extract-fact-registry.py'
    if not script.exists():
        return 0, {'error': 'extract-fact-registry.py not found'}

    try:
        result = subprocess.run(
            ['python3', str(script), memo_path],
            capture_output=True, text=True, timeout=30
        )

        memo_dir = Path(memo_path).parent
        json_path = memo_dir / 'fact-registry.json'
        if json_path.exists():
            with open(json_path, 'r') as f:
                data = json.load(f)
            conflict_count = data.get('statistics', {}).get('conflict_count', 0)
            return conflict_count, data

        return 0, {'error': 'Output not found'}

    except subprocess.TimeoutExpired:
        return 0, {'error': 'Fact registry extraction timed out'}
    except Exception as e:
        return 0, {'error': str(e)}


def check_risk_table_completeness(memo_path: str) -> Tuple[float, int, Dict]:
    """
    Run risk table aggregator and return completeness percentage.

    Returns:
        Tuple of (completeness_percentage, deal_blocking_count, details)
    """
    script = SCRIPTS_DIR / 'aggregate-risk-tables.py'
    if not script.exists():
        return 100.0, 0, {'error': 'aggregate-risk-tables.py not found'}

    try:
        result = subprocess.run(
            ['python3', str(script), memo_path],
            capture_output=True, text=True, timeout=30
        )

        memo_dir = Path(memo_path).parent
        json_path = memo_dir / 'risk-summary.json'
        if json_path.exists():
            with open(json_path, 'r') as f:
                data = json.load(f)
            tables_parsed = data.get('statistics', {}).get('tables_parsed', 0)
            incomplete = data.get('statistics', {}).get('incomplete_tables', 0)
            deal_blocking = data.get('statistics', {}).get('deal_blocking_risks', 0)

            # Calculate completeness percentage
            if tables_parsed > 0:
                completeness = ((tables_parsed - incomplete) / tables_parsed) * 100
            else:
                completeness = 100.0  # No tables = nothing incomplete

            return completeness, deal_blocking, data

        return 100.0, 0, {'error': 'Output not found'}

    except subprocess.TimeoutExpired:
        return 0.0, 0, {'error': 'Risk table aggregation timed out'}
    except Exception as e:
        return 0.0, 0, {'error': str(e)}


def run_validation(memo_path: str) -> Dict:
    """
    Run all validation checks.

    Returns:
        Dict with check results and overall pass/fail status
    """
    results = {
        'passed': True,
        'blocking_failures': 0,
        'warnings': 0,
        'checks': []
    }

    memo_file = Path(memo_path)
    if not memo_file.exists():
        results['passed'] = False
        results['error'] = f'File not found: {memo_path}'
        return results

    # ----------------------------------------
    # Check 1: CREAC Header Count
    # ----------------------------------------
    creac_count = count_creac_headers(memo_path)
    creac_passed = creac_count >= THRESHOLDS['creac_headers_min']

    results['checks'].append({
        'name': 'CREAC Headers',
        'check_id': 'creac_headers',
        'value': creac_count,
        'threshold': f">= {THRESHOLDS['creac_headers_min']}",
        'passed': creac_passed,
        'blocking': 'creac_headers' in BLOCKING_CHECKS,
        'fix': f"Run apply-creac-headers.py for initial headers, then agent validates and enhances to complete CREAC structure" if not creac_passed else None
    })

    if not creac_passed and 'creac_headers' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    # ----------------------------------------
    # Check 2: Provision Coverage
    # ----------------------------------------
    coverage, provision_details = check_provision_coverage(memo_path)
    coverage_passed = coverage >= THRESHOLDS['provision_coverage_min']

    missing_count = provision_details.get('summary', {}).get('findings_missing_provisions', 0)

    results['checks'].append({
        'name': 'Provision Coverage',
        'check_id': 'provision_coverage',
        'value': f"{coverage}%",
        'threshold': f">= {THRESHOLDS['provision_coverage_min']}%",
        'passed': coverage_passed,
        'blocking': 'provision_coverage' in BLOCKING_CHECKS,
        'details': f"{missing_count} HIGH/CRITICAL findings missing provisions" if not coverage_passed else None,
        'fix': f"See provision-gaps.json for missing provisions" if not coverage_passed else None
    })

    if not coverage_passed and 'provision_coverage' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    # ----------------------------------------
    # Check 3: Executive Summary Word Count
    # ----------------------------------------
    word_count = count_exec_summary_words(memo_path)
    word_count_passed = word_count <= THRESHOLDS['word_count_exec_summary_max']

    excess = word_count - THRESHOLDS['word_count_exec_summary_max'] if not word_count_passed else 0

    results['checks'].append({
        'name': 'Exec Summary Words',
        'check_id': 'word_count_exec_summary',
        'value': word_count,
        'threshold': f"<= {THRESHOLDS['word_count_exec_summary_max']}",
        'passed': word_count_passed,
        'blocking': 'word_count_exec_summary' in BLOCKING_CHECKS,
        'fix': f"Reduce by {excess} words" if not word_count_passed else None
    })

    if not word_count_passed:
        if 'word_count_exec_summary' in BLOCKING_CHECKS:
            results['passed'] = False
            results['blocking_failures'] += 1
        else:
            results['warnings'] += 1

    # ----------------------------------------
    # Check 4: Placeholder Detection
    # ----------------------------------------
    placeholder_count, placeholder_examples = count_placeholders(memo_path)
    placeholder_passed = placeholder_count <= THRESHOLDS['placeholders_max']

    results['checks'].append({
        'name': 'Placeholders',
        'check_id': 'placeholders',
        'value': placeholder_count,
        'threshold': f"<= {THRESHOLDS['placeholders_max']}",
        'passed': placeholder_passed,
        'blocking': 'placeholders' in BLOCKING_CHECKS,
        'examples': placeholder_examples if not placeholder_passed else None,
        'fix': f"Remove {placeholder_count} placeholder(s): {', '.join(placeholder_examples[:3])}" if not placeholder_passed else None
    })

    if not placeholder_passed and 'placeholders' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    # ----------------------------------------
    # Check 5: Citation Tag Coverage (P5)
    # ----------------------------------------
    # Script runs for data gathering; agent validates and enhances
    tag_coverage, high_unverified, tag_details = check_citation_tag_coverage(memo_path)
    tag_coverage_passed = tag_coverage >= THRESHOLDS['citation_tag_coverage_min']

    results['checks'].append({
        'name': 'Citation Tag Coverage',
        'check_id': 'citation_tag_coverage',
        'value': f"{tag_coverage:.1f}%",
        'threshold': f">= {THRESHOLDS['citation_tag_coverage_min']}%",
        'passed': tag_coverage_passed,
        'blocking': 'citation_tag_coverage' in BLOCKING_CHECKS,
        'fix': "Agent validates script output and enhances with verification tags [VERIFIED:/INFERRED:/ASSUMED:/METHODOLOGY:]" if not tag_coverage_passed else None
    })

    if not tag_coverage_passed and 'citation_tag_coverage' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    # ----------------------------------------
    # Check 6: HIGH Severity Verified (P5)
    # ----------------------------------------
    high_verified_passed = high_unverified == 0

    results['checks'].append({
        'name': 'HIGH Severity Verified',
        'check_id': 'high_severity_verified',
        'value': f"{high_unverified} unverified",
        'threshold': "0 unverified",
        'passed': high_verified_passed,
        'blocking': 'high_severity_verified' in BLOCKING_CHECKS,
        'details': f"{high_unverified} HIGH/CRITICAL citations with UNVERIFIED status" if not high_verified_passed else None,
        'fix': "Verify HIGH severity citations before QA" if not high_verified_passed else None
    })

    if not high_verified_passed and 'high_severity_verified' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    # ----------------------------------------
    # Check 7: Fact Conflicts (P6)
    # ----------------------------------------
    conflict_count, fact_details = check_fact_conflicts(memo_path)
    conflicts_passed = conflict_count <= THRESHOLDS['fact_conflicts_max']

    results['checks'].append({
        'name': 'Fact Conflicts',
        'check_id': 'fact_conflicts',
        'value': conflict_count,
        'threshold': f"<= {THRESHOLDS['fact_conflicts_max']}",
        'passed': conflicts_passed,
        'blocking': 'fact_conflicts' in BLOCKING_CHECKS,
        'details': f"{conflict_count} fact conflict(s) detected" if not conflicts_passed else None,
        'fix': f"See fact-registry.json for conflict resolution" if not conflicts_passed else None
    })

    if not conflicts_passed and 'fact_conflicts' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    # ----------------------------------------
    # Check 8: Risk Table Completeness (P6)
    # ----------------------------------------
    completeness, deal_blocking, risk_details = check_risk_table_completeness(memo_path)
    completeness_passed = completeness >= THRESHOLDS['risk_table_completeness_min']

    results['checks'].append({
        'name': 'Risk Table Completeness',
        'check_id': 'risk_table_completeness',
        'value': f"{completeness:.1f}%",
        'threshold': f">= {THRESHOLDS['risk_table_completeness_min']}%",
        'passed': completeness_passed,
        'blocking': 'risk_table_completeness' in BLOCKING_CHECKS,
        'details': f"{deal_blocking} deal-blocking risk(s) identified" if deal_blocking > 0 else None,
        'fix': f"See risk-summary.json for incomplete tables" if not completeness_passed else None
    })

    if not completeness_passed and 'risk_table_completeness' in BLOCKING_CHECKS:
        results['passed'] = False
        results['blocking_failures'] += 1

    return results


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Run pre-QA validation checks on legal memorandum.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 pre-qa-validate.py final-memorandum.md
  python3 pre-qa-validate.py reports/session/final-memorandum.md

Exit codes:
  0 = All checks pass (ready for QA)
  1 = Blocking issues found (remediate first)
  2 = Script error
        '''
    )
    parser.add_argument('memorandum_path', help='Path to memorandum markdown file')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')

    args = parser.parse_args()

    try:
        results = run_validation(args.memorandum_path)

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            # Pretty print results
            print("\n" + "=" * 60)
            print("PRE-QA VALIDATION RESULTS")
            print("=" * 60)
            print(f"File: {args.memorandum_path}")
            print("-" * 60)

            for check in results['checks']:
                if check['passed']:
                    status = '✅'
                elif check['blocking']:
                    status = '❌'
                else:
                    status = '⚠️'

                print(f"{status} {check['name']}: {check['value']} (threshold: {check['threshold']})")

                if check.get('details'):
                    print(f"   Details: {check['details']}")
                if check.get('fix'):
                    print(f"   Fix: {check['fix']}")
                if check.get('examples'):
                    print(f"   Examples: {check['examples'][:3]}")

            print("-" * 60)

            if results['passed']:
                print("✅ ALL CHECKS PASSED - Ready for QA diagnostic")
            else:
                print(f"❌ {results['blocking_failures']} BLOCKING ISSUE(S) - Remediation required before QA")

            if results['warnings'] > 0:
                print(f"⚠️  {results['warnings']} warning(s) - non-blocking but recommended to fix")

            print("=" * 60)

        # Exit with appropriate code
        if results['passed']:
            sys.exit(0)
        else:
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(2)


if __name__ == '__main__':
    main()
