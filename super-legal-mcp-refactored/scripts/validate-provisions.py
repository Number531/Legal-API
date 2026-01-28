#!/usr/bin/env python3
"""
Draft Contract Provision Validator

Purpose: Ensure all HIGH/CRITICAL severity findings have corresponding
draft contract provisions in the Recommendations subsection.

Part of hybrid workflow: Script detects gaps, agent drafts provisions.

Usage:
    python3 scripts/validate-provisions.py <memorandum_path> [output_path]

    If output_path is omitted, writes to provision-gaps.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~1 second for 1MB file

Output:
    provision-gaps.json containing:
    - covered_findings: HIGH/CRITICAL with draft provisions
    - missing_provisions: findings requiring draft language
    - provision_templates: suggested provision types for each gap
    - remediation_tasks: task list for agent remediation
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict, field


@dataclass
class Finding:
    """Represents a HIGH/CRITICAL finding from risk tables."""
    section_id: str
    finding_description: str
    severity: str
    exposure: str
    has_provision: bool = False
    provision_location: Optional[int] = None  # Line number if found
    recommended_provision_type: str = 'general_indemnity'


# ============================================
# PROVISION TYPE MAPPING
# ============================================

# Map finding keywords to provision types
PROVISION_TYPE_RULES = {
    'non-compete': 'garden_leave_covenant',
    'noncompete': 'garden_leave_covenant',
    'garden leave': 'garden_leave_covenant',
    'restrictive covenant': 'garden_leave_covenant',
    'change-of-control': 'consent_campaign_covenant',
    'change of control': 'consent_campaign_covenant',
    'consent': 'consent_campaign_covenant',
    'key person': 'retention_agreement',
    'key man': 'retention_agreement',
    'retention': 'retention_agreement',
    'environmental': 'environmental_indemnity',
    'contamination': 'environmental_indemnity',
    'cercla': 'environmental_indemnity',
    'hazardous': 'environmental_indemnity',
    'erisa': 'prohibited_transaction_indemnity',
    'prohibited transaction': 'prohibited_transaction_indemnity',
    'fiduciary': 'prohibited_transaction_indemnity',
    'tax': 'tax_gross_up',
    'section 1061': 'tax_gross_up',
    'carried interest': 'tax_gross_up',
    'ip': 'ip_assignment_covenant',
    'intellectual property': 'ip_assignment_covenant',
    'patent': 'ip_assignment_covenant',
    'trademark': 'ip_assignment_covenant',
    'insurance': 'insurance_procurement_covenant',
    'coverage': 'insurance_procurement_covenant',
    'd&o': 'insurance_procurement_covenant',
    'regulatory': 'regulatory_approval_condition',
    'sec': 'regulatory_approval_condition',
    'approval': 'regulatory_approval_condition',
    'valuation': 'earnout_escrow',
    'earnout': 'earnout_escrow',
    'escrow': 'earnout_escrow',
    'markdown': 'earnout_escrow',
}

# Template stubs for provision types
PROVISION_TEMPLATES = {
    'garden_leave_covenant': '''
### Draft Contract Language: Garden Leave Payment Covenant

**ARTICLE [X] - KEY EMPLOYEE RESTRICTIONS**

Section [X].1 Garden Leave Payments.

(a) For each Key Employee (as defined in Exhibit A) whose employment
    terminates within three (3) years following the Closing Date, and
    who is subject to a non-compete restriction:

    (i)   Acquirer shall pay, or cause the Surviving Entity to pay,
          such Key Employee an amount equal to one hundred percent
          (100%) of such individual's Base Salary during the Restricted Period;

    (ii)  Such payments shall be made in equal monthly installments;

    (iii) "Restricted Period" means the twelve (12) month period during
          which the non-compete restriction applies.

(b) **Rationale**: [State law] requires garden leave payments as
    condition of non-compete enforceability.
''',

    'consent_campaign_covenant': '''
### Draft Contract Language: Client Consent Campaign Covenant

**ARTICLE [X] - PRE-CLOSING COVENANTS**

Section [X].1 Client Consent Campaign.

(a) Seller shall, commencing no later than ninety (90) days prior to the
    anticipated Closing Date, conduct a client consent campaign to obtain
    affirmative written consent from each Client whose Investment
    Management Agreement contains change-of-control provisions.

(b) "Consent Tracking Dashboard" means a real-time reporting mechanism,
    accessible to Buyer, tracking consent status and AUM attribution.

(c) **Closing Condition**: Affirmative consents shall have been obtained
    from Clients representing not less than ninety percent (90%) of the
    aggregate AUM requiring consent.

(d) **Rationale**: Change-of-control provisions typically permit
    termination without penalty upon assignment.
''',

    'retention_agreement': '''
### Draft Contract Language: Key Person Retention Agreement

**ARTICLE [X] - KEY PERSON RETENTION**

Section [X].1 Retention Agreements.

(a) Prior to Closing, Acquirer and each Key Person shall execute a
    Retention Agreement substantially in the form of Exhibit [Y].

(b) Each Retention Agreement shall provide for deferred compensation
    of $[AMOUNT] payable over [3] years, subject to continued employment.

(c) **Rationale**: Key person departure represents $[EXPOSURE] exposure;
    retention agreements reduce probability from [X]% to [Y]%.
''',

    'environmental_indemnity': '''
### Draft Contract Language: Environmental Indemnity

**ARTICLE [X] - ENVIRONMENTAL MATTERS**

Section [X].1 Environmental Indemnification.

(a) Seller shall indemnify Acquirer for all Losses arising from
    Environmental Conditions existing on or prior to the Closing Date.

(b) **Basket**: $[500,000] aggregate threshold before indemnification.

(c) **Cap**: $[X]M (representing [Y]% of Purchase Price).

(d) **Survival**: Ten (10) years from Closing Date.

(e) **Rationale**: Identified environmental exposure of $[AMOUNT]
    requires contractual protection.
''',

    'prohibited_transaction_indemnity': '''
### Draft Contract Language: ERISA Indemnification

**ARTICLE [X] - ERISA MATTERS**

Section [X].1 Prohibited Transaction Indemnification.

(a) Seller shall indemnify Acquirer for all Losses arising from
    Prohibited Transactions (as defined in ERISA Section 406 and
    IRC Section 4975) occurring prior to Closing.

(b) **Survival**: Ten (10) years from Closing Date (matching statute
    of limitations for ERISA claims).

(c) **Rationale**: SEC examination identified [N] potential prohibited
    transactions requiring contractual protection.
''',

    'tax_gross_up': '''
### Draft Contract Language: Tax Gross-Up Provision

**ARTICLE [X] - TAX MATTERS**

Section [X].1 Carried Interest Tax Adjustment.

(a) In the event that any portion of Carried Interest is recharacterized
    as short-term capital gain or ordinary income under IRC Section 1061,
    Seller shall pay to Acquirer an amount equal to the incremental
    tax liability.

(b) **Calculation**: Difference between (i) taxes payable at long-term
    capital gains rate and (ii) taxes actually payable.

(c) **Rationale**: Holding period analysis indicates [X]% of carried
    interest may be subject to recharacterization.
''',

    'ip_assignment_covenant': '''
### Draft Contract Language: IP Assignment Covenant

**ARTICLE [X] - INTELLECTUAL PROPERTY**

Section [X].1 IP Assignment Completion.

(a) Seller shall, prior to Closing, cause all current and former employees
    who contributed to Company IP to execute assignment agreements
    substantially in the form of Exhibit [Y].

(b) **Closing Condition**: Assignment agreements covering not less than
    [95]% of identified IP contributors.

(c) **Rationale**: IP assignment gaps identified for [N] contributors.
''',

    'insurance_procurement_covenant': '''
### Draft Contract Language: Insurance Procurement Covenant

**ARTICLE [X] - INSURANCE MATTERS**

Section [X].1 Insurance Enhancement.

(a) Prior to Closing, Seller shall procure and maintain:
    (i)   Key man life insurance of not less than $[50]M on [Key Person];
    (ii)  D&O coverage with Side A DIC of not less than $[25]M;
    (iii) Cyber liability coverage of not less than $[15]M.

(b) Acquirer shall be named as additional insured or loss payee.

(c) **Rationale**: Current coverage gaps identified: [describe gaps].
''',

    'regulatory_approval_condition': '''
### Draft Contract Language: Regulatory Approval Condition

**ARTICLE [X] - REGULATORY APPROVALS**

Section [X].1 Closing Condition.

(a) The Closing shall be conditioned upon receipt of all Required
    Regulatory Approvals, including [list specific approvals].

(b) Each party shall use commercially reasonable efforts to obtain
    such approvals within [90] days of signing.

(c) **Termination Right**: If approvals not obtained within [180] days,
    either party may terminate without liability.

(d) **Rationale**: [Agency] approval required under [statute/regulation].
''',

    'earnout_escrow': '''
### Draft Contract Language: Valuation Escrow

**ARTICLE [X] - ESCROW AND EARNOUT**

Section [X].1 Valuation Adjustment Escrow.

(a) Acquirer shall deposit $[AMOUNT] into an escrow account to secure
    potential valuation adjustments.

(b) **Release Conditions**: [Describe metrics and thresholds].

(c) **Survival**: Escrow shall remain in place for [24] months
    following Closing.

(d) **Rationale**: Identified valuation uncertainty of $[AMOUNT]
    requires escrow protection.
''',

    'general_indemnity': '''
### Draft Contract Language: General Indemnification

**ARTICLE [X] - INDEMNIFICATION**

Section [X].1 Seller Indemnification.

(a) Seller shall indemnify Acquirer for all Losses arising from
    [describe specific finding/risk].

(b) **Basket**: $[AMOUNT] aggregate threshold.

(c) **Cap**: $[AMOUNT] (representing [Y]% of Purchase Price).

(d) **Survival**: [X] years from Closing Date.

(e) **Rationale**: [Describe specific risk and quantified exposure].
''',
}


# ============================================
# PATTERN DEFINITIONS
# ============================================

# Section header patterns
SECTION_HEADER_PATTERN = re.compile(
    r'^#{2,3}\s+(?:Section\s+)?(IV\.)?([A-Z])(?:\.(\d+))?\.?\s*(.*)$',
    re.IGNORECASE
)

# Risk table row pattern - matches various table formats
RISK_TABLE_PATTERNS = [
    # Standard format: | Domain | Finding | Severity | Probability | Exposure |
    re.compile(
        r'\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(CRITICAL|HIGH)\s*\|'
        r'\s*([^|]+)\s*\|\s*\$?([0-9,.]+[MBK]?)\s*\|',
        re.IGNORECASE
    ),
    # Compact format: | Finding | Severity | Exposure |
    re.compile(
        r'\|\s*([^|]+)\s*\|\s*(CRITICAL|HIGH)\s*\|\s*\$?([0-9,.]+[MBK]?)\s*\|',
        re.IGNORECASE
    ),
]

# Draft provision detection patterns
PROVISION_PATTERNS = [
    re.compile(r'#{2,4}\s*Draft\s+(?:Contract\s+)?(?:Language|Provision)', re.IGNORECASE),
    re.compile(r'\*\*ARTICLE\s+\[?\w+\]?\s*[-–—]', re.IGNORECASE),
    re.compile(r'Section\s+\[\w+\]\.\d+\.?\s+(?:Seller|Buyer|Acquirer|Target)\s+shall', re.IGNORECASE),
    re.compile(r'#{2,4}\s*(?:Recommended\s+)?(?:Contract|Covenant|Provision)', re.IGNORECASE),
]


def determine_provision_type(finding_description: str) -> str:
    """Determine the recommended provision type based on finding keywords."""
    desc_lower = finding_description.lower()

    for keyword, provision_type in PROVISION_TYPE_RULES.items():
        if keyword in desc_lower:
            return provision_type

    return 'general_indemnity'


def extract_risk_table_findings(lines: List[str]) -> List[Finding]:
    """
    Parse risk assessment tables to extract HIGH/CRITICAL findings.

    Scans the document for risk tables and extracts findings with
    CRITICAL or HIGH severity ratings.
    """
    findings = []
    current_section = None
    in_table = False
    seen_findings = set()  # Avoid duplicates

    for i, line in enumerate(lines):
        # Track current section
        section_match = SECTION_HEADER_PATTERN.match(line.strip())
        if section_match:
            current_section = f"IV.{section_match.group(2)}"
            in_table = False
            continue

        # Detect table start
        if '|' in line and ('Severity' in line or 'Risk' in line or 'Finding' in line):
            in_table = True
            continue

        # Table separator line
        if in_table and line.strip().startswith('|') and set(line.strip()) <= {'|', '-', ':', ' '}:
            continue

        # End of table
        if in_table and not line.strip().startswith('|'):
            in_table = False
            continue

        # Try to match risk table row
        if in_table or '|' in line:
            for pattern in RISK_TABLE_PATTERNS:
                match = pattern.search(line)
                if match:
                    groups = match.groups()

                    # Parse based on pattern (different group positions)
                    if len(groups) >= 5:
                        # Full format: domain, finding, severity, prob, exposure
                        finding_desc = groups[1].strip()
                        severity = groups[2].upper()
                        exposure = groups[4].strip()
                    else:
                        # Compact format: finding, severity, exposure
                        finding_desc = groups[0].strip()
                        severity = groups[1].upper()
                        exposure = groups[2].strip()

                    # Skip header rows and duplicates
                    if finding_desc.lower() in ['finding', 'description', 'risk', 'issue']:
                        continue

                    # Create unique key for deduplication
                    finding_key = f"{current_section}:{finding_desc[:50]}"
                    if finding_key in seen_findings:
                        continue
                    seen_findings.add(finding_key)

                    # Determine provision type
                    provision_type = determine_provision_type(finding_desc)

                    findings.append(Finding(
                        section_id=current_section or 'Unknown',
                        finding_description=finding_desc,
                        severity=severity,
                        exposure=exposure,
                        recommended_provision_type=provision_type
                    ))
                    break

    return findings


def find_provision_locations(lines: List[str]) -> List[int]:
    """Find all lines that appear to contain draft provisions."""
    locations = []

    for i, line in enumerate(lines):
        for pattern in PROVISION_PATTERNS:
            if pattern.search(line):
                locations.append(i)
                break

    return locations


def check_provision_coverage(lines: List[str], findings: List[Finding]) -> None:
    """
    Check if each finding has a corresponding draft provision.

    For each finding, searches within its section for draft provision
    language that appears to address the finding.
    """
    provision_locations = find_provision_locations(lines)

    for finding in findings:
        section_start = None
        section_end = None

        # Find section boundaries
        section_pattern = re.compile(
            rf'^#{{2,3}}\s+(?:Section\s+)?{re.escape(finding.section_id)}',
            re.IGNORECASE
        )
        next_section_pattern = re.compile(r'^#{2,3}\s+(?:Section\s+)?IV\.[A-Z]', re.IGNORECASE)

        for i, line in enumerate(lines):
            if section_pattern.match(line.strip()):
                section_start = i
            elif section_start and next_section_pattern.match(line.strip()) and i > section_start:
                section_end = i
                break

        if section_start is None:
            continue

        section_end = section_end or len(lines)

        # Check for provision within section
        for loc in provision_locations:
            if section_start <= loc < section_end:
                # Verify provision relates to this finding by checking context
                context_start = max(0, loc - 5)
                context_end = min(len(lines), loc + 20)
                context = ' '.join(lines[context_start:context_end]).lower()

                # Extract keywords from finding description
                keywords = [w for w in finding.finding_description.lower().split()
                           if len(w) > 4 and w not in ['which', 'where', 'their', 'there', 'would', 'could', 'should']]

                # Check if at least 2 keywords appear in context
                matches = sum(1 for kw in keywords[:5] if kw in context)
                if matches >= 2 or finding.recommended_provision_type.replace('_', ' ') in context:
                    finding.has_provision = True
                    finding.provision_location = loc
                    break


def validate_provisions(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main validation function.

    Args:
        input_path: Path to memorandum markdown file
        output_path: Path for JSON output (default: provision-gaps.json)

    Returns:
        Dict containing coverage analysis and remediation tasks
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "provision-gaps.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Extract findings from risk tables
    findings = extract_risk_table_findings(lines)

    if not findings:
        # No HIGH/CRITICAL findings found
        result = {
            'summary': {
                'total_high_critical_findings': 0,
                'findings_with_provisions': 0,
                'findings_missing_provisions': 0,
                'coverage_percentage': 100.0
            },
            'covered_findings': [],
            'missing_provisions': [],
            'provision_templates': {},
            'remediation_tasks': []
        }
    else:
        # Check provision coverage
        check_provision_coverage(lines, findings)

        # Separate covered vs missing
        covered = [f for f in findings if f.has_provision]
        missing = [f for f in findings if not f.has_provision]

        coverage_pct = round(len(covered) / len(findings) * 100, 1) if findings else 100.0

        result = {
            'summary': {
                'total_high_critical_findings': len(findings),
                'findings_with_provisions': len(covered),
                'findings_missing_provisions': len(missing),
                'coverage_percentage': coverage_pct
            },
            'covered_findings': [asdict(f) for f in covered],
            'missing_provisions': [asdict(f) for f in missing],
            'provision_templates': {
                f"{f.section_id}": {
                    'finding': f.finding_description[:100],
                    'provision_type': f.recommended_provision_type,
                    'template': PROVISION_TEMPLATES.get(f.recommended_provision_type, '')
                }
                for f in missing
            },
            'remediation_tasks': [
                {
                    'task_id': f'DRAFT-{i+1:03d}',
                    'section': f.section_id,
                    'finding': f.finding_description[:80],
                    'severity': f.severity,
                    'provision_type': f.recommended_provision_type,
                    'exposure': f.exposure,
                    'priority': 'P1' if f.severity == 'CRITICAL' else 'P2'
                }
                for i, f in enumerate(missing)
            ]
        }

    # Write output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    result['output_file'] = output_path
    return result


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Validate draft contract provision coverage for HIGH/CRITICAL findings.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 validate-provisions.py final-memorandum.md
  python3 validate-provisions.py final-memorandum.md provision-gaps.json

Exit codes:
  0 = All HIGH/CRITICAL findings have provisions (100% coverage)
  1 = Missing provisions detected
  2 = Script error
        '''
    )
    parser.add_argument('memorandum_path', help='Path to memorandum markdown file')
    parser.add_argument('output_path', nargs='?', help='Output JSON file (default: provision-gaps.json)')

    args = parser.parse_args()

    try:
        result = validate_provisions(args.memorandum_path, args.output_path)
        summary = result['summary']

        # Determine status icon
        if summary['coverage_percentage'] == 100:
            status = '✅'
            exit_code = 0
        else:
            status = '⚠️'
            exit_code = 1

        print(f"\n{status} Provision Coverage: {summary['coverage_percentage']}%")
        print(f"\n  HIGH/CRITICAL findings: {summary['total_high_critical_findings']}")
        print(f"  With provisions: {summary['findings_with_provisions']}")
        print(f"  Missing provisions: {summary['findings_missing_provisions']}")

        if result['missing_provisions']:
            print(f"\nMissing provisions:")
            for task in result['remediation_tasks']:
                print(f"  - {task['task_id']}: {task['section']} - {task['finding'][:50]}...")
                print(f"    Type: {task['provision_type']} | Exposure: {task['exposure']} | Priority: {task['priority']}")

            print(f"\nRemediation tasks written to: {result['output_file']}")
            print(f"\nTo generate provision templates, see 'provision_templates' in output JSON.")

        sys.exit(exit_code)

    except FileNotFoundError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(2)


if __name__ == '__main__':
    main()
