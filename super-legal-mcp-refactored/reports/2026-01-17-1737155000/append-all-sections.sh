#!/bin/bash
#
# Append All Remaining Sections to Final Memorandum
# Workaround for Agent SDK file size limitations
#
# This script appends sections IV.B through IV.H to final-memorandum.md
# Created: 2026-01-17
# Purpose: Complete Phase 8 - Final Memorandum Synthesis & Assembly

set -e  # Exit on error

BASE_DIR="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-17-1737155000"
cd "$BASE_DIR"

echo "========================================="
echo "Final Memorandum - Section Append Script"
echo "========================================="
echo ""

# Verify final-memorandum.md exists
if [ ! -f "final-memorandum.md" ]; then
    echo "ERROR: final-memorandum.md not found"
    exit 1
fi

echo "Current state:"
wc -l final-memorandum.md
echo ""

# Section IV.B - Insurance Product Compliance
if [ -f "temp-section-IV-B.md" ]; then
    echo "[1/7] Appending Section IV.B (Insurance Product Compliance)..."
    cat temp-section-IV-B.md >> final-memorandum.md
    echo "  ✓ Section IV.B appended (501 lines)"
else
    echo "[1/7] Extracting Section IV.B from source..."
    grep -v "^$" section-reports/section-IV-B-insurance.md >> final-memorandum.md || {
        echo "  WARNING: Section IV.B extraction failed, trying alternate method..."
        cat section-reports/section-IV-B-insurance.md >> final-memorandum.md
    }
    echo "  ✓ Section IV.B appended"
fi

# Section IV.C - Securities & Investment Compliance
echo "[2/7] Appending Section IV.C (Securities & Investment Compliance)..."
cat section-reports/section-IV-C-securities.md >> final-memorandum.md
echo "  ✓ Section IV.C appended (637 lines)"

# Section IV.D - Litigation Exposure
echo "[3/7] Appending Section IV.D (Litigation Exposure)..."
cat section-reports/section-IV-D-litigation.md >> final-memorandum.md
echo "  ✓ Section IV.D appended"

# Section IV.E - Material Contracts
echo "[4/7] Appending Section IV.E (Material Contracts)..."
cat section-reports/section-IV-E-contracts.md >> final-memorandum.md
echo "  ✓ Section IV.E appended"

# Section IV.F - Tax Structure
echo "[5/7] Appending Section IV.F (Tax Structure)..."
cat section-reports/section-IV-F-tax.md >> final-memorandum.md
echo "  ✓ Section IV.F appended"

# Section IV.G - Employment & Agent Retention
echo "[6/7] Appending Section IV.G (Employment & Agent Retention)..."
cat section-reports/section-IV-G-employment.md >> final-memorandum.md
echo "  ✓ Section IV.G appended"

# Section IV.H - Financial Analysis
echo "[7/7] Appending Section IV.H (Financial Analysis)..."
cat section-reports/section-IV-H-financial.md >> final-memorandum.md
echo "  ✓ Section IV.H appended"

echo ""
echo "========================================="
echo "All sections appended successfully!"
echo "========================================="
echo ""

# Final statistics
echo "Final memorandum statistics:"
wc -l final-memorandum.md
wc -w final-memorandum.md
du -h final-memorandum.md

# Create completion marker
echo "Sections IV.B through IV.H appended successfully at $(date)" > sections-appended.marker
echo ""
echo "✓ Completion marker created: sections-appended.marker"
echo ""

# Verify key sections are present
echo "Verifying section headers:"
grep -n "^## IV\.[A-H]" final-memorandum.md | tail -8

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo "1. Generate Cross-Reference Matrix (Section V)"
echo "2. Consolidate Footnotes (Section VI)"
echo "3. Compile Limitations and Assumptions (Section VII)"
echo "4. Add final footer and disclaimer"
echo ""
