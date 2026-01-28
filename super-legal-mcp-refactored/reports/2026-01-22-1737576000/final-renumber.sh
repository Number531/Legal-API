#!/bin/bash

set -e
cd "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000"

echo "=== Final Section Renumbering ==="

# Fix the remaining sections at the end
sed -e 's/^## V\. CROSS-REFERENCE MATRIX/## VII. CROSS-REFERENCE MATRIX/' \
    -e 's/^## VII\. LIMITATIONS AND ASSUMPTIONS/## VIII. LIMITATIONS AND ASSUMPTIONS/' \
    final-memorandum-v2.md > final-memorandum-v2-renumbered.md

mv final-memorandum-v2-renumbered.md final-memorandum-v2.md

echo "Complete!"
echo ""
echo "Final verification - all top-level sections:"
grep -n "^## [IVX]*\." final-memorandum-v2.md | head -25
echo ""
wc -lw final-memorandum-v2.md

