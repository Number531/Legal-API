#!/bin/bash
# Execute W3-001-VALIDATE CREAC header enhancement
# This script runs the Python enhancement and verifies results

set -e

cd /Users/ej/Super-Legal/super-legal-mcp-refactored

echo "=== W3-001-VALIDATE: CREAC Header Enhancement ==="
echo ""

# Execute enhancement
python3 process-creac-now.py

echo ""
echo "=== Verification ==="

OUTPUT_FILE="reports/2026-01-24-1737765000/remediation-outputs/W3-001-VALIDATE-creac-review.md"

echo "File created: $OUTPUT_FILE"
echo "File size: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
echo ""

echo "Header counts:"
echo "  Conclusion: $(grep -c "^### Conclusion" "$OUTPUT_FILE")"
echo "  Rule: $(grep -c "^### Rule" "$OUTPUT_FILE")"
echo "  Explanation: $(grep -c "^### Explanation" "$OUTPUT_FILE")"
echo "  Application: $(grep -c "^### Application" "$OUTPUT_FILE")"
echo "  Counter-Analysis: $(grep -c "^### Counter-Analysis" "$OUTPUT_FILE")"
echo ""

TOTAL=$(grep -c "^###" "$OUTPUT_FILE")
echo "  TOTAL: $TOTAL"

if [ "$TOTAL" -ge 50 ]; then
    echo ""
    echo "✓✓ SUCCESS: Target of 50+ headers achieved! ✓✓"
    exit 0
else
    echo ""
    echo "⚠ WARNING: Only $TOTAL headers (target: 50)"
    exit 1
fi
