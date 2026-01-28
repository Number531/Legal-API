#!/usr/bin/env python3
"""
SURGICAL EDIT: Remove meta-commentary from Section IV.L
Target: lines 602-611 in section-IV-L-financial-risk-analysis.md
Action: Replace incorrect calculation and "Wait, calculation error" meta-commentary with clean header
"""

import os
import sys

# File path
FILE_PATH = "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600/section-reports/section-IV-L-financial-risk-analysis.md"

# Verify file exists
if not os.path.exists(FILE_PATH):
    print(f"ERROR: File not found: {FILE_PATH}")
    sys.exit(1)

print(f"Processing: {FILE_PATH}")
print(f"File size: {os.path.getsize(FILE_PATH)} bytes")

# Read entire file
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    original_content = f.read()

# Text to remove (lines 602-611)
OLD_TEXT = """- **Total Seller Recovery:** $165M purchase price - $20M escrow + $8M Tier 1 + $14.96M Tier 2/residual = **$167.96M total** (Seller recovers 99.7% of escrow, loses only $52K to claim payments net of $5.04M settlements covered)

Wait, calculation error—let me recalculate:
- Escrow initial: $20M held from $165M purchase price → Seller receives $145M Day 1
- 18 months: $8M Tier 1 released → Seller receives $145M + $8M = $153M cumulative
- 24 months: $5.04M settlements paid from escrow (leaving $14.96M escrow balance)
- 36 months: $12M Tier 2 released → Seller receives $153M + $12M = $165M cumulative
- Residual escrow: $20M - $8M - $12M = $0 Tier releases, but $20M - $5.04M settlements = $14.96M remaining balance → issue: Tiers total $20M, but only $5.04M paid in settlements, so $14.96M available for Tier 2 release vs. $12M Tier 2 scheduled amount

**CORRECTION:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Replacement text (clean header)
NEW_TEXT = """**Escrow Release Calculation:** Tier releases are calculated as percentages of **remaining escrow balance after claims**, not fixed dollar amounts:"""

# Check if old text exists
if OLD_TEXT not in original_content:
    print("\nERROR: Target text not found in file")
    print("The file may have already been edited or the text differs slightly")

    # Debug: Check for components
    if "Wait, calculation error" in original_content:
        print("  - Found: 'Wait, calculation error' (meta-commentary present)")
    if "**CORRECTION:**" in original_content:
        print("  - Found: '**CORRECTION:**' marker")

    sys.exit(1)

print("\n✓ Found target text (meta-commentary)")

# Perform replacement (only first occurrence)
updated_content = original_content.replace(OLD_TEXT, NEW_TEXT, 1)

# Verify exactly one replacement
occurrences = original_content.count(OLD_TEXT)
print(f"✓ Replacements: {occurrences} occurrence(s)")

# Calculate changes
chars_removed = len(original_content) - len(updated_content)
lines_removed_estimate = OLD_TEXT.count('\n') - NEW_TEXT.count('\n')

print(f"✓ Characters removed: {chars_removed}")
print(f"✓ Lines removed: ~{lines_removed_estimate}")

# Write updated content
with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print(f"\n✓ SUCCESS: File updated")
print(f"✓ Output: {FILE_PATH}")

# Verification
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    verify_content = f.read()

if "Wait, calculation error" in verify_content:
    print("\n❌ VERIFICATION FAILED: Meta-commentary still present")
    sys.exit(1)

if "Escrow Release Calculation:" in verify_content:
    print("✓ VERIFICATION PASSED: New header present, meta-commentary removed")
else:
    print("\n❌ VERIFICATION FAILED: New header not found")
    sys.exit(1)

print("\n" + "="*60)
print("SURGICAL EDIT COMPLETE")
print("="*60)
print("Status: COMPLETE")
print("File: section-IV-L-financial-risk-analysis.md")
print(f"Lines removed: {lines_removed_estimate}")
print("Issue resolved: Meta-commentary removed")
print("Verification: Zero remaining meta-commentary")
print("="*60)
