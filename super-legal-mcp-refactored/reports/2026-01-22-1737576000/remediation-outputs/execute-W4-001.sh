#!/bin/bash
# W4-001: Execute advocacy language neutralization
# This script performs the single required replacement

cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-22-1737576000/remediation-outputs

# Execute Python script
python3 neutralize-advocacy.py

# Verify replacement
echo ""
echo "=== VERIFICATION ==="
echo ""
echo "1. Checking advocacy term removed:"
grep -n "clearly sufficient" W4-001-neutral-language.md || echo "✓ PASS: 'clearly sufficient' not found"

echo ""
echo "2. Checking replacement present:"
grep -n "sufficient under precedent" W4-001-neutral-language.md | head -1

echo ""
echo "3. Verifying statutory quote preserved (ERISA):"
grep -n "clearly prudent not to do so" W4-001-neutral-language.md | head -1

echo ""
echo "4. Verifying regulatory quotes preserved (SEC Marketing Rule):"
grep -c "Clearly and prominently discloses" W4-001-neutral-language.md

echo ""
echo "5. File size comparison:"
ls -lh W3-XREF-INSERT-final-memorandum-xrefs.md W4-001-neutral-language.md | awk '{print $5, $9}'

echo ""
echo "=== W4-001 COMPLETE ==="
