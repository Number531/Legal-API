#!/bin/bash
# W4-002 Remediation Execution Script
# Adds precedent transaction citations to all 13 draft provisions

echo "================================================================"
echo "W4-002: ADD PRECEDENT TRANSACTION CITATIONS"
echo "================================================================"
echo ""
echo "This script will add market context or precedent transaction"
echo "citations to all 13 draft contract provisions in the memorandum."
echo ""
echo "File to be modified:"
echo "  final-memorandum-v2.md"
echo ""
echo "Backup will be created automatically before modification."
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."

# Navigate to session directory
cd "/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-26-1737849600"

# Create backup
echo ""
echo "Creating backup..."
cp final-memorandum-v2.md final-memorandum-v2-backup-$(date +%Y%m%d-%H%M%S).md
echo "  ✓ Backup created"

# Execute Python script
echo ""
echo "Executing remediation script..."
echo ""
python3 remediation-outputs/apply-w4-002-edits.py

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "================================================================"
    echo "REMEDIATION COMPLETE"
    echo "================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Review remediation-outputs/W4-002.md for summary"
    echo "  2. Run quality-assessment-certification to verify"
    echo ""
else
    echo ""
    echo "================================================================"
    echo "ERROR: Remediation incomplete"
    echo "================================================================"
    echo ""
    echo "Please review the warnings above and contact support if needed."
    echo ""
    exit 1
fi
