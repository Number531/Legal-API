#!/usr/bin/env python3
"""Surgical edit to remove meta-commentary from Section IV.L"""

import sys

file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"

# Read the entire file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old string (meta-commentary to remove)
old_string = """- **Total Seller Recovery:** $165M purchase price - $20M escrow + $8M Tier 1 + $14.96M Tier 2/residual = **$167.96M total** (Seller recovers 99.7% of escrow, loses only $52K to claim payments net of $5.04M settlements covered)

Wait, calculation error—let me recalculate:
- Escrow initial: $20M held from $165M purchase price → Seller receives $145M Day 1
- 18 months: $8M Tier 1 released → Seller receives $145M + $8M = $153M cumulative
- 24 months: $5.04M settlements paid from escrow (leaving $14.96M escrow balance)
- 36 months: $12M Tier 2 released → Seller receives $153M + $12M = $165M cumulative
- Residual escrow: $20M - $8M - $12M = $0 Tier releases, but $20M - $5.04M settlements = $14.96M remaining balance → issue: Tiers total $20M, but only $5.04M paid in settlements, so $14.96M available for Tier 2 release vs. $12M Tier 2 scheduled amount

**CORRECTION:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Define the new string (clean replacement)
new_string = """**Escrow Release Calculation:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Verify the old string exists
if old_string not in content:
    print("ERROR: Old string not found in file")
    print("This may indicate the file has already been edited or line breaks differ")
    sys.exit(1)

# Perform the replacement
content_updated = content.replace(old_string, new_string)

# Verify exactly one replacement was made
replacements = content.count(old_string)
if replacements != 1:
    print(f"ERROR: Found {replacements} instances of old string (expected 1)")
    sys.exit(1)

# Write the updated content back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content_updated)

print(f"SUCCESS: Meta-commentary removed from {file_path}")
print(f"Replacements made: 1")
print(f"Lines removed: ~8")
print(f"New content begins with: 'Escrow Release Calculation:'")
