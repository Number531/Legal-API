#!/bin/bash

# Wave 6 Assembly Script: Create final-memorandum-v2.md
# Integrates all remediation outputs into final deliverable

set -e

SESSION_DIR="/Users/ej/Super-Legal/super-legal-mcp-refactored/reports/2026-01-24-1737749920"
cd "$SESSION_DIR"

echo "=== WAVE 6: FINAL ASSEMBLY ==="
echo ""

# Step 1: Start with CREAC-enhanced base
echo "Step 1: Copying CREAC-enhanced base..."
cp final-memorandum-creac.md final-memorandum-v2-temp.md

# Step 2: Extract header and TOC (first ~80 lines)
echo "Step 2: Extracting header and TOC..."
head -80 final-memorandum-v2-temp.md > final-memorandum-v2-header.txt

# Step 3: Find where main content starts (after TOC)
echo "Step 3: Locating content boundaries..."
TOC_END=$(grep -n "^##" final-memorandum-v2-temp.md | head -1 | cut -d: -f1)
echo "  TOC ends at line: $TOC_END"

# Step 4: Extract main content (after TOC)
tail -n +$TOC_END final-memorandum-v2-temp.md > final-memorandum-v2-body.txt

# Step 5: Insert Questions Presented and Brief Answers at the front
echo "Step 5: Inserting Questions Presented and Brief Answers..."
cat final-memorandum-v2-header.txt > final-memorandum-v2.md
echo "" >> final-memorandum-v2.md
cat remediation-outputs/W1-001-questions-presented.md >> final-memorandum-v2.md
echo "" >> final-memorandum-v2.md
echo "" >> final-memorandum-v2.md
cat remediation-outputs/W1-002-brief-answers.md >> final-memorandum-v2.md
echo "" >> final-memorandum-v2.md
echo "" >> final-memorandum-v2.md

# Step 6: Renumber sections in body (I→III, II→IV, III→V, IV→VI, V→VII, VI→VIII, VII→IX)
echo "Step 6: Renumbering sections..."
sed -e 's/^## VII\./## IX./g' \
    -e 's/^## VI\./## VIII./g' \
    -e 's/^## V\./## VII./g' \
    -e 's/^## IV\./## VI./g' \
    -e 's/^## III\./## V./g' \
    -e 's/^## II\./## IV./g' \
    -e 's/^## I\./## III./g' \
    final-memorandum-v2-body.txt >> final-memorandum-v2.md

# Step 7: Replace Executive Summary section with trimmed version
echo "Step 7: Replacing Executive Summary with trimmed version..."
# Extract lines before Executive Summary
grep -n "^## III. EXECUTIVE SUMMARY" final-memorandum-v2.md | head -1 | cut -d: -f1 > exec_start.txt
EXEC_START=$(cat exec_start.txt)

# Extract lines after Executive Summary (find next ## section)
tail -n +$EXEC_START final-memorandum-v2.md | grep -n "^## IV\." | head -1 | cut -d: -f1 > exec_length.txt
EXEC_LENGTH=$(cat exec_length.txt)
EXEC_END=$((EXEC_START + EXEC_LENGTH - 1))

# Split file: before exec, trimmed exec, after exec
head -$((EXEC_START - 1)) final-memorandum-v2.md > v2-part1.txt
echo "## III. EXECUTIVE SUMMARY" > v2-part2.txt
echo "" >> v2-part2.txt
cat remediation-outputs/W3-001-executive-summary-trimmed.md >> v2-part2.txt
tail -n +$((EXEC_END + 1)) final-memorandum-v2.md > v2-part3.txt

# Reassemble
cat v2-part1.txt v2-part2.txt v2-part3.txt > final-memorandum-v2.md

# Cleanup temp files
rm -f final-memorandum-v2-temp.md final-memorandum-v2-header.txt final-memorandum-v2-body.txt
rm -f exec_start.txt exec_length.txt v2-part1.txt v2-part2.txt v2-part3.txt

echo ""
echo "=== ASSEMBLY COMPLETE ==="
echo ""
echo "File: final-memorandum-v2.md"
ls -lh final-memorandum-v2.md
echo ""
echo "Line count:"
wc -l final-memorandum-v2.md
echo ""
echo "Word count:"
wc -w final-memorandum-v2.md

