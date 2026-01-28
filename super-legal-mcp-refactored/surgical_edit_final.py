#!/usr/bin/env python3
"""
Surgical edit to remove meta-commentary from Section IV.L
Lines 602-611: Remove incorrect calculation and meta-commentary
Replace with clean header
"""

file_path = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"

# Read the entire file
print(f"Reading file: {file_path}")
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

original_length = len(content)

# Define the exact text to remove (from line 602 to line 611)
old_text = """- **Total Seller Recovery:** $165M purchase price - $20M escrow + $8M Tier 1 + $14.96M Tier 2/residual = **$167.96M total** (Seller recovers 99.7% of escrow, loses only $52K to claim payments net of $5.04M settlements covered)

Wait, calculation error—let me recalculate:
- Escrow initial: $20M held from $165M purchase price → Seller receives $145M Day 1
- 18 months: $8M Tier 1 released → Seller receives $145M + $8M = $153M cumulative
- 24 months: $5.04M settlements paid from escrow (leaving $14.96M escrow balance)
- 36 months: $12M Tier 2 released → Seller receives $153M + $12M = $165M cumulative
- Residual escrow: $20M - $8M - $12M = $0 Tier releases, but $20M - $5.04M settlements = $14.96M remaining balance → issue: Tiers total $20M, but only $5.04M paid in settlements, so $14.96M available for Tier 2 release vs. $12M Tier 2 scheduled amount

**CORRECTION:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Define the replacement text
new_text = """**Escrow Release Calculation:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Check if old text exists
if old_text not in content:
    print("ERROR: Old text not found. Checking for variations...")
    # Check components
    if "Wait, calculation error—let me recalculate:" in content:
        print("  ✓ Found meta-commentary marker")
    if "**CORRECTION:**" in content:
        print("  ✓ Found CORRECTION marker")
    if "**Total Seller Recovery:** $165M purchase price" in content:
        print("  ✓ Found Total Seller Recovery line")
    print("\nAttempting line-break normalized search...")

    # Try normalizing line breaks
    import re
    old_text_normalized = re.sub(r'\n+', '\n', old_text.strip())
    content_normalized = re.sub(r'\n+', '\n', content.strip())

    if old_text_normalized in content_normalized:
        print("Found with normalized line breaks!")
        content = content_normalized.replace(old_text_normalized, new_text)
    else:
        print("ERROR: Cannot find text even with normalization")
        exit(1)
else:
    print("✓ Found exact match for old text")
    # Perform replacement
    content = content.replace(old_text, new_text, 1)

new_length = len(content)
chars_removed = original_length - new_length

# Write back
print(f"Writing updated content to: {file_path}")
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✓ SUCCESS: Meta-commentary removed")
print(f"  Characters removed: {chars_removed}")
print(f"  Estimated lines removed: ~{chars_removed // 80}")
print(f"  New header: 'Escrow Release Calculation:'")
print(f"\nVerification: grep 'Wait, calculation error' should return 0 results")
