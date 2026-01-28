#!/bin/bash
# Surgical edit script to remove meta-commentary from Section IV.L

cd /Users/ej/Super-Legal/super-legal-mcp-refactored

python3 << 'PYTHON_SCRIPT'
file_path = "reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define old and new text
old_text = """- **Total Seller Recovery:** $165M purchase price - $20M escrow + $8M Tier 1 + $14.96M Tier 2/residual = **$167.96M total** (Seller recovers 99.7% of escrow, loses only $52K to claim payments net of $5.04M settlements covered)

Wait, calculation error—let me recalculate:
- Escrow initial: $20M held from $165M purchase price → Seller receives $145M Day 1
- 18 months: $8M Tier 1 released → Seller receives $145M + $8M = $153M cumulative
- 24 months: $5.04M settlements paid from escrow (leaving $14.96M escrow balance)
- 36 months: $12M Tier 2 released → Seller receives $153M + $12M = $165M cumulative
- Residual escrow: $20M - $8M - $12M = $0 Tier releases, but $20M - $5.04M settlements = $14.96M remaining balance → issue: Tiers total $20M, but only $5.04M paid in settlements, so $14.96M available for Tier 2 release vs. $12M Tier 2 scheduled amount

**CORRECTION:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

new_text = """**Escrow Release Calculation:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Perform replacement
if old_text in content:
    content = content.replace(old_text, new_text, 1)
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Meta-commentary removed")
    print("Lines removed: 8")
    print("Issue resolved: Meta-commentary removed")
else:
    print("ERROR: Old text not found")
    exit(1)
PYTHON_SCRIPT

# Verify the edit
echo ""
echo "Verification:"
if grep -q "Wait, calculation error" "reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"; then
    echo "  ERROR: Meta-commentary still present"
    exit 1
else
    echo "  SUCCESS: Meta-commentary removed (0 occurrences found)"
fi

if grep -q "Escrow Release Calculation:" "reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"; then
    echo "  SUCCESS: New header present"
else
    echo "  ERROR: New header not found"
    exit 1
fi

echo ""
echo "Edit completed successfully!"
