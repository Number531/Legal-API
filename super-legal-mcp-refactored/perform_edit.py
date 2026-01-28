#!/usr/bin/env python3
import sys

file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"

# Read file
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the problematic section (around line 602)
# We'll look for the specific marker text
output_lines = []
skip_mode = False
skip_count = 0

for i, line in enumerate(lines, 1):
    # Check if this is the start of the problematic section
    if "**Total Seller Recovery:** $165M purchase price - $20M escrow + $8M Tier 1 + $14.96M Tier 2/residual" in line:
        # Skip this line and enter skip mode
        skip_mode = True
        skip_count = 0
        continue

    # If we're in skip mode, check if we've reached the end
    if skip_mode:
        skip_count += 1
        # Look for the CORRECTION line which marks the end
        if "**CORRECTION:** Tier releases are calculated" in line:
            # Replace with clean header and exit skip mode
            output_lines.append("**Escrow Release Calculation:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:\n")
            skip_mode = False
            continue
        else:
            # Skip this line (it's part of the meta-commentary)
            continue

    # Normal mode: keep the line
    output_lines.append(line)

# Write back
with open(file_path, 'w') as f:
    f.writelines(output_lines)

print("SUCCESS: Edit completed")
print(f"Total lines processed: {len(lines)}")
print(f"Total lines in output: {len(output_lines)}")
print(f"Lines removed: {len(lines) - len(output_lines)}")
