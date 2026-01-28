#!/bin/bash
# Execute the Python script to add parentheticals

cd /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737765000/remediation-outputs

python3 add_parentheticals.py

echo ""
echo "Verifying output file was created..."
if [ -f "W5-002-parentheticals.md" ]; then
    echo "✓ Output file created successfully"
    wc -l W5-002-parentheticals.md
    echo ""
    echo "Sample parentheticals added:"
    grep -n "holding that if one purpose" W5-002-parentheticals.md | head -3
else
    echo "✗ Output file not found"
    exit 1
fi
