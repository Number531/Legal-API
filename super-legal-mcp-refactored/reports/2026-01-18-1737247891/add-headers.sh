#!/bin/bash

# ADD MISSING SECTION HEADERS SCRIPT (REWRITTEN - NO ASSOCIATIVE ARRAYS)
# Adds 5-line preamble to 8 files missing section headers
# Session: 2026-01-18-1737247891

set -e  # Exit on error

SESSION_DIR="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-18-1737247891"
cd "$SESSION_DIR"

echo "════════════════════════════════════════════════════════"
echo "  ADDING MISSING SECTION HEADERS"
echo "════════════════════════════════════════════════════════"
echo ""

# Define files and headers as parallel arrays
files=(
  "section-reports/section-IV-B-captive-reinsurance.md"
  "section-reports/section-IV-C-variable-products.md"
  "section-IV-F-integrated.md"
  "section-IV-G-integrated.md"
  "section-IV-H-integrated.md"
  "section-IV-I-integrated.md"
  "section-IV-J-integrated.md"
  "section-IV-K-integrated.md"
)

headers=(
  "SECTION IV.B: CAPTIVE REINSURANCE REGULATORY COMPLIANCE"
  "SECTION IV.C: VARIABLE ANNUITY PRODUCTS REGULATORY FRAMEWORK"
  "SECTION IV.F: TAX STRUCTURE & QUALIFICATION ANALYSIS"
  "SECTION IV.G: REINSURANCE AGREEMENTS & COUNTERPARTY RISK"
  "SECTION IV.H: EMPLOYMENT & LABOR LAW COMPLIANCE"
  "SECTION IV.I: INSURANCE COVERAGE & CLAIMS ANALYSIS"
  "SECTION IV.J: INVESTMENT PORTFOLIO RISK ASSESSMENT"
  "SECTION IV.K: FINANCIAL IMPACT & SCENARIO ANALYSIS"
)

TOTAL=8

for i in {0..7}; do
    COUNT=$((i + 1))
    file="${files[$i]}"
    header="${headers[$i]}"

    echo "[$COUNT/$TOTAL] Processing: $file"

    if [ ! -f "$file" ]; then
        echo "  ✗ ERROR: File not found"
        exit 1
    fi

    # Create temp file with 5-line preamble + original content
    {
        printf "\n\n---\n\n# %s\n\n" "$header"
        cat "$file"
    } > "${file}.tmp"

    # Replace original with temp file
    mv "${file}.tmp" "$file"

    echo "  ✓ Header added: # $header"
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✓ ALL HEADERS ADDED SUCCESSFULLY"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Modified $TOTAL files"
echo ""
