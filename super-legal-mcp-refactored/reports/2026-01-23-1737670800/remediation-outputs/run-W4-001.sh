#!/bin/bash
# W4-001: Execute advocacy language removal

set -e

SCRIPT_DIR="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/remediation-outputs"
PYTHON_SCRIPT="$SCRIPT_DIR/W4-001-extract-and-fix.py"

echo "=========================================="
echo "W4-001: Advocacy Language Removal"
echo "=========================================="
echo ""
echo "This script will:"
echo "1. Find all 4 instances of 'clearly' in final-memorandum-creac.md"
echo "2. Remove them to eliminate advocacy language"
echo "3. Create a backup (.backup-W4-001)"
echo "4. Generate remediation report (W4-001-advocacy-removal.md)"
echo ""
echo "Starting..."
echo ""

# Make Python script executable
chmod +x "$PYTHON_SCRIPT"

# Execute the Python script
python3 "$PYTHON_SCRIPT"

echo ""
echo "=========================================="
echo "TASK COMPLETE"
echo "=========================================="
echo ""
echo "Output files:"
echo "- Report: $SCRIPT_DIR/W4-001-advocacy-removal.md"
echo "- Backup: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md.backup-W4-001"
echo "- Modified: /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md"
echo ""
echo "Verification:"
echo "Check remaining instances:"
grep -ic "clearly" /Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-23-1737670800/final-memorandum-creac.md || echo "  → 0 instances (SUCCESS)"
