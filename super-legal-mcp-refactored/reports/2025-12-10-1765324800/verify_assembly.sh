#!/bin/bash

echo "=== ASSEMBLY VERIFICATION REPORT ==="
echo ""

FILE="final-memorandum.md"

# Basic stats
echo "1. FILE STATISTICS:"
echo "   - Size: $(ls -lh $FILE | awk '{print $5}')"
echo "   - Lines: $(wc -l < $FILE)"
echo "   - Words: $(wc -w < $FILE)"
echo ""

# Section count
echo "2. SECTION COUNT:"
SECTION_COUNT=$(grep -c "^## IV\.[A-L]" $FILE)
echo "   - Detailed sections: $SECTION_COUNT (expected: 12)"
echo ""

# Verification tag count
echo "3. VERIFICATION TAG COUNT:"
VERIFIED=$(grep -o "\[VERIFIED:" $FILE | wc -l)
INFERRED=$(grep -o "\[INFERRED:" $FILE | wc -l)
METHODOLOGY=$(grep -o "\[METHODOLOGY:" $FILE | wc -l)
ASSUMED=$(grep -o "\[ASSUMED:" $FILE | wc -l)
TOTAL=$((VERIFIED + INFERRED + METHODOLOGY + ASSUMED))

echo "   - [VERIFIED:...]:     $VERIFIED"
echo "   - [INFERRED:...]:     $INFERRED"
echo "   - [METHODOLOGY:...]:  $METHODOLOGY"
echo "   - [ASSUMED:...]:      $ASSUMED"
echo "   - TOTAL TAGS:         $TOTAL (expected: ~2,012)"
echo ""

# Check for headers
echo "4. REQUIRED ELEMENTS:"
grep -q "PRIVILEGED AND CONFIDENTIAL" $FILE && echo "   ✓ Title page present" || echo "   ✗ Title page missing"
grep -q "Atlas Power Holdings Investment Committee" $FILE && echo "   ✓ TO line present" || echo "   ✗ TO line missing"
grep -q "EXECUTIVE SUMMARY" $FILE && echo "   ✓ Executive summary present" || echo "   ✗ Executive summary missing"
grep -q "RESEARCH SUMMARY DISCLAIMER" $FILE && echo "   ✓ Footer disclaimer present" || echo "   ✗ Footer disclaimer missing"
echo ""

# Check section order
echo "5. SECTION ORDER VERIFICATION:"
grep "^## IV\." $FILE | head -12 | sed 's/^/   /'
echo ""

# Citation format check
echo "6. CITATION SAMPLES:"
echo "   USC citations: $(grep -o '[0-9]* U\.S\.C\. §' $FILE | wc -l)"
echo "   CFR citations: $(grep -o '[0-9]* C\.F\.R\. §' $FILE | wc -l)"
echo "   Case citations: $(grep -o '[0-9]* F\.[23]d [0-9]*' $FILE | wc -l)"
echo ""

echo "=== VERIFICATION COMPLETE ==="
