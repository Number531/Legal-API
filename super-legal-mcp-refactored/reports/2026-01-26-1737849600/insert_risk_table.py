#!/usr/bin/env python3
"""
Script to insert risk assessment table into Section IV.L of final-memorandum-v2.md
Inserts after line 9134 (the ---- separator after B.4 assessment)
"""

import sys

# The risk assessment table to insert
RISK_TABLE = """
### B.5 Risk Assessment Table

| Finding | Severity | Probability | Exposure | Mitigation |
|---------|----------|-------------|----------|------------|
| Base case net exposure after tax benefit offset | MEDIUM | 60% (per OIG SDP historical acceptance rate 75%, CMS SRDP negotiated lookback 65%, Jacksonville QI success rate 70%, OASIS containment 60%) | $13.48M (gross $37.06M less $23.58M tax benefit) | $20M escrow (18-36 month staggered release) + mandatory remediation actions (Dr. Mitchell buyout, voluntary disclosures, MediSupply termination) |
| Downside case with CMS extrapolation or DOJ FCA intervention | HIGH | 30% (requires ≥2 of 5 trigger events: CMS extrapolation 35% probability, qui tam filing 25%, OASIS extrapolation 40%, Jacksonville CHOW delay 12%, MA plan termination 30%) | $91.47M (gross $115.05M less $23.58M tax benefit) | Enhanced escrow structure + $50M Seller indemnification cap (6-year survival) provides 97% coverage of $71.96M weighted expected value |
| Severe downside with criminal prosecution or FCA trial verdict | CRITICAL | 10% (combined: DOJ criminal AKS prosecution 5% pathway + FCA trial without settlement 5% pathway; baseline 15-20% reduced to 10% via voluntary disclosures) | $364.25M (gross $387.83M less $23.58M tax benefit; includes FCA judgment $173.76M or program exclusion = total transaction loss) | OIG SDP voluntary disclosure (80-90% criminal risk reduction) + Dr. Mitchell equity buyout (eliminates ongoing violation) + mandatory settlement covenant (buyer/seller covenant requires FCA settlement before trial) reduces residual severe risk to 2% |
| Dr. Mitchell equity buyout (mandatory condition precedent) | HIGH | 100% (non-negotiable closing condition to eliminate STARK/AKS violation source) | $27.75M (15% equity × $185M original purchase price; paid by Buyer directly to Dr. Mitchell, separate from Seller consideration) | None—Mandatory closing condition; structured as separate simultaneous transaction; no mitigation available (required to proceed) |
| Asset purchase tax benefit (buyer benefit offset) | LOW | 100% (certainty if asset purchase structure executed; 85% probability stock purchase with 338(h)(10) unavailable per Section IV.K analysis) | ($23.58M) — NEGATIVE exposure (buyer benefit; Class V/VI/VII step-up basis, 15-year amortization, NPV @ 8% WACC = $5.73M perpetual value) | N/A—Positive offset to gross exposure; buyer retains full benefit; asset purchase structure required (no mitigation needed) |

----
"""

def main():
    input_file = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-v2.md"
    output_file = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/final-memorandum-v2-updated.md"

    print(f"Reading {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f"Total lines: {len(lines)}")

    # Find the insertion point - after line 9134 which should be "----\n"
    # Line numbers are 0-indexed in Python, so line 9134 is index 9133
    insertion_index = 9134  # Insert after line 9134 (0-indexed: after index 9133)

    # Verify we're at the right location
    if insertion_index - 1 < len(lines):
        print(f"Line {insertion_index}: {lines[insertion_index-1].strip()}")
        print(f"Line {insertion_index + 1}: {lines[insertion_index].strip()[:80]}...")

    # Insert the risk table
    new_lines = lines[:insertion_index] + [RISK_TABLE] + lines[insertion_index:]

    print(f"Writing {len(new_lines)} lines to {output_file}...")

    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print("✓ Risk assessment table inserted successfully")
    print(f"✓ Output written to: {output_file}")
    print(f"✓ New file has {len(new_lines)} lines (added {len(new_lines) - len(lines)} lines)")

    return 0

if __name__ == "__main__":
    sys.exit(main())
