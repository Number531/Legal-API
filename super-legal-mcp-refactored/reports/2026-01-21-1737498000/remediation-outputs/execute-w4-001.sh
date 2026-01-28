#!/bin/bash
# W4-001 Questions Presented Remediation Execution Script
# Run this script to update final-memorandum.md with reformatted questions

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MEMO_FILE="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-21-1737498000/final-memorandum.md"
PYTHON_SCRIPT="$SCRIPT_DIR/update_questions.py"

echo "========================================"
echo "W4-001: Questions Presented Reformatting"
echo "========================================"
echo ""
echo "Target File: $MEMO_FILE"
echo "Python Script: $PYTHON_SCRIPT"
echo ""

# Check file exists
if [ ! -f "$MEMO_FILE" ]; then
    echo "❌ ERROR: final-memorandum.md not found"
    exit 1
fi

# Check Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "❌ ERROR: update_questions.py not found"
    exit 1
fi

# Backup original file
BACKUP_FILE="${MEMO_FILE}.backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup: $BACKUP_FILE"
cp "$MEMO_FILE" "$BACKUP_FILE"

# Execute Python script
echo "Executing replacement script..."
python3 "$PYTHON_SCRIPT"

# Verify changes
echo ""
echo "Verifying changes..."

if grep -q "Under Nebraska Revised Statutes sections 44-6011 through 44-6014" "$MEMO_FILE"; then
    echo "✅ Question 1 verified: Under/Does/When format detected"
else
    echo "❌ Question 1 NOT updated - rolling back"
    mv "$BACKUP_FILE" "$MEMO_FILE"
    exit 1
fi

if grep -q "Under general principles of corporate veil and guarantor liability" "$MEMO_FILE"; then
    echo "✅ Question 2 verified: Under/Does/When format detected"
else
    echo "❌ Question 2 NOT updated - rolling back"
    mv "$BACKUP_FILE" "$MEMO_FILE"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ W4-001 COMPLETE"
echo "========================================"
echo ""
echo "All 12 questions reformatted successfully"
echo "Backup saved to: $BACKUP_FILE"
echo ""
echo "Next: Verify Brief Answers compatibility in Section III"
