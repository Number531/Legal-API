#!/usr/bin/env python3
"""
W4-002 Verification Script
Verifies that all 13 precedent citations were successfully added
"""

import re

def verify_precedent_citations(file_path):
    """Verify all 13 precedent citations are present"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define verification patterns for each provision
    verifications = [
        {
            "num": 1,
            "name": "Dr. Mitchell STARK/AKS Escrow",
            "pattern": r"Halifax Hospital.*settlement.*\$85M.*2014",
            "context": "Section IV.A - Healthcare Compliance Escrow"
        },
        {
            "num": 2,
            "name": "FCA Liability Indemnity Cap",
            "pattern": r"ABA Health Law Section 2024 Deal Terms Study",
            "context": "Section IV.B - Healthcare Fraud Cap"
        },
        {
            "num": 3,
            "name": "OASIS Overcoding Extrapolation",
            "pattern": r"Visiting Nurse Service of New York.*OIG settlement.*2015",
            "context": "Section IV.B - OASIS Indemnity"
        },
        {
            "num": 4,
            "name": "MediSupply DME Kickback (IV.B)",
            "pattern": r"Lincare Holdings.*DOJ settlement.*\$28\.5M.*2024",
            "context": "Section IV.B - Escrow Allocation"
        },
        {
            "num": 5,
            "name": "Jacksonville Infection Control",
            "pattern": r"Healthcare M&A Journal 2025 survey",
            "context": "Section IV.C - CHOW Escrow"
        },
        {
            "num": 6,
            "name": "Hospice Aggregate Cap",
            "pattern": r"NHPCO.*2024 M&A survey",
            "context": "Section IV.D - Aggregate Cap Indemnity"
        },
        {
            "num": 7,
            "name": "Face-to-Face Encounter",
            "pattern": r"NHPCO market practice",
            "context": "Section IV.D - Face-to-Face Indemnity"
        },
        {
            "num": 8,
            "name": "Jacksonville CHOW Approval Risk",
            "pattern": r"Amedisys/AssuredCare.*\$38M.*2019",
            "context": "Section IV.F - CHOW Escrow with Tiered Release"
        },
        {
            "num": 9,
            "name": "WARN Act Liability",
            "pattern": r"ABA M&A Committee 2025 survey",
            "context": "Section IV.H - WARN Act Allocation"
        },
        {
            "num": 10,
            "name": "MA Delegated Credentialing Escrow",
            "pattern": r"Humana/Kindred at Home.*\$810M.*2021",
            "context": "Section IV.H - Credentialing Escrow"
        },
        {
            "num": 11,
            "name": "MA Contract Termination Revenue Escrow",
            "pattern": r"HCPEA 2025 transaction survey",
            "context": "Section IV.I - MA Revenue Escrow"
        },
        {
            "num": 12,
            "name": "MediSupply DME Kickback Escrow (IV.I)",
            "pattern": r"PharMerica/BriovaRx.*\$2\.7B.*2021",
            "context": "Section IV.I - MediSupply Dedicated Escrow"
        },
        {
            "num": 13,
            "name": "MA Delegated Credentialing Audit",
            "pattern": r"HCPEA 2024 market data",
            "context": "Section IV.I - Credentialing Audit Condition"
        }
    ]

    results = []
    passed = 0
    failed = 0

    print("\n" + "="*80)
    print("W4-002 VERIFICATION: PRECEDENT CITATIONS")
    print("="*80 + "\n")

    for v in verifications:
        match = re.search(v["pattern"], content, re.IGNORECASE | re.DOTALL)
        if match:
            status = "✓ PASS"
            passed += 1
            results.append((v["num"], v["name"], v["context"], "PASS"))
        else:
            status = "✗ FAIL"
            failed += 1
            results.append((v["num"], v["name"], v["context"], "FAIL"))

        print(f"{status} | Provision {v['num']:2d}: {v['name']}")
        print(f"         {v['context']}")
        if match:
            # Show snippet of matched text
            snippet = content[max(0, match.start()-50):match.end()+50]
            snippet = snippet.replace('\n', ' ')
            print(f"         Match: ...{snippet[:100]}...")
        print()

    print("="*80)
    print(f"RESULTS: {passed} PASSED | {failed} FAILED | {len(verifications)} TOTAL")
    print("="*80 + "\n")

    if failed > 0:
        print("FAILED PROVISIONS:")
        for num, name, context, status in results:
            if status == "FAIL":
                print(f"  - Provision {num}: {name}")
                print(f"    {context}")
        print()
        return False
    else:
        print("SUCCESS: All 13 precedent citations verified!")
        print()
        return True

if __name__ == "__main__":
    file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-v2.md"

    success = verify_precedent_citations(file_path)

    if success:
        print("Next step: Run quality-assessment-certification agent")
        exit(0)
    else:
        print("ERROR: Some precedent citations are missing")
        print("Please review the apply-w4-002-edits.py script for corrections")
        exit(1)
