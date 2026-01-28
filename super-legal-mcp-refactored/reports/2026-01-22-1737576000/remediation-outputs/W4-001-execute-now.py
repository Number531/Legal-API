#!/usr/bin/env python3
"""Direct execution - W4-001 advocacy neutralization"""

import sys

input_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000/remediation-outputs/W3-XREF-INSERT-final-memorandum-xrefs.md'
output_file = '/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000/remediation-outputs/W4-001-neutral-language.md'

print("Reading input file...")
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content):,} bytes")

# Make the single replacement
old = "- Transfer of majority voting power (clearly sufficient)"
new = "- Transfer of majority voting power (sufficient under precedent)"

if old in content:
    content = content.replace(old, new, 1)
    print(f"✓ Replaced: '{old}' → '{new}'")
else:
    print(f"✗ ERROR: Target text not found")
    sys.exit(1)

# Write output
print("Writing output file...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Output written: {len(content):,} bytes")
print("✓ W4-001 COMPLETE")
